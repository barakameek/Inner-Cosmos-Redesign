// js/storylet_manager.js

const StoryletManager = (() => {

    let activeStoryletData = null;
    let activeStoryletInstance = null; // Working copy with evaluated choice conditions
    let currentPlayerRef = null;
    let currentWorldRef = null;

    function init(player, world) {
        currentPlayerRef = player;
        currentWorldRef = world;
        console.log("StoryletManager (v2 Awakening) initialized.");
    }

    function startStorylet(storyletId) {
        const storyletDef = STORYLET_DATA_MINIMAL[storyletId]; // From config.js
        if (storyletDef) {
            activeStoryletData = { ...storyletDef };
            activeStoryletInstance = { ...storyletDef, choices: [] }; // Start with empty choices for instance

            // Deep copy choices and evaluate conditions
            if (storyletDef.choices && Array.isArray(storyletDef.choices)) {
                activeStoryletInstance.choices = storyletDef.choices.map(choiceDef => {
                    const choiceInstance = { ...choiceDef }; // Copy choice
                    choiceInstance.disabled = false;
                    choiceInstance.disabledReason = "";
                    if (choiceDef.conditionFunctionName && typeof storyletConditions[choiceDef.conditionFunctionName] === 'function') {
                        if (!storyletConditions[choiceDef.conditionFunctionName](choiceDef.conditionParams || {})) {
                            choiceInstance.disabled = true;
                            choiceInstance.disabledReason = choiceDef.conditionDisabledReason || "You cannot choose this option presently.";
                        }
                    } else if (choiceDef.conditionFunctionName) {
                        console.warn(`Condition function "${choiceDef.conditionFunctionName}" not found for storylet "${storyletId}", choice "${choiceDef.text}". Choice enabled by default.`);
                    }
                    return choiceInstance;
                });
            }

            UIManager.addLogEntry(`Storylet: ${activeStoryletInstance.title}`, "story");
            UIManager.displayStorylet(activeStoryletInstance);
            return true;
        } else {
            UIManager.addLogEntry(`Error: Storylet ID "${storyletId}" not found.`, "error");
            console.error(`Storylet ID "${storyletId}" not found.`);
            activeStoryletData = null; activeStoryletInstance = null;
            Game.storyletEnded(); // Notify main to handle fallback view
            return false;
        }
    }

    function makeChoice(choiceIndex) {
        if (!activeStoryletInstance || !activeStoryletInstance.choices || choiceIndex < 0 || choiceIndex >= activeStoryletInstance.choices.length) {
            UIManager.addLogEntry("Invalid storylet choice made.", "error"); return;
        }
        const chosenOption = activeStoryletInstance.choices[choiceIndex];
        if (chosenOption.disabled) {
            UIManager.addLogEntry(`Cannot select disabled choice: "${chosenOption.text}" (Reason: ${chosenOption.disabledReason})`, "warning"); return;
        }
        UIManager.addLogEntry(`Chose: "${chosenOption.text}"`, "choice");
        if (chosenOption.outcomeFunctionName && typeof storyletOutcomes[chosenOption.outcomeFunctionName] === 'function') {
            storyletOutcomes[chosenOption.outcomeFunctionName](chosenOption.params || {});
        } else {
            UIManager.addLogEntry(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented for "${chosenOption.text}". Storylet ends.`, "error");
            console.warn(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented.`);
            endStorylet();
        }
    }

    function endStorylet(logMessage = "The moment passes into memory.") {
        if (activeStoryletData) { UIManager.addLogEntry(logMessage, "system"); }
        activeStoryletData = null; activeStoryletInstance = null;
        Game.storyletEnded();
    }

    const storyletConditions = {
        conditionHasFocus1: (params) => currentPlayerRef && currentPlayerRef.focus >= 1,
        conditionPlayerWounded: (params) => currentPlayerRef && (currentPlayerRef.integrity < (currentPlayerRef.maxIntegrity * 0.5)),
        conditionHasMemory: (params) => currentPlayerRef && params.memoryId && currentPlayerRef.hasMemory(params.memoryId),
        conditionHasCardInHand: (params) => currentPlayerRef && params.cardId && currentPlayerRef.hand.includes(params.cardId),
        // NEW: Condition for the Keeper's rest offer - player integrity not full
        conditionPlayerNotAtMaxIntegrity: (params) => currentPlayerRef && currentPlayerRef.integrity < currentPlayerRef.maxIntegrity,
    };

    const storyletOutcomes = {
        outcomePlayGraspForAwarenessShore: (params) => {
            const graspCardId = "AWK001";
            if (currentPlayerRef.hand.includes(graspCardId)) {
                const cardDef = CONCEPT_CARD_DEFINITIONS[graspCardId];
                // Focus check (cost 0, so should pass if focus >=0)
                // Actual focus spend (even if 0) should be handled by EncounterManager or Game before effect
                // For now, assume if playable, it is.
                const playedCardDef = currentPlayerRef.playCardFromHand(graspCardId); // Moves to discard
                if (playedCardDef) {
                    UIManager.addLogEntry(`You instinctively ${playedCardDef.name.toLowerCase()}.`, "player_action_major");
                    const graspEffectFn = EncounterManager.getConceptCardEffectFunction(playedCardDef.effectFunctionName);
                    if (graspEffectFn) {
                        graspEffectFn(playedCardDef); // This draws AWK002 from awakeningDeck to hand
                    } else { console.error("Effect for Grasp for Awareness not found."); }
                    Game.refreshPlayerUI();
                    endStorylet("A sliver of awareness cuts through the fog. The world sharpens slightly.");
                } else { UIManager.addLogEntry("Could not manifest the 'Grasp for Awareness'.", "error"); endStorylet("The fog remains thick."); }
            } else { UIManager.addLogEntry("The impulse to grasp awareness is missing...", "error"); endStorylet("Adrift in confusion."); }
        },
        outcomeSiftWreckage: (params) => { if (!currentPlayerRef.spendFocusForCard(1, "sifting wreckage")) { endStorylet("Lacking focus, the debris remains a meaningless jumble."); return; } currentPlayerRef.addMemory("MEM_TARNISHED_LOCKET"); currentPlayerRef.modifyHope(1, "finding the locket"); UIManager.addJournalEntry("A Glimmer of the Past", "Amidst shattered thoughts, I found a Tarnished Locket. It feels... important."); Game.refreshPlayerUI(); endStorylet("You find a small, tarnished locket in the debris."); },
        outcomeListenWhisperWreckage: (params) => { UIManager.addLogEntry("The whisper intensifies, 'YOU SHOULD NOT BE HERE!' A shard of doubt takes form!", "critical"); Game.queueEncounter("ASP_LINGERING_DOUBT"); endStorylet("The whispers coalesce into a menacing presence."); },
        outcomeLeaveWreckage: (params) => { currentPlayerRef.modifyDespair(1, "fleeing the wreckage"); UIManager.addJournalEntry("Unease", "The Wreckage of a Thought felt deeply unsettling. I chose not to linger."); Game.refreshPlayerUI(); endStorylet("You back away from the unsettling wreckage."); },
        outcomeTouchFungusEmpathy: (params) => { currentPlayerRef.addConceptToDeck("CON001", true); UIManager.addLogEntry("You receive a 'Glimmering Tear-Drop' (conceptual resource).", "reward"); UIManager.addJournalEntry("The Sorrowful Bloom", "The tear-shaped fungus resonated, sharing profound sadness, a vision of a burning library, and 'Shared Sorrow'."); currentPlayerRef.modifyAttunement("psychological", 1, "empathizing with the fungus"); currentPlayerRef.modifyHope(1, "a moment of connection"); Game.refreshPlayerUI(); endStorylet("A wave of shared sorrow leaves an echo of understanding and a strange gift."); },
        outcomeObserveFungusCognitive: (params) => { currentPlayerRef.addConceptToDeck("CON002", true); UIManager.addJournalEntry("Calculated Distance", "Observing the sorrowful fungus revealed its patterns, granting 'Detached Observation'."); currentPlayerRef.modifyAttunement("cognitive", 1, "analyzing the fungus"); Game.refreshPlayerUI(); endStorylet("From a distance, you analyze the fungus, gaining a new perspective."); },
        outcomeHarvestFungus: (params) => { UIManager.addLogEntry("You gain a 'Bioluminescent Tear-Drop Cluster' (conceptual resource). Its light is cold.", "reward"); currentPlayerRef.modifyDespair(1, "harvesting the sorrowful fungus"); currentPlayerRef.modifyAttunement("interaction", 1, "a decisive, if regrettable, action"); UIManager.addJournalEntry("A Cold Harvest", "I took the fungus. Its light died with a sigh. A sense of violation lingers."); Game.refreshPlayerUI(); endStorylet("You pluck the fungus. Its mournful light extinguishes."); },
        outcomeKeeperExplainInnerSea: (params) => { UIManager.addLogEntry("Keeper: 'This is the Inner Sea, dream-tides where all thoughts eventually flow. Few surface here with as much... self... as you. A bleak fortune.'", "dialogue"); currentPlayerRef.modifyInsight(1, "Keeper's explanation"); UIManager.addJournalEntry("The Inner Sea", "The Keeper confirms this is the 'Inner Sea,' a confluence of consciousness."); Game.refreshPlayerUI(); endStorylet("The Keeper's words offer terrifying clarity."); },
        outcomeKeeperExplainReturn: (params) => { UIManager.addLogEntry("Keeper: 'Return? To the shore you knew? That path is erased. To 'leave' now means forging a new anchor of self, a new shore. Or being claimed. Your Ambition, Psychonaut, will light your way... or be your undoing.'", "dialogue"); UIManager.addJournalEntry("No Easy Return", "The Keeper speaks of forging a new self. Return is not simple. My Ambition is key."); endStorylet("The concept of 'return' seems distant."); },
        outcomeKeeperOfferRest: (params) => { UIManager.addLogEntry("Keeper: 'The tattered edges of your mind are plain. Rest here. Let the Sanctum's calm soothe what it can.'", "dialogue"); const integrityToHeal = Math.min(20, currentPlayerRef.maxIntegrity - currentPlayerRef.integrity); if(integrityToHeal > 0) currentPlayerRef.modifyIntegrity(integrityToHeal, "Keeper's solace"); currentPlayerRef.modifyHope(1, "Sanctuary's peace"); currentPlayerRef.modifyDespair(-1, "Sanctuary's peace"); UIManager.addJournalEntry("A Moment's Peace", "The Keeper allowed me to rest. The weight lessened."); Game.refreshPlayerUI(); endStorylet("A fragile peace settles as you accept the Keeper's offer."); },
        outcomeKeeperAddressAmbition: (params) => { UIManager.addLogEntry(`Keeper: 'Your Ambition: "${currentPlayerRef.ambition}". Many threads of such things drift. One pulls you towards the 'Archives of Regret'. Seek it. But understanding has a cost.'`, "dialogue_important"); currentWorldRef.revealNodeConnection("NODE_THRESHOLD_SANCTUM", "NODE_ARCHIVES_OF_REGRET_ENTRANCE"); UIManager.addJournalEntry("A Faint Trail", "The Keeper spoke of the 'Archives of Regret'. A path opened."); Game.refreshPlayerUI(); /* Game.refreshMapView(); // Main.js handles map refresh via storyletEnded -> _switchToView('map-view') */ endStorylet("The Keeper's words point towards a destination."); },
        outcomeKeeperSurvivalTips: (params) => { UIManager.addLogEntry("Keeper: 'Conserve Clarity, your light. Hoard Hope, your raft. Understand Concepts, your will. And listen... always listen to the Sea.'", "dialogue"); endStorylet("The advice is cryptic, yet resonant."); },
        outcomeKeeperExplainConcepts: (params) => { UIManager.addLogEntry("Keeper: 'Concepts are shaped thoughts. Expressions, techniques, insights. The more you understand, the more potent they become.'", "dialogue"); currentPlayerRef.modifyInsight(1, "learning about Concepts"); Game.refreshPlayerUI(); endStorylet("You gain deeper appreciation for your mental tools."); },
        outcomeEndConversationWithKeeper: (params) => { endStorylet("You nod to the Keeper, the conversation ended for now."); },

        // NEW: Outcome for playing "Fragmented Memory: The Fall" if it becomes a choice/action
        outcomePlayFragmentedMemoryTheFall: (params) => {
            const cardId = "AWK002";
            if (currentPlayerRef.hand.includes(cardId)) {
                const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                if (currentPlayerRef.spendFocusForCard(cardDef.cost, cardDef.name)) {
                    currentPlayerRef.playCardFromHand(cardId); // Move from hand to discard
                    UIManager.addLogEntry(`Played ${cardDef.name}.`, "player_action_major");
                    const effectFn = EncounterManager.getConceptCardEffectFunction(cardDef.effectFunctionName);
                    if (effectFn) {
                        effectFn(cardDef); // This should add Clarity, Trauma, and call Game.revealAwakeningMapConnections()
                    } else { console.error("Effect for Fragmented Memory: The Fall not found."); }
                    Game.refreshPlayerUI();
                    endStorylet("The vision of the fall, though painful, brings a strange clarity and reveals new paths.");
                } else {
                    // Not enough focus, player can try again or do something else.
                    // Don't end storylet, let them re-evaluate. Or, current storylet should have other choices.
                    UIManager.addLogEntry(`Not enough Focus to process ${cardDef.name}.`, "warning");
                    // To prevent getting stuck, if this is the ONLY choice, we should end.
                    // This scenario needs careful storylet design.
                    // For now, let's assume this outcome is part of a storylet with other options or is an auto-end.
                     endStorylet("The memory is too jarring to process fully right now.");
                }
            } else {
                UIManager.addLogEntry("The 'Fragmented Memory: The Fall' is not currently in your grasp.", "warning");
                endStorylet();
            }
        }
    };

    return {
        init,
        startStorylet,
        makeChoice,
        // endStorylet, // Not public, internal or via Game
    };
})();
