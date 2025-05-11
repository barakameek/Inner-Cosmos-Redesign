// js/main.js

const Game = (() => {

    let currentPlayer = null;
    let currentWorld = World; // World is an IIFE module, its public API is World itself
    let uiMgr = UIManager;    // UIManager is an IIFE module
    let storyletMgr = StoryletManager; // StoryletManager is an IIFE module
    let encounterMgr = EncounterManager; // EncounterManager is an IIFE module

    // Game State Variables
    let currentViewId = 'pre-game-intro-view'; // Start with the intro
    let isGameOver = false;
    let preGameIntroActive = true;
    let pendingEncounterId = null; // To queue an encounter after a storylet
    let currentMapNodeId = null; // To keep track of player's position on the node map

    // --- Initialization ---
    function init() {
        console.log("Sunless Psyche Main (v2 Awakening): Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        // Initialize Managers (order can be important for dependencies)
        // Config.js is assumed to be loaded first in HTML, making its constants globally available.
        uiMgr.init(); // Initialize UI elements first, it might need CONFIG constants
        currentPlayer = new Player(); // Player uses CONFIG constants
        currentWorld.init(); // World uses NODE_MAP_DATA from CONFIG
        storyletMgr.init(currentPlayer, currentWorld); // Pass player and world references
        encounterMgr.init(currentPlayer); // Pass player reference

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main (v2 Awakening): Initialization complete.");
    }

    function _startGameSequence() {
        currentMapNodeId = null; // Not on the map yet
        refreshPlayerUI(); // Update with initial low stats from Player constructor
        _updateHeaderInfo(true); // True for intro state header ("The Unknowing")

        uiMgr.startPreGameIntro(); // Starts the timed text display in UIManager
        // The "Continue from Precipice" button's event listener will trigger _handleContinueFromPrecipice
    }

    function _updateHeaderInfo(isPreRecall = false) {
        const nameEl = uiMgr.getDOMElement('psychonautNameDisplay');
        const ambitionEl = uiMgr.getDOMElement('currentAmbitionDisplay');
        if (isPreRecall) {
            if(nameEl) nameEl.textContent = "The Unknowing"; // Default before "Echo of a Name"
            if(ambitionEl) ambitionEl.textContent = "To Simply Be"; // Default before Ambition is clear
        } else {
            // Uses player.name which is updated by "Echo of a Name" card effect via playerRecalledName()
            if(nameEl) nameEl.textContent = currentPlayer.name || CONFIG.INITIAL_PSYCHONAUT_NAME;
            if(ambitionEl) ambitionEl.textContent = currentPlayer.ambition || CONFIG.INITIAL_AMBITION_TEXT;
        }
    }

    // --- Game State & View Management ---
    function _switchToView(viewId) {
        console.log(`Main: Switching view to: ${viewId}`);
        currentViewId = viewId;
        uiMgr.showView(viewId); // UIManager handles hiding/showing the correct div
        if (viewId === 'map-view') {
            _updateAndRenderNodeMap(); // If switching to map, render it
        }
    }

    function _updateAndRenderNodeMap() {
        if (currentMapNodeId) { // Ensure player is on a node
            const currentNodeData = currentWorld.getNodeData(currentMapNodeId);
            const allNodes = currentWorld.getAllNodes();
            const accessibleNodeIds = currentWorld.getAccessibleNodeIds(currentMapNodeId); // Pass current node for context
            uiMgr.renderNodeMap(allNodes, currentMapNodeId, accessibleNodeIds);
            uiMgr.updateCurrentNodeInfo(currentNodeData);
        } else {
            // This case might happen if map is shown before player is placed (e.g. error recovery)
            const mapContainer = uiMgr.getDOMElement('nodeMapContainer');
            if(mapContainer) mapContainer.innerHTML = `<p class="placeholder">The way is obscured by swirling nothingness...</p>`;
            uiMgr.updateCurrentNodeInfo(null); // Show 'Lost' or similar
        }
    }

    // Public function for explicit switch to map view, e.g., after a storylet outcome
    function switchToNodeMapView() { 
        _switchToView('map-view'); 
    }

    function storyletEnded() { // Called by StoryletManager.endStorylet()
        if (isGameOver) return;
        refreshPlayerUI(); // Update all player stats, deck info, memories

        if (pendingEncounterId) {
            const encounterToStart = pendingEncounterId;
            pendingEncounterId = null; // Clear before starting
            startEncounterFromQueue(encounterToStart, currentViewId); // Pass current view for return context
        } else {
            // Default to map view showing current node after storylet,
            // or location view if the current node is a complex location (e.g., Sanctuary)
            const currentNode = currentWorld.getNodeData(currentMapNodeId);
            if (currentViewId === 'location-view' && currentNode && currentNode.isSanctuary) {
                // If we were in a location view (e.g. sanctuary) and a storylet ended, refresh that location view.
                uiMgr.displayLocation(currentNode.locationDetails || currentNode); // Refresh with current data
                 _switchToView('location-view'); // Stay in location view
            } else {
                 switchToNodeMapView(); // Use the correctly defined function
            }
        }
        _checkGameOver();
    }


    // --- Intro Sequence Logic ---
    function _handleContinueFromPrecipice() {
        if (!preGameIntroActive) return;
        preGameIntroActive = false;
        uiMgr.clearPreGameIntroTimeout(); // Stop text animation if running
        // Note: player.name updates after "Echo of a Name" is played via its outcome. Header updated then.

        // Player isn't "navigating" yet, they are *arriving* at the first node.
        const startingNode = currentWorld.placePlayerAtNode("NODE_SHATTERED_SHORE");
        if (startingNode) {
            currentMapNodeId = startingNode.id; // Set current node in Game
            uiMgr.addLogEntry("Consciousness coalesces... You find yourself on The Shattered Shore.", "system_major_event");
            
            // The "Grasp for Awareness" is now a choice within the STORY_SHORE_ARRIVAL storylet.
            if (startingNode.storyletOnArrival) {
                storyletMgr.startStorylet(startingNode.storyletOnArrival); // This is STORY_SHORE_ARRIVAL
            } else {
                console.error("NODE_SHATTERED_SHORE has no arrival storylet defined!");
                switchToNodeMapView(); // Fallback
            }
        } else {
            console.error("CRITICAL: Failed to place player at NODE_SHATTERED_SHORE!");
            uiMgr.addLogEntry("The void remains absolute. (Error: Start node missing)", "critical_system");
        }
    }

    // --- Navigation & Location Interaction ---
    function _navigateToNode(targetNodeId) {
        if (isGameOver || encounterMgr.isActive()) return;

        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer);
        if (newNodeData) {
            currentMapNodeId = newNodeData.id; // Update main game's track of current node
            refreshPlayerUI(); // For Clarity cost & any other stat changes
            _updateAndRenderNodeMap(); // Update map display for new location

            // Check for arrival storylets at newNodeData
            if (newNodeData.storyletOnArrival) {
                storyletMgr.startStorylet(newNodeData.storyletOnArrival);
                // UIManager switches view if storylet starts
            }
            // If no storylet, player is simply at the new node on the map.
        }
        _checkGameOver();
    }

    function _exploreCurrentNode() {
        if (isGameOver || encounterMgr.isActive() || !currentMapNodeId) return;
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (node) {
            uiMgr.addLogEntry(`Delving into ${node.name}...`, "action");
            
            // Prioritize complex location view if it's a sanctuary with details
            if (node.isSanctuary && node.locationDetails) {
                uiMgr.displayLocation(node.locationDetails);
                _switchToView('location-view');
                return; 
            }
            
            // Otherwise, try to trigger a storylet
            let storyletToStartId = node.storyletOnArrival; // Default, could check if already played
            // TODO: Add more sophisticated logic for choosing among multiple storyletsOnExplore
            // or replaying arrival storylets if designed that way.
            // For now, just use storyletOnArrival.
            
            if (storyletToStartId && STORYLET_DATA_MINIMAL[storyletToStartId]) {
                storyletMgr.startStorylet(storyletToStartId);
            } else {
                uiMgr.addLogEntry("There's nothing more of immediate note here to explore via storylet.", "system");
            }
        }
    }

    function _handleLocationAction(actionId) { // For Sanctuary-like locations from location-view
        if (isGameOver || encounterMgr.isActive()) return;
        const locationNode = currentWorld.getNodeData(currentMapNodeId); // Current node should be the location
        if (!locationNode || !locationNode.isSanctuary || !locationNode.locationDetails) { 
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
                const keeperStoryletId = locationNode.locationDetails.storyletsOnExplore?.[0]; // Assume first is talk
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
        switchToNodeMapView(); // Use the correctly defined function
    }


    function _handleStoryletChoice(choiceIndex) {
        if (isGameOver || encounterMgr.isActive()) return;
        storyletMgr.makeChoice(choiceIndex);
        // storyletEnded() will be called by StoryletManager, which then handles UI updates & next view.
    }

    // --- Encounter Orchestration ---
    function queueEncounter(aspectId) { // Called by storylet outcomes
        pendingEncounterId = aspectId;
    }

    function startEncounterFromQueue(aspectIdToStart, previousViewBeforeStorylet) { // Called by storyletEnded
        if (isGameOver || !aspectIdToStart) return; 
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewBeforeStorylet)) {
            // UI view switch handled by UIManager within encounterMgr.startEncounter
            // by calling uiMgr.displayEncounterView
        } else {
            uiMgr.addLogEntry(`Failed to start queued encounter with Aspect ID: ${aspectIdToStart}`, "error");
            storyletEnded(); // Attempt to recover by ending storylet flow gracefully
        }
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) return;

        // Handle "Disorientation" Clarity spend choice *before* playing the card (if it's not Disorientation itself)
        if (cardId !== "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) {
            // The canSpendClarityForDisorientation checks if TRM001 is in hand and clarity not yet spent
            // This confirm is a placeholder for a better UI choice.
            if (confirm("Disorientation increases Concept costs by 1 Focus this turn.\nSpend 1 Clarity to negate this effect?")) {
                if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation();
            }
        }
        encounterMgr.playConceptCard(cardId); // This deducts focus, plays card, updates UI, checks win/loss
        refreshPlayerUI(); // Player stats (focus) definitely changed
        _checkGameOver(); // Final check on player integrity
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

    function returnFromEncounter(viewToRestore) { // Called by EncounterManager when encounter ends
        if (isGameOver && currentPlayer.integrity > 0) { 
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
            switchToNodeMapView(); // Use the correctly defined function
        }
    }

    // Special function called by "Fragmented Memory: The Fall" card effect (via EncounterManager)
    function revealAwakeningMapConnections() {
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT");
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE");
        if (currentViewId === 'map-view') { // If already on map, re-render
            _updateAndRenderNodeMap();
        }
        uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore.");
    }
    // Called by "Echo of a Name" card effect (via EncounterManager)
    function playerRecalledName() {
        _updateHeaderInfo(false); // Update header with actual name
        // refreshPlayerUI(); // Player.js already called modifyMaxIntegrity etc which should trigger UI via main.js
                           // But a direct refresh here ensures all related UI is up-to-date.
                           // This might be redundant if stat mods in Player.js already call Game.refreshPlayerUI()
                           // For safety, let's keep it for now.
        refreshPlayerUI();
    }


    function refreshPlayerUI() { // Centralized UI refresh for player data
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions());
        // Pass hand count to updateDeckInfo
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay());
        uiMgr.updateActiveMemories(currentPlayer.memories);
    }

    function _checkGameOver() {
        if (isGameOver) return true; // Already over
        if (currentPlayer.integrity <= 0) {
            // triggerGameOver is called by player.modifyIntegrity when integrity hits 0
            return true;
        }
        return false;
    }
    // Public trigger for game over, called by Player class
    function triggerGameOver(title, message) {
        if (isGameOver) return;
        isGameOver = true;
        uiMgr.displayGameOver(title, message);
        uiMgr.addLogEntry(`GAME OVER: ${title}`, "critical_system");
    }
    // Called by Player.js when clarity hits 0
    function triggerMentalFogEffects() {
        uiMgr.addLogEntry("The Mental Fog thickens, making navigation treacherous and thoughts sluggish.", "world_event_negative");
        // TODO: Implement other effects: e.g. chance for random trauma, reduced focus regen, visual effects
    }
    // Called by Player.js when despair is maxed
    function triggerCriticalDespairEffects() {
        uiMgr.addLogEntry("Overwhelming Despair attracts Nightmare Aspects and distorts perception!", "world_event_critical");
        // TODO: Implement other effects: e.g. spawn special nightmare aspect, visual distortions, storylet
    }


    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false; 
        preGameIntroActive = true; 
        pendingEncounterId = null; 
        currentMapNodeId = null; 
        uiMgr.hideModals();

        currentPlayer.resetForNewRun(); // Resets player to initial intro state
        currentWorld.resetWorld(); // This re-calls its own init to reload map data

        _startGameSequence(); // Restart the intro sequence

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
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) {
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
        init,
        restartGame,
        triggerGameOver,
        storyletEnded, 
        returnFromEncounter, 
        queueEncounter,
        revealAwakeningMapConnections, 
        playerRecalledName, 
        refreshPlayerUI, 
        switchToNodeMapView, // Now correctly available
        triggerMentalFogEffects, 
        triggerCriticalDespairEffects, 
        handleTraumaOnDraw: (cardId, onDrawFunctionName) => {
            if (encounterMgr.isActive()) {
                // This check is to see if the onDrawFunctionName exists within EncounterManager's conceptCardEffects
                // which is where we put the 'onDrawDisorientation' logic.
                const effectFn = encounterMgr.getConceptCardEffectFunction(onDrawFunctionName);
                if (effectFn && typeof effectFn === 'function') {
                    effectFn(CONCEPT_CARD_DEFINITIONS[cardId]); 
                    refreshPlayerUI(); 
                } else {
                    console.warn(`onDraw function ${onDrawFunctionName} for ${cardId} not found or not a function in EncounterManager.`);
                     // If it's specifically Disorientation and the direct function wasn't found, try the generic handler.
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
                UIManager.addLogEntry(`Drew ${CONCEPT_CARD_DEFINITIONS[cardId]?.name} (Trauma) outside of an encounter - effect not applied in this context.`, "system_warning");
            }
        },
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
