// js/player.js

class Player {
    constructor() {
        this.name = CONFIG.INITIAL_PSYCHONAUT_NAME;
        this.ambition = CONFIG.INITIAL_AMBITION_TEXT;

        // Initialize with "The Precipice" starting stats
        this.integrity = PLAYER_INITIAL_STATS.integrity;
        this.maxIntegrity = PLAYER_INITIAL_STATS.maxIntegrity; // Starts low, "Echo of a Name" will increase
        this.focus = PLAYER_INITIAL_STATS.focus;
        this.maxFocus = PLAYER_INITIAL_STATS.maxFocus; // Starts low
        this.clarity = PLAYER_INITIAL_STATS.clarity;
        this.maxClarity = PLAYER_INITIAL_STATS.maxClarity;
        this.hope = PLAYER_INITIAL_STATS.hope;
        this.maxHope = PLAYER_INITIAL_STATS.maxHope;
        this.despair = PLAYER_INITIAL_STATS.despair;
        this.maxDespair = PLAYER_INITIAL_STATS.maxDespair;
        this.insight = PLAYER_INITIAL_STATS.insight;

        this.attunements = { ...PLAYER_INITIAL_STATS.attunements };

        // Deck state for the intro
        this.awakeningDeck = [...PLAYER_AWAKENING_DECK_CONTENTS]; // Special deck for intro draws
        this.shuffleArray(this.awakeningDeck); // Shuffle the insights to be drawn

        this.deck = [...PLAYER_INITIAL_DECK]; // Main deck starts empty or with very few cards
        this.hand = [...PLAYER_INITIAL_AWAKENING_HAND]; // Starts with "Grasp for Awareness"
        this.discardPile = [];
        // Trauma cards will be added to discard/deck as they occur

        this.memories = []; // Array of Memory objects (e.g., {id: "MEM_ID", name: "Locket", ...})
        this.activePersonaStance = null;
    }

    // --- Deck Management ---
    shuffleArray(array) { // Generic shuffle utility
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Special draw for "Grasp for Awareness" from the awakening sequence
    drawFromAwakeningDeck() {
        if (this.awakeningDeck.length > 0) {
            if (this.hand.length >= CONFIG.MAX_HAND_SIZE) {
                UIManager.addLogEntry("Hand is full. Cannot draw awakening insight.", "system_warning");
                return null;
            }
            const cardId = this.awakeningDeck.pop();
            if (cardId) {
                this.hand.push(cardId);
                UIManager.addLogEntry(`A flicker of insight: Drew "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}".`, "discovery");
                return cardId;
            }
        } else {
            UIManager.addLogEntry("No more awakening insights to draw.", "system");
        }
        return null;
    }

    drawCards(count) { // Normal card draw from main deck
        const drawnCards = [];
        for (let i = 0; i < count; i++) {
            if (this.hand.length >= CONFIG.MAX_HAND_SIZE) {
                UIManager.addLogEntry("Hand is full. Cannot draw more cards.", "system_warning");
                break;
            }
            if (this.deck.length === 0) {
                if (this.discardPile.length === 0) {
                    UIManager.addLogEntry("No cards left in deck or discard pile to draw.", "system");
                    break;
                }
                UIManager.addLogEntry("Deck empty. Reshuffling discard pile into deck.", "system");
                this.discardPile.forEach(cardId => this.deck.push(cardId)); // Move all to deck
                this.discardPile = [];
                this.shuffleArray(this.deck);
                if (this.deck.length === 0) {
                    UIManager.addLogEntry("No cards left after reshuffle.", "system");
                    break;
                }
            }
            const cardId = this.deck.pop();
            if (cardId) {
                this.hand.push(cardId);
                drawnCards.push(cardId);
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                if (cardDef && cardDef.type === "Trauma" && cardDef.onDrawFunctionName) {
                    // Trigger onDraw effect via EncounterManager or main game loop
                    // For now, just log. Game.executeCardOnDrawEffect(cardId, this);
                    UIManager.addLogEntry(`Trauma drawn: ${cardDef.name}! Effect: ${cardDef.description}`, "trauma");
                    // Automatically try to resolve it if possible (e.g. Disorientation costing Clarity)
                    if (cardId === "TRM001" && this.clarity > 0) { // Specific to Disorientation
                       // This logic should ideally be in the onDrawFunctionName itself via Game/EncounterMgr
                       // UIManager.addLogEntry("You can spend 1 Clarity to negate Disorientation's effect this turn.", "choice_prompt");
                       // For now, assume player choice or auto-spend if available for simplicity.
                    }
                } else if (cardDef) {
                    UIManager.addLogEntry(`Drew: ${cardDef.name}.`, "system");
                }
            }
        }
        return drawnCards;
    }

    playCardFromHand(cardId) {
        const cardIndex = this.hand.indexOf(cardId);
        if (cardIndex > -1) {
            const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
            if (!cardDef) {
                console.error("Played card ID has no definition:", cardId);
                return null;
            }
            if (this.focus < cardDef.cost) {
                UIManager.addLogEntry(`Not enough Focus to play ${cardDef.name} (Cost: ${cardDef.cost}, Have: ${this.focus}).`, "warning");
                return null;
            }

            this.modifyFocus(-cardDef.cost); // Spend focus before moving card
            const playedCardId = this.hand.splice(cardIndex, 1)[0];

            if (cardDef.type === "Trauma") {
                // Traumas might go to a "resolved traumas" pile or just discard
                this.discardPile.push(playedCardId);
            } else {
                this.discardPile.push(playedCardId);
            }
            return cardDef; // Return card definition for processing its effect
        }
        return null; // Card not found
    }

    discardCardFromHand(cardId) { // Discard without playing effect (e.g. from Aspect ability)
        const cardIndex = this.hand.indexOf(cardId);
        if (cardIndex > -1) {
            const discardedCardId = this.hand.splice(cardIndex, 1)[0];
            this.discardPile.push(discardedCardId);
            UIManager.addLogEntry(`Discarded ${CONCEPT_CARD_DEFINITIONS[discardedCardId]?.name || 'a card'}.`, "system_negative");
            return CONCEPT_CARD_DEFINITIONS[discardedCardId];
        }
        return null;
    }

    addConceptToDeck(cardId, shuffleIn = false) { // For rewards, adding to main deck
        this.deck.push(cardId);
        if (shuffleIn) {
            this.shuffleArray(this.deck);
        }
        UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A new concept'} coalesces in your deck.`, "reward");
    }

    addConceptToDiscard(cardId) {
        this.discardPile.push(cardId);
         UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'} manifests in your discard pile.`, "system");
    }

    addConceptToHand(cardId) {
        if (this.hand.length < CONFIG.MAX_HAND_SIZE) {
            this.hand.push(cardId);
            UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'} appears in your hand.`, "system_positive");
        } else {
            UIManager.addLogEntry(`Hand full, ${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'a concept'} added to discard instead.`, "system_warning");
            this.addConceptToDiscard(cardId);
        }
    }

    addTraumaToDiscard(traumaCardId) { // Explicitly for adding Traumas
        this.discardPile.push(traumaCardId);
        const traumaDef = CONCEPT_CARD_DEFINITIONS[traumaCardId];
        UIManager.addLogEntry(`A Trauma (${traumaDef?.name || 'Unknown Fear'}) has formed in your discard pile!`, "trauma");
    }

    removeCardFromPsyche(cardId) { // Attempts to remove from hand, then discard, then deck
        let found = false;
        let pileName = "";
        if (this.hand.includes(cardId)) {
            this.hand.splice(this.hand.indexOf(cardId), 1);
            found = true; pileName = "hand";
        } else if (this.discardPile.includes(cardId)) {
            this.discardPile.splice(this.discardPile.indexOf(cardId), 1);
            found = true; pileName = "discard pile";
        } else if (this.deck.includes(cardId)) {
            this.deck.splice(this.deck.indexOf(cardId), 1);
            found = true; pileName = "deck";
        }

        if (found) {
            UIManager.addLogEntry(`The Concept "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}" fades from your ${pileName}.`, "system");
        } else {
            UIManager.addLogEntry(`Could not find "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}" to remove.`, "warning");
        }
        return found;
    }

    // --- Stat & Resource Modification ---
    // modifyIntegrity, modifyFocus, modifyClarity, modifyHope, modifyDespair, modifyInsight, modifyAttunement
    // are largely the same but ensure logging reflects the game's tone.

    modifyIntegrity(amount, source = "an unknown force") {
        const prevIntegrity = this.integrity;
        this.integrity += amount;
        if (this.integrity > this.maxIntegrity) this.integrity = this.maxIntegrity;
        if (this.integrity < 0) this.integrity = 0;

        if (amount < 0) UIManager.addLogEntry(`Your mind strains (${-amount} Integrity damage from ${source}).`, "damage");
        else if (amount > 0 && this.integrity > prevIntegrity) UIManager.addLogEntry(`A measure of cohesion returns (+${amount} Integrity from ${source}).`, "system_positive");

        if (this.integrity === 0 && prevIntegrity > 0) {
            Game.triggerGameOver("Psychological Collapse", "Your Integrity has shattered. The Inner Sea claims you.");
        }
    }

    modifyMaxIntegrity(newMax) {
        this.maxIntegrity = Math.max(1, newMax); // Ensure max integrity is at least 1
        if (this.integrity > this.maxIntegrity) {
            this.integrity = this.maxIntegrity; // Cap current integrity if it exceeds new max
        }
        UIManager.addLogEntry(`Your capacity for psychological cohesion has changed. Max Integrity: ${this.maxIntegrity}.`, "system_positive");
    }

    modifyFocus(amount, source = "internal reserves") {
        const prevFocus = this.focus;
        this.focus += amount;
        if (this.focus > this.maxFocus) this.focus = this.maxFocus;
        if (this.focus < 0) this.focus = 0;
        // Focus changes frequently, so less verbose logging unless significant
        if (amount > 0 && this.focus > prevFocus) { /* UIManager.addLogEntry(`Focus regained.`, "system_subtle"); */ }
        else if (amount < 0 && this.focus < prevFocus) { UIManager.addLogEntry(`Focus expended by ${source}.`, "system_subtle");}
    }
     modifyMaxFocus(newMax) {
        this.maxFocus = Math.max(1, newMax);
        if (this.focus > this.maxFocus) {
            this.focus = this.maxFocus;
        }
        UIManager.addLogEntry(`Your mental energy capacity has shifted. Max Focus: ${this.maxFocus}.`, "system_positive");
    }

    spendFocusForCard(cost, cardName = "a Concept") { // Specific for card plays
        if (this.focus >= cost) {
            this.modifyFocus(-cost, `playing ${cardName}`);
            return true;
        }
        UIManager.addLogEntry(`Not enough Focus to manifest ${cardName}.`, "warning");
        return false;
    }

    modifyClarity(amount, source = "the journey") {
        const prevClarity = this.clarity;
        this.clarity += amount;
        if (this.clarity > this.maxClarity) this.clarity = this.maxClarity;
        if (this.clarity < 0) this.clarity = 0;

        if (amount < 0) UIManager.addLogEntry(`The way forward blurs (-${-amount} Clarity from ${source}).`, "system_negative");
        else if (amount > 0 && this.clarity > prevClarity) UIManager.addLogEntry(`A moment of lucidity (+${amount} Clarity from ${source}).`, "system_positive");

        if (this.clarity === 0 && prevClarity > 0) {
            UIManager.addLogEntry("Clarity exhausted! A thick Mental Fog descends, oppressive and disorienting.", "critical");
            this.modifyDespair(2, "Mental Fog"); // Example effect of Mental Fog
            // Game.triggerMentalFogEvent(); // Main game controller would handle this
        }
    }

    modifyHope(amount, source = "an unknown influence") {
        const prevHope = this.hope;
        this.hope += amount;
        if (this.hope > this.maxHope) this.hope = this.maxHope;
        if (this.hope < 0) this.hope = 0;

        if (amount < 0) UIManager.addLogEntry(`A flicker of Hope gutters and fades (-${-amount} from ${source}).`, "system_negative");
        else if (amount > 0 && this.hope > prevHope) UIManager.addLogEntry(`A fragile Hope glimmers anew (+${amount} from ${source}).`, "system_positive");

        // Tarnished Locket check could be here or in a turn processing function in main.js
        if (this.hope <= 1 && prevHope > 1 && this.memories.some(mem => mem.id === "MEM_TARNISHED_LOCKET")) {
             UIManager.addLogEntry("The Tarnished Locket emits a faint, comforting warmth.", "artifact_effect");
             // The actual +1 Hope would be applied at start of "day" or next major rest via game loop
        }
    }

    modifyDespair(amount, source = "the encroaching void") {
        const prevDespair = this.despair;
        this.despair += amount;
        if (this.despair > this.maxDespair) this.despair = this.maxDespair;
        if (this.despair < 0) this.despair = 0;

        if (amount > 0 && this.despair > prevDespair) UIManager.addLogEntry(`A cold Despair seeps in (+${amount} from ${source}).`, "system_negative");
        else if (amount < 0) UIManager.addLogEntry(`The weight of Despair lessens slightly (-${-amount} from ${source}).`, "system_positive");

        if (this.despair >= this.maxDespair && prevDespair < this.maxDespair) {
             UIManager.addLogEntry("Despair has reached critical levels! The shadows writhe with unseen horrors.", "critical_system");
             // Game.triggerCriticalDespairEvent();
        } else if (this.despair > this.maxDespair * 0.7 && prevDespair <= this.maxDespair * 0.7) {
             UIManager.addLogEntry("Despair grows heavy. The Inner Sea feels more oppressive.", "warning");
        }
    }

    modifyInsight(amount, source = "an epiphany") {
        this.insight += amount;
        if (this.insight < 0) this.insight = 0;
        if (amount > 0) UIManager.addLogEntry(`A flash of Insight illuminates your mind (+${amount} from ${source}).`, "reward");
    }

    modifyAttunement(attunementKey, amount, source = "an experience") {
        if (this.attunements.hasOwnProperty(attunementKey)) {
            const prevValue = this.attunements[attunementKey];
            this.attunements[attunementKey] += amount;
            if (this.attunements[attunementKey] < 0) this.attunements[attunementKey] = 0;
            // Add max caps for attunements if desired (e.g., 10)
            // if (this.attunements[attunementKey] > 10) this.attunements[attunementKey] = 10;

            if (this.attunements[attunementKey] !== prevValue) {
                 UIManager.addLogEntry(`Your approach to ${ATTUNEMENT_DEFINITIONS[attunementKey].name} shifts due to ${source} (${amount > 0 ? '+' : ''}${amount}).`, "system");
            }
        }
    }

    // --- Memories (Artifacts) ---
    addMemory(memoryId) {
        const memoryDef = MEMORY_DEFINITIONS[memoryId];
        if (memoryDef && !this.memories.some(mem => mem.id === memoryId)) {
            this.memories.push({ ...memoryDef }); // Store a copy
            UIManager.addLogEntry(`A forgotten Memory surfaces: "${memoryDef.name}".`, "reward");
            // Apply immediate or passive effects if defined (complex part for main loop)
            // e.g. if (memoryDef.onAcquireFunctionName) Game.executeMemoryEffect(memoryDef.onAcquireFunctionName, this);
        } else if (this.memories.some(mem => mem.id === memoryId)) {
            UIManager.addLogEntry(`You already possess the Memory: "${memoryDef.name}".`, "system");
        } else {
            UIManager.addLogEntry(`Failed to acquire unknown Memory: ${memoryId}.`, "error");
        }
    }

    removeMemory(memoryId) {
        const memoryIndex = this.memories.findIndex(mem => mem.id === memoryId);
        if (memoryIndex > -1) {
            const removedMemory = this.memories.splice(memoryIndex, 1)[0];
            UIManager.addLogEntry(`The Memory of "${removedMemory.name}" fades...`, "system_negative");
            // Remove passive effects (complex part)
            return true;
        }
        return false;
    }

    hasMemory(memoryId) {
        return this.memories.some(mem => mem.id === memoryId);
    }

    // --- Persona Stance ---
    setPersonaStance(stanceId) {
        if (stanceId === null) {
            if (this.activePersonaStance) {
                UIManager.addLogEntry(`You release the ${this.activePersonaStance.name}, returning to a neutral mindset.`, "system");
            }
            this.activePersonaStance = null;
            return;
        }
        const stanceDef = PERSONA_STANCE_DEFINITIONS[stanceId];
        if (stanceDef) {
            // Check requirements (Attunements)
            let canAdopt = true;
            if (stanceDef.attunementReq) {
                for (const attKey in stanceDef.attunementReq) {
                    if (this.attunements[attKey] < stanceDef.attunementReq[attKey]) {
                        canAdopt = false;
                        UIManager.addLogEntry(`Cannot adopt ${stanceDef.name}: requires ${ATTUNEMENT_DEFINITIONS[attKey].name} ${stanceDef.attunementReq[attKey]}. You have ${this.attunements[attKey]}.`, "warning");
                        break;
                    }
                }
            }
            if (canAdopt) {
                this.activePersonaStance = { ...stanceDef };
                UIManager.addLogEntry(`You adopt the ${this.activePersonaStance.name}.`, "system_positive");
            }
        } else {
            UIManager.addLogEntry(`Unknown Persona Stance ID: ${stanceId}`, "error");
        }
    }

    // --- Utility / Data Getters ---
    getUIData() {
        return {
            integrity: this.integrity, maxIntegrity: this.maxIntegrity,
            focus: this.focus, maxFocus: this.maxFocus,
            clarity: this.clarity, maxClarity: this.maxClarity,
            hope: this.hope, maxHope: this.maxHope,
            despair: this.despair, maxDespair: this.maxDespair,
            attunements: this.attunements,
            // Not including insight here, might be displayed differently
        };
    }

    getHandCardDefinitions() {
        return this.hand.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(Boolean);
    }

    getFullDeckCardDefinitions() {
        const allCardIds = [...this.deck, ...this.hand, ...this.discardPile];
        // Filter out awakening deck if it's considered separate after initial draws
        return allCardIds.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(Boolean);
    }

    getTraumaCountInPlay() { // Counts traumas in hand, deck, discard
        let count = 0;
        const pilesToScan = [this.deck, this.hand, this.discardPile];
        pilesToScan.forEach(pile => {
            pile.forEach(cardId => {
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                if (cardDef && cardDef.type === "Trauma") {
                    count++;
                }
            });
        });
        return count;
    }

    // --- Game State Transitions ---
    resetForNewRun() {
        this.name = CONFIG.INITIAL_PSYCHONAUT_NAME; // Or allow naming
        this.ambition = CONFIG.INITIAL_AMBITION_TEXT; // Or allow choice

        this.integrity = PLAYER_INITIAL_STATS.integrity;
        this.maxIntegrity = PLAYER_INITIAL_STATS.maxIntegrity;
        this.focus = PLAYER_INITIAL_STATS.focus;
        this.maxFocus = PLAYER_INITIAL_STATS.maxFocus;
        this.clarity = PLAYER_INITIAL_STATS.clarity;
        this.maxClarity = PLAYER_INITIAL_STATS.maxClarity;
        this.hope = PLAYER_INITIAL_STATS.hope;
        this.maxHope = PLAYER_INITIAL_STATS.maxHope;
        this.despair = PLAYER_INITIAL_STATS.despair;
        // this.insight = 0; // Reset run-specific insight, keep meta-insight if any
        this.attunements = { ...PLAYER_INITIAL_STATS.attunements };

        this.awakeningDeck = [...PLAYER_AWAKENING_DECK_CONTENTS];
        this.shuffleArray(this.awakeningDeck);
        this.deck = [...PLAYER_INITIAL_DECK]; // Should be empty
        this.hand = [...PLAYER_INITIAL_AWAKENING_HAND]; // Start with Grasp
        this.discardPile = [];

        this.memories = []; // Or carry over some via Legacy
        this.activePersonaStance = null;
    }

    prepareForEncounter() { // Called by EncounterManager
        // Move existing hand to discard (if any, shouldn't be if coming from map)
        this.discardPile.push(...this.hand);
        this.hand = [];
        // Encounter draw is handled by EncounterManager calling startTurnInEncounter which calls drawCards
        // Or specific encounter start draw logic here.
        // For now, EncounterManager's startTurn will handle initial draw.
        this.setPersonaStance(this.activePersonaStance ? this.activePersonaStance.id : "OBSERVER"); // Default to Observer if no stance
    }

    startTurnInEncounter() { // Called by EncounterManager
        // Regenerate Focus
        let focusRegen = this.maxFocus; // Full regen for simplicity
        if (this.activePersonaStance && this.activePersonaStance.modifiers && this.activePersonaStance.modifiers.focusRegenBonus) {
            focusRegen += this.activePersonaStance.modifiers.focusRegenBonus;
        }
        this.modifyFocus(focusRegen, "start of turn");

        // Draw cards
        this.drawCards(CONFIG.TURN_START_CARD_DRAW);

        // Other start-of-turn effects (from Memories, Stance, Aspect states on player)
        // Example: Tarnished Locket (this is a "new day" tick for the locket)
        if (this.hope <= 1 && this.memories.some(mem => mem.id === "MEM_TARNISHED_LOCKET")) {
             // Check if already applied this "day" to prevent multiple triggers if hope fluctuates
            if (!this.tarnishedLocketHopeAppliedThisTurn) { // Add this flag to player object if needed
                this.modifyHope(1, "Tarnished Locket");
                // this.tarnishedLocketHopeAppliedThisTurn = true; // Set flag
            }
        }
        // else { this.tarnishedLocketHopeAppliedThisTurn = false; } // Reset flag
    }
}
