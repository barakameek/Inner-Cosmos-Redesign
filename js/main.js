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
    let currentMapNodeId = null; // To keep track of player's position on the node map

    function init() {
        console.log("Sunless Psyche Main: Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        uiMgr.init();
        currentPlayer = new Player();
        // Pass Game object itself or specific callbacks to modules if they need to call back into Main
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer); // EncounterManager gets player ref
        currentWorld.init(); // World init now sets up node map internally

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main: Initialization complete.");
    }

    function _startGameSequence() {
        currentMapNodeId = null; // Not on the map yet
        refreshPlayerUI(); // Update with initial low stats
        _updateHeaderInfo(true); // Intro headers

        uiMgr.startPreGameIntro(); // Starts timed text display
        // Event listener on "continue-from-precipice" button will trigger _handleContinueFromPrecipice
    }

    function _updateHeaderInfo(isIntro = false) {
        if (isIntro) {
            uiMgr.getDOMElement('psychonautNameDisplay').textContent = "The Unknowing";
            uiMgr.getDOMElement('currentAmbitionDisplay').textContent = "To Simply Be";
        } else {
            uiMgr.getDOMElement('psychonautNameDisplay').textContent = currentPlayer.name || CONFIG.INITIAL_PSYCHONAUT_NAME;
            uiMgr.getDOMElement('currentAmbitionDisplay').textContent = currentPlayer.ambition || CONFIG.INITIAL_AMBITION_TEXT;
        }
    }

    function _switchToView(viewId) {
        console.log(`Switching view to: ${viewId}`);
        currentViewId = viewId;
        uiMgr.showView(viewId);
        if (viewId === 'map-view') {
            _updateAndRenderNodeMap();
        }
    }

    function _updateAndRenderNodeMap() {
        if (currentMapNodeId) { // Ensure player is on a node
            const currentNode = currentWorld.getNodeData(currentMapNodeId);
            const allNodes = currentWorld.getAllNodes();
            const accessibleNodeIds = currentWorld.getAccessibleNodeIds(currentMapNodeId); // Pass current node for context
            uiMgr.renderNodeMap(allNodes, currentMapNodeId, accessibleNodeIds);
            uiMgr.updateCurrentNodeInfo(currentNode);
        } else {
            console.warn("Attempted to render node map, but currentMapNodeId is not set.");
            // uiMgr.renderNodeMap({}, null, []); // Render an empty map or placeholder
            uiMgr.getDOMElement('nodeMapContainer').innerHTML = `<p class="placeholder">The way is obscured...</p>`;
            uiMgr.updateCurrentNodeInfo(null);
        }
    }

    function returnToMapView() {
        _switchToView('map-view');
    }

    function storyletEnded() {
        if (isGameOver) return;
        refreshPlayerUI(); // Update all player stats, deck info, memories

        if (pendingEncounterId) {
            const encounterToStart = pendingEncounterId;
            pendingEncounterId = null; // Clear before starting
            startEncounterFromQueue(encounterToStart, currentViewId); // Pass current view for return
        } else {
            // After a storylet, generally return to the map view of the current node
            // unless the storylet specifically navigated or is part of a complex location view
            const currentNode = currentWorld.getNodeData(currentMapNodeId);
            if (currentViewId === 'location-view' && currentNode && currentNode.isSanctuary) {
                // If we were in a location view (e.g. sanctuary) and a storylet ended, refresh that location view.
                uiMgr.displayLocation(currentNode.locationDetails || currentNode);
                _switchToView('location-view');
            } else {
                 _switchToView('map-view');
            }
        }
        _checkGameOver();
    }

    // --- Intro Sequence Logic ---
    function _handleContinueFromPrecipice() {
        if (!preGameIntroActive) return;
        preGameIntroActive = false;
        uiMgr.clearPreGameIntroTimeout();

        // Player isn't "navigating" yet, they are *arriving* at the first node.
        // World.init() already set the start node in config, but let's confirm.
        // The first "action" is conceptual arrival and then the storylet.
        currentMapNodeId = "NODE_SHATTERED_SHORE"; // Explicitly set current node
        const shoreNode = currentWorld.getNodeData(currentMapNodeId);

        if (shoreNode) {
            uiMgr.addLogEntry("Consciousness flickers... you find yourself on The Shattered Shore.", "system_major_event");
            // The "Grasp for Awareness" is now a choice within the STORY_SHORE_ARRIVAL storylet.
            if (shoreNode.storyletOnArrival) {
                storyletMgr.startStorylet(shoreNode.storyletOnArrival);
            } else {
                console.error("NODE_SHATTERED_SHORE has no arrival storylet defined!");
                _switchToView('map-view'); // Fallback
            }
        } else {
            console.error("CRITICAL: NODE_SHATTERED_SHORE data not found after intro!");
            uiMgr.addLogEntry("The void remains absolute. (Error: Start node missing)", "critical_system");
        }
        // Header will update fully after "Echo of a Name" is played via its outcome.
    }

    // --- Navigation & Location Interaction ---
    function _navigateToNode(targetNodeId) {
        if (isGameOver || encounterMgr.isActive()) return;

        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer);
        if (newNodeData) {
            currentMapNodeId = newNodeData.id; // Update main game's track of current node
            refreshPlayerUI(); // For Clarity cost & any other stat changes
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
            let storyletToStart = node.storyletOnArrival; // Default to arrival storylet if not played
            // More complex logic could be: if arrival storylet already done, check for storyletsOnExplore

            if (node.isSanctuary && node.locationDetails) {
                // For Sanctuaries, directly show location view with its actions
                uiMgr.displayLocation(node.locationDetails);
                _switchToView('location-view');
                return; // Don't auto-start another storylet if it's a complex location screen
            }

            if (storyletToStart && STORYLET_DATA_MINIMAL[storyletToStart]) {
                storyletMgr.startStorylet(storyletToStart);
            } else {
                uiMgr.addLogEntry("There's nothing more of immediate note here to explore via storylet.", "system");
            }
        }
    }

    function _handleLocationAction(actionId) { // For Sanctuary-like locations from location-view
        if (isGameOver || encounterMgr.isActive()) return;
        const currentNode = currentWorld.getNodeData(currentMapNodeId);
        if (!currentNode || !currentNode.isSanctuary || !currentNode.locationDetails) {
             uiMgr.addLogEntry("No specific location actions available here.", "warning");
             return;
        }
        uiMgr.addLogEntry(`Location action: ${actionId}`, "action");

        switch (actionId) {
            case 'rest':
                const integrityHealed = Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity);
                currentPlayer.modifyIntegrity(integrityHealed, "Sanctuary rest");
                currentPlayer.modifyHope(1, "Sanctuary rest");
                currentPlayer.modifyDespair(-1, "Sanctuary rest");
                uiMgr.addLogEntry("You rest within the Sanctum. A fragile peace settles.", "system_positive");
                break;
            case 'shop_intro':
                uiMgr.addLogEntry("The Keeper offers a few basic Concepts for your Insight, should you find any. (Shop not yet implemented).", "dialogue");
                break;
            case 'talk_keeper':
                const keeperStoryletId = currentNode.locationDetails.storyletsOnExplore?.[0]; // Assume first is talk
                if (keeperStoryletId && STORYLET_DATA_MINIMAL[keeperStoryletId]) {
                    storyletMgr.startStorylet(keeperStoryletId);
                } else {
                     uiMgr.addLogEntry("The Keeper merely observes you in silence.", "system");
                }
                break;
            case 'view_ambition':
                uiMgr.addLogEntry(`Your current Ambition: ${currentPlayer.ambition}`, "system");
                uiMgr.addJournalEntry("Ambition Focused", `I contemplate my Ambition: "${currentPlayer.ambition}".`);
                break;
            default:
                uiMgr.addLogEntry(`Action "${actionId}" is not specifically handled for this location.`, "warning");
                break;
        }
        refreshPlayerUI();
        _checkGameOver();
    }

    function _handleReturnToMapFromLocation() {
        _switchToView('map-view');
    }

    function _handleStoryletChoice(choiceIndex) {
        if (isGameOver || encounterMgr.isActive()) return;
        storyletMgr.makeChoice(choiceIndex);
        // storyletEnded() will be called by StoryletManager, which then handles UI updates & next view.
    }

    // --- Encounter Orchestration ---
    function queueEncounter(aspectId) {
        pendingEncounterId = aspectId;
        // The actual start will happen in storyletEnded() or similar transition point
    }

    function startEncounterFromQueue(aspectIdToStart, previousViewIdBeforeStorylet) {
        if (isGameOver) return;
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewIdBeforeStorylet)) {
            // UI view switch is handled by UIManager.displayEncounterView via encounterMgr
        } else {
            uiMgr.addLogEntry(`Failed to start queued encounter with Aspect ID: ${aspectIdToStart}`, "error");
            storyletEnded(); // Attempt to recover by ending storylet flow
        }
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) return;

        // Handle "Disorientation" choice BEFORE playing the card (if it's not Disorientation itself)
        if (cardId !== "TRM001" && encounterMgr.canSpendClarityForDisorientation()) {
            // This is where a UI prompt for the player would go.
            // For now, to make it testable without complex UI, let's assume:
            // If player has clarity and Disorientation is an issue, they *would* spend it.
            // This is a simplification.
            const confirmSpend = confirm("Disorientation increases card costs by 1 Focus this turn.\nSpend 1 Clarity to negate this effect?");
            if (confirmSpend) {
                encounterMgr.spendClarityForDisorientation();
            }
        }
        encounterMgr.playConceptCard(cardId);
        refreshPlayerUI(); // Player stats (focus) definitely changed
        _checkGameOver();
    }

    function _handleEncounterEndTurn() {
        if (isGameOver || !encounterMgr.isActive()) return;
        encounterMgr.playerEndTurn();
    }

    function _handleEncounterRevealTrait() {
         if (isGameOver || !encounterMgr.isActive()) return;
         encounterMgr.revealHiddenAspectTrait();
         refreshPlayerUI(); // For insight cost
    }

    function returnFromEncounter(viewToRestore) {
        if (isGameOver && currentPlayer.integrity > 0) { // If game over wasn't due to this encounter
             console.warn("returnFromEncounter called while game is over by other means.");
        } else if (isGameOver && currentPlayer.integrity <= 0) {
            // Game over already handled by player.modifyIntegrity via triggerGameOver
            return;
        }

        refreshPlayerUI();
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (viewToRestore === 'location-view' && node && node.isSanctuary) {
             uiMgr.displayLocation(node.locationDetails || node);
             _switchToView('location-view');
        } else {
            _switchToView('map-view');
        }
    }

    function revealAwakeningMapConnections() { // Called by "Fragmented Memory: The Fall"
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT");
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE");
        if (currentViewId === 'map-view') {
            _updateAndRenderNodeMap();
        }
        uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore. Places to explore... or to fear.");
    }
    function playerRecalledName() { // Called by "Echo of a Name"
        _updateHeaderInfo(false); // Update header with actual name
        refreshPlayerUI(); // Max integrity/focus changed
    }

    function refreshPlayerUI() { // Centralized UI refresh for player data
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions());
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay());
        uiMgr.updateActiveMemories(currentPlayer.memories);
    }

    function _checkGameOver() {
        if (isGameOver) return true;
        if (currentPlayer.integrity <= 0) {
            // triggerGameOver is called by player.modifyIntegrity
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

    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false;
        preGameIntroActive = true;
        pendingEncounterId = null;
        currentMapNodeId = null; // Reset current node
        uiMgr.hideModals();

        currentPlayer.resetForNewRun(); // Resets player to initial intro state
        currentWorld.resetWorld();

        _startGameSequence();
        uiMgr.getDOMElement('logEntries').innerHTML = '';
        uiMgr.getDOMElement('journalEntries').innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`;
        uiMgr.addLogEntry("A new cycle of consciousness begins...", "system_major_event");
    }

    function _setupGlobalEventListeners() {
        // Pre-Game Intro Button
        const continueBtn = uiMgr.getDOMElement('continueFromPrecipiceButton');
        if (continueBtn) continueBtn.addEventListener('click', _handleContinueFromPrecipice);

        // Node Map Click (Event Delegation)
        const mapContainer = uiMgr.getDOMElement('nodeMapContainer');
        if (mapContainer) {
            mapContainer.addEventListener('click', (event) => {
                const targetNodeEl = event.target.closest('.map-node.accessible');
                if (targetNodeEl && targetNodeEl.dataset.nodeId && !encounterMgr.isActive() && !preGameIntroActive) {
                    _navigateToNode(targetNodeEl.dataset.nodeId);
                }
            });
        }
        // Explore Current Node Button
        const exploreBtn = uiMgr.getDOMElement('exploreCurrentNodeButton');
        if (exploreBtn) exploreBtn.addEventListener('click', _exploreCurrentNode);

        // Location Actions (Event Delegation)
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

        // Storylet Choices (Event Delegation)
        const storyChoicesContainer = uiMgr.getDOMElement('storyletChoices');
        if (storyChoicesContainer) {
            storyChoicesContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) {
                    _handleStoryletChoice(parseInt(event.target.dataset.choiceIndex));
                }
            });
        }
        // Encounter Controls
        const endTurnBtnEnc = uiMgr.getDOMElement('endTurnEncounterButton');
        if (endTurnBtnEnc) endTurnBtnEnc.addEventListener('click', _handleEncounterEndTurn);
        const revealTraitBtnEnc = uiMgr.getDOMElement('revealTraitEncounterButton');
        if (revealTraitBtnEnc) revealTraitBtnEnc.addEventListener('click', _handleEncounterRevealTrait);

        // Encounter Hand Card Clicks (Event Delegation)
        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards');
        if (playerHandElemEnc) {
            playerHandElemEnc.addEventListener('click', (event) => {
                const cardElement = event.target.closest('.encounter-card-placeholder');
                if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) {
                    _handleEncounterCardPlay(cardElement.dataset.cardId);
                }
            });
            playerHandElemEnc.addEventListener('mouseover', (event) => { /* ... tooltip logic from before ... */ });
            playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip());
            playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event));
        }
        // Modals
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
        // Journal
        const addJournalBtn = uiMgr.getDOMElement('addJournalEntryButton');
        if(addJournalBtn) { /* ... journal button logic from before ... */ }
        // Global key listeners
        document.addEventListener('keydown', (event) => { /* ... Esc key logic from before ... */ });
    }

    return {
        init,
        restartGame,
        triggerGameOver,
        // Callbacks / Orchestration functions
        storyletEnded,
        returnFromEncounter,
        queueEncounter, // Exposed for storylet outcomes
        // startEncounterFromQueue, // This should be internal to Game's flow after storyletEnded
        revealAwakeningMapConnections, // For card effects
        playerRecalledName, // For card effects
        refreshPlayerUI, // For outcomes that directly change player stats outside of normal flow
        switchToNodeMapView: returnToMapView, // Alias for clarity in storylet outcomes
        // For "Disorientation" choice - this could be called from an explicit UI prompt
        // For now, simplified to a confirm() dialog.
        handleDisorientationClaritySpend: () => {
            if (encounterMgr.isActive() && encounterMgr.canSpendClarityForDisorientation()) {
                if (confirm("Disorientation makes cards cost +1 Focus this turn. Spend 1 Clarity to negate this?")) {
                    encounterMgr.spendClarityForDisorientation();
                    refreshPlayerUI(); // Update clarity display
                }
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
