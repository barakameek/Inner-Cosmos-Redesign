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
    let currentMapNodeId = null; // Player's current node ID on the map

    // --- Initialization ---
    function init() {
        console.log("Sunless Psyche Main (v2 Awakening): Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        uiMgr.init();
        currentPlayer = new Player(); // Initializes with Awakening stats/deck
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer);
        currentWorld.init(); // Loads NODE_MAP_DATA

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main (v2 Awakening): Initialization complete.");
    }

    function _startGameSequence() {
        currentMapNodeId = null; // Not yet on the map proper
        refreshPlayerUI();
        _updateHeaderInfo(true); // True for intro state header
        uiMgr.startPreGameIntro(); // Starts timed text, shows button eventually
    }

    function _updateHeaderInfo(isPreRecall = false) {
        if (isPreRecall) {
            _setText(uiMgr.getDOMElement('psychonautNameDisplay'), "The Unknowing");
            _setText(uiMgr.getDOMElement('currentAmbitionDisplay'), "To Simply Be");
        } else {
            _setText(uiMgr.getDOMElement('psychonautNameDisplay'), currentPlayer.name || CONFIG.INITIAL_PSYCHONAUT_NAME);
            _setText(uiMgr.getDOMElement('currentAmbitionDisplay'), currentPlayer.ambition || CONFIG.INITIAL_AMBITION_TEXT);
        }
    }
    // Helper for _setText as UIManager._setText is private
    function _setText(element, text) { if (element) element.textContent = text; }


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
            uiMgr.getDOMElement('nodeMapContainer').innerHTML = `<p class="placeholder">The way is obscured by swirling nothingness...</p>`;
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
        // Note: player.name updates after "Echo of a Name" is played.

        const startingNode = currentWorld.placePlayerAtNode("NODE_SHATTERED_SHORE");
        if (startingNode) {
            currentMapNodeId = startingNode.id;
            uiMgr.addLogEntry("Consciousness coalesces... You are on The Shattered Shore.", "system_major_event");
            if (startingNode.storyletOnArrival) {
                storyletMgr.startStorylet(startingNode.storyletOnArrival); // This is STORY_SHORE_ARRIVAL
            } else {
                console.error("NODE_SHATTERED_SHORE has no arrival storylet!");
                _switchToView('map-view');
            }
        } else {
            console.error("CRITICAL: Failed to place player at NODE_SHATTERED_SHORE!");
            uiMgr.addLogEntry("The void consumes all attempts to form. (Error: Start node missing)", "critical_system");
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
            let storyletToStartId = node.storyletOnArrival; // Default, could be more complex
            // TODO: Add logic for 'storyletsOnExplore' or if arrival storylet was already done
            if (node.isSanctuary && node.locationDetails) {
                uiMgr.displayLocation(node.locationDetails);
                _switchToView('location-view');
                return;
            }
            if (storyletToStartId && STORYLET_DATA_MINIMAL[storyletToStartId]) {
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
            case 'view_ambition': uiMgr.addLogEntry(`Ambition: ${currentPlayer.ambition}`, "system"); uiMgr.addJournalEntry("Ambition Focused", `I contemplate: "${currentPlayer.ambition}".`); break;
            default: uiMgr.addLogEntry(`Action "${actionId}" unknown here.`, "warning"); break;
        }
        refreshPlayerUI(); _checkGameOver();
    }
    function _handleReturnToMapFromLocation() { _switchToView('map-view'); }
    function _handleStoryletChoice(choiceIndex) { if (isGameOver || encounterMgr.isActive()) return; storyletMgr.makeChoice(choiceIndex); /* storyletEnded orchestrates next step */ }

    function queueEncounter(aspectId) { pendingEncounterId = aspectId; }
    function startEncounterFromQueue(aspectIdToStart, previousViewBeforeStorylet) {
        if (isGameOver) return;
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewBeforeStorylet)) { /* UI switch handled by encounterMgr via UIManager */ }
        else { uiMgr.addLogEntry(`Failed to start encounter: ${aspectIdToStart}`, "error"); storyletEnded(); } // Recover
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) return;

        if (cardId !== "TRM001" && encounterMgr.canSpendClarityForDisorientation()) {
            if (confirm("Disorientation increases Concept costs by 1 Focus this turn.\nSpend 1 Clarity to negate this effect?")) {
                encounterMgr.spendClarityForDisorientation(); // This updates player Clarity and sets flag
            }
        }
        encounterMgr.playConceptCard(cardId); // This deducts focus, plays card, updates UI, checks win/loss
        refreshPlayerUI(); // Refresh player stats just in case (focus, integrity if damaged)
        _checkGameOver(); // Final integrity check
    }
    function _handleEncounterEndTurn() { if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.playerEndTurn(); }
    function _handleEncounterRevealTrait() { if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.revealHiddenAspectTrait(); refreshPlayerUI(); }

    function returnFromEncounter(viewToRestore) {
        if (isGameOver && currentPlayer.integrity > 0) { console.warn("returnFromEncounter called while game over by other means."); }
        else if (isGameOver && currentPlayer.integrity <= 0) { return; } // Game over already handled
        refreshPlayerUI();
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (viewToRestore === 'location-view' && node && node.isSanctuary) {
             uiMgr.displayLocation(node.locationDetails || node); _switchToView('location-view');
        } else { _switchToView('map-view'); }
    }

    function revealAwakeningMapConnections() { currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT"); currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE"); if (currentViewId === 'map-view') _updateAndRenderNodeMap(); uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore."); }
    function playerRecalledName() { _updateHeaderInfo(false); refreshPlayerUI(); } // player.name is set in card effect

    function refreshPlayerUI() { uiMgr.updatePlayerStats(currentPlayer.getUIData()); uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions()); uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay()); uiMgr.updateActiveMemories(currentPlayer.memories); }
    function _checkGameOver() { if (isGameOver) return true; if (currentPlayer.integrity <= 0) { return true; } return false; }
    function triggerGameOver(title, message) { if (isGameOver) return; isGameOver = true; uiMgr.displayGameOver(title, message); uiMgr.addLogEntry(`GAME OVER: ${title}`, "critical_system"); }
    function triggerMentalFogEffects() { uiMgr.addLogEntry("The Mental Fog thickens, making navigation treacherous and thoughts sluggish.", "world_event_negative"); /* Add other effects: e.g. chance for random trauma, reduced focus regen */ }
    function triggerCriticalDespairEffects() { uiMgr.addLogEntry("Overwhelming Despair attracts Nightmare Aspects and distorts perception!", "world_event_critical"); /* Add other effects: e.g. spawn nightmare aspect, visual distortions */ }


    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false; preGameIntroActive = true; pendingEncounterId = null; currentMapNodeId = null;
        uiMgr.hideModals();
        currentPlayer.resetForNewRun(); currentWorld.resetWorld();
        _startGameSequence();
        uiMgr.getDOMElement('logEntries').innerHTML = ''; uiMgr.getDOMElement('journalEntries').innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`;
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
        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards'); if (playerHandElemEnc) { playerHandElemEnc.addEventListener('click', (event) => { const cardElement = event.target.closest('.encounter-card-placeholder'); if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) _handleEncounterCardPlay(cardElement.dataset.cardId); }); playerHandElemEnc.addEventListener('mouseover', (event) => { const cardElement = event.target.closest('.encounter-card-placeholder'); if (cardElement && cardElement.dataset.cardId) { const cardDef = CONCEPT_CARD_DEFINITIONS[cardElement.dataset.cardId]; if (cardDef) { const tooltipContent = `<strong>${cardDef.name}</strong> (${cardDef.cost}F)<br><em>${cardDef.type} - ${cardDef.attunement}</em><br>${(cardDef.description || "").replace(/\n/g, "<br>")}<br><small>Keywords: ${(cardDef.keywords || []).join(', ')}</small>`; uiMgr.showTooltip(tooltipContent, event); } } }); playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip()); playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event)); }
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton'); if (viewDeckBtn) viewDeckBtn.addEventListener('click', () => uiMgr.displayFullDeck(currentPlayer.getFullDeckCardDefinitions()));
        const modalOverlay = uiMgr.getDOMElement('modalOverlay'); if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target.classList.contains('close-modal-button') || event.target === modalOverlay) uiMgr.hideModals(); });
        const restartBtnModal = uiMgr.getDOMElement('restartGameButton'); if (restartBtnModal) restartBtnModal.addEventListener('click', restartGame);
        const addJournalBtn = uiMgr.getDOMElement('addJournalEntryButton'); if(addJournalBtn) addJournalBtn.addEventListener('click', () => { const note = prompt("Personal Note (max 100 chars):"); if (note && note.trim() !== "") uiMgr.addJournalEntry("Personal Note", note.trim().substring(0, 100)); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!uiMgr.getDOMElement('modalOverlay').classList.contains('view-hidden')) uiMgr.hideModals(); } });
    }

    return {
        init, restartGame, triggerGameOver,
        storyletEnded, returnFromEncounter, queueEncounter, // Removed startEncounterFromQueue as it's internal
        revealAwakeningMapConnections, playerRecalledName,
        refreshPlayerUI, switchToNodeMapView, // Exposed for StoryletManager outcomes
        triggerMentalFogEffects, triggerCriticalDespairEffects, // For Player class
        handleDisorientationDraw: () => { // Called when Player.drawCards detects Disorientation
            if (encounterMgr.isActive() && encounterMgr.canSpendClarityForDisorientation()) {
                 // For now, auto-prompt. Could be delayed or part of player turn UI.
                if (confirm("Disorientation clouds your thoughts, making Concepts cost +1 Focus this turn.\nSpend 1 Clarity to clear this effect for the turn?")) {
                    encounterMgr.spendClarityForDisorientation();
                    refreshPlayerUI();
                } else {
                    UIManager.addLogEntry("You choose to endure the Disorientation's effects this turn.", "player_action_negative");
                }
            }
        },
        // Expose for card effects if needed (effects should ideally be in EncounterManager)
        // getConceptCardEffectFunction: (name) => EncounterManager.getConceptCardEffectFunction(name),
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
