// js/encounter_manager.js

const EncounterManager = (() => {

    let isActive = false;
    let currentPlayerRef = null;
    let currentAspect = null;

    let playerEncounterState = {
        composure: 0,
        disorientationClaritySpentThisTurn: false,
        // other encounter-specific player states/flags
    };

    let viewToReturnToAfterEncounter = 'map-view'; // Default view to return to

    function init(player) {
        currentPlayerRef = player;
        console.log("EncounterManager (v2 Awakening) initialized.");
    }

    function startEncounter(aspectId, previousViewId = 'map-view') {
        const aspectTemplate = ASPECT_TEMPLATES[aspectId];
        if (!aspectTemplate) {
            UIManager.addLogEntry(`Error: Aspect template ID "${aspectId}" not found. Cannot start encounter.`, "error");
            Game.returnFromEncounter(previousViewId); // Signal failure to main
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
            dissonanceTriggeredThisThreshold: false, // Flag for threshold effect
            visibleTraits: JSON.parse(JSON.stringify(aspectTemplate.visibleTraits || [])),
            hiddenTraits: JSON.parse(JSON.stringify(aspectTemplate.hiddenTraits || [])),
            revealedTraits: [],
            intents: (aspectTemplate.intents || []).map(intent => ({ ...intent })),
            currentIntent: null,
            states: [], // { name, duration, data... }
            tookPressureThisTurn: false,
            rewards: { ...(aspectTemplate.rewards || {}) },
            turnCount: 0
        };

        currentPlayerRef.prepareForEncounter(); // Sets up stance, clears hand (draws later)
        playerEncounterState.composure = 0;
        playerEncounterState.disorientationClaritySpentThisTurn = false;

        _chooseAspectIntent(); // Choose first intent before UI display

        UIManager.addLogEntry(`Encounter begins: ${currentAspect.name} materializes!`, "critical_system");
        // Player's turn starts, which includes drawing initial hand for encounter
        _startPlayerTurn(); // This will call UIManager to display encounter and update hand
        return true;
    }

    function endEncounter(outcome) {
        if(!isActive) return; // Prevent multiple calls
        isActive = false;
        UIManager.addLogEntry(`Encounter with ${currentAspect.name} concludes. Outcome: ${outcome}.`, "system_major_event");

        switch (outcome) {
            case "player_win_resolve":
            case "player_win_resonance":
                const victoryType = outcome === 'player_win_resolve' ? 'Understanding' : 'Integration';
                UIManager.addLogEntry(`You achieved ${victoryType} with ${currentAspect.name}!`, "reward_major");
                if (currentAspect.rewards) {
                    if (currentAspect.rewards.insight) currentPlayerRef.modifyInsight(currentAspect.rewards.insight, `resolving ${currentAspect.name}`);
                    if (currentAspect.rewards.conceptPool?.length > 0) {
                        const cardId = currentAspect.rewards.conceptPool[Math.floor(Math.random() * currentAspect.rewards.conceptPool.length)];
                        UIManager.addLogEntry(`A new understanding forms: "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}".`, "reward");
                        currentPlayerRef.addConceptToDeck(cardId, true);
                    }
                    if (currentAspect.rewards.memoryPool?.length > 0) {
                        const memoryId = currentAspect.rewards.memoryPool[Math.floor(Math.random() * currentAspect.rewards.memoryPool.length)];
                        currentPlayerRef.addMemory(memoryId);
                    }
                }
                break;
            case "player_flee": UIManager.addLogEntry("You disengage.", "system"); currentPlayerRef.modifyClarity(-2, "fleeing"); currentPlayerRef.modifyDespair(1, "unresolved encounter"); break;
            case "aspect_win": UIManager.addLogEntry(`${currentAspect.name} overwhelmed your psyche.`, "critical"); break;
            case "aspect_fled": UIManager.addLogEntry(`${currentAspect.name} faded. An enigma remains.`, "system_negative"); currentPlayerRef.modifyDespair(1, `${currentAspect.name} disengaged`); break;
        }
        currentAspect = null;
        playerEncounterState = { composure: 0, disorientationClaritySpentThisTurn: false };
        Game.returnFromEncounter(viewToReturnToAfterEncounter);
    }

    function _startPlayerTurn() {
        if (!isActive || !currentAspect) return;
        UIManager.addLogEntry("--- Your Turn ---", "turn");
        playerEncounterState.disorientationClaritySpentThisTurn = false;
        currentPlayerRef.startTurnInEncounter(); // Regen focus, draw card, Tarnished Locket check

        // Apply player's start-of-turn effects from Stances/Memories (if any)
        // For example, Observer Stance focus regen is handled in Player.startTurnInEncounter

        _updateEncounterUIDisplay(); // Update all UI elements for encounter
        UIManager.getDOMElement('endTurnEncounterButton').disabled = false;
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0);
    }

    function _endPlayerTurn() {
        if (!isActive || !currentAspect) return;
        UIManager.addLogEntry("You steady your thoughts, ending your turn.", "system");
        UIManager.getDOMElement('endTurnEncounterButton').disabled = true;
        // Apply end-of-player-turn effects (e.g., expire temporary player states)
        // ...
        _startAspectTurn();
    }

    function _startAspectTurn() {
        if (!isActive || !currentAspect) return;
        currentAspect.turnCount++;
        UIManager.addLogEntry(`--- ${currentAspect.name}'s Turn (${currentAspect.turnCount}) ---`, "turn");

        if (currentAspect.tookPressureThisTurn && currentAspect.visibleTraits.some(t => t.name.includes("Grudge Holder"))) { _gainAspectComposure(1, "Grudge Holder Trait"); }
        currentAspect.tookPressureThisTurn = false;
        _updateAspectStates();

        if (currentAspect.currentIntent && typeof aspectIntentEffects[currentAspect.currentIntent.functionName] === 'function') {
            UIManager.addLogEntry(`${currentAspect.name} intends: ${currentAspect.currentIntent.description}`, "intent");
            aspectIntentEffects[currentAspect.currentIntent.functionName](currentAspect.currentIntent.params || {});
        } else { UIManager.addLogEntry(`${currentAspect.name} hesitates.`, "system"); }

        if (_checkEncounterWinLoss()) return;

        _chooseAspectIntent(); // Choose next intent AFTER current one executes
        _updateEncounterUIDisplay();

        if (isActive) { setTimeout(() => { if (isActive) _startPlayerTurn(); }, 800); }
    }

    function playConceptCard(cardId) {
        if (!isActive || !currentPlayerRef || !currentAspect) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) { UIManager.addLogEntry(`Error playing unknown Concept ID: ${cardId}`, "error"); return; }

        let actualCost = cardDef.cost;
        const disorientationInHand = currentPlayerRef.hand.some(id => id === "TRM001");
        if (cardDef.id !== "TRM001" && disorientationInHand && !playerEncounterState.disorientationClaritySpentThisTurn) {
            actualCost += 1; // Disorientation penalty
        }

        if (!currentPlayerRef.spendFocusForCard(actualCost, cardDef.name)) return;

        const playedCard = currentPlayerRef.playCardFromHand(cardId); // Moves card from hand to discard
        if (!playedCard) { console.error(`Failed to retrieve ${cardId} from hand after focus spend.`); return; } // Should not happen

        UIManager.addLogEntry(`Played ${cardDef.name}.`, "player_action");

        if (cardDef.effectFunctionName && typeof conceptCardEffects[cardDef.effectFunctionName] === 'function') {
            conceptCardEffects[cardDef.effectFunctionName](cardDef);
        } else { UIManager.addLogEntry(`Effect for ${cardDef.name} not yet defined.`, "error"); }

        // Post-play trait checks
        if (cardDef.keywords.includes("#DissonanceSource") && currentAspect.visibleTraits.some(t => t.name.includes("Feeds on Negativity"))) {
            UIManager.addLogEntry(`${currentAspect.name} draws strength from the dissonance!`, "aspect_action_subtle");
            _gainAspectComposure(1, "Feeds on Negativity");
        }
        const isChallenge = cardDef.keywords.includes("#Challenge");
        const lashesOutTrait = currentAspect.hiddenTraits.find(t => t.name.includes("Lashes Out") && currentAspect.revealedTraits.includes(t.name));
        if (isChallenge && lashesOutTrait && currentAspect.resolve < (currentAspect.maxResolve * 0.4)) {
            UIManager.addLogEntry(`TRAIT TRIGGER: ${currentAspect.name} 'Lashes Out When Cornered'!`, "critical");
            const lashOutIntent = currentAspect.intents.find(intent => intent.id === "INT_DOUBT_01" || intent.name.includes("Jab")); // Example for Lingering Doubt
            if (lashOutIntent && typeof aspectIntentEffects[lashOutIntent.functionName] === 'function') {
                 aspectIntentEffects[lashOutIntent.functionName](lashOutIntent.params || {});
            }
        }

        _updateEncounterUIDisplay();
        if (_checkEncounterWinLoss()) return;
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0);
    }

    function _getUnrevealedTraitCount() { if (!currentAspect) return 0; return currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name)).length; }
    function _updateEncounterUIDisplay() { if (!isActive || !currentAspect || !currentPlayerRef) return; UIManager.displayEncounterView(currentAspect, currentPlayerRef, playerEncounterState); UIManager.updatePlayerHand(currentPlayerRef.getHandCardDefinitions()); }

    function _applyPressureToAspect(amount, source = "a Concept") { if (!currentAspect) return; let pressureApplied = amount; if (currentAspect.composure > 0) { const absorbed = Math.min(pressureApplied, currentAspect.composure); currentAspect.composure -= absorbed; pressureApplied -= absorbed; UIManager.addLogEntry(`${currentAspect.name}'s Composure absorbs ${absorbed} Pressure.`, "combat"); } if (pressureApplied > 0) { currentAspect.resolve -= Math.floor(pressureApplied); currentAspect.tookPressureThisTurn = true; UIManager.addLogEntry(`${currentAspect.name} takes ${Math.floor(pressureApplied)} Pressure from ${source}. Resolve: ${currentAspect.resolve}/${currentAspect.maxResolve}`, "combat_crit"); } if (currentAspect.resolve <= 0) currentAspect.resolve = 0; }
    function _gainAspectComposure(amount, source = "") { if (!currentAspect) return; currentAspect.composure += amount; if (currentAspect.composure > currentAspect.maxComposureCap) currentAspect.composure = currentAspect.maxComposureCap; UIManager.addLogEntry(`${currentAspect.name} gains ${amount} Composure (${source}). Composure: ${currentAspect.composure}`, "combat"); }
    function _buildResonance(amount, source = "") { if (!currentAspect) return; /* Trait checks for bonus resonance */ if (source.includes("Shared Sorrow") && (currentAspect.visibleTraits.some(t => t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound")) || currentAspect.hiddenTraits.some(t => (currentAspect.revealedTraits.includes(t.name)) && (t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound"))))) { amount += 1; UIManager.addLogEntry(`"${source}" resonates deeply with ${currentAspect.name}'s sorrow (+1 bonus).`, "system_positive_strong"); } currentAspect.resonance += amount; if (currentAspect.resonance > currentAspect.resonanceGoal) currentAspect.resonance = currentAspect.resonanceGoal; UIManager.addLogEntry(`Resonance with ${currentAspect.name} grows by ${amount} (${source}). (${currentAspect.resonance}/${currentAspect.resonanceGoal})`, "system_positive"); }
    function _buildDissonance(amount, source = "") { if (!currentAspect) return; currentAspect.dissonance += amount; UIManager.addLogEntry(`Dissonance with ${currentAspect.name} deepens by ${amount} (${source}). (${currentAspect.dissonance}/${currentAspect.dissonanceThreshold})`, "system_negative"); if (currentAspect.dissonance >= currentAspect.dissonanceThreshold && !currentAspect.dissonanceTriggeredThisThreshold) { currentAspect.dissonanceTriggeredThisThreshold = true; UIManager.addLogEntry(`${currentAspect.name} crosses its Dissonance threshold! It becomes more agitated!`, "critical"); _applyAspectState({ name: "Agitated", duration: 2, data: { pressureBoost: 1 } }); currentPlayerRef.addTraumaToDiscard("TRM001"); } }
    function _applyAspectState(stateObject) { if (!currentAspect) return; let existingState = currentAspect.states.find(s => s.name === stateObject.name); if (existingState) { existingState.duration = Math.max(existingState.duration || 0, stateObject.duration || 0); if(stateObject.data) existingState.data = {...existingState.data, ...stateObject.data}; } else { currentAspect.states.push(stateObject); } UIManager.addLogEntry(`${currentAspect.name} becomes ${stateObject.name}.`, "aspect_action_subtle"); }
    function _updateAspectStates() { if (!currentAspect || !currentAspect.states) return; currentAspect.states = currentAspect.states.filter(state => { if (state.duration !== undefined) { state.duration--; if (state.duration <= 0) { UIManager.addLogEntry(`${currentAspect.name} is no longer ${state.name}.`, "system"); return false; } } return true; }); }
    function _chooseAspectIntent() { if (!currentAspect || !currentAspect.intents || currentAspect.intents.length === 0) { currentAspect.currentIntent = { description: "Stands mutely.", functionName: null }; return; } const availableIntents = currentAspect.intents.filter(intent => { if (intent.id === "INT_DOUBT_03" && currentAspect.turnCount < 2) return false; /* Lingering Doubt fades after turn 2 if not resolved */ return true; }); if (availableIntents.length === 0) { currentAspect.currentIntent = currentAspect.intents[0] || { description: "Is still.", functionName: null}; } else { currentAspect.currentIntent = availableIntents[Math.floor(Math.random() * availableIntents.length)]; } }
    function revealHiddenAspectTrait() { if (!isActive || !currentAspect || currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0) { if (currentPlayerRef.insight < 1) UIManager.addLogEntry("Not enough Insight.", "warning"); else if (_getUnrevealedTraitCount() === 0) UIManager.addLogEntry("No more hidden traits.", "system"); return; } currentPlayerRef.modifyInsight(-1, "revealing a Trait"); const unrevealed = currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name)); if (unrevealed.length > 0) { const traitToReveal = unrevealed[0]; currentAspect.revealedTraits.push(traitToReveal.name); UIManager.addLogEntry(`Revealed: ${traitToReveal.name} - ${traitToReveal.description}`, "discovery"); } _updateEncounterUIDisplay(); UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0); }
    function _checkEncounterWinLoss() { if (!isActive || !currentAspect) return false; if (currentPlayerRef.integrity <= 0) { endEncounter("aspect_win"); return true; } if (currentAspect.resolve <= 0) { endEncounter("player_win_resolve"); return true; } if (currentAspect.resonance >= currentAspect.resonanceGoal) { endEncounter("player_win_resonance"); return true; } return false; }

    const conceptCardEffects = {
        playGraspForAwareness: (cardDef) => { currentPlayerRef.modifyFocus(1, cardDef.name); currentPlayerRef.drawFromAwakeningDeck(); /* UI updated by draw & main game loop */ },
        playFragmentedMemoryTheFall: (cardDef) => { currentPlayerRef.modifyClarity(2, cardDef.name); currentPlayerRef.addTraumaToDiscard("TRM001"); UIManager.addJournalEntry("A Glimpse of the Fall", "Painful, fractured visions... how I arrived. Clarity gained, but Disorientation too."); Game.revealAwakeningMapConnections(); },
        playEchoOfAName: (cardDef) => { const name = CONFIG.INITIAL_PSYCHONAUT_NAME; currentPlayerRef.name = name; Game.playerRecalledName(); /* Notifies Main to update header */ currentPlayerRef.modifyMaxIntegrity(PLAYER_INITIAL_STATS.maxIntegrity + 40); currentPlayerRef.modifyIntegrity(20, cardDef.name); currentPlayerRef.modifyMaxFocus(PLAYER_INITIAL_STATS.maxFocus + 2); currentPlayerRef.modifyFocus(2, cardDef.name); UIManager.addJournalEntry("An Echo, A Name", `I remember... my name is ${name}. Strength returns.`); },
        playPrimalFear: (cardDef) => { _applyPressureToAspect(3, cardDef.name); _buildDissonance(1, `${cardDef.name} (self)`); },
        playSharedSorrow: (cardDef) => { let baseRes = 2; /* Bonus logic moved into _buildResonance */ _buildResonance(baseRes, cardDef.name); currentPlayerRef.modifyIntegrity(1, cardDef.name); },
        playDetachedObservation: (cardDef) => { Game.setPlayerTempFlag("detachedObservationActive", true); UIManager.addLogEntry("Perspective shifts: your next query will be more focused.", "system_positive"); currentPlayerRef.drawCards(1); },
        playStandardInquiry: (cardDef) => { revealHiddenAspectTrait(); _buildResonance(1, cardDef.name); },
        playStandardChallenge: (cardDef) => { _applyPressureToAspect(4, cardDef.name); _buildDissonance(1, cardDef.name); },
        onDrawDisorientation: (cardDef) => { UIManager.addLogEntry(`TRAUMA EFFECT: ${cardDef.name} clouds your thoughts! (Card costs +1 Focus this turn unless 1 Clarity spent).`, "trauma_major"); Game.handleDisorientationDraw(); /* Notifies main to handle choice/effect */},
        playDisorientation: (cardDef) => { _buildDissonance(1, cardDef.name + " (played)"); } // Minimal effect if explicitly played
    };

    const aspectIntentEffects = {
        intentSowConfusion: (params) => { const traumaId = params.traumaId || "TRM001"; UIManager.addLogEntry(`${currentAspect.name} whispers disorienting notions.`, "aspect_action"); currentPlayerRef.addTraumaToDiscard(traumaId); },
        intentWhisperDiscouragement: (params) => { UIManager.addLogEntry(`${currentAspect.name} murmurs words of despair.`, "aspect_action"); currentPlayerRef.modifyHope(-1, `${currentAspect.name}'s discouragement`); },
        intentFadeAway: (params) => { if (currentAspect.turnCount >= 2) { UIManager.addLogEntry(`${currentAspect.name} begins to dissipate!`, "aspect_action_special"); endEncounter("aspect_fled"); } else { UIManager.addLogEntry(`${currentAspect.name} attempts to fade, but holds its form.`, "aspect_action_subtle"); _gainAspectComposure(2, "failed fade attempt"); } }
    };

    return {
        init, startEncounter, endEncounter,
        isActive: () => isActive,
        getCurrentAspectData: () => currentAspect,
        playConceptCard,
        playerEndTurn: _endPlayerTurn,
        revealHiddenAspectTrait,
        canSpendClarityForDisorientation: () => currentPlayerRef && currentPlayerRef.clarity > 0 && currentPlayerRef.hand.some(id => id === "TRM001") && !playerEncounterState.disorientationClaritySpentThisTurn,
        spendClarityForDisorientation: () => { if (currentPlayerRef && currentPlayerRef.clarity > 0) { currentPlayerRef.modifyClarity(-1, "negating Disorientation"); playerEncounterState.disorientationClaritySpentThisTurn = true; UIManager.addLogEntry("You spend 1 Clarity to clear the Disorientation's immediate effect.", "player_action_good"); _updateEncounterUIDisplay(); return true; } return false; },
        getConceptCardEffectFunction: (functionName) => conceptCardEffects[functionName],
        playerEncounterState // Expose for read-only or specific modifications by Game if needed
    };
})();
