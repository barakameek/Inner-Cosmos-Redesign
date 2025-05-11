// js/encounter_manager.js

const EncounterManager = (() => {

    let isActive = false;
    let currentPlayerRef = null;
    let currentAspect = null; // Live instance of the Aspect

    let playerEncounterState = {
        composure: 0,
        // flags for per-turn effects, e.g., disorientationClaritySpentThisTurn
    };

    // To store the view to return to after encounter (map, location)
    // This should ideally be managed by main.js's game state
    let viewToReturnTo = 'map-view';

    function init(player) {
        currentPlayerRef = player;
        console.log("EncounterManager initialized.");
    }

    function startEncounter(aspectId, previousViewId = 'map-view') {
        const aspectTemplate = ASPECT_TEMPLATES[aspectId];
        if (!aspectTemplate) {
            UIManager.addLogEntry(`Error: Aspect template ID "${aspectId}" not found. Cannot start encounter.`, "error");
            return false;
        }
        isActive = true;
        viewToReturnTo = previousViewId; // Store where to return

        currentAspect = {
            id: aspectTemplate.id,
            name: aspectTemplate.name,
            resolve: aspectTemplate.baseResolve,
            maxResolve: aspectTemplate.baseResolve,
            composure: aspectTemplate.baseComposure,
            maxComposureCap: aspectTemplate.baseComposure + (aspectTemplate.maxResolve / 2) || 20, // Dynamic cap
            resonance: 0,
            resonanceGoal: aspectTemplate.resonanceGoal,
            dissonance: 0,
            dissonanceThreshold: aspectTemplate.dissonanceThreshold,
            visibleTraits: JSON.parse(JSON.stringify(aspectTemplate.visibleTraits || [])),
            hiddenTraits: JSON.parse(JSON.stringify(aspectTemplate.hiddenTraits || [])),
            revealedTraits: [],
            intents: (aspectTemplate.intents || []).map(intent => ({ ...intent })),
            currentIntent: null,
            states: [],
            tookPressureThisTurn: false,
            rewards: { ...(aspectTemplate.rewards || {}) },
            turnCount: 0 // For timed effects like Lingering Doubt's fade
        };

        currentPlayerRef.prepareForEncounter(); // Sets up stance (default Observer), clears hand
        playerEncounterState.composure = 0; // Reset player's encounter composure
        playerEncounterState.disorientationClaritySpentThisTurn = false; // Reset flag

        _chooseAspectIntent();

        UIManager.addLogEntry(`Encounter begins: ${currentAspect.name} materializes!`, "critical");
        UIManager.displayEncounterView(currentAspect, currentPlayerRef, playerEncounterState);
        // Player's turn starts, which includes drawing cards
        _startPlayerTurn(); // This will also update hand UI
        return true;
    }

    function endEncounter(outcome) {
        isActive = false;
        UIManager.addLogEntry(`Encounter with ${currentAspect.name} concludes. Outcome: ${outcome}.`, "system");

        switch (outcome) {
            case "player_win_resolve":
            case "player_win_resonance":
                const victoryType = outcome === 'player_win_resolve' ? 'Understanding' : 'Integration';
                UIManager.addLogEntry(`You achieved ${victoryType} with ${currentAspect.name}!`, "reward_major");
                if (currentAspect.rewards) {
                    if (currentAspect.rewards.insight) {
                        currentPlayerRef.modifyInsight(currentAspect.rewards.insight, `resolving ${currentAspect.name}`);
                    }
                    if (currentAspect.rewards.conceptPool && currentAspect.rewards.conceptPool.length > 0) {
                        const cardId = currentAspect.rewards.conceptPool[Math.floor(Math.random() * currentAspect.rewards.conceptPool.length)];
                        // TODO: Implement card choice screen via UIManager and Game
                        UIManager.addLogEntry(`A new understanding forms: "${CONCEPT_CARD_DEFINITIONS[cardId]?.name}".`, "reward");
                        currentPlayerRef.addConceptToDeck(cardId, true);
                    }
                    if (currentAspect.rewards.memoryPool && currentAspect.rewards.memoryPool.length > 0) {
                        const memoryId = currentAspect.rewards.memoryPool[Math.floor(Math.random() * currentAspect.rewards.memoryPool.length)];
                        currentPlayerRef.addMemory(memoryId); // Player.addMemory logs its own message
                    }
                }
                break;
            case "player_flee": // Not implemented yet, but for future
                UIManager.addLogEntry("You disengage from the psychic fray.", "system");
                currentPlayerRef.modifyClarity(-2, "fleeing encounter");
                currentPlayerRef.modifyDespair(1, "unresolved encounter");
                break;
            case "aspect_win": // Player Integrity reached 0
                UIManager.addLogEntry(`${currentAspect.name} has overwhelmed your psyche.`, "critical_system");
                // Game.triggerGameOver is called by Player.modifyIntegrity
                break;
            case "aspect_fled":
                UIManager.addLogEntry(`${currentAspect.name} faded before resolution. An unsettling enigma remains.`, "system_negative");
                currentPlayerRef.modifyDespair(1, `${currentAspect.name} disengaged`);
                break;
        }

        currentAspect = null;
        playerEncounterState = { composure: 0 }; // Reset state

        Game.returnFromEncounter(viewToReturnTo); // Notify main game loop to switch view
    }

    function _startPlayerTurn() {
        if (!isActive || !currentAspect) return;
        UIManager.addLogEntry("--- Your Turn ---", "turn");
        playerEncounterState.disorientationClaritySpentThisTurn = false; // Reset for Disorientation
        currentPlayerRef.startTurnInEncounter(); // Regen focus, draw card (which might trigger onDraw for Disorientation)

        // Update UI for player stats, hand, and Aspect's (potentially new) intent
        _updateEncounterUIDisplay();
        UIManager.getDOMElement('endTurnEncounterButton').disabled = false;
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0);
    }

    function _endPlayerTurn() {
        if (!isActive || !currentAspect) return;
        UIManager.addLogEntry("You steady your thoughts, ending your turn.", "system");
        UIManager.getDOMElement('endTurnEncounterButton').disabled = true;
        _startAspectTurn();
    }

    function _startAspectTurn() {
        if (!isActive || !currentAspect) return;
        currentAspect.turnCount++;
        UIManager.addLogEntry(`--- ${currentAspect.name}'s Turn (${currentAspect.turnCount}) ---`, "turn");

        if (currentAspect.tookPressureThisTurn && currentAspect.visibleTraits.some(t => t.name.includes("Grudge Holder"))) {
            _gainAspectComposure(1, "Grudge Holder Trait");
        }
        currentAspect.tookPressureThisTurn = false;
        _updateAspectStates();

        if (currentAspect.currentIntent && typeof aspectIntentEffects[currentAspect.currentIntent.functionName] === 'function') {
            UIManager.addLogEntry(`${currentAspect.name} intends: ${currentAspect.currentIntent.description}`, "intent");
            aspectIntentEffects[currentAspect.currentIntent.functionName](currentAspect.currentIntent.params || {});
        } else {
            UIManager.addLogEntry(`${currentAspect.name} hesitates.`, "system");
        }

        if (_checkEncounterWinLoss()) return; // Encounter might have ended

        _chooseAspectIntent();
        _updateEncounterUIDisplay(); // Update Aspect UI (new intent, stats)

        if (isActive) { // Check again, Aspect action might have ended encounter
            setTimeout(() => { if (isActive) _startPlayerTurn(); }, 800);
        }
    }

    function playConceptCard(cardId) {
        if (!isActive || !currentPlayerRef || !currentAspect) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) return;

        // Check if Disorientation is making it more expensive
        let actualCost = cardDef.cost;
        const disorientationInHand = currentPlayerRef.hand.find(id => id === "TRM001");
        if (disorientationInHand && !playerEncounterState.disorientationClaritySpentThisTurn) {
            actualCost += 1;
        }

        if (!currentPlayerRef.spendFocusForCard(actualCost, cardDef.name)) return; // spendFocusForCard logs if not enough focus

        currentPlayerRef.playCardFromHand(cardId); // Moves card from hand to discard
        UIManager.addLogEntry(`Played ${cardDef.name}.`, "player_action");

        if (cardDef.effectFunctionName && typeof conceptCardEffects[cardDef.effectFunctionName] === 'function') {
            conceptCardEffects[cardDef.effectFunctionName](cardDef);
        } else {
            UIManager.addLogEntry(`Effect for ${cardDef.name} not yet defined.`, "error");
        }

        // Post-play checks (e.g., "Lashes Out" traits, Aspect "Feeds on Negativity")
        if (cardDef.keywords.includes("#DissonanceSource") && currentAspect.visibleTraits.some(t => t.name.includes("Feeds on Negativity"))) {
            UIManager.addLogEntry(`${currentAspect.name} seems to draw strength from the dissonance!`, "aspect_action_subtle");
            _gainAspectComposure(1, "Feeds on Negativity");
        }

        _updateEncounterUIDisplay();
        if (_checkEncounterWinLoss()) return;

        // Enable/disable reveal trait button based on insight
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0);
    }

    function _getUnrevealedTraitCount() {
        if (!currentAspect) return 0;
        return currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name)).length;
    }

    function _updateEncounterUIDisplay() {
        if (!isActive || !currentAspect || !currentPlayerRef) return;
        UIManager.displayEncounterView(currentAspect, currentPlayerRef, playerEncounterState);
        UIManager.updatePlayerHand(currentPlayerRef.getHandCardDefinitions()); // Use definitions for full data
    }

    // --- Aspect Logic Helpers ---
    function _applyPressureToAspect(amount, source = "a Concept") {
        if (!currentAspect) return;
        let pressureApplied = amount;
        if (currentAspect.states.some(s => s.name === "Vulnerable")) pressureApplied *= 1.5; // Example state

        if (currentAspect.composure > 0) {
            const absorbed = Math.min(pressureApplied, currentAspect.composure);
            currentAspect.composure -= absorbed;
            pressureApplied -= absorbed;
            UIManager.addLogEntry(`${currentAspect.name}'s Composure absorbs ${absorbed} Pressure.`, "combat");
        }
        if (pressureApplied > 0) {
            currentAspect.resolve -= Math.floor(pressureApplied); // Use floor for clean numbers
            currentAspect.tookPressureThisTurn = true;
            UIManager.addLogEntry(`${currentAspect.name} takes ${Math.floor(pressureApplied)} Pressure from ${source}. Resolve: ${currentAspect.resolve}/${currentAspect.maxResolve}`, "combat_crit");
        }
        if (currentAspect.resolve <= 0) currentAspect.resolve = 0;
    }

    function _gainAspectComposure(amount, source = "") {
        if (!currentAspect) return;
        currentAspect.composure += amount;
        if (currentAspect.composure > currentAspect.maxComposureCap) {
            currentAspect.composure = currentAspect.maxComposureCap;
        }
        UIManager.addLogEntry(`${currentAspect.name} gains ${amount} Composure (${source}). Composure: ${currentAspect.composure}`, "combat");
    }

    function _buildResonance(amount, source = "") {
        if (!currentAspect) return;
        currentAspect.resonance += amount;
        if (currentAspect.resonance > currentAspect.resonanceGoal) currentAspect.resonance = currentAspect.resonanceGoal;
        UIManager.addLogEntry(`Resonance with ${currentAspect.name} grows by ${amount} (${source}). (${currentAspect.resonance}/${currentAspect.resonanceGoal})`, "system_positive");
    }

    function _buildDissonance(amount, source = "") {
        if (!currentAspect) return;
        currentAspect.dissonance += amount;
        // No cap on accumulation, but threshold triggers effect
        UIManager.addLogEntry(`Dissonance with ${currentAspect.name} deepens by ${amount} (${source}). (${currentAspect.dissonance}/${currentAspect.dissonanceThreshold})`, "system_negative");

        if (currentAspect.dissonance >= currentAspect.dissonanceThreshold && !currentAspect.dissonanceTriggered) {
            currentAspect.dissonanceTriggered = true; // Prevent multiple triggers per threshold pass
            UIManager.addLogEntry(`${currentAspect.name} crosses its Dissonance threshold! It becomes more agitated!`, "critical");
            // Example: Aspect gains a temporary buff or player gets a Trauma
            _applyAspectState({ name: "Agitated", duration: 2, pressureBoost: 1 }); // Custom state logic needed
            currentPlayerRef.addTraumaToDiscard("TRM001"); // Add Disorientation
        }
    }

    function _applyAspectState(stateObject) { // { name, duration, data... }
        if (!currentAspect) return;
        let existingState = currentAspect.states.find(s => s.name === stateObject.name);
        if (existingState) {
            existingState.duration = Math.max(existingState.duration || 0, stateObject.duration || 0);
            // Merge other data if needed
        } else {
            currentAspect.states.push(stateObject);
        }
        UIManager.addLogEntry(`${currentAspect.name} becomes ${stateObject.name}.`, "aspect_action_subtle");
    }

    function _updateAspectStates() {
        if (!currentAspect || !currentAspect.states) return;
        currentAspect.states = currentAspect.states.filter(state => {
            if (state.duration !== undefined) {
                state.duration--;
                if (state.duration <= 0) {
                    UIManager.addLogEntry(`${currentAspect.name} is no longer ${state.name}.`, "system");
                    return false;
                }
            }
            return true;
        });
    }

    function _chooseAspectIntent() {
        if (!currentAspect || !currentAspect.intents || currentAspect.intents.length === 0) {
            currentAspect.currentIntent = { description: "No actions available.", functionName: null };
            return;
        }
        const availableIntents = currentAspect.intents.filter(intent => {
            // Add conditions for intents if any (e.g. only use 'Fade Away' if turnCount >= 3)
            if (intent.id === "INT_DOUBT_03" && currentAspect.turnCount < 3) return false;
            return true;
        });
        if (availableIntents.length === 0) { // Fallback if conditions make all intents unavailable
             currentAspect.currentIntent = currentAspect.intents[Math.floor(Math.random() * currentAspect.intents.length)];
        } else {
            currentAspect.currentIntent = availableIntents[Math.floor(Math.random() * availableIntents.length)];
        }
    }

    function revealHiddenAspectTrait() {
        if (!isActive || !currentAspect || currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0) {
            if (currentPlayerRef.insight < 1) UIManager.addLogEntry("Not enough Insight.", "warning");
            else if (_getUnrevealedTraitCount() === 0) UIManager.addLogEntry("No more hidden traits to reveal.", "system");
            return;
        }
        currentPlayerRef.modifyInsight(-1, "revealing a Trait");

        const unrevealed = currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name));
        if (unrevealed.length > 0) { // Should always be true due to earlier check
            const traitToReveal = unrevealed[0]; // Reveal in order or random
            currentAspect.revealedTraits.push(traitToReveal.name);
            UIManager.addLogEntry(`Revealed: ${traitToReveal.name} - ${traitToReveal.description}`, "discovery");
        }
        _updateEncounterUIDisplay(); // Update UI
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || _getUnrevealedTraitCount() === 0);
    }

    function _checkEncounterWinLoss() {
        if (!isActive || !currentAspect) return false;
        if (currentPlayerRef.integrity <= 0) { endEncounter("aspect_win"); return true; }
        if (currentAspect.resolve <= 0) { endEncounter("player_win_resolve"); return true; }
        if (currentAspect.resonance >= currentAspect.resonanceGoal) { endEncounter("player_win_resonance"); return true; }
        return false;
    }

    // --- Card & Intent Effect Implementations ---
    const conceptCardEffects = {
        playGraspForAwareness: (cardDef) => {
            currentPlayerRef.modifyFocus(1, cardDef.name);
            const drawnCardId = currentPlayerRef.drawFromAwakeningDeck(); // Special draw
            // UI for hand already updated by drawFromAwakeningDeck if it calls UIManager
        },
        playFragmentedMemoryTheFall: (cardDef) => {
            currentPlayerRef.modifyClarity(2, cardDef.name);
            currentPlayerRef.addTraumaToDiscard("TRM001"); // Add Disorientation
            UIManager.addJournalEntry("A Glimpse of the Fall", "A painful, fractured vision... how I arrived here. It brought some Clarity, but also a deep Disorientation.");
            // This card also reveals connections on the map, handled by main.js/storylet outcome
            Game.revealAwakeningMapConnections(); // Notify main game
        },
        playEchoOfAName: (cardDef) => {
            const name = CONFIG.INITIAL_PSYCHONAUT_NAME;
            currentPlayerRef.name = name; // Set player name
            UIManager.getDOMElement('psychonautNameDisplay').textContent = name; // Update header
            currentPlayerRef.modifyMaxIntegrity(40 + PLAYER_INITIAL_STATS.maxIntegrity); // Increase max
            currentPlayerRef.modifyIntegrity(20, cardDef.name); // Heal
            currentPlayerRef.modifyMaxFocus(3 + PLAYER_INITIAL_STATS.maxFocus); // Increase max focus too
            currentPlayerRef.modifyFocus(3, cardDef.name); // Restore some focus
            UIManager.addJournalEntry("An Echo, A Name", `I remember... my name is ${name}. With it, a measure of strength returns.`);
        },
        playPrimalFear: (cardDef) => {
            _applyPressureToAspect(3, cardDef.name); // Target current aspect
            _buildDissonance(1, cardDef.name); // Dissonance with self
        },
        playSharedSorrow: (cardDef) => {
            let resonanceAmount = 2;
            // Check current aspect for traits (more complex logic needed to check specific traits like 'Sadness' or 'Wounded')
            if (currentAspect && (currentAspect.visibleTraits.some(t => t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound")) ||
                                 currentAspect.hiddenTraits.some(t => (currentAspect.revealedTraits.includes(t.name)) && (t.name.toLowerCase().includes("sad") || t.name.toLowerCase().includes("wound"))))) {
                UIManager.addLogEntry(`"${cardDef.name}" resonates deeply with ${currentAspect.name}'s sorrow.`, "system_positive_strong");
                resonanceAmount +=1; // Bonus for matching trait
            }
            _buildResonance(resonanceAmount, cardDef.name);
            currentPlayerRef.modifyIntegrity(1, cardDef.name);
        },
        playDetachedObservation: (cardDef) => {
            // This card's effect ("next reveal card costs less") needs a temporary player state or flag
            // Game.setPlayerTempFlag("detachedObservationActive", true);
            UIManager.addLogEntry("You adopt a detached perspective for your next query.", "system_positive");
            currentPlayerRef.drawCards(1);
        },
        playStandardInquiry: (cardDef) => { // From old config, ensure it works
            revealHiddenAspectTrait();
            _buildResonance(1, cardDef.name);
        },
        playStandardChallenge: (cardDef) => { // From old config
            _applyPressureToAspect(4, cardDef.name);
            _buildDissonance(1, cardDef.name);
        },
        onDrawDisorientation: (cardDef) => { // Called from Player.drawCards() via main Game loop
            UIManager.addLogEntry(`TRAUMA EFFECT: ${cardDef.name} clouds your thoughts! (All Concepts +1 Focus cost this turn unless 1 Clarity spent).`, "trauma_major");
            // The choice to spend Clarity would be a UI prompt in a full game.
            // For now, let's assume if Clarity > 0, player *can* choose.
            // The actual cost modification happens when playing a card.
            // We can set a flag on playerEncounterState.
            // Main game loop needs to show a prompt or auto-resolve if AI.
            // For now, let's just log. Actual effect is checked in playConceptCard.
            if (currentPlayerRef.clarity > 0) {
                 // Game.promptPlayerForClaritySpendOnDisorientation(); // Hypothetical
            }
        },
        playDisorientation: (cardDef) => { /* No effect if explicitly played, effect is onDraw */ }
    };

    const aspectIntentEffects = {
        intentSowConfusion: (params) => {
            const traumaId = params.traumaId || "TRM001"; // Default to Disorientation if not specified
            UIManager.addLogEntry(`${currentAspect.name} whispers disorienting notions.`, "aspect_action");
            currentPlayerRef.addTraumaToDiscard(traumaId);
        },
        intentWhisperDiscouragement: (params) => {
            UIManager.addLogEntry(`${currentAspect.name} murmurs words of despair.`, "aspect_action");
            currentPlayerRef.modifyHope(-1, `${currentAspect.name}'s discouragement`);
        },
        intentFadeAway: (params) => {
            if (currentAspect.turnCount >= 3) {
                 UIManager.addLogEntry(`${currentAspect.name} begins to dissipate!`, "aspect_action_special");
                 endEncounter("aspect_fled");
            } else {
                UIManager.addLogEntry(`${currentAspect.name} attempts to fade, but holds its form.`, "aspect_action_subtle");
                // Does nothing else this turn if it fails to fade
            }
        }
        // Add more intent effects from config here
    };

    return {
        init,
        startEncounter,
        endEncounter,
        isActive: () => isActive,
        getCurrentAspectData: () => currentAspect, // Read-only access to current aspect state
        playConceptCard,
        playerEndTurn: _endPlayerTurn,
        revealHiddenAspectTrait,
        // For "Disorientation" Trauma, allowing main loop to trigger clarity spend choice
        canSpendClarityForDisorientation: () => currentPlayerRef && currentPlayerRef.clarity > 0 && currentPlayerRef.hand.some(id => id === "TRM001") && !playerEncounterState.disorientationClaritySpentThisTurn,
        spendClarityForDisorientation: () => {
            if (currentPlayerRef && currentPlayerRef.clarity > 0) {
                currentPlayerRef.modifyClarity(-1, "negating Disorientation");
                playerEncounterState.disorientationClaritySpentThisTurn = true;
                UIManager.addLogEntry("You spend 1 Clarity to clear the Disorientation's immediate effect.", "player_action_good");
                _updateEncounterUIDisplay(); // Refresh UI in case clarity change affects anything
                return true;
            }
            return false;
        },
        getConceptCardEffectFunction: (functionName) => conceptCardEffects[functionName], // For Game loop to call onDraw effects
    };
})();
