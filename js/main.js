// js/main.js

const Game = (() => {

    let currentPlayer = null;
    let currentWorld = null; 
    let uiMgr = null;      
    let storyletMgr = null; 
    let encounterMgr = null; 

    let currentViewId = 'pre-game-intro-view';
    let isGameOver = false;
    let preGameIntroActive = true;
    let pendingEncounterId = null;
    let currentMapNodeId = null; 

    function init() {
        console.log("Sunless Psyche Main (v2.1 Awakening - Final Full Corrected): Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        // Assign module shortcuts AFTER they are defined globally by their respective IIFEs
        // This depends on script load order in index.html
        uiMgr = UIManager;    
        currentWorld = World; 
        storyletMgr = StoryletManager; 
        encounterMgr = EncounterManager; 

        uiMgr.init(); 
        currentPlayer = new Player();
        currentWorld.init(); 
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer); 

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main (v2.1 Awakening - Final Full Corrected): Initialization complete.");
    }

    function _startGameSequence() {
        currentMapNodeId = null; 
        refreshPlayerUI(); // Update with initial low stats from Player constructor
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
        // console.log(`Main: Switching view to: ${viewId}`); // Can be noisy, enable for debug
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
            // Update reflect insights button based on hand
            const reflectBtn = uiMgr.getDOMElement('reflectInsightsButton');
            if(reflectBtn) {
                const hasPlayableInsight = currentPlayer.hand.some(cardId => {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                    return cardDef && cardDef.type === "Insight" && (cardId === "AWK002" || cardId === "AWK003" || cardId === "AWK004"); // Example condition
                });
                if(hasPlayableInsight) reflectBtn.classList.remove('view-hidden');
                else reflectBtn.classList.add('view-hidden');
            }

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
                // If storylet ended in a location view (e.g. talking to keeper), re-display location
                _switchToView('location-view'); 
                uiMgr.displayLocation(currentNode.locationDetails || currentNode); 
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
            notify("Consciousness coalesces... You are on The Shattered Shore.", "system_major_event");
            
            // console.log("Player hand JUST BEFORE STORY_SHORE_ARRIVAL storylet is started (in main.js):", JSON.stringify(currentPlayer.hand));

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
            notify("The void remains absolute. (Error: Start node missing)", "critical_system");
        }
    }

    function _navigateToNode(targetNodeId) { 
        if (isGameOver || encounterMgr.isActive()) return; 
        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer); 
        if (newNodeData) { 
            currentMapNodeId = newNodeData.id; 
            refreshPlayerUI(); 
            
            let storyletToStart = null;
            // Only trigger arrival storylet if it hasn't been completed
            if (!newNodeData.arrivalStoryletCompleted && newNodeData.storyletOnArrival) {
                storyletToStart = newNodeData.storyletOnArrival;
            }

            if (storyletToStart) { 
                _switchToView('storylet-view'); 
                const storyletInstance = storyletMgr.startStorylet(storyletToStart); 
                if(storyletInstance) uiMgr.displayStorylet(storyletInstance); 
                else switchToNodeMapView(); 
            } else { 
                switchToNodeMapView(); // No new arrival storylet, just show the map at new location
            } 
        } 
        _checkGameOver(); 
    }

    function _exploreCurrentNode() { 
        if (isGameOver || encounterMgr.isActive() || !currentMapNodeId) return; 
        const node = currentWorld.getNodeData(currentMapNodeId); 
        if (node) { 
            notify(`Delving into ${node.name}...`, "action"); 

            if (node.id === "NODE_SHATTERED_SHORE" && node.arrivalStoryletCompleted) {
                let awakeningCardIdToPlay = null;
                if (currentPlayer.hand.includes("AWK002")) awakeningCardIdToPlay = "AWK002";
                else if (currentPlayer.hand.includes("AWK003")) awakeningCardIdToPlay = "AWK003";
                else if (currentPlayer.hand.includes("AWK004")) awakeningCardIdToPlay = "AWK004";

                if (awakeningCardIdToPlay) {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[awakeningCardIdToPlay];
                    notify(`You focus on the lingering insight: "${cardDef.name}"...`, "player_action_major");

                    if (currentPlayer.spendFocusForCard(cardDef.cost, cardDef.name)) {
                        currentPlayer.playCardFromHand(cardDef.id); 
                        const effectFn = EncounterManager.getConceptCardEffectFunction(cardDef.effectFunctionName);
                        if (effectFn) {
                            effectFn(cardDef); 
                        } else {
                            console.error(`No effect function found for ${cardDef.effectFunctionName}`);
                            notify(`The insight of "${cardDef.name}" remains elusive.`, "warning");
                        }
                        refreshPlayerUI(); 

                        if (currentPlayer.awakeningDeck.length > 0) {
                            const nextAwakeningCardId = currentPlayer.drawFromAwakeningDeck();
                            if (nextAwakeningCardId) {
                                refreshPlayerUI(); 
                                notify("Another fragmented thought surfaces...", "discovery");
                                notify(`Hint: Consider exploring "${node.name}" again to process new insights.`, "tutorial_hint");
                            }
                        } else if (currentPlayer.awakeningDeck.length === 0 && !currentPlayer.hand.some(id => id.startsWith("AWK"))) {
                            notify("The initial flood of fractured insights subsides. The way forward is slightly clearer.", "system_positive_strong");
                            if(currentViewId === 'map-view') _updateAndRenderNodeMap();
                        }
                    }
                    if (currentViewId !== 'map-view') switchToNodeMapView(); 
                    return; 
                }
                notify(`You've processed all current insights from ${node.name}.`, "system");
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
                 notify(`You've already contemplated the essence of ${node.name}.`, "system");
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
                    notify("There's nothing more of immediate note here to explore via storylet.", "system"); 
                }
                switchToNodeMapView();
            } 
        } 
    }

    function _handleLocationAction(actionId) { 
        if (isGameOver || encounterMgr.isActive()) return; 
        const locationNode = currentWorld.getNodeData(currentMapNodeId); 
        if (!locationNode || !locationNode.isSanctuary || !locationNode.locationDetails) { 
             notify("No specific location actions here.", "warning"); 
             return; 
        } 
        notify(`Location action: ${actionId}`, "action"); 
        switch (actionId) { 
            case 'rest': 
                currentPlayer.modifyIntegrity(Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity), "Sanctuary rest"); 
                currentPlayer.modifyHope(1, "Sanctuary rest"); 
                currentPlayer.modifyDespair(-1, "Sanctuary rest"); 
                currentPlayer.modifyClarity(2, "Sanctuary respite"); // Added Clarity on rest
                notify("You rest within the Sanctum. A fragile peace settles, and your mind clears somewhat.", "system_positive_strong"); 
                break; 
            case 'shop_intro': 
                notify("The Keeper offers basic Concepts for Insight. (Shop not yet implemented).", "dialogue"); 
                break; 
            case 'talk_keeper': 
                const keeperStoryletId = locationNode.locationDetails.storyletsOnExplore?.[0]; 
                if (keeperStoryletId && STORYLET_DATA_MINIMAL[keeperStoryletId]) { 
                    _switchToView('storylet-view'); 
                    const storyletInstance = storyletMgr.startStorylet(keeperStoryletId); 
                    if(storyletInstance) uiMgr.displayStorylet(storyletInstance); 
                    else switchToNodeMapView(); 
                } else { 
                    notify("The Keeper merely observes.", "system"); 
                } 
                break; 
            case 'view_ambition': 
                notify(`Your current Ambition: ${currentPlayer.ambition}`, "system"); 
                addJournalEntry("Ambition Focused", `I contemplate my Ambition: "${currentPlayer.ambition}".`); 
                break; 
            default: 
                notify(`Action "${actionId}" unknown here.`, "warning"); 
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
            notify(`Failed to start queued encounter: ${aspectIdToStart}`, "error"); 
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
        addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore."); 
    }
    
    function playerRecalledName() { 
        _updateHeaderInfo(false); 
        refreshPlayerUI();
    } 
    
    function refreshPlayerUI() { 
        uiMgr.updateDashboardVitals(currentPlayer.getUIData()); // UPDATED to new UIManager function
        // Hand for encounter is updated by EncounterManager. For map reflection, use a modal.
        // uiMgr.updateDeckInfo in UIManager no longer exists, that info is in modals.
        // For now, we don't have a persistent deck/hand display outside of modals/encounter.
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
        notify(`GAME OVER: ${title}`, "critical_system"); 
    }

    function triggerMentalFogEffects() { 
        notify("The Mental Fog thickens, treacherous and sluggish.", "world_event_negative"); 
    }

    function triggerCriticalDespairEffects() { 
        notify("Overwhelming Despair attracts Nightmares and distorts perception!", "world_event_critical"); 
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
        const logEntriesEl = uiMgr.getDOMElement('eventLogNotificationsContainer'); // Target new container
        if(logEntriesEl) logEntriesEl.innerHTML = ''; // Clear old notifications
        const journalEntriesEl = uiMgr.getDOMElement('journalEntriesModal'); // Target modal journal
        if(journalEntriesEl) journalEntriesEl.innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`; 
        notify("A new cycle of consciousness begins...", "system_major_event"); 
    }

    // --- UI Event Log Proxy & Journal ---
    function notify(message, type = "normal") {
        // This function will now be the primary way game logic sends messages to the player
        // It uses the UIManager's new notification system
        if (uiMgr && uiMgr.addEventLogNotification) {
            uiMgr.addEventLogNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`); // Fallback if UIManager or function is missing
        }
    }
    function addJournalEntry(title, text) {
        // This can be called by various game events to add to the persistent journal
        // The UIManager will handle displaying it in the journal modal.
        if (uiMgr && uiMgr.addJournalEntry) { // Check if UIManager itself is loaded
            uiMgr.addJournalEntry(title, text); // UIManager.addJournalEntry is for the *data* part
        }
        // We also want a notification that a journal entry was added.
        notify(`Journal Updated: "${title}"`, "discovery");
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

        // Reflect Insights button on map
        const reflectBtn = uiMgr.getDOMElement('reflectInsightsButton');
        if (reflectBtn) {
            reflectBtn.addEventListener('click', () => {
                if (encounterMgr.isActive() || preGameIntroActive) return;
                const playableInsights = currentPlayer.hand.filter(cardId => {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                    // Define which cards are playable insights outside combat (e.g., AWK002, AWK003, AWK004)
                    return cardDef && cardDef.type === "Insight" || (cardDef && cardDef.id.startsWith("AWK") && cardDef.id !== "AWK001");
                }).map(cardId => CONCEPT_CARD_DEFINITIONS[cardId]);

                if (playableInsights.length > 0) {
                    uiMgr.displayReflectInsightsModal(playableInsights);
                } else {
                    notify("No pressing insights to reflect upon from your current hand.", "system");
                }
            });
        }
        // Event listener for dynamically created buttons in Reflect Insights Modal
        const playableInsightsListEl = uiMgr.getDOMElement('playableInsightsList');
        if(playableInsightsListEl){
            playableInsightsListEl.addEventListener('click', (event) => {
                const cardButton = event.target.closest('button');
                if(cardButton && cardButton.dataset.cardId) {
                    const cardId = cardButton.dataset.cardId;
                    const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
                    uiMgr.hideModals(); // Close modal first
                    notify(`You focus on the insight: "${cardDef.name}"...`, "player_action_major");
                    if (currentPlayer.spendFocusForCard(cardDef.cost, cardDef.name)) {
                        currentPlayer.playCardFromHand(cardDef.id);
                        const effectFn = EncounterManager.getConceptCardEffectFunction(cardDef.effectFunctionName);
                        if (effectFn) { effectFn(cardDef); }
                        else { console.error(`No effect function for ${cardDef.effectFunctionName}`); }
                        refreshPlayerUI();
                        // Check if more awakening cards need to be drawn
                        if (currentPlayer.awakeningDeck.length > 0 && cardDef.id.startsWith("AWK")) {
                           const nextAwakeningCardId = currentPlayer.drawFromAwakeningDeck();
                            if (nextAwakeningCardId) {
                                refreshPlayerUI(); 
                                notify("Another fragmented thought surfaces...", "discovery");
                            }
                        } else if (currentPlayer.awakeningDeck.length === 0 && !currentPlayer.hand.some(id => id.startsWith("AWK"))) {
                             notify("The initial flood of fractured insights subsides.", "system_positive_strong");
                             if(currentViewId === 'map-view') _updateAndRenderNodeMap(); // Update reflect button visibility
                        }

                    } else {
                        notify(`Not enough Focus to process "${cardDef.name}".`, "warning");
                    }
                }
            });
        }


        const locActionsContainer = uiMgr.getDOMElement('locationActionsMain'); 
        if (locActionsContainer) {
            locActionsContainer.addEventListener('click', (event) => { 
                if (event.target.tagName === 'BUTTON' && event.target.dataset.action && !encounterMgr.isActive()) {
                    _handleLocationAction(event.target.dataset.action); 
                }
            });
        }
        const returnToMapBtn = uiMgr.getDOMElement('returnToMapFromLocationMainButton'); 
         if(returnToMapBtn) returnToMapBtn.addEventListener('click', _handleReturnToMapFromLocation);

        const storyChoicesContainer = uiMgr.getDOMElement('storyletChoicesMain'); 
        if (storyChoicesContainer) {
            storyChoicesContainer.addEventListener('click', (event) => { 
                const storyletViewEl = uiMgr.getDOMElement('storyletView');
                if (currentViewId !== 'storylet-view' || (storyletViewEl && storyletViewEl.classList.contains('view-hidden'))) {
                    return; 
                }
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) {
                    const button = event.target; 
                    if(button.disabled) { return; }
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

        const playerHandElemEnc = uiMgr.getDOMElement('playerHandEncounterOverlay');  
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
        
        // Dashboard Buttons
        const journalBtn = uiMgr.getDOMElement('dashboardJournalButton');
        if(journalBtn) journalBtn.addEventListener('click', () => {
            // Assuming journal entries are stored somewhere accessible, e.g., Game.getJournalEntries()
            // For now, let's imagine a simple array of strings or {title, text} objects in Game or Player
            const entries = currentPlayer.journalEntries || [{title:"First Entry", text:"The pages are worn, details indistinct..."}]; // Placeholder
            uiMgr.displayJournalModal(entries);
        });
        const statusBtn = uiMgr.getDOMElement('dashboardStatusButton');
        if(statusBtn) statusBtn.addEventListener('click', () => {
            uiMgr.updateStatusModal(currentPlayer.getUIData()); // Pass all player data
            uiMgr.showModal('status-modal'); // UIManager method to show the specific modal by ID
        });
        const conceptsBtn = uiMgr.getDOMElement('dashboardConceptsButton');
        if(conceptsBtn) conceptsBtn.addEventListener('click', () => {
            const deckInfo = {
                deck: currentPlayer.deck.length,
                hand: currentPlayer.hand.length,
                discard: currentPlayer.discardPile.length,
                traumas: currentPlayer.getTraumaCountInPlay()
            };
            uiMgr.displayConceptsModal(deckInfo, currentPlayer.getFullDeckCardDefinitions());
        });

        // Modal Close Buttons (using event delegation on the overlay)
        const modalOverlay = uiMgr.getDOMElement('modalOverlayFullscreen'); 
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => { 
                if (event.target.classList.contains('close-fullscreen-modal-button') || event.target === modalOverlay) { // Click on X or outside content
                    uiMgr.hideModals(); 
                }
            });
        }
        const restartBtnModal = uiMgr.getDOMElement('restartGameModalButton'); 
        if (restartBtnModal) restartBtnModal.addEventListener('click', restartGame);
        
        const addJournalBtnModal = uiMgr.getDOMElement('addJournalEntryModalButton'); 
        if(addJournalBtnModal) {
            addJournalBtnModal.addEventListener('click', () => { 
                const note = prompt("Personal Note (max 100 chars):"); 
                if (note && note.trim() !== "") {
                    // This should add to a player's journal data structure, then refresh the modal view.
                    // For now, just a UIManager call:
                    addJournalEntry("Personal Note", note.trim().substring(0, 100)); // Game.addJournalEntry now uses notify
                    // To refresh the modal if it's open:
                    if(!uiMgr.getDOMElement('journalModal').classList.contains('view-hidden')){
                        const entries = currentPlayer.journalEntries || [{title:"First Entry", text:"The pages are worn, details indistinct..."}];
                        uiMgr.displayJournalModal(entries); // Re-display with new entry
                    }
                }
            });
        }
        
        document.addEventListener('keydown', (event) => { 
            if (event.key === 'Escape') { 
                const modalOverlayEl = uiMgr.getDOMElement('modalOverlayFullscreen');
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
        handleTraumaOnDraw: (cardId, onDrawFunctionName) => { /* ... (Identical to previous full main.js) ... */ if (encounterMgr.isActive()) { const effectFn = EncounterManager.getConceptCardEffectFunction(onDrawFunctionName); if (effectFn && typeof effectFn === 'function') { effectFn(CONCEPT_CARD_DEFINITIONS[cardId]); refreshPlayerUI(); } else { console.warn(`onDraw function ${onDrawFunctionName} for ${cardId} not found in EncounterManager.`); if (cardId === "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) { if (confirm("Disorientation clouds your thoughts, making Concepts cost +1 Focus this turn.\nSpend 1 Clarity to clear this effect for the turn?")) { if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation(); refreshPlayerUI(); } else { notify("You endure Disorientation's effects this turn.", "player_action_negative"); } } } } else { notify(`Drew ${CONCEPT_CARD_DEFINITIONS[cardId]?.name} (Trauma) outside of encounter - effect not applied now.`, "system_warning"); } },
        getCurrentPlayer: () => currentPlayer, 
        setPlayerTempFlag: (flagName, value) => { if (currentPlayer) { currentPlayer[flagName] = value; /* console.log(`Player flag set by Game: ${flagName} = ${value}`); */ } }, // Quieter log
        getPlayerTempFlag: (flagName) => { return currentPlayer ? currentPlayer[flagName] : undefined; },
        notify, // Expose the notify function
        addJournalEntry, // Expose for storylet outcomes etc.
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
