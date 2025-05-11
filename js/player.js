// js/player.js

// Using a class for the Player for better organization and potential for multiple instances if needed (though unlikely for this game)
class Player {
    constructor() {
        // Initialize with deep copies of PLAYER_INITIAL_STATS from config.js
        this.name = CONFIG.INITIAL_PSYCHONAUT_NAME;
        this.ambition = CONFIG.INITIAL_AMBITION_TEXT; // This might be an object later

        this.integrity = PLAYER_INITIAL_STATS.integrity;
        this.maxIntegrity = PLAYER_INITIAL_STATS.maxIntegrity;
        this.focus = PLAYER_INITIAL_STATS.focus;
        this.maxFocus = PLAYER_INITIAL_STATS.maxFocus;
        this.clarity = PLAYER_INITIAL_STATS.clarity;
        this.maxClarity = PLAYER_INITIAL_STATS.maxClarity;
        this.hope = PLAYER_INITIAL_STATS.hope;
        this.maxHope = PLAYER_INITIAL_STATS.maxHope;
        this.despair = PLAYER_INITIAL_STATS.despair;
        this.maxDespair = PLAYER_INITIAL_STATS.maxDespair;
        this.insight = PLAYER_INITIAL_STATS.insight;

        this.attunements = { ...PLAYER_INITIAL_STATS.attunements }; // Shallow copy is fine for object of numbers

        this.deck = []; // Array of card ID strings
        this.hand = []; // Array of card ID strings
        this.discardPile = []; // Array of card ID strings
        this.traumaDeck = []; // Separate deck for Trauma cards, or mix them in

        this.memories = []; // Array of Memory objects/IDs (Artifacts)
        this.activePersonaStance = null; // Will hold a PersonaStance object from CONFIG

        this.initializeDeck();
        // UIManager.updatePlayerStats(this.getUIData()); // Initial UI update would be triggered by main.js
    }

    // --- Deck Management ---
    initializeDeck() {
        this.deck = [...PLAYER_INITIAL_DECK]; // Copy from config
        this.shuffleDeck();
        // console.log("Player deck initialized:", this.deck);
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCards(count, fromEncounterStart = false) {
        const drawnCards = [];
        for (let i = 0; i < count; i++) {
            if (this.hand.length >= CONFIG.MAX_HAND_SIZE) {
                UIManager.addLogEntry("Hand is full. Cannot draw more cards.", "system");
                break;
            }
            if (this.deck.length === 0) {
                if (this.discardPile.length === 0) {
                    UIManager.addLogEntry("No cards left in deck or discard pile to draw.", "system");
                    break;
                }
                UIManager.addLogEntry("Deck empty. Reshuffling discard pile into deck.", "system");
                this.deck = [...this.discardPile];
                this.discardPile = [];
                this.shuffleDeck();
                // After reshuffle, check again if deck is empty (could happen if discard was also empty)
                if (this.deck.length === 0) {
                    UIManager.addLogEntry("No cards left after reshuffle.", "system");
                    break;
                }
            }
            const cardId = this.deck.pop();
            if (cardId) {
                this.hand.push(cardId);
                drawnCards.push(cardId);
                 // If the drawn card is a Trauma with an onDraw effect
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                if (cardDef && cardDef.type === "Trauma" && cardDef.onDrawFunctionName) {
                    // In a real game, we'd call the function:
                    // Game.executeCardEffect(cardDef.onDrawFunctionName, this, null, cardDef);
                    UIManager.addLogEntry(`Trauma drawn: ${cardDef.name}. ${cardDef.description}`, "trauma");
                }
            }
        }
        // UIManager.updatePlayerHand(this.getHandData()); // UI update responsibility of main game loop or encounter manager
        // UIManager.updateDeckInfo(this.deck.length, this.discardPile.length, this.getTraumaCount());
        return drawnCards; // Return drawn cards for potential immediate effects
    }

    playCardFromHand(cardId) {
        const cardIndex = this.hand.indexOf(cardId);
        if (cardIndex > -1) {
            const playedCard = this.hand.splice(cardIndex, 1)[0];
            this.discardPile.push(playedCard);
            // Actual card effect logic will be in EncounterManager or a dedicated card effect handler
            // UIManager.updatePlayerHand(this.getHandData());
            // UIManager.updateDeckInfo(this.deck.length, this.discardPile.length, this.getTraumaCount());
            return CONCEPT_CARD_DEFINITIONS[playedCard]; // Return card definition for processing
        }
        return null; // Card not found
    }

    discardCard(cardId) {
        const cardIndex = this.hand.indexOf(cardId);
        if (cardIndex > -1) {
            const discardedCard = this.hand.splice(cardIndex, 1)[0];
            this.discardPile.push(discardedCard);
            UIManager.addLogEntry(`Discarded ${CONCEPT_CARD_DEFINITIONS[discardedCard]?.name || 'a card'}.`, "system");
            return true;
        }
        return false;
    }

    addCardToDeck(cardId, shuffleIn = false) {
        this.deck.push(cardId);
        if (shuffleIn) {
            this.shuffleDeck();
        }
        UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A new concept'} added to your deck.`, "reward");
    }

    addCardToDiscard(cardId) {
        this.discardPile.push(cardId);
         UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'} added to your discard pile.`, "system");
    }

    addCardToHand(cardId) {
        if (this.hand.length < CONFIG.MAX_HAND_SIZE) {
            this.hand.push(cardId);
            UIManager.addLogEntry(`${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'} added to your hand.`, "system");
        } else {
            UIManager.addLogEntry(`Hand full, ${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'a concept'} added to discard instead.`, "system");
            this.addCardToDiscard(cardId);
        }
    }


    addTrauma(traumaCardId) {
        // Decide whether traumas go into main deck, discard, or a separate pile
        // For now, let's add to discard pile to be shuffled in later
        this.discardPile.push(traumaCardId);
        UIManager.addLogEntry(`A Trauma (${CONCEPT_CARD_DEFINITIONS[traumaCardId]?.name || 'Unknown Fear'}) has manifested in your discard pile!`, "trauma");
    }

    removeCardFromDeck(cardId, fromAllPiles = true) { // More complex removal logic needed
        let removed = false;
        // Simplistic removal: remove first instance found
        const deckIdx = this.deck.indexOf(cardId);
        if (deckIdx > -1) {
            this.deck.splice(deckIdx, 1);
            removed = true;
        } else if (fromAllPiles) {
            const discardIdx = this.discardPile.indexOf(cardId);
            if (discardIdx > -1) {
                this.discardPile.splice(discardIdx, 1);
                removed = true;
            } else {
                const handIdx = this.hand.indexOf(cardId);
                if (handIdx > -1) {
                    this.hand.splice(handIdx, 1);
                    removed = true;
                }
            }
        }
        if (removed) {
            UIManager.addLogEntry(`Removed ${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'a concept'} from your psyche.`, "system");
        }
        return removed;
    }

    // --- Stat & Resource Modification ---
    modifyIntegrity(amount) {
        this.integrity += amount;
        if (this.integrity > this.maxIntegrity) this.integrity = this.maxIntegrity;
        if (this.integrity < 0) this.integrity = 0;
        // UIManager.updatePlayerStats(this.getUIData());
        if (amount < 0) UIManager.addLogEntry(`Took ${-amount} Psychological Damage.`, "damage");
        if (this.integrity === 0) {
            // Game over logic would be handled by main.js
            // UIManager.displayGameOver("Psychological Collapse!", "Your Integrity has shattered.");
        }
    }

    modifyFocus(amount) {
        this.focus += amount;
        if (this.focus > this.maxFocus) this.focus = this.maxFocus;
        if (this.focus < 0) this.focus = 0;
        // UIManager.updatePlayerStats(this.getUIData());
    }

    spendFocus(cost) {
        if (this.focus >= cost) {
            this.focus -= cost;
            // UIManager.updatePlayerStats(this.getUIData());
            return true;
        }
        UIManager.addLogEntry("Not enough Focus.", "error");
        return false;
    }

    modifyClarity(amount) {
        this.clarity += amount;
        if (this.clarity > this.maxClarity) this.clarity = this.maxClarity;
        if (this.clarity < 0) this.clarity = 0;
        // UIManager.updatePlayerStats(this.getUIData());
        if (this.clarity === 0) {
            UIManager.addLogEntry("Clarity exhausted! Mental Fog sets in.", "warning");
            // Trigger Mental Fog effects (e.g., Despair gain, negative events)
        }
    }

    modifyHope(amount) {
        this.hope += amount;
        if (this.hope > this.maxHope) this.hope = this.maxHope;
        if (this.hope < 0) this.hope = 0;
        // UIManager.updatePlayerStats(this.getUIData());
    }

    modifyDespair(amount) {
        this.despair += amount;
        if (this.despair > this.maxDespair) this.despair = this.maxDespair;
        if (this.despair < 0) this.despair = 0;
        // UIManager.updatePlayerStats(this.getUIData());
        if (this.despair >= this.maxDespair) {
             UIManager.addLogEntry("Despair has reached critical levels!", "critical");
            // Trigger severe Despair effects
        }
    }

    modifyInsight(amount) {
        this.insight += amount;
        if (this.insight < 0) this.insight = 0; // Should not happen often
        // UIManager.updatePlayerStats(this.getUIData()); // Insight might not be on main UI
        if (amount > 0) UIManager.addLogEntry(`Gained ${amount} Insight.`, "reward");
    }

    modifyAttunement(attunementKey, amount) {
        if (this.attunements.hasOwnProperty(attunementKey)) {
            this.attunements[attunementKey] += amount;
            // Add min/max caps for attunements if desired
            if (this.attunements[attunementKey] < 0) this.attunements[attunementKey] = 0;
            // UIManager.updatePlayerStats(this.getUIData());
            UIManager.addLogEntry(`${ATTUNEMENT_DEFINITIONS[attunementKey].name} ${amount > 0 ? 'increased' : 'decreased'} by ${Math.abs(amount)}.`, "system");
        }
    }

    // --- Memories (Artifacts) ---
    addMemory(memoryObject) { // memoryObject from a definition
        this.memories.push(memoryObject);
        // Apply memory's passive effects if any (more complex logic)
        UIManager.addLogEntry(`Acquired Memory: ${memoryObject.name}.`, "reward");
        // UIManager.updateActiveMemories(this.memories);
    }

    removeMemory(memoryId) {
        const memoryIndex = this.memories.findIndex(mem => mem.id === memoryId);
        if (memoryIndex > -1) {
            const removedMemory = this.memories.splice(memoryIndex, 1)[0];
            // Remove memory's passive effects
            UIManager.addLogEntry(`Lost Memory: ${removedMemory.name}.`, "system");
            // UIManager.updateActiveMemories(this.memories);
            return true;
        }
        return false;
    }

    // --- Persona Stance ---
    setPersonaStance(stanceId) {
        if (PERSONA_STANCE_DEFINITIONS[stanceId]) {
            this.activePersonaStance = PERSONA_STANCE_DEFINITIONS[stanceId];
            UIManager.addLogEntry(`Adopted ${this.activePersonaStance.name}.`, "system");
            // Apply stance modifiers (handled by encounter manager or main game loop)
        } else if (stanceId === null) {
            this.activePersonaStance = null;
            UIManager.addLogEntry(`Returned to a neutral stance.`, "system");
        }
    }

    // --- Utility / Data Getters ---
    getUIData() {
        // Consolidate data needed for UIManager.updatePlayerStats
        return {
            integrity: this.integrity, maxIntegrity: this.maxIntegrity,
            focus: this.focus, maxFocus: this.maxFocus,
            clarity: this.clarity, maxClarity: this.maxClarity,
            hope: this.hope, maxHope: this.maxHope,
            despair: this.despair, maxDespair: this.maxDespair,
            attunements: this.attunements
            // Insight might be displayed elsewhere or not constantly
        };
    }

    getHandCardData() {
        // Returns array of full card definition objects for cards in hand
        return this.hand.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(Boolean);
    }

    getFullDeckListData() {
        // Returns array of full card definition objects for all cards owned
        const allCards = [...this.deck, ...this.hand, ...this.discardPile];
        return allCards.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(Boolean);
    }

    getTraumaCount() {
        let count = 0;
        const checkPiles = [this.deck, this.hand, this.discardPile];
        checkPiles.forEach(pile => {
            pile.forEach(cardId => {
                if (CONCEPT_CARD_DEFINITIONS[cardId] && CONCEPT_CARD_DEFINITIONS[cardId].type === "Trauma") {
                    count++;
                }
            });
        });
        return count;
    }

    resetForNewRun() { // Or for game over
        this.integrity = PLAYER_INITIAL_STATS.integrity;
        this.maxIntegrity = PLAYER_INITIAL_STATS.maxIntegrity;
        this.focus = PLAYER_INITIAL_STATS.focus;
        this.maxFocus = PLAYER_INITIAL_STATS.maxFocus;
        this.clarity = PLAYER_INITIAL_STATS.clarity;
        this.maxClarity = PLAYER_INITIAL_STATS.maxClarity;
        this.hope = PLAYER_INITIAL_STATS.hope;
        this.maxHope = PLAYER_INITIAL_STATS.maxHope;
        this.despair = PLAYER_INITIAL_STATS.despair;
        // Keep Insight for meta-progression, or reset per run based on design
        // this.insight = 0; // Reset if insight is per-run only
        this.attunements = { ...PLAYER_INITIAL_STATS.attunements };
        this.hand = [];
        this.discardPile = [];
        this.traumaDeck = [];
        this.memories = []; // Or carry over some based on legacy
        this.activePersonaStance = null;
        this.initializeDeck(); // Get a fresh starting deck
    }

    // Called at the start of an encounter
    prepareForEncounter() {
        // For now, just ensure hand is clear, draw initial cards
        // More complex logic for encounter start effects from memories/stances could go here
        this.discardPile = [...this.discardPile, ...this.hand]; // Move hand to discard
        this.hand = [];
        this.drawCards(CONFIG.INITIAL_CARD_DRAW_ENCOUNTER, true);
    }

    // Called at the start of a player's turn in an encounter
    startTurnInEncounter() {
        this.modifyFocus(this.maxFocus); // Full focus regen for simplicity, or could be a base amount
        // Apply stance-based focus regen if any
        if (this.activePersonaStance && this.activePersonaStance.modifiers && this.activePersonaStance.modifiers.focusRegenBonus) {
            this.modifyFocus(this.activePersonaStance.modifiers.focusRegenBonus);
        }
        this.drawCards(CONFIG.TURN_START_CARD_DRAW);
    }
}

// We will create an instance of this player in main.js
// let GamePlayer = new Player();
