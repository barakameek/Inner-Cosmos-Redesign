// js/encounter_manager.js

const EncounterManager = (() => { // IIFE for a module-like structure

    let isActive = false;
    let currentPlayerRef = null; // Reference to the main Player object
    let currentAspect = null; // Object holding the current Aspect's data and state

    // Temporary state for player during encounter (e.g. encounter-specific composure)
    let playerEncounterState = {
        composure: 0, // Player's temporary block for this encounter
        // other encounter-specific states
    };

    function init(player) {
        currentPlayerRef = player;
        console.log("EncounterManager initialized.");
    }

    function startEncounter(aspectId) {
        if (!ASPECT_TEMPLATES[aspectId]) {
            UIManager.addLogEntry(`Error: Aspect template ID "${aspectId}" not found.`, "error");
            console.error(`Aspect template ID "${aspectId}" not found.`);
            return false;
        }
        isActive = true;

        // Create a live instance of the Aspect from its template
        const template = ASPECT_TEMPLATES[aspectId];
        currentAspect = {
            id: template.id,
            name: template.name,
            resolve: template.baseResolve,
            maxResolve: template.baseResolve,
            composure: template.baseComposure,
            maxComposureCap: template.baseComposure + 20, // Example cap
            resonance: 0,
            resonanceGoal: template.resonanceGoal,
            dissonance: 0,
            dissonanceThreshold: template.dissonanceThreshold,
            visibleTraits: JSON.parse(JSON.stringify(template.visibleTraits || [])),
            hiddenTraits: JSON.parse(JSON.stringify(template.hiddenTraits || [])),
            revealedTraits: [], // Store names of revealed hidden traits
            intents: template.intents.map(intent => ({ ...intent })), // Deep copy intents with their functions
            currentIntent: null,
            states: [], // { name, duration, data }
            tookPressureThisTurn: false, // For traits like Grudge Holder
            rewards: { ...template.rewards }
        };

        // Prepare player for encounter (draws hand, etc.)
        currentPlayerRef.prepareForEncounter();
        playerEncounterState.composure = 0; // Reset player's encounter composure

        // Choose Aspect's first intent
        _chooseAspectIntent();

        UIManager.addLogEntry(`Encounter started with ${currentAspect.name}!`, "critical");
        UIManager.displayEncounterView(currentAspect, currentPlayerRef); // Initial UI update
        UIManager.updatePlayerHand(currentPlayerRef.getHandCardData());
        _updateEncounterPlayerStatus(); // For player's encounter-specific stats

        // Start player's turn
        _startPlayerTurn();
        return true;
    }

    function endEncounter(outcome) { // outcome: "player_win_resolve", "player_win_resonance", "player_flee", "aspect_win"
        isActive = false;
        UIManager.addLogEntry(`Encounter with ${currentAspect.name} ended. Outcome: ${outcome}`, "system");

        // Handle rewards or consequences based on outcome
        switch (outcome) {
            case "player_win_resolve":
            case "player_win_resonance":
                UIManager.addLogEntry(`You achieved ${outcome === 'player_win_resolve' ? 'Understanding' : 'Integration'}!`, "reward");
                if (currentAspect.rewards) {
                    if (currentAspect.rewards.insight) {
                        currentPlayerRef.modifyInsight(currentAspect.rewards.insight);
                    }
                    // Grant concept card rewards (simplified)
                    if (currentAspect.rewards.conceptPool && currentAspect.rewards.conceptPool.length > 0) {
                        const randomCardId = currentAspect.rewards.conceptPool[Math.floor(Math.random() * currentAspect.rewards.conceptPool.length)];
                        // This should present a choice to the player in a real game
                        UIManager.addLogEntry(`You sense a new Concept: ${CONCEPT_CARD_DEFINITIONS[randomCardId]?.name || randomCardId}`, "reward");
                        // For now, auto-add to deck
                        currentPlayerRef.addCardToDeck(randomCardId, true);
                    }
                    // Grant memory/artifact (simplified)
                     if (currentAspect.rewards.memoryPool && currentAspect.rewards.memoryPool.length > 0) {
                        const randomMemoryId = currentAspect.rewards.memoryPool[Math.floor(Math.random() * currentAspect.rewards.memoryPool.length)];
                        // Game.addMemoryToPlayer(randomMemoryId); // Needs memory definitions
                        UIManager.addLogEntry(`A new Memory resonates: ${randomMemoryId}`, "reward");
                    }
                }
                break;
            case "player_flee":
                UIManager.addLogEntry("You managed to disengage from the Aspect.", "system");
                // Apply penalties for fleeing (e.g., lose Clarity, gain Despair)
                currentPlayerRef.modifyClarity(-2); // Example penalty
                currentPlayerRef.modifyDespair(1);
                break;
            case "aspect_win": // Player Integrity reached 0
                UIManager.addLogEntry(`${currentAspect.name} overwhelmed your psyche.`, "critical");
                // Game over logic is handled by main.js by checking player Integrity
                break;
        }

        currentAspect = null;
        playerEncounterState.composure = 0;

        // Return to the previous view (map or location) - main.js orchestrates this
        // UIManager.showView(UIManager.getDOMElement('mapView')); // Simplification
        Game.returnFromEncounter(); // Notify main game loop
    }

    function _startPlayerTurn() {
        if (!isActive) return;
        UIManager.addLogEntry("--- Your Turn ---", "turn");
        currentPlayerRef.startTurnInEncounter(); // Regenerate focus, draw card

        // Apply player's start-of-turn effects from Stances/Memories (if any)
        // ...

        // Update UI
        UIManager.updatePlayerHand(currentPlayerRef.getHandCardData());
        _updateEncounterPlayerStatus();
        UIManager.getDOMElement('endTurnEncounterButton').disabled = false;
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1); // Example cost for reveal
    }

    function _endPlayerTurn() {
        if (!isActive) return;
        UIManager.addLogEntry("Player ends turn.", "system");
        UIManager.getDOMElement('endTurnEncounterButton').disabled = true;
        // Disable card playability visually if needed

        // Apply end-of-player-turn effects (e.g., expire temporary player states)
        // ...

        _startAspectTurn();
    }

    function _startAspectTurn() {
        if (!isActive) return;
        UIManager.addLogEntry(`--- ${currentAspect.name}'s Turn ---`, "turn");

        // Aspect's pre-action phase (e.g., "Grudge Holder" trait)
        if (currentAspect.tookPressureThisTurn && currentAspect.visibleTraits.some(t => t.name.includes("Grudge Holder"))) {
            _gainAspectComposure(1, "Grudge Holder Trait");
        }
        currentAspect.tookPressureThisTurn = false;

        // Decrement duration of Aspect states
        _updateAspectStates();


        // Execute Aspect's current Intent
        if (currentAspect.currentIntent && typeof aspectIntentEffects[currentAspect.currentIntent.functionName] === 'function') {
            UIManager.addLogEntry(`${currentAspect.name} intends: ${currentAspect.currentIntent.description}`, "intent");
            aspectIntentEffects[currentAspect.currentIntent.functionName](currentAspect.currentIntent.params || {});
        } else {
            UIManager.addLogEntry(`${currentAspect.name} seems hesitant and does nothing.`, "system");
        }

        _checkEncounterWinLoss(); // Check after Aspect action
        if (!isActive) return; // Encounter might have ended

        // Choose next Intent
        _chooseAspectIntent();

        // Update UI for Aspect state
        UIManager.displayEncounterView(currentAspect, currentPlayerRef); // Update Aspect's part of UI

        // If encounter still active, start player's next turn
        setTimeout(() => { // Add a slight delay for readability
            if (isActive) _startPlayerTurn();
        }, 700);
    }

    function playConceptCard(cardId) {
        if (!isActive || !currentPlayerRef || !currentAspect) return;

        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) {
            UIManager.addLogEntry(`Error: Concept card ID "${cardId}" not found.`, "error");
            return;
        }

        if (!currentPlayerRef.spendFocus(cardDef.cost)) {
            UIManager.addLogEntry(`Not enough Focus to play ${cardDef.name}.`, "warning");
            return;
        }

        currentPlayerRef.playCardFromHand(cardId); // Moves card from hand to discard
        UIManager.addLogEntry(`Played ${cardDef.name}.`, "player_action");

        // Execute card effect
        // This is where a more robust effect system would come in.
        // For now, direct calls or a simple mapping.
        if (cardDef.effectFunctionName && typeof conceptCardEffects[cardDef.effectFunctionName] === 'function') {
            conceptCardEffects[cardDef.effectFunctionName](cardDef);
        } else {
            UIManager.addLogEntry(`Effect for ${cardDef.name} not implemented.`, "error");
        }

        // Check for "Lashes Out When Cornered" type traits
        if (currentAspect.resolve < (currentAspect.maxResolve * 0.4) && // e.g., below 40%
            currentAspect.hiddenTraits.some(t => t.name.includes("Lashes Out") && currentAspect.revealedTraits.includes(t.name)) &&
            cardDef.keywords.includes("#Challenge")) {
            UIManager.addLogEntry(`TRAIT TRIGGER: ${currentAspect.name} 'Lashes Out When Cornered'!`, "critical");
            // Immediately execute a retaliatory intent
            const lashOutIntent = currentAspect.intents.find(intent => intent.name.includes("Jab") || intent.name.includes("Lash"));
            if (lashOutIntent && typeof aspectIntentEffects[lashOutIntent.functionName] === 'function') {
                 aspectIntentEffects[lashOutIntent.functionName](lashOutIntent.params || {});
            }
            // Could also apply a temporary "Enraged" state to the Aspect
        }


        UIManager.updatePlayerHand(currentPlayerRef.getHandCardData());
        _updateEncounterPlayerStatus();
        UIManager.displayEncounterView(currentAspect, currentPlayerRef); // Update Aspect UI after effect

        _checkEncounterWinLoss(); // Check if playing the card won/lost
    }

    function _updateEncounterPlayerStatus() {
        // For UI elements specific to player in encounter view
        UIManager.getDOMElement('playerFocusEncounter').textContent = `${currentPlayerRef.focus}/${currentPlayerRef.maxFocus}`;
        UIManager.getDOMElement('playerIntegrityEncounter').textContent = `${currentPlayerRef.integrity}/${currentPlayerRef.maxIntegrity}`;
        // Update player composure display if we implement it:
        // UIManager.getDOMElement('playerComposureEncounter').textContent = playerEncounterState.composure;
    }

    // --- Aspect Logic Helpers ---
    function _applyPressureToAspect(amount, source = "") {
        if (!currentAspect) return;
        let pressureApplied = amount;
        // Consider Aspect states that modify pressure (e.g. Vulnerable)
        // ...

        if (currentAspect.composure > 0) {
            const absorbed = Math.min(pressureApplied, currentAspect.composure);
            currentAspect.composure -= absorbed;
            pressureApplied -= absorbed;
            UIManager.addLogEntry(`${currentAspect.name}'s Composure absorbs ${absorbed} Pressure from ${source}.`, "combat");
        }
        if (pressureApplied > 0) {
            currentAspect.resolve -= pressureApplied;
            currentAspect.tookPressureThisTurn = true;
            UIManager.addLogEntry(`${currentAspect.name} takes ${pressureApplied} Pressure from ${source}. Resolve: ${currentAspect.resolve}/${currentAspect.maxResolve}`, "combat_crit"); // Use crit for emphasis
        }
        if (currentAspect.resolve < 0) currentAspect.resolve = 0;
    }

    function _gainAspectComposure(amount, source = "") {
        if (!currentAspect) return;
        currentAspect.composure += amount;
        if (currentAspect.composure > currentAspect.maxComposureCap) { // Optional cap
            currentAspect.composure = currentAspect.maxComposureCap;
        }
        UIManager.addLogEntry(`${currentAspect.name} gains ${amount} Composure from ${source}. Composure: ${currentAspect.composure}`, "combat");
    }

    function _buildResonance(amount, source = "") {
        if (!currentAspect) return;
        // Consider traits/states that modify resonance gain
        if (currentAspect.visibleTraits.some(t => t.name.includes("Wounded")) && source.includes("#Understanding")) {
            amount +=1; // Example Wounded trait bonus
            UIManager.addLogEntry("Wounded Trait: +1 bonus Resonance.", "system_positive");
        }

        currentAspect.resonance += amount;
        if (currentAspect.resonance > currentAspect.resonanceGoal) currentAspect.resonance = currentAspect.resonanceGoal;
        UIManager.addLogEntry(`Resonance with ${currentAspect.name} builds by ${amount} from ${source}. Resonance: ${currentAspect.resonance}/${currentAspect.resonanceGoal}`, "system_positive");
    }

    function _buildDissonance(amount, source = "") {
        if (!currentAspect) return;
        currentAspect.dissonance += amount;
        if (currentAspect.dissonance > currentAspect.dissonanceThreshold) currentAspect.dissonance = currentAspect.dissonanceThreshold;
        UIManager.addLogEntry(`Dissonance with ${currentAspect.name} builds by ${amount} from ${source}. Dissonance: ${currentAspect.dissonance}/${currentAspect.dissonanceThreshold}`, "system_negative");

        if (currentAspect.dissonance >= currentAspect.dissonanceThreshold) {
            UIManager.addLogEntry(`${currentAspect.name} reaches Dissonance threshold! (Effect TBD)`, "critical");
            // Trigger Dissonance threshold effect (e.g., Aspect gains a buff, player gets a Trauma)
            currentPlayerRef.addTrauma("T001"); // Example: add Whispers of Doubt
        }
    }

    function _updateAspectStates() {
        if (!currentAspect || !currentAspect.states) return;
        currentAspect.states = currentAspect.states.filter(state => {
            if (state.duration !== undefined) {
                state.duration--;
                if (state.duration <= 0) {
                    UIManager.addLogEntry(`${currentAspect.name} is no longer ${state.name}.`, "system");
                    return false; // Remove expired state
                }
            }
            return true; // Keep state
        });
    }


    function _chooseAspectIntent() {
        if (!currentAspect || !currentAspect.intents || currentAspect.intents.length === 0) {
            currentAspect.currentIntent = { description: "No actions available.", functionName: null };
            return;
        }
        // Simple random choice for now
        const randomIndex = Math.floor(Math.random() * currentAspect.intents.length);
        currentAspect.currentIntent = currentAspect.intents[randomIndex];
    }

    function revealHiddenAspectTrait() {
        if (!isActive || !currentAspect || currentPlayerRef.insight < 1) { // Assuming 1 Insight cost
            if(currentPlayerRef.insight < 1) UIManager.addLogEntry("Not enough Insight to reveal a Trait.", "warning");
            return;
        }
        currentPlayerRef.modifyInsight(-1);
        // UIManager.updatePlayerStats(currentPlayerRef.getUIData()); // Main.js handles this

        const unrevealed = currentAspect.hiddenTraits.filter(ht => !currentAspect.revealedTraits.includes(ht.name));
        if (unrevealed.length > 0) {
            const traitToReveal = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            currentAspect.revealedTraits.push(traitToReveal.name);
            UIManager.addLogEntry(`Revealed Hidden Trait for ${currentAspect.name}: ${traitToReveal.name} - ${traitToReveal.description}`, "discovery");
            UIManager.displayEncounterView(currentAspect, currentPlayerRef); // Update UI to show revealed trait
        } else {
            UIManager.addLogEntry(`No more hidden traits on ${currentAspect.name} to reveal.`, "system");
        }
        UIManager.getDOMElement('revealTraitEncounterButton').disabled = (currentPlayerRef.insight < 1 || unrevealed.length <=1 );
    }


    function _checkEncounterWinLoss() {
        if (!isActive || !currentAspect) return;

        if (currentPlayerRef.integrity <= 0) {
            endEncounter("aspect_win"); // Player lost
            return true;
        }
        if (currentAspect.resolve <= 0) {
            endEncounter("player_win_resolve"); // Player won by reducing resolve
            return true;
        }
        if (currentAspect.resonance >= currentAspect.resonanceGoal) {
            endEncounter("player_win_resonance"); // Player won by filling resonance
            return true;
        }
        return false; // Encounter continues
    }

    // --- Placeholder for Card Effect Implementations ---
    // These would call the helpers like _applyPressureToAspect, _buildResonance etc.
    const conceptCardEffects = {
        playTentativeInquiry: (cardDef) => {
            revealHiddenAspectTrait(); // Or a portion of it for this card specifically
            _buildResonance(1, cardDef.name);
        },
        playAssertiveStance: (cardDef) => {
            _applyPressureToAspect(4, cardDef.name);
            _buildDissonance(1, cardDef.name);
        },
        playMomentOfComposure: (cardDef) => {
            playerEncounterState.composure += 5; // Conceptual player composure
            UIManager.addLogEntry(`Player gains 5 conceptual Composure.`, "player_action");
            // In a more complex system, this would apply a state that reduces next incoming damage
        },
        playWhispersOfDoubt: (cardDef) => { // Effect if explicitly played
            _buildDissonance(1, cardDef.name);
        }
        // onDrawWhispersOfDoubt would be handled by Player.drawCards()
    };

    // --- Placeholder for Aspect Intent Effect Implementations ---
    const aspectIntentEffects = {
        intentMinorWorrySpike: (params) => {
            const damage = params?.damage || 2;
            UIManager.addLogEntry(`${currentAspect.name} lashes out with a spike of worry!`, "aspect_action");
            // Apply damage to player, considering player's encounter composure
            let actualDamage = damage;
            if (playerEncounterState.composure > 0) {
                const absorbed = Math.min(actualDamage, playerEncounterState.composure);
                playerEncounterState.composure -= absorbed;
                actualDamage -= absorbed;
                UIManager.addLogEntry(`Your composure absorbed ${absorbed} damage.`, "player_action_good");
            }
            if (actualDamage > 0) {
                currentPlayerRef.modifyIntegrity(-actualDamage);
            }
            _updateEncounterPlayerStatus(); // Update UI for player integrity/composure
        },
        intentSuddenRetreat: (params) => {
            const composureGain = params?.composure || 5;
            UIManager.addLogEntry(`${currentAspect.name} recoils, building its defenses.`, "aspect_action");
            _gainAspectComposure(composureGain, "Sudden Retreat");
        },
        intentDismissiveGlare: (params) => {
            const damage = params?.damage || 3;
            UIManager.addLogEntry(`${currentAspect.name} glares dismissively!`, "aspect_action");
            currentPlayerRef.modifyIntegrity(-damage);
            // Player discards 1 random card
            if (currentPlayerRef.hand.length > 0) {
                const randomIndex = Math.floor(Math.random() * currentPlayerRef.hand.length);
                const cardIdToDiscard = currentPlayerRef.hand[randomIndex];
                currentPlayerRef.discardCard(cardIdToDiscard); // discardCard logs its own message
                UIManager.updatePlayerHand(currentPlayerRef.getHandCardData());
            }
            _updateEncounterPlayerStatus();
        },
        intentReinforceBeliefs: (params) => {
            const composureGain = params?.composure || 3;
            UIManager.addLogEntry(`${currentAspect.name} reinforces its beliefs.`, "aspect_action");
            _gainAspectComposure(composureGain, "Reinforce Beliefs");
            _buildDissonance(1, "Reinforce Beliefs");
        }
    };


    // --- Public API ---
    return {
        init,
        startEncounter,
        endEncounter, // Could be called by main loop if player flees or other conditions
        isActive: () => isActive,
        getCurrentAspect: () => currentAspect, // For UI or other systems to query
        playConceptCard,
        playerEndTurn: _endPlayerTurn, // Expose for UI button
        revealHiddenAspectTrait,
        // Potentially more functions to handle specific player actions in encounter
    };

})();

// Initialization would be called by main.js
// EncounterManager.init(GamePlayer);
