// js/main.js

const Game = (() => {

    let currentPlayer = null;
    let currentWorld = World;    
    let uiMgr = UIManager;      
    let storyletMgr = StoryletManager; 
    let encounterMgr = EncounterManager; 

    let currentViewId = 'pre-game-intro-view';
    let isGameOver = false;
    let preGameIntroActive = true;
    let pendingEncounterId = null;
    let currentMapNodeId = null; 

    function init() {
        console.log("Sunless Psyche Main (v2.1 Awakening - Full Final): Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        uiMgr.init(); 
        currentPlayer = new Player();
        currentWorld.init(); 
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer); 

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main (v2.1 Awakening - Full Final): Initialization complete.");
    }

    function _startGameSequence() {
        currentMapNodeId = null; 
        refreshPlayerUI();
        _updateHeaderInfo(true); 
        uiMgr.startPreGameIntro(); 
    }

    function _updateHeaderInfo(isPreRecall = false) {
        const nameEl = uiMgr.getDOMElement('psychonautNameDisplay');
        const ambitionEl = uiMgr.getDOMElement('currentAmbitionDisplay');
        if (isPreRecall) {
            if(nameEl) nameEl.textContent = "The Unknowing";
            if(ambitionEl) ambitionEl.textContent = "To Simply Be";
        } else {
            if(nameEl) nameEl.textContent = currentPlayer.name || CONFIG.INITIAL_PSYCHONAUT_NAME;
            if(ambitionEl) ambitionEl.textContent = currentPlayer.ambition || CONFIG.INITIAL_AMBITION_TEXT;
        }
    }
    
    function _switchToView(viewId) {
        console.log(`Main: Switching view to: ${viewId}`);
        currentViewId = viewId; 
        uiMgr._showViewActualDOM(viewId); 
        
        if (viewId === 'map-view') {
            _updateAndRenderNodeMap(); 
        }
    }

    function _updateAndRenderNodeMap() {
        if (currentMapNodeId) { 
            const currentNodeData = currentWorld.getNodeData(currentMapNodeId);
            const allNodes = currentWorld.getAllNodes();
            const accessibleNodeIds = currentWorld.getAccessibleNodeIds(currentMapNodeId); 
            uiMgr.renderNodeMap(allNodes, currentMapNodeId, accessibleNodeIds);
            uiMgr.updateCurrentNodeInfo(currentNodeData);
        } else {
            const mapContainer = uiMgr.getDOMElement('nodeMapContainer');
            if(mapContainer) mapContainer.innerHTML = `<p class="placeholder">The way is obscured by swirling nothingness...</p>`;
            uiMgr.updateCurrentNodeInfo(null); 
        }
    }
    
    function switchToNodeMapView() { 
        _switchToView('map-view'); 
    }

    function storyletEnded() { 
        if (isGameOver) return;
        refreshPlayerUI(); 

        if (pendingEncounterId) {
            const encounterToStart = pendingEncounterId;
            pendingEncounterId = null; 
            startEncounterFromQueue(encounterToStart, currentViewId); 
        } else {
            const currentNode = currentWorld.getNodeData(currentMapNodeId);
            if (currentViewId === 'location-view' && currentNode && currentNode.isSanctuary) {
                uiMgr.displayLocation(currentNode.locationDetails || currentNode); 
                 _switchToView('location-view'); 
            } else {
                 switchToNodeMapView(); 
            }
        }
        _checkGameOver();
    }

    function _handleContinueFromPrecipice() {
        if (!preGameIntroActive) return;
        preGameIntroActive = false;
        uiMgr.clearPreGameIntroTimeout();
        
        const startingNode = currentWorld.placePlayerAtNode("NODE_SHATTERED_SHORE");
        if (startingNode) {
            currentMapNodeId = startingNode.id; 
            uiMgr.addLogEntry("Consciousness coalesces... You are on The Shattered Shore.", "system_major_event");
            
            console.log("Player hand JUST BEFORE STORY_SHORE_ARRIVAL storylet is started (in main.js):", JSON.stringify(currentPlayer.hand));

            if (startingNode.storyletOnArrival) {
                _switchToView('storylet-view'); 
                const storyletInstance = storyletMgr.startStorylet(startingNode.storyletOnArrival); 
                if (!storyletInstance) { 
                    console.error("Failed to start storylet: " + startingNode.storyletOnArrival);
                    switchToNodeMapView(); 
                } else {
                    uiMgr.displayStorylet(storyletInstance);
                }
            } else {
                console.error("NODE_SHATTERED_SHORE has no arrival storylet defined!");
                switchToNodeMapView(); 
            }
        } else {
            console.error("CRITICAL: Failed to place player at NODE_SHATTERED_SHORE!");
            uiMgr.addLogEntry("The void remains absolute. (Error: Start node missing)", "critical_system");
        }
    }

    function _navigateToNode(targetNodeId) { 
        if (isGameOver || encounterMgr.isActive()) return; 
        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer); 
        if (newNodeData) { 
            currentMapNodeId = newNodeData.id; 
            refreshPlayerUI(); 
            
            let storyletToStart = null;
            if (!newNodeData.arrivalStoryletCompleted && newNodeData.storyletOnArrival) {
                storyletToStart = newNodeData.storyletOnArrival;
            }

            if (storyletToStart) { 
                _switchToView('storylet-view'); 
                const storyletInstance = storyletMgr.startStorylet(storyletToStart); 
                if(storyletInstance) uiMgr.displayStorylet(storyletInstance); 
                else switchToNodeMapView(); 
            } else { 
                switchToNodeMapView(); 
            } 
        } 
        _checkGameOver(); 
    }

    function _exploreCurrentNode() { 
        if (isGameOver || encounterMgr.isActive() || !currentMapNodeId) return; 
        const node = currentWorld.getNodeData(currentMapNodeId); 
        if (node) { 
            uiMgr.addLogEntry(`Delving into ${node.name}...`, "action"); 

            if (node.id === "NODE_SHATTERED_SHORE" && node.arrivalStoryletCompleted) {
                let awakeningCardIdToPlay = null;
                if (currentPlayer.hand.includes("AWK002")) awakeningCardIdToPlay = "AWK002";
                else if (currentPlayer.hand.includes("AWK003")) awakeningCardIdToPlay = "AWK003";
                else if (currentPlayer.hand.includes("AWK004")) awakeningCardIdToPlay = "AWK004";

                if (awakeningCardIdToPlay) {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[awakeningCardIdToPlay];
                    uiMgr.addLogEntry(`You focus on the lingering insight: "${cardDef.name}"...`, "player_action_major");

                    if (currentPlayer.spendFocusForCard(cardDef.cost, cardDef.name)) {
                        currentPlayer.playCardFromHand(cardDef.id); 
                        const effectFn = EncounterManager.getConceptCardEffectFunction(cardDef.effectFunctionName);
                        if (effectFn) {
                            effectFn(cardDef); 
                        } else {
                            console.error(`No effect function found for ${cardDef.effectFunctionName}`);
                            uiMgr.addLogEntry(`The insight of "${cardDef.name}" remains elusive.`, "warning");
                        }
                        refreshPlayerUI(); 

                        if (currentPlayer.awakeningDeck.length > 0) {
                            const nextAwakeningCardId = currentPlayer.drawFromAwakeningDeck();
                            if (nextAwakeningCardId) {
                                refreshPlayerUI(); 
                                uiMgr.addLogEntry("Another fragmented thought surfaces...", "discovery");
                                uiMgr.addLogEntry(`Hint: Consider exploring "${node.name}" again to process new insights.`, "tutorial_hint");
                            }
                        } else if (currentPlayer.awakeningDeck.length === 0 && !currentPlayer.hand.some(id => id.startsWith("AWK"))) {
                            uiMgr.addLogEntry("The initial flood of fractured insights subsides. The way forward is slightly clearer.", "system_positive_strong");
                            if(currentViewId === 'map-view') _updateAndRenderNodeMap();
                        }
                    }
                    if (currentViewId !== 'map-view') switchToNodeMapView(); 
                    return; 
                }
                uiMgr.addLogEntry(`You've processed all current insights from ${node.name}.`, "system");
                switchToNodeMapView();
                return;
            }

            if (node.isSanctuary && node.locationDetails) { 
                _switchToView('location-view'); 
                uiMgr.displayLocation(node.locationDetails); 
                return; 
            } 
            
            let storyletToStartId = null;
            if (!node.arrivalStoryletCompleted && node.storyletOnArrival) {
                storyletToStartId = node.storyletOnArrival;
            } else if (node.locationDetails && node.locationDetails.storyletsOnExplore && node.locationDetails.storyletsOnExplore.length > 0) {
                storyletToStartId = node.locationDetails.storyletsOnExplore[0]; 
            } else if (node.storyletOnArrival && node.arrivalStoryletCompleted && node.id !== "NODE_SHATTERED_SHORE") { 
                 uiMgr.addLogEntry(`You've already contemplated the essence of ${node.name}.`, "system");
                 switchToNodeMapView(); 
                 return;
            }

            if (storyletToStartId && STORYLET_DATA_MINIMAL[storyletToStartId]) { 
                _switchToView('storylet-view'); 
                const storyletInstance = storyletMgr.startStorylet(storyletToStartId); 
                if(storyletInstance) uiMgr.displayStorylet(storyletInstance); 
                else switchToNodeMapView(); 
            } else { 
                if (!(node.id === "NODE_SHATTERED_SHORE" && node.arrivalStoryletCompleted)) { 
                    uiMgr.addLogEntry("There's nothing more of immediate note here to explore via storylet.", "system"); 
                }
                switchToNodeMapView();
            } 
        } 
    }

    function _handleLocationAction(actionId) { 
        if (isGameOver || encounterMgr.isActive()) return; 
        const locationNode = currentWorld.getNodeData(currentMapNodeId); 
        if (!locationNode || !locationNode.isSanctuary || !locationNode.locationDetails) { 
             uiMgr.addLogEntry("No specific location actions here.", "warning"); 
             return; 
        } 
        uiMgr.addLogEntry(`Location action: ${actionId}`, "action"); 
        switch (actionId) { 
            case 'rest': 
                currentPlayer.modifyIntegrity(Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity), "Sanctuary rest"); 
                currentPlayer.modifyHope(1, "Sanctuary rest"); 
                currentPlayer.modifyDespair(-1, "Sanctuary rest"); 
                uiMgr.addLogEntry("You rest. A fragile peace settles.", "system_positive"); 
                break; 
            case 'shop_intro': 
                uiMgr.addLogEntry("The Keeper offers basic Concepts for Insight. (Shop not yet implemented).", "dialogue"); 
                break; 
            case 'talk_keeper': 
                const keeperStoryletId = locationNode.locationDetails.storyletsOnExplore?.[0]; 
                if (keeperStoryletId && STORYLET_DATA_MINIMAL[keeperStoryletId]) { 
                    _switchToView('storylet-view'); 
                    const storyletInstance = storyletMgr.startStorylet(keeperStoryletId); 
                    if(storyletInstance) uiMgr.displayStorylet(storyletInstance); 
                    else switchToNodeMapView(); 
                } else { 
                    uiMgr.addLogEntry("The Keeper merely observes.", "system"); 
                } 
                break; 
            case 'view_ambition': 
                uiMgr.addLogEntry(`Your current Ambition: ${currentPlayer.ambition}`, "system"); 
                uiMgr.addJournalEntry("Ambition Focused", `I contemplate: "${currentPlayer.ambition}".`); 
                break; 
            default: 
                uiMgr.addLogEntry(`Action "${actionId}" unknown here.`, "warning"); 
                break; 
        } 
        refreshPlayerUI(); 
        _checkGameOver(); 
    }

    function _handleReturnToMapFromLocation() { 
        switchToNodeMapView(); 
    }

    function _handleStoryletChoice(choiceIndex) { 
        if (isGameOver || encounterMgr.isActive()) return; 
        storyletMgr.makeChoice(choiceIndex); 
    }

    function queueEncounter(aspectId) { 
        pendingEncounterId = aspectId; 
    }

    function startEncounterFromQueue(aspectIdToStart, previousViewBeforeStorylet) { 
        if (isGameOver || !aspectIdToStart) return; 
        _switchToView('encounter-view'); 
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewBeforeStorylet)) {} 
        else { 
            uiMgr.addLogEntry(`Failed to start queued encounter: ${aspectIdToStart}`, "error"); 
            storyletEnded(); 
        } 
    }

    function _handleEncounterCardPlay(cardId) { 
        if (isGameOver || !encounterMgr.isActive()) return; 
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; 
        if (!cardDef) return; 
        if (cardId !== "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) { 
            if (confirm("Disorientation increases Concept costs by 1 Focus this turn.\nSpend 1 Clarity to negate this effect?")) { 
                if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation(); 
            } 
        } 
        encounterMgr.playConceptCard(cardId); 
        refreshPlayerUI(); 
        _checkGameOver(); 
    }

    function _handleEncounterEndTurn() { 
        if (isGameOver || !encounterMgr.isActive()) return; 
        encounterMgr.playerEndTurn(); 
    }

    function _handleEncounterRevealTrait() { 
         if (isGameOver || !encounterMgr.isActive()) return; 
         encounterMgr.revealHiddenAspectTrait(); 
         refreshPlayerUI(); 
    }

    function returnFromEncounter(viewToRestore) { 
        if (isGameOver && currentPlayer.integrity > 0) { 
             console.warn("returnFromEncounter called while game over by other means."); 
        } else if (isGameOver && currentPlayer.integrity <= 0) { 
            return; 
        } 
        refreshPlayerUI(); 
        const node = currentWorld.getNodeData(currentMapNodeId); 
        if (viewToRestore === 'location-view' && node && node.isSanctuary) { 
             _switchToView('location-view'); 
             uiMgr.displayLocation(node.locationDetails || node);  
        } else { 
            switchToNodeMapView(); 
        } 
    } 
    
    function revealAwakeningMapConnections() { 
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT"); 
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE"); 
        if (currentViewId === 'map-view') _updateAndRenderNodeMap(); 
        uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore."); 
    }
    
    function playerRecalledName() { 
        _updateHeaderInfo(false); 
        refreshPlayerUI();
    } 
    
    function refreshPlayerUI() { 
        uiMgr.updatePlayerStats(currentPlayer.getUIData()); 
        uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions()); 
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay()); 
        uiMgr.updateActiveMemories(currentPlayer.memories); 
    }

    function _checkGameOver() { 
        if (isGameOver) return true; 
        if (currentPlayer.integrity <= 0) { 
            return true; 
        } 
        return false; 
    }

    function triggerGameOver(title, message) { 
        if (isGameOver) return; 
        isGameOver = true; 
        uiMgr.displayGameOver(title, message); 
        uiMgr.addLogEntry(`GAME OVER: ${title}`, "critical_system"); 
    }

    function triggerMentalFogEffects() { 
        uiMgr.addLogEntry("The Mental Fog thickens, treacherous and sluggish.", "world_event_negative"); 
    }

    function triggerCriticalDespairEffects() { 
        uiMgr.addLogEntry("Overwhelming Despair attracts Nightmares and distorts perception!", "world_event_critical"); 
    }

    function restartGame() { 
        console.log("Restarting game..."); 
        isGameOver = false; 
        preGameIntroActive = true; 
        pendingEncounterId = null; 
        currentMapNodeId = null; 
        uiMgr.hideModals(); 
        currentPlayer.resetForNewRun(); 
        currentWorld.resetWorld(); 
        _startGameSequence(); 
        const logEntriesEl = uiMgr.getDOMElement('logEntries'); 
        if(logEntriesEl) logEntriesEl.innerHTML = ''; 
        const journalEntriesEl = uiMgr.getDOMElement('journalEntries'); 
        if(journalEntriesEl) journalEntriesEl.innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`; 
        uiMgr.addLogEntry("A new cycle of consciousness begins...", "system_major_event"); 
    }
    
    function _setupGlobalEventListeners() {
        const continueBtn = uiMgr.getDOMElement('continueFromPrecipiceButton'); 
        if (continueBtn) continueBtn.addEventListener('click', _handleContinueFromPrecipice);

        const mapContainer = uiMgr.getDOMElement('nodeMapContainer'); 
        if (mapContainer) {
            mapContainer.addEventListener('click', (event) => { 
                const targetNodeEl = event.target.closest('.map-node.accessible'); 
                if (targetNodeEl && targetNodeEl.dataset.nodeId && !encounterMgr.isActive() && !preGameIntroActive) {
                    _navigateToNode(targetNodeEl.dataset.nodeId); 
                }
            });
        }
        
        const exploreBtn = uiMgr.getDOMElement('exploreCurrentNodeButton'); 
        if (exploreBtn) exploreBtn.addEventListener('click', _exploreCurrentNode);

        const locActionsContainer = uiMgr.getDOMElement('locationActions'); 
        if (locActionsContainer) {
            locActionsContainer.addEventListener('click', (event) => { 
                if (event.target.tagName === 'BUTTON' && event.target.dataset.action && !encounterMgr.isActive()) {
                    _handleLocationAction(event.target.dataset.action); 
                }
            });
        }
        const returnToMapBtn = uiMgr.getDOMElement('returnToMapFromLocationButton'); 
         if(returnToMapBtn) returnToMapBtn.addEventListener('click', _handleReturnToMapFromLocation);

        const storyChoicesContainer = uiMgr.getDOMElement('storyletChoices'); 
        if (storyChoicesContainer) {
            storyChoicesContainer.addEventListener('click', (event) => { 
                const storyletViewEl = uiMgr.getDOMElement('storyletView');
                if (currentViewId !== 'storylet-view' || (storyletViewEl && storyletViewEl.classList.contains('view-hidden'))) {
                    // console.warn("Storylet choice click ignored: Storylet view not active/visible."); 
                    return; 
                }
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) {
                    const button = event.target; 
                    if(button.disabled) { 
                        // console.warn("Clicked on a disabled storylet choice button."); 
                        return; 
                    }
                    const allChoiceButtons = storyChoicesContainer.querySelectorAll('button');
                    allChoiceButtons.forEach(btn => btn.disabled = true);
                    
                    _handleStoryletChoice(parseInt(event.target.dataset.choiceIndex)); 
                }
            });
        }
        
        const endTurnBtnEnc = uiMgr.getDOMElement('endTurnEncounterButton'); 
        if (endTurnBtnEnc) endTurnBtnEnc.addEventListener('click', _handleEncounterEndTurn);
        
        const revealTraitBtnEnc = uiMgr.getDOMElement('revealTraitEncounterButton'); 
        if (revealTraitBtnEnc) revealTraitBtnEnc.addEventListener('click', _handleEncounterRevealTrait);

        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards');  
        if (playerHandElemEnc) {  
            playerHandElemEnc.addEventListener('click', (event) => { 
                const cardElement = event.target.closest('.encounter-card-placeholder'); 
                if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) {
                    _handleEncounterCardPlay(cardElement.dataset.cardId); 
                }
            });  
            playerHandElemEnc.addEventListener('mouseover', (event) => { 
                const el = event.target.closest('.encounter-card-placeholder'); 
                if(el && el.dataset.cardId && typeof CONCEPT_CARD_DEFINITIONS !== 'undefined' && CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]) { 
                    const c = CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]; 
                    uiMgr.showTooltip(`<strong>${c.name}</strong> (${c.cost}F)<br><em>${c.type} - ${c.attunement}</em><br>${(c.description || "").replace(/\n/g, "<br>")}<br><small>Keywords: ${(c.keywords || []).join(', ')}</small>`, event);
                }
            });  
            playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip());  
            playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event));  
        } 
        
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton'); 
        if (viewDeckBtn) viewDeckBtn.addEventListener('click', () => uiMgr.displayFullDeck(currentPlayer.getFullDeckCardDefinitions()));
        
        const modalOverlay = uiMgr.getDOMElement('modalOverlay'); 
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => { 
                if (event.target.classList.contains('close-modal-button') || event.target === modalOverlay) {
                    uiMgr.hideModals(); 
                }
            });
        }
        const restartBtnModal = uiMgr.getDOMElement('restartGameButton'); 
        if (restartBtnModal) restartBtnModal.addEventListener('click', restartGame);
        
        const addJournalBtn = uiMgr.getDOMElement('addJournalEntryButton'); 
        if(addJournalBtn) {
            addJournalBtn.addEventListener('click', () => { 
                const note = prompt("Personal Note (max 100 chars):"); 
                if (note && note.trim() !== "") {
                    uiMgr.addJournalEntry("Personal Note", note.trim().substring(0, 100)); 
                }
            });
        }
        
        document.addEventListener('keydown', (event) => { 
            if (event.key === 'Escape') { 
                const modalOverlayEl = uiMgr.getDOMElement('modalOverlay');
                if (modalOverlayEl && !modalOverlayEl.classList.contains('view-hidden')) {
                    uiMgr.hideModals(); 
                }
            } 
        });
    }

    // Public API of Game object
    return {
        init, restartGame, triggerGameOver,
        storyletEnded, returnFromEncounter, queueEncounter, 
        revealAwakeningMapConnections, playerRecalledName,
        refreshPlayerUI, 
        switchToNodeMapView, 
        triggerMentalFogEffects, triggerCriticalDespairEffects, 
        handleTraumaOnDraw: (cardId, onDrawFunctionName) => {
            if (encounterMgr.isActive()) {
                const effectFn = EncounterManager.getConceptCardEffectFunction(onDrawFunctionName);
                if (effectFn && typeof effectFn === 'function') {
                    effectFn(CONCEPT_CARD_DEFINITIONS[cardId]); 
                    refreshPlayerUI(); 
                } else {
                    console.warn(`onDraw function ${onDrawFunctionName} for ${cardId} not found in EncounterManager.`);
                    if (cardId === "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) {
                        if (confirm("Disorientation clouds your thoughts, making Concepts cost +1 Focus this turn.\nSpend 1 Clarity to clear this effect for the turn?")) {
                            if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation();
                            refreshPlayerUI();
                        } else {
                            UIManager.addLogEntry("You endure Disorientation's effects this turn.", "player_action_negative");
                        }
                    }
                }
            } else {
                UIManager.addLogEntry(`Drew ${CONCEPT_CARD_DEFINITIONS[cardId]?.name} (Trauma) outside of encounter - effect not applied now.`, "system_warning");
            }
        },
        getCurrentPlayer: () => currentPlayer, 
        setPlayerTempFlag: (flagName, value) => { if (currentPlayer) { currentPlayer[flagName] = value; console.log(`Player flag set by Game: ${flagName} = ${value}`); } },
        getPlayerTempFlag: (flagName) => { return currentPlayer ? currentPlayer[flagName] : undefined; }
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
