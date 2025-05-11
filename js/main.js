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
        console.log("Sunless Psyche Main (v2 Awakening): Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        uiMgr.init(); // UIManager first, as others might log through it
        currentPlayer = new Player();
        currentWorld.init(); // World loads map data
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer);

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main (v2 Awakening): Initialization complete.");
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
        uiMgr.showView(viewId);
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
            if(uiMgr.getDOMElement('nodeMapContainer')) uiMgr.getDOMElement('nodeMapContainer').innerHTML = `<p class="placeholder">The way is obscured by swirling nothingness...</p>`;
            uiMgr.updateCurrentNodeInfo(null);
        }
    }

    function returnToMapView() { _switchToView('map-view'); }

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
                 _switchToView('map-view');
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
            // The "Grasp for Awareness" is now a choice within the STORY_SHORE_ARRIVAL storylet.
            if (startingNode.storyletOnArrival) {
                storyletMgr.startStorylet(startingNode.storyletOnArrival); // This is STORY_SHORE_ARRIVAL
            } else {
                console.error("NODE_SHATTERED_SHORE has no arrival storylet defined!");
                _switchToView('map-view'); 
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
            _updateAndRenderNodeMap(); 
            if (newNodeData.storyletOnArrival) {
                storyletMgr.startStorylet(newNodeData.storyletOnArrival);
            }
        }
        _checkGameOver();
    }

    function _exploreCurrentNode() {
        if (isGameOver || encounterMgr.isActive() || !currentMapNodeId) return;
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (node) {
            uiMgr.addLogEntry(`Delving into ${node.name}...`, "action");
            let storyletToStartId = node.storyletOnArrival; 
            if (node.isSanctuary && node.locationDetails) {
                uiMgr.displayLocation(node.locationDetails);
                _switchToView('location-view');
                return; 
            }
            if (storyletToStartId && STORYLET_DATA_MINIMAL[storyletToStartId]) { // Assumes STORYLET_DATA_MINIMAL global
                storyletMgr.startStorylet(storyletToStartId);
            } else {
                uiMgr.addLogEntry("There's nothing more of immediate note here.", "system");
            }
        }
    }

    function _handleLocationAction(actionId) {
        if (isGameOver || encounterMgr.isActive()) return;
        const locationNode = currentWorld.getNodeData(currentMapNodeId);
        if (!locationNode || !locationNode.isSanctuary || !locationNode.locationDetails) { uiMgr.addLogEntry("No specific location actions here.", "warning"); return; }
        uiMgr.addLogEntry(`Location action: ${actionId}`, "action");
        switch (actionId) {
            case 'rest': currentPlayer.modifyIntegrity(Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity), "Sanctuary rest"); currentPlayer.modifyHope(1, "Sanctuary rest"); currentPlayer.modifyDespair(-1, "Sanctuary rest"); uiMgr.addLogEntry("You rest. A fragile peace settles.", "system_positive"); break;
            case 'shop_intro': uiMgr.addLogEntry("The Keeper offers basic Concepts for Insight. (Shop not yet implemented).", "dialogue"); break;
            case 'talk_keeper': const keeperStoryletId = locationNode.locationDetails.storyletsOnExplore?.[0]; if (keeperStoryletId && STORYLET_DATA_MINIMAL[keeperStoryletId]) { storyletMgr.startStorylet(keeperStoryletId); } else { uiMgr.addLogEntry("The Keeper merely observes.", "system"); } break;
            case 'view_ambition': uiMgr.addLogEntry(`Your current Ambition: ${currentPlayer.ambition}`, "system"); uiMgr.addJournalEntry("Ambition Focused", `I contemplate: "${currentPlayer.ambition}".`); break;
            default: uiMgr.addLogEntry(`Action "${actionId}" unknown here.`, "warning"); break;
        }
        refreshPlayerUI(); _checkGameOver();
    }
    function _handleReturnToMapFromLocation() { _switchToView('map-view'); }
    function _handleStoryletChoice(choiceIndex) { if (isGameOver || encounterMgr.isActive()) return; storyletMgr.makeChoice(choiceIndex); }

    function queueEncounter(aspectId) { pendingEncounterId = aspectId; }
    function startEncounterFromQueue(aspectIdToStart, previousViewBeforeStorylet) {
        if (isGameOver || !aspectIdToStart) return; // Check aspectIdToStart
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewBeforeStorylet)) {}
        else { uiMgr.addLogEntry(`Failed to start queued encounter: ${aspectIdToStart}`, "error"); storyletEnded(); }
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; // Assumes CONCEPT_CARD_DEFINITIONS is global
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
    function _handleEncounterEndTurn() { if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.playerEndTurn(); }
    function _handleEncounterRevealTrait() { if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.revealHiddenAspectTrait(); refreshPlayerUI(); }

    function returnFromEncounter(viewToRestore) {
        if (isGameOver && currentPlayer.integrity > 0) { console.warn("returnFromEncounter called while game over by other means."); }
        else if (isGameOver && currentPlayer.integrity <= 0) { return; } 
        refreshPlayerUI();
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (viewToRestore === 'location-view' && node && node.isSanctuary) {
             uiMgr.displayLocation(node.locationDetails || node); _switchToView('location-view');
        } else { _switchToView('map-view'); }
    }

    function revealAwakeningMapConnections() { currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT"); currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE"); if (currentViewId === 'map-view') _updateAndRenderNodeMap(); uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore."); }
    function playerRecalledName() { _updateHeaderInfo(false); refreshPlayerUI(); } 

    function refreshPlayerUI() { uiMgr.updatePlayerStats(currentPlayer.getUIData()); uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions()); uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay()); uiMgr.updateActiveMemories(currentPlayer.memories); }
    function _checkGameOver() { if (isGameOver) return true; if (currentPlayer.integrity <= 0) { return true; } return false; }
    function triggerGameOver(title, message) { if (isGameOver) return; isGameOver = true; uiMgr.displayGameOver(title, message); uiMgr.addLogEntry(`GAME OVER: ${title}`, "critical_system"); }
    function triggerMentalFogEffects() { uiMgr.addLogEntry("The Mental Fog thickens, treacherous and sluggish.", "world_event_negative"); }
    function triggerCriticalDespairEffects() { uiMgr.addLogEntry("Overwhelming Despair attracts Nightmares and distorts perception!", "world_event_critical"); }

    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false; preGameIntroActive = true; pendingEncounterId = null; currentMapNodeId = null;
        uiMgr.hideModals();
        currentPlayer.resetForNewRun(); currentWorld.resetWorld();
        _startGameSequence();
        if(uiMgr.getDOMElement('logEntries')) uiMgr.getDOMElement('logEntries').innerHTML = ''; 
        if(uiMgr.getDOMElement('journalEntries')) uiMgr.getDOMElement('journalEntries').innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`;
        uiMgr.addLogEntry("A new cycle of consciousness begins...", "system_major_event");
    }

    function _setupGlobalEventListeners() {
        const continueBtn = uiMgr.getDOMElement('continueFromPrecipiceButton'); if (continueBtn) continueBtn.addEventListener('click', _handleContinueFromPrecipice);
        const mapContainer = uiMgr.getDOMElement('nodeMapContainer'); if (mapContainer) mapContainer.addEventListener('click', (event) => { const targetNodeEl = event.target.closest('.map-node.accessible'); if (targetNodeEl && targetNodeEl.dataset.nodeId && !encounterMgr.isActive() && !preGameIntroActive) _navigateToNode(targetNodeEl.dataset.nodeId); });
        const exploreBtn = uiMgr.getDOMElement('exploreCurrentNodeButton'); if (exploreBtn) exploreBtn.addEventListener('click', _exploreCurrentNode);
        const locActionsContainer = uiMgr.getDOMElement('locationActions'); if (locActionsContainer) locActionsContainer.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON' && event.target.dataset.action && !encounterMgr.isActive()) _handleLocationAction(event.target.dataset.action); });
        const returnToMapBtn = uiMgr.getDOMElement('returnToMapFromLocationButton'); if(returnToMapBtn) returnToMapBtn.addEventListener('click', _handleReturnToMapFromLocation);
        const storyChoicesContainer = uiMgr.getDOMElement('storyletChoices'); if (storyChoicesContainer) storyChoicesContainer.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) _handleStoryletChoice(parseInt(event.target.dataset.choiceIndex)); });
        const endTurnBtnEnc = uiMgr.getDOMElement('endTurnEncounterButton'); if (endTurnBtnEnc) endTurnBtnEnc.addEventListener('click', _handleEncounterEndTurn);
        const revealTraitBtnEnc = uiMgr.getDOMElement('revealTraitEncounterButton'); if (revealTraitBtnEnc) revealTraitBtnEnc.addEventListener('click', _handleEncounterRevealTrait);
        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards'); 
        if (playerHandElemEnc) { 
            playerHandElemEnc.addEventListener('click', (event) => { const cardElement = event.target.closest('.encounter-card-placeholder'); if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) _handleEncounterCardPlay(cardElement.dataset.cardId); }); 
            playerHandElemEnc.addEventListener('mouseover', (event) => { const el = event.target.closest('.encounter-card-placeholder'); if(el && el.dataset.cardId && CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]) { const c = CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]; uiMgr.showTooltip(`<strong>${c.name}</strong> (${c.cost}F)<br><em>${c.type} - ${c.attunement}</em><br>${(c.description || "").replace(/\n/g, "<br>")}<br><small>Keywords: ${(c.keywords || []).join(', ')}</small>`, event);}}); 
            playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip()); 
            playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event)); 
        }
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton'); if (viewDeckBtn) viewDeckBtn.addEventListener('click', () => uiMgr.displayFullDeck(currentPlayer.getFullDeckCardDefinitions()));
        const modalOverlay = uiMgr.getDOMElement('modalOverlay'); if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target.classList.contains('close-modal-button') || event.target === modalOverlay) uiMgr.hideModals(); });
        const restartBtnModal = uiMgr.getDOMElement('restartGameButton'); if (restartBtnModal) restartBtnModal.addEventListener('click', restartGame);
        const addJournalBtn = uiMgr.getDOMElement('addJournalEntryButton'); if(addJournalBtn) addJournalBtn.addEventListener('click', () => { const note = prompt("Personal Note (max 100 chars):"); if (note && note.trim() !== "") uiMgr.addJournalEntry("Personal Note", note.trim().substring(0, 100)); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (DOM.modalOverlay && !DOM.modalOverlay.classList.contains('view-hidden')) uiMgr.hideModals(); } });
    }

    return {
        init, restartGame, triggerGameOver,
        storyletEnded, returnFromEncounter, queueEncounter, 
        revealAwakeningMapConnections, playerRecalledName,
        refreshPlayerUI, 
        // switchToNodeMapView, // Internal, called via storyletEnded or direct navigation
        triggerMentalFogEffects, triggerCriticalDespairEffects, 
        handleTraumaOnDraw: (cardId, onDrawFunctionName) => { // Called by Player.drawCards
            if (encounterMgr.isActive()) { // Only handle trauma effects during encounter for now
                const effectFn = EncounterManager.getConceptCardEffectFunction(onDrawFunctionName);
                if (effectFn) {
                    effectFn(CONCEPT_CARD_DEFINITIONS[cardId]); // Pass cardDef to effect
                    refreshPlayerUI(); // Update UI after onDraw effect
                } else {
                    console.warn(`onDraw function ${onDrawFunctionName} not found in EncounterManager for ${cardId}`);
                }
                 // Specifically for Disorientation, trigger the clarity spend choice
                if (cardId === "TRM001") {
                    if (encounterMgr.canSpendClarityForDisorientation()) {
                        if (confirm("Disorientation clouds your thoughts, making Concepts cost +1 Focus this turn.\nSpend 1 Clarity to clear this effect for the turn?")) {
                            encounterMgr.spendClarityForDisorientation();
                            refreshPlayerUI();
                        } else {
                            UIManager.addLogEntry("You choose to endure Disorientation's effects this turn.", "player_action_negative");
                        }
                    }
                }
            }
        },
        // For card effects needing to call game-level actions or access other managers safely
        // Example:
        // worldActionFromCardEffect: (action, params) => { if (action === "revealNode") currentWorld.revealNodeConnection(params.from, params.to); }
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
