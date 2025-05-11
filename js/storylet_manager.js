// js/storylet_manager.js

const StoryletManager = (() => { // IIFE for a module-like structure

    let activeStoryletData = null;
    let activeStoryletInstance = null;
    let currentPlayerRef = null;
    let currentWorldRef = null;

    function init(player, world) {
        currentPlayerRef = player;
        currentWorldRef = world;
        console.log("StoryletManager initialized.");
    }

    function startStorylet(storyletId) {
        const storyletDef = STORYLET_DATA_MINIMAL[storyletId];
        if (storyletDef) {
            activeStoryletData = { ...storyletDef }; // Store original definition
            activeStoryletInstance = { ...storyletDef }; // Make a working copy

            // Evaluate conditions for choices *before* displaying
            if (activeStoryletInstance.choices) {
                activeStoryletInstance.choices.forEach(choice => {
                    choice.disabled = false; // Reset disabled state
                    choice.disabledReason = "";
                    if (choice.conditionFunctionName && typeof storyletConditions[choice.conditionFunctionName] === 'function') {
                        if (!storyletConditions[choice.conditionFunctionName](choice.conditionParams || {})) {
                            choice.disabled = true;
                            choice.disabledReason = choice.conditionDisabledReason || "You cannot choose this right now.";
                        }
                    } else if (choice.conditionFunctionName) {
                        console.warn(`Condition function "${choice.conditionFunctionName}" not found for storylet "${storyletId}", choice "${choice.text}". Choice will be enabled.`);
                    }
                });
            }

            UIManager.addLogEntry(`Storylet: ${activeStoryletInstance.title}`, "story");
            UIManager.displayStorylet(activeStoryletInstance);
            return true;
        } else {
            UIManager.addLogEntry(`Error: Storylet ID "${storyletId}" not found.`, "error");
            console.error(`Storylet ID "${storyletId}" not found.`);
            activeStoryletData = null;
            activeStoryletInstance = null;
            Game.storyletEnded(); // Notify main to handle view fallback
            return false;
        }
    }

    function makeChoice(choiceIndex) {
        if (!activeStoryletInstance || !activeStoryletInstance.choices || choiceIndex < 0 || choiceIndex >= activeStoryletInstance.choices.length) {
            UIManager.addLogEntry("Invalid storylet choice made.", "error");
            return;
        }

        const chosenOption = activeStoryletInstance.choices[choiceIndex];
        if (chosenOption.disabled) {
            UIManager.addLogEntry(`Cannot select disabled choice: "${chosenOption.text}"`, "warning");
            return;
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

    function endStorylet(logMessage = "The moment passes.") {
        if (activeStoryletData) {
             UIManager.addLogEntry(logMessage, "system");
        }
        activeStoryletData = null;
        activeStoryletInstance = null;
        Game.storyletEnded(); // Notify main controller
    }

    // --- Storylet Choice Conditions ---
    const storyletConditions = {
        conditionHasFocus1: (params) => {
            return currentPlayerRef && currentPlayerRef.focus >= 1;
        },
        conditionPlayerWounded: (params) => {
            return currentPlayerRef && (currentPlayerRef.integrity < (currentPlayerRef.maxIntegrity * 0.5));
        },
        conditionHasMemory: (params) => {
            return currentPlayerRef && params.memoryId && currentPlayerRef.hasMemory(params.memoryId);
        },
        // Example: Check if a specific card is in hand
        conditionHasCardInHand: (params) => {
            // params = { cardId: "AWK002" }
            return currentPlayerRef && params.cardId && currentPlayerRef.hand.includes(params.cardId);
        }
    };

    // --- Storylet Outcome Functions (Expanded for Intro) ---
    const storyletOutcomes = {
        // --- Outcome for STORY_SHORE_ARRIVAL (NEW) ---
        outcomePlayGraspForAwarenessShore: (params) => {
            const graspCardId = "AWK001"; // "Grasp for Awareness"
            if (currentPlayerRef.hand.includes(graspCardId)) {
                const cardDef = CONCEPT_CARD_DEFINITIONS[graspCardId];
                // Player.playCardFromHand checks focus and deducts it.
                const playedCardDef = currentPlayerRef.playCardFromHand(graspCardId);

                if (playedCardDef) {
                    UIManager.addLogEntry(`You instinctively ${playedCardDef.name.toLowerCase()}.`, "player_action_major");
                    // Execute "Grasp for Awareness" effect
                    const graspEffectFn = EncounterManager.getConceptCardEffectFunction(playedCardDef.effectFunctionName);
                    if (graspEffectFn) {
                        graspEffectFn(playedCardDef); // This will draw from Awakening Deck
                    } else {
                        console.error("Effect function for Grasp for Awareness not found in EncounterManager's exports.");
                        UIManager.addLogEntry("The impulse yields nothing but deeper confusion.", "system_negative");
                    }
                    Game.refreshPlayerUI(); // Update UI after card play & effect
                    // The game now expects the player to play the newly drawn "Fragmented Memory: The Fall"
                    // This storylet ends, player remains on Shattered Shore map node.
                    // Next action will likely be exploring the node again, or playing the new card if we add a "play insight from map" mechanic.
                    // For now, ending the storylet returns to the map view of the current node.
                    endStorylet("A sliver of awareness cuts through the fog. The world around you sharpens, just a little.");
                    // Game.switchToNodeMapView(); // Main.js will handle this via storyletEnded callback
                } else {
                    // This case means player couldn't play it (e.g. somehow no focus, though cost is 0)
                    UIManager.addLogEntry("Could not manifest the 'Grasp for Awareness'. The fog remains thick.", "error");
                    endStorylet("The oppressive disorientation remains.");
                }
            } else {
                UIManager.addLogEntry("The initial impulse to grasp awareness is missing... (Card AWK001 not in hand)", "error");
                endStorylet("You remain adrift in confusion.");
            }
        },

        // --- Outcomes for STORY_WRECKAGE_ARRIVAL ---
        outcomeSiftWreckage: (params) => {
            if (!currentPlayerRef.spendFocusForCard(1, "sifting wreckage")) { // Check and spend focus
                endStorylet("You lack the mental energy to sift through the wreckage meaningfully.");
                return;
            }
            currentPlayerRef.addMemory("MEM_TARNISHED_LOCKET");
            currentPlayerRef.modifyHope(1, "finding the locket");
            UIManager.addJournalEntry("A Glimmer of the Past", "Amidst shattered thoughts, I found a Tarnished Locket. It feels... important, a faint anchor.");
            Game.refreshPlayerUI();
            endStorylet("You carefully sift through the debris, finding a small, tarnished locket.");
        },
        outcomeListenWhisperWreckage: (params) => {
            UIManager.addLogEntry("The whisper intensifies, 'YOU SHOULD NOT BE HERE!' A shard of doubt takes form!", "critical");
            Game.queueEncounter("ASP_LINGERING_DOUBT");
            endStorylet("The whispers coalesce into a menacing presence.");
        },
        outcomeLeaveWreckage: (params) => {
            currentPlayerRef.modifyDespair(1, "fleeing the wreckage");
            UIManager.addJournalEntry("Unease", "The Wreckage of a Thought felt deeply unsettling. I chose not to linger.");
            Game.refreshPlayerUI();
            endStorylet("You back away from the unsettling wreckage, a chill settling in your mind.");
        },

        // --- Outcomes for STORY_NICHE_ARRIVAL ---
        outcomeTouchFungusEmpathy: (params) => {
            currentPlayerRef.addConceptToDeck("CON001", true);
            UIManager.addLogEntry("You receive a 'Glimmering Tear-Drop' (conceptual resource).", "reward");
            UIManager.addJournalEntry("The Sorrowful Bloom", "The tear-shaped fungus resonated with my touch, sharing a profound sadness and a strange vision: a vast library burning, and a lone figure trying to save the knowledge within... I feel a new understanding: 'Shared Sorrow'.");
            currentPlayerRef.modifyAttunement("psychological", 1, "empathizing with the fungus");
            currentPlayerRef.modifyHope(1, "a moment of connection");
            Game.refreshPlayerUI();
            endStorylet("A wave of shared sorrow washes over you, leaving behind an echo of understanding and a strange, sad gift.");
        },
        outcomeObserveFungusCognitive: (params) => {
            currentPlayerRef.addConceptToDeck("CON002", true);
            UIManager.addJournalEntry("Calculated Distance", "Observing the sorrowful fungus, I noted its patterns, its connection to the ambient despair. This insight grants me 'Detached Observation'.");
            currentPlayerRef.modifyAttunement("cognitive", 1, "analyzing the fungus");
            Game.refreshPlayerUI();
            endStorylet("From a distance, you analyze the fungus, gaining a new perspective on observation itself.");
        },
        outcomeHarvestFungus: (params) => {
            UIManager.addLogEntry("You gain a 'Bioluminescent Tear-Drop Cluster' (conceptual resource). Its light is cold.", "reward");
            currentPlayerRef.modifyDespair(1, "harvesting the sorrowful fungus");
            currentPlayerRef.modifyAttunement("interaction", 1, "a decisive, if regrettable, action");
            UIManager.addJournalEntry("A Cold Harvest", "I took the fungus. Its light died with a sigh. While it may prove useful, a sense of violation lingers.");
            Game.refreshPlayerUI();
            endStorylet("You pluck the fungus. Its mournful light extinguishes, leaving a cold weight in your hand.");
        },

        // --- Outcomes for STORY_SANCTUARY_INTRO_AWAKENING ---
        outcomeKeeperExplainInnerSea: (params) => {
            UIManager.addLogEntry("The Keeper speaks: 'This is the Inner Sea, the dream-tides where all thoughts eventually flow. Few surface here with as much... self... as you have retained. Consider it a bleak fortune.'", "dialogue");
            currentPlayerRef.modifyInsight(1, "Keeper's explanation");
            UIManager.addJournalEntry("The Inner Sea", "The Keeper confirms this surreal ocean is the 'Inner Sea,' a confluence of consciousness. I am a 'stray spark.'");
            Game.refreshPlayerUI();
            // This choice could lead to a sub-storylet or modified choices on the current one.
            // For now, we end, and player can talk to Keeper again.
            endStorylet("The Keeper's words offer a sliver of terrifying clarity.");
        },
        outcomeKeeperExplainReturn: (params) => {
            UIManager.addLogEntry("Keeper: 'Return? To the shore you knew? That path is likely erased by your arrival. To 'leave' now means forging a new anchor of self, finding a new shore. Or being claimed by the currents. Your Ambition, Psychonaut, will light your way... or be your undoing.'", "dialogue");
            UIManager.addJournalEntry("No Easy Return", "The Keeper speaks of forging a new self, a new shore. Return is not simple. My Ambition is key.");
            Game.refreshPlayerUI();
            endStorylet("The concept of 'return' seems distant, almost impossible.");
        },
        outcomeKeeperOfferRest: (params) => {
            UIManager.addLogEntry("Keeper: 'The tattered edges of your mind are plain to see. Rest here. Let the Sanctum's calm soothe what it can.'", "dialogue");
            const integrityToHeal = Math.min(20, currentPlayerRef.maxIntegrity - currentPlayerRef.integrity);
            currentPlayerRef.modifyIntegrity(integrityToHeal, "Keeper's solace");
            currentPlayerRef.modifyHope(1, "Sanctuary's peace");
            currentPlayerRef.modifyDespair(-1, "Sanctuary's peace"); // Reduce despair
            UIManager.addJournalEntry("A Moment's Peace", "The Keeper allowed me to rest. The crushing weight lessened, if only for a while.");
            Game.refreshPlayerUI();
            endStorylet("A fragile peace settles over you as you accept the Keeper's offer to rest.");
        },
        outcomeKeeperAddressAmbition: (params) => {
            UIManager.addLogEntry(`Keeper, looking past you: 'The whispers... the loss... yes. Your Ambition: "${currentPlayerRef.ambition}". Many threads of such things drift in the Sea. One such thread seems to pull you towards the forgotten 'Archives of Regret'. Seek it, if you must. But know that understanding often comes at a cost.'`, "dialogue_important");
            currentWorldRef.revealNodeConnection("NODE_THRESHOLD_SANCTUM", "NODE_ARCHIVES_OF_REGRET_ENTRANCE"); // Config needs this node ID
            UIManager.addJournalEntry("A Faint Trail", "The Keeper spoke of the 'Archives of Regret' in connection to my Ambition. A path seems to have opened.");
            Game.refreshPlayerUI(); // In case insight or other stats changed
            // Game.refreshMapView(); // Main.js should handle this after connection is revealed
            endStorylet("The Keeper's words point towards a destination, however ominous.");
        },

        // --- Outcomes for STORY_KEEPER_ADVICE_OPTIONAL ---
        outcomeKeeperSurvivalTips: (params) => {
            UIManager.addLogEntry("Keeper: 'Conserve your Clarity; it is the light by which you see. Hoard your Hope; it is the raft upon the Despair. Understand the Concepts you wield; they are extensions of your will. And listen... always listen to the Sea.'", "dialogue");
            endStorylet("The advice is cryptic, yet resonant.");
        },
        outcomeKeeperExplainConcepts: (params) => {
            UIManager.addLogEntry("Keeper: 'Concepts are shaped thoughts, Psychonaut. Your will given form. Some are expressions, some techniques, others profound insights. The more you understand yourself and the Sea, the more potent they become.'", "dialogue");
            currentPlayerRef.modifyInsight(1, "learning about Concepts");
            Game.refreshPlayerUI();
            endStorylet("You gain a deeper appreciation for the nature of your mental tools.");
        },
        outcomeEndConversationWithKeeper: (params) => {
            endStorylet("You nod to the Keeper, the conversation ended for now.");
        },
    };

    return {
        init,
        startStorylet,
        makeChoice,
        // endStorylet, // No longer public, called internally or via Game.storyletEnded()
        // isChoiceAvailable, // Not strictly needed if main.js doesn't pre-check
    };
})();
