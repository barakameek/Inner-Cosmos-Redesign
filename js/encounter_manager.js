// js/encounter_manager.js

const EncounterManager = (() => {

    let isActive = false;
    let currentPlayerRef = null;
    let currentAspect = null; 

    let playerEncounterState = {
        composure: 0,
        disorientationClaritySpentThisTurn: false,
    };

    let viewToReturnToAfterEncounter = 'map-view'; 

    function init(player) {
        currentPlayerRef = player;
        console.log("EncounterManager (v2.1 Awakening - Full Corrected v2) initialized.");
    }

    function startEncounter(aspectId, previousViewId = 'map-view') {
        const aspectTemplate = ASPECT_TEMPLATES[aspectId]; 
        if (!aspectTemplate) {
            if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Error: Aspect template ID "${aspectId}" not found.`, "error");
            if(typeof Game !== 'undefined' && Game.returnFromEncounter) Game.returnFromEncounter(previousViewId); 
            return false;
        }
        isActive = true;
        viewToReturnToAfterEncounter = previousViewId;

        currentAspect = {
            id: aspectTemplate.id,
            name: aspectTemplate.name,
            resolve: aspectTemplate.baseResolve,
            maxResolve: aspectTemplate.baseResolve,
            composure: aspectTemplate.baseComposure,
            maxComposureCap: aspectTemplate.baseComposure + Math.ceil(aspectTemplate.baseResolve * 0.75) || 20,
            resonance: 0,
            resonanceGoal: aspectTemplate.resonanceGoal,
            dissonance: 0,
            dissonanceThreshold: aspectTemplate.dissonanceThreshold,
            dissonanceTriggeredThisThreshold: false,
            visibleTraits: JSON.parse(JSON.stringify(aspectTemplate.visibleTraits || [])),
            hiddenTraits: JSON.parse(JSON.stringify(aspectTemplate.hiddenTraits || [])),
            revealedTraits: [],
            intents: (aspectTemplate.intents || []).map(intent => ({ ...intent })),
            currentIntent: null,
            states: [], 
            tookPressureThisTurn: false,
            rewards: { ...(aspectTemplate.rewards || {}) },
            turnCount: 0
        };

        currentPlayerRef.prepareForEncounter(); 
        playerEncounterState.composure = 0;
        playerEncounterState.disorientationClaritySpentThisTurn = false;

        _chooseAspectIntent(); 

        if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Encounter begins: ${currentAspect.name} materializes!`, "critical_system");
        _startPlayerTurn(); 
        return true;
    }

    function endEncounter(outcome) { 
        if(!isActive) return; 
        isActive = false; 
        if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Encounter with ${currentAspect.name} concludes. Outcome: ${outcome}.`, "system_major_event"); 
        switch (outcome) { 
            case "player_win_resolve": case "player_win_resonance": const victoryType = outcome === 'player_win_resolve' ? 'Understanding' : 'Integration'; if(Game && Game.notify) Game.notify(`You achieved ${victoryType} with ${currentAspect.name}!`, "reward_major"); if (currentAspect.rewards) { if (currentAspect.rewards.insight) currentPlayerRef.modifyInsight(currentAspect.rewards.insight, `resolving ${currentAspect.name}`); if (currentAspect.rewards.conceptPool?.length > 0) { const cardId = currentAspect.rewards.conceptPool[Math.floor(Math.random() * currentAspect.rewards.conceptPool.length)]; if(Game && Game.notify) Game.notify(`A new understanding forms: "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}".`, "reward"); currentPlayerRef.addConceptToDeck(cardId, true); } if (currentAspect.rewards.memoryPool?.length > 0) { const memoryId = currentAspect.rewards.memoryPool[Math.floor(Math.random() * currentAspect.rewards.memoryPool.length)]; currentPlayerRef.addMemory(memoryId); } } break; 
            case "player_flee": if(Game && Game.notify) Game.notify("You disengage.", "system"); currentPlayerRef.modifyClarity(-2, "fleeing"); currentPlayerRef.modifyDespair(1, "unresolved encounter"); break; 
            case "aspect_win": if(Game && Game.notify) Game.notify(`${currentAspect.name} overwhelmed your psyche.`, "critical"); break; 
            case "aspect_fled": if(Game && Game.notify) Game.notify(`${currentAspect.name} faded. An enigma remains.`, "system_negative"); currentPlayerRef.modifyDespair(1, `${currentAspect.name} disengaged`); break; 
        } 
        currentAspect = null; 
        playerEncounterState = { composure: 0, disorientationClaritySpentThisTurn: false }; 
        if(typeof Game !== 'undefined' && Game.returnFromEncounter) Game.returnFromEncounter(viewToReturnToAfterEncounter); 
    }
    function _startPlayerTurn() { if (!isActive || !currentAspect) return; if(Game && Game.notify) Game.notify("--- Your Turn ---", "turn"); playerEncounterState.disorientationClaritySpentThisTurn = false; currentPlayerRef.startTurnInEncounter(); _updateEncounterUIDisplay(); if(UIManager && UIManager.getDOMElement('endTurnEncounterButton')) UIManager.getDOMElement('endTurnEncounterButton').disabled = false; if(UIManager && UIManager.getDOMElement('revealTraitEncounterButton')) UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0); }
    function _endPlayerTurn() { if (!isActive || !currentAspect) return; if(Game && Game.notify) Game.notify("You steady your thoughts, ending your turn.", "system"); if(UIManager && UIManager.getDOMElement('endTurnEncounterButton')) UIManager.getDOMElement('endTurnEncounterButton').disabled = true; _startAspectTurn(); }
    function _startAspectTurn() { if (!isActive || !currentAspect) return; currentAspect.turnCount++; if(Game && Game.notify) Game.notify(`--- ${currentAspect.name}'s Turn (${currentAspect.turnCount}) ---`, "turn"); if (currentAspect.tookPressureThisTurn && currentAspect.visibleTraits.some(t => t.name.includes("Grudge Holder"))) { _gainAspectComposure(1, "Grudge Holder Trait"); } currentAspect.tookPressureThisTurn = false; _updateAspectStates(); if (currentAspect.currentIntent && typeof aspectIntentEffects[currentAspect.currentIntent.functionName] === 'function') { if(Game && Game.notify) Game.notify(`${currentAspect.name} intends: ${currentAspect.currentIntent.description}`, "intent"); aspectIntentEffects[currentAspect.currentIntent.functionName](currentAspect.currentIntent.params || {}); } else { if(Game && Game.notify) Game.notify(`${currentAspect.name} hesitates.`, "system"); } if (_checkEncounterWinLoss()) return; _chooseAspectIntent(); _updateEncounterUIDisplay(); if (isActive) { setTimeout(() => { if (isActive) _startPlayerTurn(); }, 800); } }
    function playConceptCard(cardId) { if (!isActive || !currentPlayerRef || !currentAspect) return; const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; if (!cardDef) { if(Game && Game.notify) Game.notify(`Error playing unknown Concept ID: ${cardId}`, "error"); return; } let actualCost = cardDef.cost; const disorientationInHand = currentPlayerRef.hand.some(id => id === "TRM001"); if (cardDef.id !== "TRM001" && disorientationInHand && !playerEncounterState.disorientationClaritySpentThisTurn) { actualCost += 1; } if (!currentPlayerRef.spendFocusForCard(actualCost, cardDef.name)) return; const playedCard = currentPlayerRef.playCardFromHand(cardId); if (!playedCard) { console.error(`Failed to retrieve ${cardId} from hand after focus spend.`); return; } if(Game && Game.notify) Game.notify(`Played ${cardDef.name}.`, "player_action"); if (cardDef.effectFunctionName && typeof conceptCardEffects[cardDef.effectFunctionName] === 'function') { conceptCardEffects[cardDef.effectFunctionName](cardDef); } else { if(Game && Game.notify) Game.notify(`Effect for ${cardDef.name} not yet defined.`, "error"); } if (cardDef.keywords.includes("#DissonanceSource") && currentAspect.visibleTraits.some(t => t.name.includes("Feeds on Negativity"))) { if(Game && Game.notify) Game.notify(`${currentAspect.name} draws strength from the dissonance!`, "aspect_action_subtle"); _gainAspectComposure(1, "Feeds on Negativity"); } const isChallenge = cardDef.keywords.includes("#Challenge"); const lashesOutTrait = currentAspect.hiddenTraits.find(t => t.name.includes("Lashes Out") && currentAspect.revealedTraits.includes(t.name)); if (isChallenge && lashesOutTrait && currentAspect.resolve < (currentAspect.maxResolve * 0.4)) { if(Game && Game.notify) Game.notify(`TRAIT TRIGGER: ${currentAspect.name} 'Lashes Out When Cornered'!`, "critical"); const lashOutIntent = currentAspect.intents.find(intent => intent.id === "INT_DOUBT_01" || intent.name.includes("Jab")); if (lashOutIntent && typeof aspectIntentEffects[lashOutIntent.functionName] === 'function') { aspectIntentEffects[lashOutIntent.functionName](lashOutIntent.params || {}); } } _updateEncounterUIDisplay(); if (_checkEncounterWinLoss()) return; if(UIManager && UIManager.getDOMElement('revealTraitEncounterButton')) UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0); }
    function _getUnrevealedTraitCount() { if (!currentAspect) return 0; return currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name)).length; }
    function _updateEncounterUIDisplay() { if (!isActive || !currentAspect || !currentPlayerRef || !UIManager) return; UIManager.displayEncounterView(currentAspect, currentPlayerRef, playerEncounterState); UIManager.updatePlayerHand(currentPlayerRef.getHandCardDefinitions()); }
    function _applyPressureToAspect(amount, source = "a Concept") { if (!currentAspect) return; let pressureApplied = amount; if (currentAspect.states.some(s => s.name === "Vulnerable")) pressureApplied *= 1.5; if (currentAspect.composure > 0) { const absorbed = Math.min(pressureApplied, currentAspect.composure); currentAspect.composure -= absorbed; pressureApplied -= absorbed; if(Game && Game.notify) Game.notify(`${currentAspect.name}'s Composure absorbs ${absorbed} Pressure.`, "combat"); } if (pressureApplied > 0) { currentAspect.resolve -= Math.floor(pressureApplied); currentAspect.tookPressureThisTurn = true; if(Game && Game.notify) Game.notify(`${currentAspect.name} takes ${Math.floor(pressureApplied)} Pressure from ${source}. Resolve: ${currentAspect.resolve}/${currentAspect.maxResolve}`, "combat_crit"); } if (currentAspect.resolve <= 0) currentAspect.resolve = 0; }
    function _gainAspectComposure(amount, source = "") { if (!currentAspect) return; currentAspect.composure += amount; if (currentAspect.composure > currentAspect.maxComposureCap) currentAspect.composure = currentAspect.maxComposureCap; if(Game && Game.notify) Game.notify(`${currentAspect.name} gains ${amount} Composure (${source}). Composure: ${currentAspect.composure}`, "combat"); }
    function _buildResonance(amount, source = "") { if (!currentAspect) return; if (source.includes("Shared Sorrow") && (currentAspect.visibleTraits.some(t => t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound")) || currentAspect.hiddenTraits.some(t => (currentAspect.revealedTraits.includes(t.name)) && (t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound"))))) { amount += 1; if(Game && Game.notify) Game.notify(`"${source}" resonates deeply (+1 bonus).`, "system_positive_strong"); } currentAspect.resonance += amount; if (currentAspect.resonance > currentAspect.resonanceGoal) currentAspect.resonance = currentAspect.resonanceGoal; if(Game && Game.notify) Game.notify(`Resonance grows by ${amount} (${source}). (${currentAspect.resonance}/${currentAspect.resonanceGoal})`, "system_positive"); }
    function _buildDissonance(amount, source = "") { if (!currentAspect) return; currentAspect.dissonance += amount; if(Game && Game.notify) Game.notify(`Dissonance deepens by ${amount} (${source}). (${currentAspect.dissonance}/${currentAspect.dissonanceThreshold})`, "system_negative"); if (currentAspect.dissonance >= currentAspect.dissonanceThreshold && !currentAspect.dissonanceTriggeredThisThreshold) { currentAspect.dissonanceTriggeredThisThreshold = true; if(Game && Game.notify) Game.notify(`${currentAspect.name} crosses Dissonance threshold! It becomes agitated!`, "critical"); _applyAspectState({ name: "Agitated", duration: 2, data: { pressureBoost: 1 } }); currentPlayerRef.addTraumaToDiscard("TRM001"); } }
    function _applyAspectState(stateObject) { if (!currentAspect) return; let existingState = currentAspect.states.find(s => s.name === stateObject.name); if (existingState) { existingState.duration = Math.max(existingState.duration || 0, stateObject.duration || 0); if(stateObject.data) existingState.data = {...existingState.data, ...stateObject.data}; } else { currentAspect.states.push(stateObject); } if(Game && Game.notify) Game.notify(`${currentAspect.name} becomes ${stateObject.name}.`, "aspect_action_subtle"); }
    function _updateAspectStates() { if (!currentAspect || !currentAspect.states) return; currentAspect.states = currentAspect.states.filter(state => { if (state.duration !== undefined) { state.duration--; if (state.duration <= 0) { if(Game && Game.notify) Game.notify(`${currentAspect.name} is no longer ${state.name}.`, "system"); return false; } } return true; }); }
    function _chooseAspectIntent() { if (!currentAspect || !currentAspect.intents || currentAspect.intents.length === 0) { currentAspect.currentIntent = { description: "Stands mutely.", functionName: null }; return; } const availableIntents = currentAspect.intents.filter(intent => { if (intent.id === "INT_DOUBT_03" && currentAspect.turnCount < 2) return false; return true; }); if (availableIntents.length === 0) { currentAspect.currentIntent = currentAspect.intents[0] || { description: "Is still.", functionName: null}; } else { currentAspect.currentIntent = availableIntents[Math.floor(Math.random() * availableIntents.length)]; } }
    function revealHiddenAspectTrait() { let cost = 1; if(currentPlayerRef.detachedObservationActive){ cost = Math.max(0, cost -1); currentPlayerRef.detachedObservationActive = false; if(Game && Game.notify) Game.notify("Detached Observation reduces Insight cost for revealing a Trait.", "player_action_good");} if (!isActive || !currentAspect || currentPlayerRef.insight < cost || _getUnrevealedTraitCount() === 0) { if (currentPlayerRef.insight < cost && Game && Game.notify) Game.notify("Not enough Insight.", "warning"); else if (_getUnrevealedTraitCount() === 0 && Game && Game.notify) Game.notify("No more hidden traits to reveal on this Aspect.", "system"); return; } currentPlayerRef.modifyInsight(-cost, "revealing a Trait"); const unrevealed = currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name)); if (unrevealed.length > 0) { const traitToReveal = unrevealed[0]; currentAspect.revealedTraits.push(traitToReveal.name); if(Game && Game.notify) Game.notify(`Revealed Trait for ${currentAspect.name}: ${traitToReveal.name} - ${traitToReveal.description}`, "discovery"); } _updateEncounterUIDisplay(); if(UIManager && UIManager.getDOMElement('revealTraitEncounterButton')) UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0); }
    function _checkEncounterWinLoss() { if (!isActive || !currentAspect) return false; if (currentPlayerRef.integrity <= 0) { endEncounter("aspect_win"); return true; } if (currentAspect.resolve <= 0) { endEncounter("player_win_resolve"); return true; } if (currentAspect.resonance >= currentAspect.resonanceGoal) { endEncounter("player_win_resonance"); return true; } return false; }

    const conceptCardEffects = {
        playGraspForAwareness: (cardDef) => { currentPlayerRef.modifyFocus(1, cardDef.name); currentPlayerRef.modifyClarity(1, cardDef.name); currentPlayerRef.drawFromAwakeningDeck(); },
        playFragmentedMemoryTheFall: (cardDef) => { currentPlayerRef.modifyClarity(2, cardDef.name); currentPlayerRef.addTraumaToDiscard("TRM001"); if(Game && Game.addJournalEntry) Game.addJournalEntry("A Glimpse of the Fall", "Painful, fractured visions... how I arrived. Clarity gained, but Disorientation too."); if(typeof Game !== 'undefined' && Game.revealAwakeningMapConnections) Game.revealAwakeningMapConnections(); },
        playEchoOfAName: (cardDef) => { const name = CONFIG.INITIAL_PSYCHONAUT_NAME; currentPlayerRef.name = name; if(typeof Game !== 'undefined' && Game.playerRecalledName) Game.playerRecalledName(); currentPlayerRef.modifyMaxIntegrity(PLAYER_INITIAL_STATS.maxIntegrity + 40); currentPlayerRef.modifyIntegrity(20, cardDef.name); currentPlayerRef.modifyMaxFocus(PLAYER_INITIAL_STATS.maxFocus + 2); currentPlayerRef.modifyFocus(2, cardDef.name); if(Game && Game.addJournalEntry) Game.addJournalEntry("An Echo, A Name", `I remember... my name is ${name}. Strength returns.`); },
        playPrimalFear: (cardDef) => { /* NO COMBAT: This effect is now handled by storylet if chosen */ if(Game && Game.notify) Game.notify(`You channelled your Primal Fear. A wave of raw emotion.`, "player_action_major"); currentPlayerRef.modifyAttunement("interaction", 1, cardDef.name); _buildDissonance(1, `${cardDef.name} (self expression)`); },
        playSharedSorrow: (cardDef) => { let baseRes = 2; _buildResonance(baseRes, cardDef.name); currentPlayerRef.modifyIntegrity(1, cardDef.name); },
        playDetachedObservation: (cardDef) => { currentPlayerRef.detachedObservationActive = true; if(Game && Game.notify) Game.notify("Perspective shifts: your next query will be more focused.", "system_positive"); currentPlayerRef.drawCards(1); },
        playStandardInquiry: (cardDef) => { revealHiddenAspectTrait(); _buildResonance(1, cardDef.name); },
        playStandardChallenge: (cardDef) => { _applyPressureToAspect(4, cardDef.name); _buildDissonance(1, cardDef.name); },
        onDrawDisorientation: (cardDef) => { // This is the function called by Game.handleTraumaOnDraw
            if(Game && Game.notify) Game.notify(`TRAUMA EFFECT: ${cardDef.name} clouds your thoughts! (Card costs +1 Focus this turn unless 1 Clarity spent).`, "trauma_major");
            // The *choice* to spend Clarity is handled in Game.handleTraumaOnDraw via confirm()
        },
        playDisorientation: (cardDef) => { _buildDissonance(1, cardDef.name + " (played to discard)"); } // Effect if explicitly "played"
    };

    const aspectIntentEffects = {
        intentSowConfusion: (params) => { const traumaId = params.traumaId || "TRM001"; if(Game && Game.notify) Game.notify(`${currentAspect.name} whispers disorienting notions.`, "aspect_action"); currentPlayerRef.addTraumaToDiscard(traumaId); },
        intentWhisperDiscouragement: (params) => { if(Game && Game.notify) Game.notify(`${currentAspect.name} murmurs words of despair.`, "aspect_action"); currentPlayerRef.modifyHope(-1, `${currentAspect.name}'s discouragement`); },
        intentFadeAway: (params) => { if (currentAspect.turnCount >= 2) { if(Game && Game.notify) Game.notify(`${currentAspect.name} begins to dissipate!`, "aspect_action_special"); endEncounter("aspect_fled"); } else { if(Game && Game.notify) Game.notify(`${currentAspect.name} attempts to fade, but holds its form.`, "aspect_action_subtle"); _gainAspectComposure(2, "failed fade attempt"); } }
    };

    return {
        init, startEncounter, endEncounter,
        isActive: () => isActive,
        getCurrentAspectData: () => currentAspect,
        playConceptCard,
        playerEndTurn: _endPlayerTurn,
        revealHiddenAspectTrait,
        canSpendClarityForDisorientation: () => currentPlayerRef && currentPlayerRef.clarity > 0 && currentPlayerRef.hand.some(id => id === "TRM001") && playerEncounterState && !playerEncounterState.disorientationClaritySpentThisTurn,
        spendClarityForDisorientation: () => { if (currentPlayerRef && currentPlayerRef.clarity > 0 && playerEncounterState) { currentPlayerRef.modifyClarity(-1, "negating Disorientation"); playerEncounterState.disorientationClaritySpentThisTurn = true; if(Game && Game.notify) Game.notify("You spend 1 Clarity to clear Disorientation's immediate effect.", "player_action_good"); _updateEncounterUIDisplay(); return true; } return false; },
        getConceptCardEffectFunction: (functionName) => conceptCardEffects[functionName],
        playerEncounterState 
    };
})();
