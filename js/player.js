// js/player.js

class Player {
    constructor() {
        this.name = CONFIG.INITIAL_PSYCHONAUT_NAME; 
        this.ambition = CONFIG.INITIAL_AMBITION_TEXT;

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

        this.attunements = { ...PLAYER_INITIAL_STATS.attunements };

        this.awakeningDeck = [...PLAYER_AWAKENING_DECK_CONTENTS]; 
        this.shuffleArray(this.awakeningDeck);

        this.deck = [...PLAYER_INITIAL_DECK]; 
        this.hand = [...PLAYER_INITIAL_AWAKENING_HAND]; 
        this.discardPile = [];
        
        this.journalEntriesData = []; // NEW: To store journal entries {title, text}

        this.memories = []; 
        this.activePersonaStance = null; 

        this.tarnishedLocketHopeAppliedThisTurn = false; 
        this.detachedObservationActive = false; 
        
        console.log("Player (v3 Immersive UI - Full) initialized.");
    }

    shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

    drawFromAwakeningDeck() {
        if (this.awakeningDeck.length > 0) {
            if (this.hand.length >= CONFIG.MAX_HAND_SIZE) {
                if(typeof Game !== 'undefined' && Game.notify) Game.notify("Hand is full. Cannot draw awakening insight.", "system_warning");
                return null;
            }
            const cardId = this.awakeningDeck.pop();
            if (cardId) {
                this.hand.push(cardId);
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; 
                if(typeof Game !== 'undefined' && Game.notify) Game.notify(`A flicker of insight: Drew "${cardDef?.name || 'an unknown concept'}".`, "discovery");
                return cardId;
            }
        } else { 
            if(typeof Game !== 'undefined' && Game.notify) Game.notify("No more awakening insights to draw.", "system");
        }
        return null;
    }

    drawCards(count) { 
        const drawnCards = [];
        for (let i = 0; i < count; i++) {
            if (this.hand.length >= CONFIG.MAX_HAND_SIZE) { if(Game && Game.notify) Game.notify("Hand is full. Cannot draw more cards.", "system_warning"); break; }
            if (this.deck.length === 0) {
                if (this.discardPile.length === 0) { if(Game && Game.notify) Game.notify("No concepts left in deck or discard pile to draw.", "system"); break; }
                if(Game && Game.notify) Game.notify("Deck empty. Reshuffling discard pile into deck.", "system");
                this.discardPile.forEach(cardId => this.deck.push(cardId)); this.discardPile = []; this.shuffleArray(this.deck);
                if (this.deck.length === 0) { if(Game && Game.notify) Game.notify("No concepts left after reshuffle.", "system"); break; }
            }
            const cardId = this.deck.pop();
            if (cardId) {
                this.hand.push(cardId); drawnCards.push(cardId);
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                if (cardDef) {
                    if(Game && Game.notify) Game.notify(`Drew: ${cardDef.name}.`, "system_subtle");
                    if (cardDef.type === "Trauma" && cardDef.onDrawFunctionName) {
                         if(Game && Game.notify) Game.notify(`TRAUMA DRAWN: ${cardDef.name}! ${cardDef.description}`, "trauma_major");
                         if (Game && typeof Game.handleTraumaOnDraw === 'function') {
                            Game.handleTraumaOnDraw(cardId, cardDef.onDrawFunctionName);
                         }
                    }
                } else { if(Game && Game.notify) Game.notify(`Drew an unknown concept (ID: ${cardId}).`, "error"); }
            }
        }
        return drawnCards;
    }

    playCardFromHand(cardId) { 
        const cardIndex = this.hand.indexOf(cardId);
        if (cardIndex > -1) {
            const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
            if (!cardDef) { 
                console.error("Played card ID has no definition in Player.playCardFromHand:", cardId); 
                if(Game && Game.notify) Game.notify(`Error: Unknown concept ID "${cardId}" in hand.`, "error"); 
                return null; 
            }
            const playedCardId = this.hand.splice(cardIndex, 1)[0];
            this.discardPile.push(playedCardId); 
            return cardDef; 
        }
        console.warn("Card not found in hand for playCardFromHand:", cardId, this.hand);
        return null;
    }

    discardCardFromHandById(cardId) { const cardIndex = this.hand.indexOf(cardId); if (cardIndex > -1) { const discardedCardId = this.hand.splice(cardIndex, 1)[0]; this.discardPile.push(discardedCardId); if(Game && Game.notify) Game.notify(`Discarded ${CONCEPT_CARD_DEFINITIONS[discardedCardId]?.name || 'a card'}.`, "system_negative"); return CONCEPT_CARD_DEFINITIONS[discardedCardId]; } return null; }
    discardRandomCardFromHand() { if (this.hand.length > 0) { const randomIndex = Math.floor(Math.random() * this.hand.length); const cardIdToDiscard = this.hand[randomIndex]; return this.discardCardFromHandById(cardIdToDiscard); } return null; }

    addConceptToDeck(cardId, shuffleIn = false) { this.deck.push(cardId); if (shuffleIn) this.shuffleArray(this.deck); if(Game && Game.notify) Game.notify(`"${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A new concept'}" coalesces in your deck.`, "reward"); }
    addConceptToDiscard(cardId) { this.discardPile.push(cardId); if(Game && Game.notify) Game.notify(`"${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'}" manifests in your discard pile.`, "system"); }
    addConceptToHand(cardId) { if (this.hand.length < CONFIG.MAX_HAND_SIZE) { this.hand.push(cardId); if(Game && Game.notify) Game.notify(`"${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'A concept'}" appears in your hand.`, "system_positive"); } else { if(Game && Game.notify) Game.notify(`Hand full, "${CONCEPT_CARD_DEFINITIONS[cardId]?.name || 'a concept'}" added to discard instead.`, "system_warning"); this.addConceptToDiscard(cardId); } }
    addTraumaToDiscard(traumaCardId) { this.discardPile.push(traumaCardId); const traumaDef = CONCEPT_CARD_DEFINITIONS[traumaCardId]; if(Game && Game.notify) Game.notify(`A Trauma (${traumaDef?.name || 'Unknown Fear'}) has formed in your discard pile!`, "trauma_major"); }
    removeCardFromPsyche(cardId) { let found = false; let pileName = ""; if (this.hand.includes(cardId)) { this.hand.splice(this.hand.indexOf(cardId), 1); found = true; pileName = "hand"; } else if (this.discardPile.includes(cardId)) { this.discardPile.splice(this.discardPile.indexOf(cardId), 1); found = true; pileName = "discard pile"; } else if (this.deck.includes(cardId)) { this.deck.splice(this.deck.indexOf(cardId), 1); found = true; pileName = "deck"; } if (found) { if(Game && Game.notify) Game.notify(`The Concept "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}" fades from your ${pileName}.`, "system"); } else { if(Game && Game.notify) Game.notify(`Could not find "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}" to remove.`, "warning"); } return found; }

    modifyIntegrity(amount, source = "an unknown force") { const prevIntegrity = this.integrity; this.integrity += amount; if (this.integrity > this.maxIntegrity) this.integrity = this.maxIntegrity; if (this.integrity < 0) this.integrity = 0; if (amount < 0 && Game && Game.notify) Game.notify(`Your mind strains (${-amount} Integrity damage from ${source}).`, "damage"); else if (amount > 0 && this.integrity > prevIntegrity && Game && Game.notify) Game.notify(`A measure of cohesion returns (+${amount} Integrity from ${source}).`, "system_positive"); if (this.integrity === 0 && prevIntegrity > 0 && typeof Game !== 'undefined' && typeof Game.triggerGameOver === 'function') Game.triggerGameOver("Psychological Collapse", "Your Integrity has shattered. The Inner Sea claims you."); }
    modifyMaxIntegrity(newMax) { const oldMax = this.maxIntegrity; this.maxIntegrity = Math.max(1, newMax); if (this.integrity > this.maxIntegrity) this.integrity = this.maxIntegrity; if (this.maxIntegrity > oldMax && Game && Game.notify) Game.notify(`Your capacity for psychological cohesion expands. Max Integrity: ${this.maxIntegrity}.`, "system_positive_strong"); else if (this.maxIntegrity < oldMax && Game && Game.notify) Game.notify(`Your psychological resilience feels diminished. Max Integrity: ${this.maxIntegrity}.`, "system_negative");}
    modifyFocus(amount, source = "internal reserves") { const prevFocus = this.focus; this.focus += amount; if (this.focus > this.maxFocus) this.focus = this.maxFocus; if (this.focus < 0) this.focus = 0; if (amount < 0 && this.focus < prevFocus && source !== "start of turn" && Game && Game.notify) { Game.notify(`Focus expended by ${source}.`, "system_subtle");}}
    modifyMaxFocus(newMax) { const oldMax = this.maxFocus; this.maxFocus = Math.max(1, newMax); if (this.focus > this.maxFocus) this.focus = this.maxFocus; if (this.maxFocus > oldMax && Game && Game.notify) Game.notify(`Your mental energy capacity grows. Max Focus: ${this.maxFocus}.`, "system_positive_strong"); else if (this.maxFocus < oldMax && Game && Game.notify) Game.notify(`Your ability to focus feels constrained. Max Focus: ${this.maxFocus}.`, "system_negative");}
    spendFocusForCard(cost, cardName = "a Concept") { if (this.focus >= cost) { this.modifyFocus(-cost, `playing ${cardName}`); return true; } if(Game && Game.notify) Game.notify(`Not enough Focus to manifest ${cardName} (Need: ${cost}, Have: ${this.focus}).`, "warning"); return false; }
    modifyClarity(amount, source = "the journey") { const prevClarity = this.clarity; this.clarity += amount; if (this.clarity > this.maxClarity) this.clarity = this.maxClarity; if (this.clarity < 0) this.clarity = 0; if (amount < 0 && Game && Game.notify) Game.notify(`The way forward blurs (-${-amount} Clarity from ${source}).`, "system_negative"); else if (amount > 0 && this.clarity > prevClarity && Game && Game.notify) Game.notify(`A moment of lucidity (+${amount} Clarity from ${source}).`, "system_positive"); if (this.clarity === 0 && prevClarity > 0) { if(Game && Game.notify) Game.notify("Clarity exhausted! A thick Mental Fog descends, oppressive and disorienting.", "critical"); this.modifyDespair(2, "Mental Fog"); if (typeof Game !== 'undefined' && typeof Game.triggerMentalFogEffects === 'function') Game.triggerMentalFogEffects(); }}
    modifyHope(amount, source = "an unknown influence") { const prevHope = this.hope; this.hope += amount; if (this.hope > this.maxHope) this.hope = this.maxHope; if (this.hope < 0) this.hope = 0; if (amount < 0 && Game && Game.notify) Game.notify(`A flicker of Hope gutters and fades (-${-amount} from ${source}).`, "system_negative"); else if (amount > 0 && this.hope > prevHope && Game && Game.notify) Game.notify(`A fragile Hope glimmers anew (+${amount} from ${source}).`, "system_positive_strong"); if (this.hope <= 1 && prevHope > 1 && this.memories.some(mem => mem.id === "MEM_TARNISHED_LOCKET") && Game && Game.notify) { Game.notify("The Tarnished Locket emits a faint, comforting warmth.", "artifact_effect"); this.tarnishedLocketHopeAppliedThisTurn = false; }}
    modifyDespair(amount, source = "the encroaching void") { const prevDespair = this.despair; this.despair += amount; if (this.despair > this.maxDespair) this.despair = this.maxDespair; if (this.despair < 0) this.despair = 0; if (amount > 0 && this.despair > prevDespair && Game && Game.notify) Game.notify(`A cold Despair seeps in (+${amount} from ${source}).`, "system_negative"); else if (amount < 0 && Game && Game.notify) Game.notify(`The weight of Despair lessens slightly (-${-amount} from ${source}).`, "system_positive"); if (this.despair >= this.maxDespair && prevDespair < this.maxDespair) { if(Game && Game.notify) Game.notify("Despair has reached critical levels! The shadows writhe with unseen horrors.", "critical_system"); if (typeof Game !== 'undefined' && typeof Game.triggerCriticalDespairEffects === 'function') Game.triggerCriticalDespairEffects(); } else if (this.despair > this.maxDespair * 0.7 && prevDespair <= this.maxDespair * 0.7 && Game && Game.notify) { Game.notify("Despair grows heavy. The Inner Sea feels more oppressive.", "warning"); }}
    modifyInsight(amount, source = "an epiphany") { this.insight += amount; if (this.insight < 0) this.insight = 0; if (amount > 0 && Game && Game.notify) Game.notify(`A flash of Insight illuminates your mind (+${amount} from ${source}).`, "reward"); }
    modifyAttunement(attunementKey, amount, source = "an experience") { if (this.attunements.hasOwnProperty(attunementKey)) { const prevValue = this.attunements[attunementKey]; this.attunements[attunementKey] += amount; if (this.attunements[attunementKey] < 0) this.attunements[attunementKey] = 0; if (this.attunements[attunementKey] !== prevValue && Game && Game.notify && typeof ATTUNEMENT_DEFINITIONS !== 'undefined') { Game.notify(`Your approach to ${ATTUNEMENT_DEFINITIONS[attunementKey].name} shifts via ${source} (${amount > 0 ? '+' : ''}${amount}). Current: ${this.attunements[attunementKey]}.`, "system"); } } }

    addMemory(memoryId) { const memoryDef = MEMORY_DEFINITIONS[memoryId]; if (memoryDef && !this.memories.some(mem => mem.id === memoryId)) { this.memories.push({ ...memoryDef }); if(Game && Game.notify) Game.notify(`A forgotten Memory surfaces: "${memoryDef.name}".`, "reward"); if (memoryDef.onAcquireFunctionName && typeof Game !== 'undefined' && typeof Game.executeMemoryEffect === 'function') Game.executeMemoryEffect(memoryDef.onAcquireFunctionName, this); } else if (this.memories.some(mem => mem.id === memoryId)) { if(Game && Game.notify) Game.notify(`You already possess the Memory: "${memoryDef.name}".`, "system"); } else { if(Game && Game.notify) Game.notify(`Failed to acquire unknown Memory: ${memoryId}.`, "error"); } }
    removeMemory(memoryId) { const memoryIndex = this.memories.findIndex(mem => mem.id === memoryId); if (memoryIndex > -1) { const removedMemory = this.memories.splice(memoryIndex, 1)[0]; if(Game && Game.notify) Game.notify(`The Memory of "${removedMemory.name}" fades...`, "system_negative"); if (removedMemory.onRemoveFunctionName && typeof Game !== 'undefined' && typeof Game.executeMemoryEffect === 'function') Game.executeMemoryEffect(removedMemory.onRemoveFunctionName, this); return true; } return false; }
    hasMemory(memoryId) { return this.memories.some(mem => mem.id === memoryId); }

    setPersonaStance(stanceId) { if (stanceId === null) { if (this.activePersonaStance && Game && Game.notify) { Game.notify(`You release the ${this.activePersonaStance.name}, returning to a neutral mindset.`, "system"); } this.activePersonaStance = null; return; } const stanceDef = PERSONA_STANCE_DEFINITIONS[stanceId]; if (stanceDef) { let canAdopt = true; if (stanceDef.attunementReq && typeof ATTUNEMENT_DEFINITIONS !== 'undefined') { for (const attKey in stanceDef.attunementReq) { if (this.attunements[attKey] < stanceDef.attunementReq[attKey]) { canAdopt = false; if(Game && Game.notify) Game.notify(`Cannot adopt ${stanceDef.name}: requires ${ATTUNEMENT_DEFINITIONS[attKey].name} ${stanceDef.attunementReq[attKey]}. You have ${this.attunements[attKey]}.`, "warning"); break; } } } if (canAdopt) { this.activePersonaStance = { ...stanceDef }; if(Game && Game.notify) Game.notify(`You adopt the ${this.activePersonaStance.name}.`, "system_positive"); } } else { if(Game && Game.notify) Game.notify(`Unknown Persona Stance ID: ${stanceId}`, "error"); } }

    getUIData() { return { integrity: this.integrity, maxIntegrity: this.maxIntegrity, focus: this.focus, maxFocus: this.maxFocus, clarity: this.clarity, maxClarity: this.maxClarity, hope: this.hope, maxHope: this.maxHope, despair: this.despair, maxDespair: this.maxDespair, attunements: this.attunements }; }
    getHandCardDefinitions() { return this.hand.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(cardDef => cardDef !== undefined); }
    getFullDeckCardDefinitions() { const allCardIds = [...this.deck, ...this.hand, ...this.discardPile]; return allCardIds.map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]).filter(cardDef => cardDef !== undefined); }
    getTraumaCountInPlay() { let count = 0; const pilesToScan = [this.deck, ...this.hand, ...this.discardPile]; pilesToScan.forEach(cardId => { const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; if (cardDef && cardDef.type === "Trauma") { count++; } }); return count; }

    resetForNewRun() {
        this.name = CONFIG.INITIAL_PSYCHONAUT_NAME; this.ambition = CONFIG.INITIAL_AMBITION_TEXT;
        this.integrity = PLAYER_INITIAL_STATS.integrity; this.maxIntegrity = PLAYER_INITIAL_STATS.maxIntegrity;
        this.focus = PLAYER_INITIAL_STATS.focus; this.maxFocus = PLAYER_INITIAL_STATS.maxFocus;
        this.clarity = PLAYER_INITIAL_STATS.clarity; this.maxClarity = PLAYER_INITIAL_STATS.maxClarity;
        this.hope = PLAYER_INITIAL_STATS.hope; this.maxHope = PLAYER_INITIAL_STATS.maxHope;
        this.despair = PLAYER_INITIAL_STATS.despair; this.insight = PLAYER_INITIAL_STATS.insight; 
        this.attunements = { ...PLAYER_INITIAL_STATS.attunements };
        this.awakeningDeck = [...PLAYER_AWAKENING_DECK_CONTENTS]; this.shuffleArray(this.awakeningDeck);
        this.deck = [...PLAYER_INITIAL_DECK]; this.hand = [...PLAYER_INITIAL_AWAKENING_HAND]; this.discardPile = [];
        this.journalEntriesData = [];
        this.memories = []; this.activePersonaStance = null;
        this.tarnishedLocketHopeAppliedThisTurn = false;
        this.detachedObservationActive = false;
    }

    prepareForEncounter() {
        this.discardPile.push(...this.hand); 
        this.hand = [];
        if (!this.activePersonaStance && typeof PERSONA_STANCE_DEFINITIONS !== 'undefined' && PERSONA_STANCE_DEFINITIONS["OBSERVER"]) { 
            this.setPersonaStance("OBSERVER"); 
        }
    }

    startTurnInEncounter() { 
        this.tarnishedLocketHopeAppliedThisTurn = false;
        let focusToRegen = this.maxFocus; 
        if (this.activePersonaStance && this.activePersonaStance.modifiers && this.activePersonaStance.modifiers.focusRegenBonus) {
            focusToRegen += this.activePersonaStance.modifiers.focusRegenBonus;
        }
        this.modifyFocus(focusToRegen, "start of turn"); 
        
        this.drawCards(CONFIG.TURN_START_CARD_DRAW); 

        if (this.hope <= 1 && !this.tarnishedLocketHopeAppliedThisTurn && this.memories.some(mem => mem.id === "MEM_TARNISHED_LOCKET")) {
            this.modifyHope(1, "Tarnished Locket");
            this.tarnishedLocketHopeAppliedThisTurn = true; 
        }
        this.detachedObservationActive = false; 
    }

    // Journal Data Management
    addJournalEntry(title, text) {
        this.journalEntriesData.push({ title, text, date: new Date().toLocaleString() });
        // Ensure Game.notify is available for the UI part of adding a journal entry
        if (typeof Game !== 'undefined' && Game.notify) {
            Game.notify(`Journal Updated: "${title}"`, "discovery");
        }
         // If UIManager has a direct way to update the journal modal content dynamically, call it here too
        if (typeof UIManager !== 'undefined' && UIManager.addJournalEntryDOM) {
            UIManager.addJournalEntryDOM(title, text); // UIManager function to update the modal directly
        }
    }

    getJournalEntries() {
        return this.journalEntriesData;
    }
}
