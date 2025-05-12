// js/storylet_manager.js

const StoryletManager = (() => {

    let activeStoryletData = null; 
    let activeStoryletInstance = null; 
    let currentPlayerRef = null;
    let currentWorldRef = null;

    function init(player, world) {
        currentPlayerRef = player;
        currentWorldRef = world;
        console.log("StoryletManager (v2.1 Awakening - Full) initialized.");
    }

    function startStorylet(storyletId) {
        const storyletDef = STORYLET_DATA_MINIMAL[storyletId]; 
        if (storyletDef) {
            activeStoryletData = { ...storyletDef };
            activeStoryletInstance = { 
                id: storyletDef.id,
                title: storyletDef.title,
                text: storyletDef.text,
                choices: [] 
            };

            if (storyletDef.choices && Array.isArray(storyletDef.choices)) {
                activeStoryletInstance.choices = storyletDef.choices.map(choiceDef => {
                    const choiceInstance = { ...choiceDef };
                    choiceInstance.disabled = false;
                    choiceInstance.disabledReason = "";
                    if (choiceDef.conditionFunctionName && typeof storyletConditions[choiceDef.conditionFunctionName] === 'function') {
                        if (!storyletConditions[choiceDef.conditionFunctionName](choiceDef.conditionParams || {})) {
                            choiceInstance.disabled = true;
                            choiceInstance.disabledReason = choiceDef.conditionDisabledReason || "You cannot choose this option presently.";
                        }
                    } else if (choiceDef.conditionFunctionName) {
                        console.warn(`Condition function "${choiceDef.conditionFunctionName}" for storylet "${storyletId}" not found. Choice enabled.`);
                    }
                    return choiceInstance;
                });
            }

            if (typeof Game !== 'undefined' && Game.notify) { 
                Game.notify(`Storylet Engaged: ${activeStoryletInstance.title}`, "story");
            }
            return activeStoryletInstance; 
        } else {
            if (typeof Game !== 'undefined' && Game.notify) {
                Game.notify(`Error: Storylet ID "${storyletId}" not found.`, "error");
            }
            console.error(`Storylet ID "${storyletId}" not found.`);
            activeStoryletData = null; activeStoryletInstance = null;
            if (typeof Game !== 'undefined' && Game.storyletEnded) Game.storyletEnded(); 
            return null; 
        }
    }

    function makeChoice(choiceIndex) {
        if (!activeStoryletInstance || !activeStoryletInstance.choices || choiceIndex < 0 || choiceIndex >= activeStoryletInstance.choices.length) {
            if(Game && Game.notify) Game.notify("Invalid storylet choice made.", "error"); return;
        }
        const chosenOption = activeStoryletInstance.choices[choiceIndex];
        if (chosenOption.disabled) {
            if(Game && Game.notify) Game.notify(`Cannot select disabled choice: "${chosenOption.text}" (Reason: ${chosenOption.disabledReason})`, "warning"); return;
        }
        if(Game && Game.notify) Game.notify(`Chose: "${chosenOption.text}"`, "choice");
        
        // console.log("Player hand JUST BEFORE outcome function is called in StoryletManager.makeChoice:", JSON.stringify(currentPlayerRef.hand));

        if (chosenOption.outcomeFunctionName && typeof storyletOutcomes[chosenOption.outcomeFunctionName] === 'function') {
            storyletOutcomes[chosenOption.outcomeFunctionName](chosenOption.params || {});
        } else {
            if(Game && Game.notify) Game.notify(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented for "${chosenOption.text}". Storylet ends.`, "error");
            console.warn(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented.`);
            endStorylet();
        }
    }

    function endStorylet(logMessage = "The moment passes into memory.") {
        if (activeStoryletData) { 
            const currentNode = currentWorldRef.getCurrentNode(); 
            if (currentNode && currentNode.storyletOnArrival === activeStoryletData.id && !currentNode.arrivalStoryletCompleted) {
                if (typeof currentWorldRef.markArrivalStoryletCompleted === 'function') {
                    currentWorldRef.markArrivalStoryletCompleted(currentNode.id);
                } else {
                    console.error("currentWorldRef.markArrivalStoryletCompleted is not a function!");
                }
            }
            if (typeof Game !== 'undefined' && Game.notify) { 
                Game.notify(logMessage, "system"); 
            }
        }
        activeStoryletData = null; 
        activeStoryletInstance = null;
        if (typeof Game !== 'undefined' && Game.storyletEnded) Game.storyletEnded();
    }

    const storyletConditions = {
        conditionHasFocus1: (params) => currentPlayerRef && currentPlayerRef.focus >= 1,
        conditionPlayerWounded: (params) => currentPlayerRef && (currentPlayerRef.integrity < (currentPlayerRef.maxIntegrity * 0.5)),
        conditionHasMemory: (params) => currentPlayerRef && params.memoryId && currentPlayerRef.hasMemory(params.memoryId),
        conditionHasCardInHand: (params) => currentPlayerRef && params.cardId && currentPlayerRef.hand.includes(params.cardId),
        conditionPlayerNotAtMaxIntegrity: (params) => currentPlayerRef && currentPlayerRef.integrity < currentPlayerRef.maxIntegrity,
    };

    const storyletOutcomes = {
        outcomePlayGraspForAwarenessShore: (params) => {
            const graspCardId = "AWK001";
            // console.log("Player hand at VERY START of outcomePlayGraspForAwarenessShore:", JSON.stringify(currentPlayerRef.hand));
            if (currentPlayerRef.hand.includes(graspCardId)) {
                const cardDef = CONCEPT_CARD_DEFINITIONS[graspCardId]; 
                const playedCardDef = currentPlayerRef.playCardFromHand(graspCardId); 
                if (playedCardDef) { 
                    if(Game && Game.notify) Game.notify(`You instinctively ${playedCardDef.name.toLowerCase()}.`, "player_action_major");
                    const graspEffectFn = (typeof EncounterManager !== 'undefined') ? EncounterManager.getConceptCardEffectFunction(playedCardDef.effectFunctionName) : null;
                    if (graspEffectFn) { graspEffectFn(playedCardDef); } 
                    else { console.error("Effect for Grasp for Awareness not found."); if(Game && Game.notify) Game.notify("The impulse yields confusion.", "system_negative");}
                    if(typeof Game !== 'undefined' && Game.refreshPlayerUI) Game.refreshPlayerUI();
                    endStorylet("A sliver of awareness cuts the fog. The world sharpens slightly.");
                } else { 
                    if(Game && Game.notify) Game.notify("Could not manifest 'Grasp for Awareness' (playCardFromHand failed).", "error");
                    console.error("playCardFromHand failed for AWK001. Hand:", JSON.stringify(currentPlayerRef.hand));
                    endStorylet("The fog remains thick."); 
                }
            } else { 
                if(Game && Game.notify) Game.notify("'Grasp for Awareness' is missing from hand at outcome processing.", "error"); 
                console.error("CRITICAL: AWK001 not in hand during outcome. Hand:", JSON.stringify(currentPlayerRef.hand));
                endStorylet("Adrift in confusion."); 
            }
        },
        outcomeSiftWreckage: (params) => { if (!currentPlayerRef.spendFocusForCard(1, "sifting wreckage")) { endStorylet("Lacking focus, the debris remains a jumble."); return; } currentPlayerRef.addMemory("MEM_TARNISHED_LOCKET"); currentPlayerRef.modifyHope(1, "finding the locket"); if(Game && Game.notify) Game.notify("You find a small, tarnished locket in the debris. A faint warmth emanates from it.", "discovery", true); if(Game && Game.addJournalEntry) Game.addJournalEntry("A Glimmer of the Past", "Amidst shattered thoughts, I found a Tarnished Locket. It feels... important."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet(); }, // End storylet with default message
        outcomeListenWhisperWreckage: (params) => { if(Game && Game.notify) Game.notify("The whisper intensifies, 'YOU SHOULD NOT BE HERE!' A shard of doubt takes form!", "critical"); if(Game && Game.queueEncounter) Game.queueEncounter("ASP_LINGERING_DOUBT"); endStorylet("The whispers coalesce into a menacing presence."); },
        outcomeLeaveWreckage: (params) => { currentPlayerRef.modifyDespair(1, "fleeing the wreckage"); if(Game && Game.addJournalEntry) Game.addJournalEntry("Unease", "The Wreckage of a Thought felt deeply unsettling. I chose not to linger."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("You back away from the unsettling wreckage."); },
        outcomeTouchFungusEmpathy: (params) => { currentPlayerRef.addConceptToDeck("CON001", true); if(Game && Game.notify) Game.notify("You receive a 'Glimmering Tear-Drop' (Clarity +3 or Hope +1).", "reward"); if(Game && Game.addJournalEntry) Game.addJournalEntry("The Sorrowful Bloom", "The fungus resonated, sharing sadness, a vision of a burning library, and 'Shared Sorrow'."); currentPlayerRef.modifyAttunement("psychological", 1, "empathizing with fungus"); currentPlayerRef.modifyHope(1, "connection"); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("A wave of shared sorrow leaves an echo of understanding."); },
        outcomeObserveFungusCognitive: (params) => { currentPlayerRef.addConceptToDeck("CON002", true); if(Game && Game.addJournalEntry) Game.addJournalEntry("Calculated Distance", "Observing the sorrowful fungus revealed patterns, granting 'Detached Observation'."); currentPlayerRef.modifyAttunement("cognitive", 1, "analyzing fungus"); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("From a distance, you analyze the fungus, gaining perspective."); },
        outcomeHarvestFungus: (params) => { if(Game && Game.notify) Game.notify("You gain 'Bioluminescent Tear-Drop Cluster' (Valuable). Its light is cold.", "reward"); currentPlayerRef.modifyDespair(1, "harvesting fungus"); currentPlayerRef.modifyAttunement("interaction", 1, "decisive action"); if(Game && Game.addJournalEntry) Game.addJournalEntry("A Cold Harvest", "I took the fungus. Its light died. A violation lingers."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("You pluck the fungus. Its light extinguishes."); },
        outcomeKeeperExplainInnerSea: (params) => { if(Game && Game.notify) Game.notify("Keeper: 'This is the Inner Sea, dream-tides where all thoughts flow. Few surface with as much... self... as you. A bleak fortune.'", "dialogue"); currentPlayerRef.modifyInsight(1, "Keeper's explanation"); if(Game && Game.addJournalEntry) Game.addJournalEntry("The Inner Sea", "The Keeper confirms this is the 'Inner Sea,' confluence of consciousness."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("The Keeper's words offer terrifying clarity."); },
        outcomeKeeperExplainReturn: (params) => { if(Game && Game.notify) Game.notify("Keeper: 'Return? To the shore you knew? That path is erased. To 'leave' now means forging a new anchor, a new shore. Or being claimed. Your Ambition, Psychonaut, will light your way... or be your undoing.'", "dialogue"); if(Game && Game.addJournalEntry) Game.addJournalEntry("No Easy Return", "The Keeper speaks of forging a new self. Return is not simple."); endStorylet("The concept of 'return' seems distant."); },
        outcomeKeeperOfferRest: (params) => { if(Game && Game.notify) Game.notify("Keeper: 'The tattered edges of your mind are plain. Rest here. Let the Sanctum's calm soothe what it can.'", "dialogue"); const integrityToHeal = Math.min(20, currentPlayerRef.maxIntegrity - currentPlayerRef.integrity); if(integrityToHeal > 0) currentPlayerRef.modifyIntegrity(integrityToHeal, "Keeper's solace"); currentPlayerRef.modifyHope(1, "Sanctuary's peace"); currentPlayerRef.modifyDespair(-1, "Sanctuary's peace"); if(Game && Game.addJournalEntry) Game.addJournalEntry("A Moment's Peace", "The Keeper allowed me to rest. The weight lessened."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("A fragile peace settles as you accept the Keeper's offer."); },
        outcomeKeeperAddressAmbition: (params) => { if(Game && Game.notify) Game.notify(`Keeper: 'Your Ambition: "${currentPlayerRef.ambition}". Many threads drift. One pulls you towards the 'Archives of Regret'. Seek it. But understanding has a cost.'`, "dialogue_important"); if(currentWorldRef) currentWorldRef.revealNodeConnection("NODE_THRESHOLD_SANCTUM", "NODE_ARCHIVES_OF_REGRET_ENTRANCE"); if(Game && Game.addJournalEntry) Game.addJournalEntry("A Faint Trail", "The Keeper spoke of the 'Archives of Regret'. A path opened."); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("The Keeper's words point towards a destination."); },
        outcomeKeeperSurvivalTips: (params) => { if(Game && Game.notify) Game.notify("Keeper: 'Conserve Clarity, your light. Hoard Hope, your raft. Understand Concepts, your will. Listen... to the Sea.'", "dialogue"); endStorylet("The advice is cryptic, yet resonant."); },
        outcomeKeeperExplainConcepts: (params) => { if(Game && Game.notify) Game.notify("Keeper: 'Concepts are shaped thoughts. Expressions, techniques, insights. The more you understand, the more potent they become.'", "dialogue"); currentPlayerRef.modifyInsight(1, "learning about Concepts"); if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("You gain deeper appreciation for your mental tools."); },
        outcomeEndConversationWithKeeper: (params) => { endStorylet("You nod to the Keeper, the conversation ended for now."); },
        outcomePlayFragmentedMemoryTheFall: (params) => { const cardId = "AWK002"; if (currentPlayerRef.hand.includes(cardId)) { const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; if (currentPlayerRef.spendFocusForCard(cardDef.cost, cardDef.name)) { currentPlayerRef.playCardFromHand(cardId); if(Game && Game.notify) Game.notify(`Played ${cardDef.name}.`, "player_action_major"); const effectFn = (typeof EncounterManager !== 'undefined') ? EncounterManager.getConceptCardEffectFunction(cardDef.effectFunctionName) : null; if (effectFn) { effectFn(cardDef); } else { console.error("Effect for Fragmented Memory: The Fall not found."); } if(Game && Game.refreshPlayerUI) Game.refreshPlayerUI(); endStorylet("The vision, though painful, brings clarity and reveals paths."); } else { if(Game && Game.notify) Game.notify(`Not enough Focus to process ${cardDef.name}.`, "warning"); endStorylet("The memory is too jarring to process fully now."); } } else { if(Game && Game.notify) Game.notify("'Fragmented Memory: The Fall' is not in your grasp.", "warning"); endStorylet(); } }
    };

    return {
        init,
        startStorylet,
        makeChoice,
    };
})();
