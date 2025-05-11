// js/storylet_manager.js

const StoryletManager = (() => { // IIFE for a module-like structure

    let activeStoryletData = null; // Holds the *data* of the currently active storylet from config
    let activeStoryletInstance = null; // Potentially a live copy with dynamic state, for now same as data
    let currentPlayerRef = null;
    let currentWorldRef = null;

    function init(player, world) {
        currentPlayerRef = player;
        currentWorldRef = world;
        console.log("StoryletManager initialized.");
    }

    function startStorylet(storyletId) {
        if (STORYLET_DATA_MINIMAL[storyletId]) {
            activeStoryletData = { ...STORYLET_DATA_MINIMAL[storyletId] }; // Make a copy
            activeStoryletInstance = { ...activeStoryletData }; // For now, instance is same as data

            // Evaluate conditions for choices *before* displaying
            if (activeStoryletInstance.choices) {
                activeStoryletInstance.choices.forEach(choice => {
                    choice.disabled = false; // Reset disabled state
                    choice.disabledReason = "";
                    if (choice.conditionFunctionName && typeof storyletConditions[choice.conditionFunctionName] === 'function') {
                        if (!storyletConditions[choice.conditionFunctionName](choice.conditionParams || {})) {
                            choice.disabled = true;
                            // We might want to fetch a specific disabled reason from the condition function
                            choice.disabledReason = choice.conditionDisabledReason || "You cannot choose this right now.";
                        }
                    }
                });
            }

            UIManager.addLogEntry(`Storylet: ${activeStoryletInstance.title}`, "story");
            UIManager.displayStorylet(activeStoryletInstance); // Tell UI to show it
            return true;
        } else {
            UIManager.addLogEntry(`Error: Storylet ID "${storyletId}" not found.`, "error");
            console.error(`Storylet ID "${storyletId}" not found.`);
            activeStoryletData = null;
            activeStoryletInstance = null;
            // Fallback to map view if storylet fails to load
            Game.returnToMapView(); // Notify main game to handle view
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
            // The outcome function is responsible for what happens next,
            // including potentially ending the storylet or starting another.
            storyletOutcomes[chosenOption.outcomeFunctionName](chosenOption.params || {});
        } else {
            UIManager.addLogEntry(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented for "${chosenOption.text}". Storylet ends.`, "error");
            endStorylet(); // Default to ending if no valid outcome
        }
    }

    function endStorylet(logMessage = "The moment passes.") {
        if (activeStoryletData) { // Check if a storylet was active
            UIManager.addLogEntry(logMessage, "system");
        }
        activeStoryletData = null;
        activeStoryletInstance = null;
        // Main game loop (Game in main.js) should decide what view to show next.
        // e.g., Game.returnToPreviousView(); or Game.displayCurrentNodeDetails();
        Game.storyletEnded(); // Notify main controller
    }

    // --- Storylet Choice Conditions ---
    // These functions return true if a choice should be available, false otherwise.
    const storyletConditions = {
        conditionHasFocus1: (params) => {
            return currentPlayerRef.focus >= 1;
        },
        conditionPlayerWounded: (params) => {
            // Example: wounded if integrity is below 50% of max
            return currentPlayerRef.integrity < (currentPlayerRef.maxIntegrity * 0.5);
        },
        conditionHasMemory: (params) => {
            // params = { memoryId: "MEM_TARNISHED_LOCKET" }
            return params.memoryId && currentPlayerRef.hasMemory(params.memoryId);
        },
        // ... more conditions
    };

    // --- Storylet Outcome Functions (Expanded for Intro) ---
    const storyletOutcomes = {
        // --- Outcomes for STORY_WRECKAGE_ARRIVAL ---
        outcomeSiftWreckage: (params) => {
            if (!currentPlayerRef.spendFocusForCard(1, "sifting wreckage")) return; // Cost 1 focus

            // Player found the Tarnished Locket
            currentPlayerRef.addMemory("MEM_TARNISHED_LOCKET");
            currentPlayerRef.modifyHope(1, "finding the locket");
            UIManager.addJournalEntry("A Glimmer of the Past", "Amidst shattered thoughts, I found a Tarnished Locket. It feels... important, a faint anchor.");
            // UI updates for player stats and memories will be handled by main.js after this function returns
            endStorylet("You carefully sift through the debris, finding a small, tarnished locket.");
        },
        outcomeListenWhisperWreckage: (params) => {
            UIManager.addLogEntry("The whisper intensifies, 'YOU SHOULD NOT BE HERE!' A shard of doubt takes form!", "critical");
            // Game.startEncounter will be called by main.js after this outcome
            Game.queueEncounter("ASP_LINGERING_DOUBT");
            endStorylet("The whispers coalesce into a menacing presence.");
        },
        outcomeLeaveWreckage: (params) => {
            currentPlayerRef.modifyDespair(1, "fleeing the wreckage");
            UIManager.addJournalEntry("Unease", "The Wreckage of a Thought felt deeply unsettling. I chose not to linger.");
            endStorylet("You back away from the unsettling wreckage, a chill settling in your mind.");
        },

        // --- Outcomes for STORY_NICHE_ARRIVAL ---
        outcomeTouchFungusEmpathy: (params) => {
            // This path grants "Shared Sorrow" card and a vision
            currentPlayerRef.addConceptToDeck("CON001", true); // Add "Shared Sorrow"
            // currentPlayerRef.addResource("Glimmering Tear-Drop", 1); // If it's a trackable resource
            UIManager.addLogEntry("You receive a 'Glimmering Tear-Drop' from the fungus.", "reward");
            UIManager.addJournalEntry("The Sorrowful Bloom", "The tear-shaped fungus resonated with my touch, sharing a profound sadness and a strange vision: a vast library burning, and a lone figure trying to save the knowledge within... I feel a new understanding: 'Shared Sorrow'.");
            currentPlayerRef.modifyAttunement("psychological", 1, "empathizing with the fungus");
            currentPlayerRef.modifyHope(1, "a moment of connection");
            endStorylet("A wave of shared sorrow washes over you, leaving behind an echo of understanding and a strange, sad gift.");
        },
        outcomeObserveFungusCognitive: (params) => {
            // This path grants "Detached Observation" card
            currentPlayerRef.addConceptToDeck("CON002", true); // Add "Detached Observation"
            UIManager.addJournalEntry("Calculated Distance", "Observing the sorrowful fungus, I noted its patterns, its connection to the ambient despair. This insight grants me 'Detached Observation'.");
            currentPlayerRef.modifyAttunement("cognitive", 1, "analyzing the fungus");
            endStorylet("From a distance, you analyze the fungus, gaining a new perspective on observation itself.");
        },
        outcomeHarvestFungus: (params) => {
            // This path grants a resource but increases Despair
            // currentPlayerRef.addResource("Bioluminescent Tear-Drop Cluster", 1);
            UIManager.addLogEntry("You gain a 'Bioluminescent Tear-Drop Cluster'. Its light is cold.", "reward");
            currentPlayerRef.modifyDespair(1, "harvesting the sorrowful fungus");
            currentPlayerRef.modifyAttunement("interaction", 1, "a decisive, if regrettable, action"); // Or Sensory
            UIManager.addJournalEntry("A Cold Harvest", "I took the fungus. Its light died with a sigh. While it may prove useful, a sense of violation lingers.");
            endStorylet("You pluck the fungus. Its mournful light extinguishes, leaving a cold weight in your hand.");
        },

        // --- Outcomes for STORY_SANCTUARY_INTRO_AWAKENING ---
        outcomeKeeperExplainInnerSea: (params) => {
            UIManager.addLogEntry("The Keeper speaks: 'This is the Inner Sea, the dream-tides where all thoughts eventually flow. Few surface here with as much... self... as you have retained. Consider it a bleak fortune.'", "dialogue");
            currentPlayerRef.modifyInsight(1, "Keeper's explanation");
            // Game.giveMemory("MEM_BASIC_MAP_FRAGMENT"); // Main game controller
            UIManager.addJournalEntry("The Inner Sea", "The Keeper confirms this surreal ocean is the 'Inner Sea,' a confluence of consciousness. I am a 'stray spark.'");
            // This choice might lead to more questions or end the current interaction block.
            // For simplicity, let's say it allows further conversation or ends.
            // To allow more interaction, we might restart the *same* storylet but with this option now greyed out/changed.
            // For now, just end.
            endStorylet("The Keeper's words offer a sliver of terrifying clarity.");
        },
        outcomeKeeperExplainReturn: (params) => {
            UIManager.addLogEntry("Keeper: 'Return? To the shore you knew? That path is likely erased by your arrival. To 'leave' now means forging a new anchor of self, finding a new shore. Or being claimed by the currents. Your Ambition, Psychonaut, will light your way... or be your undoing.'", "dialogue");
            UIManager.addJournalEntry("No Easy Return", "The Keeper speaks of forging a new self, a new shore. Return is not simple. My Ambition is key.");
            endStorylet("The concept of 'return' seems distant, almost impossible.");
        },
        outcomeKeeperOfferRest: (params) => {
            UIManager.addLogEntry("Keeper: 'The tattered edges of your mind are plain to see. Rest here. Let the Sanctum's calm soothe what it can. This service is freely given to new arrivals.'", "dialogue");
            // Make "Rest" action available or auto-trigger a small rest
            // Game.executeLocationAction("rest"); // Main game controller
            currentPlayerRef.modifyIntegrity(Math.min(20, currentPlayerRef.maxIntegrity - currentPlayerRef.integrity), "Keeper's solace"); // Heal up to 20 or to max
            currentPlayerRef.modifyHope(1, "Sanctuary's peace");
            UIManager.addJournalEntry("A Moment's Peace", "The Keeper allowed me to rest. The crushing weight lessened, if only for a while.");
            endStorylet("A fragile peace settles over you as you accept the Keeper's offer to rest.");
        },
        outcomeKeeperAddressAmbition: (params) => {
            UIManager.addLogEntry(`Keeper, looking past you: 'The whispers... the loss... yes. Many threads of such things drift in the Sea. One such thread seems to pull you towards the forgotten 'Archives of Regret'. Seek it, if you must. But know that understanding often comes at a cost.'`, "dialogue_important");
            // This gives a concrete (if vague) next step.
            // Game.unlockNewNodeOrRegion("NODE_ARCHIVES_OF_REGRET_ENTRANCE");
            currentWorldRef.revealNodeConnection("NODE_THRESHOLD_SANCTUM", "NODE_ARCHIVES_OF_REGRET_ENTRANCE"); // Placeholder for new node ID
            UIManager.addJournalEntry("A Faint Trail", "The Keeper spoke of the 'Archives of Regret' in connection to my Ambition. A path seems to have opened.");
            endStorylet("The Keeper's words point towards a destination, however ominous.");
        },

        // --- Outcomes for STORY_KEEPER_ADVICE_OPTIONAL ---
        outcomeKeeperSurvivalTips: (params) => {
            UIManager.addLogEntry("Keeper: 'Conserve your Clarity; it is the light by which you see. Hoard your Hope; it is the raft upon the Despair. Understand the Concepts you wield; they are extensions of your will. And listen... always listen to the Sea.'", "dialogue");
            endStorylet("The advice is cryptic, yet resonant.");
        },
        outcomeKeeperExplainConcepts: (params) => {
            UIManager.addLogEntry("Keeper: 'Concepts are shaped thoughts, Psychonaut. Your will given form. Some are expressions, some are techniques, others profound insights. The more you understand yourself and the Sea, the more potent they become.'", "dialogue");
            currentPlayerRef.modifyInsight(1, "learning about Concepts");
            endStorylet("You gain a deeper appreciation for the nature of your mental tools.");
        },
        outcomeEndConversationWithKeeper: (params) => {
            endStorylet("You nod to the Keeper, the conversation ended for now.");
        },

    };

    // --- Public API ---
    return {
        init,
        startStorylet,
        makeChoice,
        endStorylet, // Can be called by main.js if a storylet needs to be interrupted
        // Expose conditions if main.js needs to check them before starting a storylet
        isChoiceAvailable: (storyletId, choiceIndex) => {
            const storyletDef = STORYLET_DATA_MINIMAL[storyletId];
            if (storyletDef && storyletDef.choices && storyletDef.choices[choiceIndex]) {
                const choiceDef = storyletDef.choices[choiceIndex];
                if (choiceDef.conditionFunctionName && typeof storyletConditions[choiceDef.conditionFunctionName] === 'function') {
                    return storyletConditions[choiceDef.conditionFunctionName](choiceDef.params || {});
                }
                return true; // No condition, so available
            }
            return false;
        }
    };

})();
