// js/main.js

const Game = (() => {

    let currentPlayer = null;
    let currentWorld = World; // World is an IIFE module
    let uiMgr = UIManager;
    let storyletMgr = StoryletManager;
    let encounterMgr = EncounterManager;

    // Game State Variables
    let currentViewId = 'pre-game-intro-view'; // Start with the intro
    let isGameOver = false;
    let preGameIntroActive = true;
    let pendingEncounterId = null; // To queue an encounter after a storylet

    // --- Initialization ---
    function init() {
        console.log("Sunless Psyche Main: Initializing...");
        isGameOver = false;
        preGameIntroActive = true;

        uiMgr.init();
        currentPlayer = new Player();
        storyletMgr.init(currentPlayer, currentWorld);
        encounterMgr.init(currentPlayer);
        currentWorld.init(); // Initialize world after other modules that might reference its config

        _setupGlobalEventListeners();
        _startGameSequence();

        console.log("Sunless Psyche Main: Initialization complete.");
    }

    function _startGameSequence() {
        // Initial UI Setup for "The Precipice"
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.getTraumaCountInPlay());
        _updateHeaderInfo(true); // Pass true for intro state

        uiMgr.startPreGameIntro(); // Starts the timed text display
        // The "Continue from Precipice" button's event listener will move the game forward
    }

    function _updateHeaderInfo(isIntro = false) {
        if (isIntro) {
            uiMgr.getDOMElement('psychonautNameDisplay').textContent = "The Unknowing";
            uiMgr.getDOMElement('currentAmbitionDisplay').textContent = "To Simply Be";
        } else {
            uiMgr.getDOMElement('psychonautNameDisplay').textContent = currentPlayer.name;
            uiMgr.getDOMElement('currentAmbitionDisplay').textContent = currentPlayer.ambition;
        }
    }

    // --- Game State & View Management ---
    function _switchToView(viewId) {
        currentViewId = viewId;
        uiMgr.showView(viewId);
        // Additional logic based on view switch if needed
        if (viewId === 'map-view') {
            _updateAndRenderNodeMap();
        }
    }

    function _updateAndRenderNodeMap() {
        const currentNode = currentWorld.getCurrentNode();
        const allNodes = currentWorld.getAllNodes();
        const accessibleNodeIds = currentWorld.getAccessibleNodeIds();
        uiMgr.renderNodeMap(allNodes, currentNode.id, accessibleNodeIds);
        uiMgr.updateCurrentNodeInfo(currentNode);
    }

    function returnToMapView() { // Called when leaving a location or simple storylet
        _switchToView('map-view');
    }

    function storyletEnded() { // Called by StoryletManager.endStorylet()
        if (isGameOver) return;

        // Always update player stats and context panel after a storylet
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.getTraumaCountInPlay());

        if (pendingEncounterId) {
            const encounterToStart = pendingEncounterId;
            pendingEncounterId = null;
            startEncounter(encounterToStart, currentViewId); // Pass current view for return
        } else {
            // Default to map view showing current node after storylet,
            // or location view if the current node is a complex location (e.g., Sanctuary)
            const currentNode = currentWorld.getCurrentNode();
            if (currentNode && currentNode.isSanctuary) { // Or other complex location type
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
        uiMgr.clearPreGameIntroTimeout(); // Stop text animation if running
        _updateHeaderInfo(false); // Update to actual player name/ambition

        // Player effectively "moves" to the Shattered Shore by playing the first card
        const firstCardId = currentPlayer.hand[0]; // Should be "AWK001" Grasp for Awareness
        if (firstCardId === "AWK001") {
            const cardDef = currentPlayer.playCardFromHand(firstCardId); // Spend focus, move to discard
            if (cardDef) {
                uiMgr.addLogEntry(`You instinctively ${cardDef.name.toLowerCase()}.`, "player_action_major");
                // Execute "Grasp for Awareness" effect directly
                const graspEffect = encounterMgr.getConceptCardEffectFunction(cardDef.effectFunctionName);
                if (graspEffect) {
                    graspEffect(cardDef); // This will draw AWK002 (Fragmented Memory)
                }
                // UI for hand and player stats should be updated after effect
                uiMgr.updatePlayerStats(currentPlayer.getUIData());
                uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions());
                uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.getTraumaCountInPlay());


                // Now transition to the map view, centered on Shattered Shore
                // The "Fragmented Memory: The Fall" card's effect will reveal other nodes when played.
                currentWorld.navigateToNode("NODE_SHATTERED_SHORE", currentPlayer); // Teleport essentially
                _switchToView('map-view'); // This will call _updateAndRenderNodeMap

                // Check for storylet on arrival at Shattered Shore
                const shoreNode = currentWorld.getCurrentNode();
                if (shoreNode && shoreNode.storyletOnArrival) {
                    storyletMgr.startStorylet(shoreNode.storyletOnArrival);
                    // If STORY_SHORE_ARRIVAL auto-plays "Grasp", this is slightly redundant, adjust flow.
                    // The current STORY_SHORE_ARRIVAL autoTriggerAction handles this.
                }

            } else {
                 console.error("Failed to play initial Grasp for Awareness card.");
                 _switchToView('map-view'); // Fallback
            }
        } else {
            console.error("Initial card is not Grasp for Awareness!");
            _switchToView('map-view'); // Fallback
        }
    }

    // --- Navigation & Location Interaction ---
    function _navigateToNode(targetNodeId) {
        if (isGameOver || encounterMgr.isActive()) return;

        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer);
        if (newNodeData) {
            uiMgr.updatePlayerStats(currentPlayer.getUIData()); // For Clarity cost
            _updateAndRenderNodeMap(); // Update map display for new location

            // Check for arrival storylets at newNodeData
            if (newNodeData.storyletOnArrival) {
                storyletMgr.startStorylet(newNodeData.storyletOnArrival);
                // UIManager switches view if storylet starts
            } else {
                // If no storylet, just update map info (already done by _updateAndRenderNodeMap)
            }
        }
        _checkGameOver();
    }

    function _exploreCurrentNode() {
        if (isGameOver || encounterMgr.isActive()) return;
        const node = currentWorld.getCurrentNode();
        if (node) {
            uiMgr.addLogEntry(`Delving into ${node.name}...`, "action");
            if (node.storyletOnArrival && !node.arrivalStoryletPlayedThisVisit) { // More complex: track if storylet was played
                storyletMgr.startStorylet(node.storyletOnArrival);
                // node.arrivalStoryletPlayedThisVisit = true; // Mark as played for this visit
            } else if (node.isSanctuary && node.locationDetails) {
                uiMgr.displayLocation(node.locationDetails);
                _switchToView('location-view');
            } else if (node.storyletsOnExplore && node.storyletsOnExplore.length > 0) {
                // Placeholder for choosing among multiple exploration storylets
                storyletMgr.startStorylet(node.storyletsOnExplore[0]);
            }
            else {
                uiMgr.addLogEntry("There's nothing more of immediate note here.", "system");
            }
        }
    }

    function _handleLocationAction(actionId) { // For Sanctuary-like locations
        if (isGameOver || encounterMgr.isActive()) return;
        uiMgr.addLogEntry(`Location action: ${actionId}`, "action");
        const location = currentWorld.getCurrentNode(); // Assuming we are "at" a location with actions

        // This needs to align with actions defined in LOCATION_DATA_MINIMAL for the specific location type
        // E.g., for NODE_THRESHOLD_SANCTUM
        switch (actionId) {
            case 'rest':
                currentPlayer.modifyIntegrity(Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity), "Sanctuary rest");
                currentPlayer.modifyHope(1, "Sanctuary rest");
                currentPlayer.modifyDespair(-1, "Sanctuary rest");
                uiMgr.addLogEntry("You rest within the Sanctum. A fragile peace settles.", "system_positive");
                break;
            case 'shop_intro':
                uiMgr.addLogEntry("The Keeper offers a few basic Concepts for your Insight, should you find any.", "dialogue");
                // Implement shop UI if any items are available
                break;
            case 'talk_keeper':
                // Start a specific conversation storylet with the Keeper
                if (location.id === "NODE_THRESHOLD_SANCTUM" && STORYLET_DATA_MINIMAL["STORY_KEEPER_ADVICE_OPTIONAL"]) {
                    storyletMgr.startStorylet("STORY_KEEPER_ADVICE_OPTIONAL");
                } else {
                     uiMgr.addLogEntry("The Keeper merely observes you.", "system");
                }
                break;
            case 'view_ambition':
                uiMgr.addLogEntry(`Your current Ambition: ${currentPlayer.ambition}`, "system");
                uiMgr.addJournalEntry("Ambition Focused", `I contemplate my Ambition: "${currentPlayer.ambition}".`);
                break;
            default:
                uiMgr.addLogEntry(`Action "${actionId}" is not specifically handled here.`, "warning");
                break;
        }
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        _checkGameOver();
    }

    function _handleReturnToMapFromLocation() {
        _switchToView('map-view');
    }


    function _handleStoryletChoice(choiceIndex) {
        if (isGameOver || encounterMgr.isActive()) return;
        storyletMgr.makeChoice(choiceIndex);
        // Storylet outcome functions might have changed player state.
        // The storyletEnded() function will handle UI updates and next view.
    }

    // --- Encounter Orchestration ---
    function queueEncounter(aspectId) { // Called by storylet outcomes
        pendingEncounterId = aspectId;
        // The actual start will happen in storyletEnded()
    }

    function startEncounterFromQueue(previousViewId) { // Renamed, called after storylet
        if (isGameOver || !pendingEncounterId) return;
        const aspectIdToStart = pendingEncounterId;
        pendingEncounterId = null; // Clear queue

        if (encounterMgr.startEncounter(aspectIdToStart, previousViewId)) {
            // UI view switch handled by UIManager within encounterMgr.startEncounter
            // by calling uiMgr.displayEncounterView
        } else {
            uiMgr.addLogEntry(`Failed to start queued encounter with Aspect ID: ${aspectIdToStart}`, "error");
            storyletEnded(); // Go back to map/location if encounter fails to start
        }
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        const cardDef = CONCEPT_CARD_DEFINITIONS[cardId];
        if (!cardDef) return;

        // Handle "Disorientation" Clarity spend choice *before* playing the card
        const disorientationInHand = currentPlayer.hand.some(id => id === "TRM001");
        if (disorientationInHand && cardId !== "TRM001" && !encounterMgr.playerEncounterState?.disorientationClaritySpentThisTurn) {
            if (encounterMgr.canSpendClarityForDisorientation()) {
                // In a real game, this would be a UI prompt.
                // For now, auto-spend if available to simplify, or make it a specific card interaction.
                // Let's assume for this prototype, the player must *choose* to play Disorientation or another card.
                // If they play another card, the cost is increased.
                // The cost check happens in EncounterManager.playConceptCard
                UIManager.addLogEntry("Playing a card while Disoriented costs +1 Focus unless Clarity is spent on Disorientation's effect (not yet implemented as a choice).", "warning_subtle");
            }
        }
        encounterMgr.playConceptCard(cardId); // This will update UI and check game over
        _checkGameOver(); // Final check on player integrity
    }

    function _handleEncounterEndTurn() {
        if (isGameOver || !encounterMgr.isActive()) return;
        encounterMgr.playerEndTurn();
    }

    function _handleEncounterRevealTrait() {
         if (isGameOver || !encounterMgr.isActive()) return;
         encounterMgr.revealHiddenAspectTrait();
         uiMgr.updatePlayerStats(currentPlayer.getUIData()); // For insight cost
    }

    function returnFromEncounter(previousViewId) {
        if (isGameOver) return;
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.getTraumaCountInPlay());

        // Return to the view player was in before the encounter
        const node = currentWorld.getCurrentNode();
        if (previousViewId === 'location-view' && node && node.isSanctuary) {
             uiMgr.displayLocation(node.locationDetails || node);
             _switchToView('location-view');
        } else {
            _switchToView('map-view'); // Default to map view
        }
    }

    // Special function called by "Fragmented Memory: The Fall" card effect
    function revealAwakeningMapConnections() {
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT");
        currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE");
        if (currentViewId === 'map-view') { // If already on map, re-render
            _updateAndRenderNodeMap();
        }
    }
    // Called by "Echo of a Name" card effect
    function playerRecalledName() {
        _updateHeaderInfo(false); // Update header with actual name
    }


    // --- Game Over & Restart ---
    function _checkGameOver() {
        if (isGameOver) return true;
        if (currentPlayer.integrity <= 0) {
            // Player.modifyIntegrity already calls triggerGameOver
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


    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false;
        preGameIntroActive = true; // Reset intro flag
        pendingEncounterId = null;
        uiMgr.hideModals();

        currentPlayer.resetForNewRun();
        currentWorld.resetWorld(); // This re-calls its own init

        // StoryletManager and EncounterManager are mostly stateless and get player/world refs on their init.
        // Re-init them if they store run-specific state beyond what player/world holds.
        // storyletMgr.init(currentPlayer, currentWorld); // Not strictly needed if they just use refs
        // encounterMgr.init(currentPlayer);

        _startGameSequence(); // Restart the intro sequence
    }


    // --- Event Listeners Setup ---
    function _setupGlobalEventListeners() {
        // Pre-Game Intro Button
        const continueBtn = uiMgr.getDOMElement('continueFromPrecipiceButton');
        if (continueBtn) {
            continueBtn.addEventListener('click', _handleContinueFromPrecipice);
        }

        // Node Map Click (Event Delegation on map container)
        const mapContainer = uiMgr.getDOMElement('nodeMapContainer');
        if (mapContainer) {
            mapContainer.addEventListener('click', (event) => {
                const targetNodeEl = event.target.closest('.map-node.accessible');
                if (targetNodeEl && targetNodeEl.dataset.nodeId) {
                    _navigateToNode(targetNodeEl.dataset.nodeId);
                }
            });
        }

        // Explore Current Node Button
        const exploreBtn = uiMgr.getDOMElement('exploreCurrentNodeButton');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', _exploreCurrentNode);
        }

        // Location Actions (event delegation)
        const locActionsContainer = uiMgr.getDOMElement('locationActions');
        if (locActionsContainer) {
            locActionsContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON' && event.target.dataset.action) {
                    _handleLocationAction(event.target.dataset.action);
                }
            });
        }
        const returnToMapBtn = uiMgr.getDOMElement('returnToMapFromLocationButton');
         if(returnToMapBtn) {
            returnToMapBtn.addEventListener('click', _handleReturnToMapFromLocation);
         }


        // Storylet Choices (event delegation)
        const storyChoicesContainer = uiMgr.getDOMElement('storyletChoices');
        if (storyChoicesContainer) {
            storyChoicesContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex) {
                    _handleStoryletChoice(parseInt(event.target.dataset.choiceIndex));
                }
            });
        }

        // Encounter Controls
        const endTurnBtnEnc = uiMgr.getDOMElement('endTurnEncounterButton');
        if (endTurnBtnEnc) endTurnBtnEnc.addEventListener('click', _handleEncounterEndTurn);

        const revealTraitBtnEnc = uiMgr.getDOMElement('revealTraitEncounterButton');
        if (revealTraitBtnEnc) revealTraitBtnEnc.addEventListener('click', _handleEncounterRevealTrait);

        // Encounter Hand Card Clicks (event delegation)
        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards');
        if (playerHandElemEnc) {
            playerHandElemEnc.addEventListener('click', (event) => {
                const cardElement = event.target.closest('.encounter-card-placeholder');
                if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) {
                    _handleEncounterCardPlay(cardElement.dataset.cardId);
                }
            });
            // Tooltip listeners for encounter hand
            playerHandElemEnc.addEventListener('mouseover', (event) => {
                const cardElement = event.target.closest('.encounter-card-placeholder');
                if (cardElement && cardElement.dataset.cardId) {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[cardElement.dataset.cardId];
                    if (cardDef) {
                        const tooltipContent = `<strong>${cardDef.name}</strong> (Cost: ${cardDef.cost}F)<br><em>${cardDef.type} - ${cardDef.attunement}</em><br>${cardDef.description.replace(/\n/g, "<br>")}<br><small>Keywords: ${(cardDef.keywords || []).join(', ')}</small>`;
                        uiMgr.showTooltip(tooltipContent, event);
                    }
                }
            });
            playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip());
            playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event));
        }


        // Modals
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton');
        if (viewDeckBtn) {
            viewDeckBtn.addEventListener('click', () => {
                uiMgr.displayFullDeck(currentPlayer.getFullDeckCardDefinitions());
            });
        }
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
        if(addJournalBtn) {
            addJournalBtn.addEventListener('click', () => {
                const note = prompt("Enter your personal note for the journal (max 100 chars):");
                if (note && note.trim() !== "") {
                    uiMgr.addJournalEntry("Personal Note", note.trim().substring(0, 100));
                }
            });
        }

        // Global key listeners
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (!uiMgr.getDOMElement('modalOverlay').classList.contains('view-hidden')) {
                    uiMgr.hideModals();
                }
                // Could add other Esc behaviors, e.g., opening a game menu
            }
        });
    }

    return {
        init,
        restartGame,
        triggerGameOver, // Public for Player class to call
        // Functions called by other modules (like Storylet or Card Effects)
        queueEncounter, // For storylets to setup an encounter
        startEncounterFromQueue, // To actually start it after storylet UI closes
        storyletEnded,      // Callback from StoryletManager
        returnToMapView,    // Callback
        returnFromEncounter,// Callback from EncounterManager
        revealAwakeningMapConnections, // Called by card effect
        playerRecalledName, // Called by card effect
        getCurrentPlayer: () => currentPlayer, // For modules that need read-only access
        // For "Disorientation" choice - these would be called from a UI prompt handler
        // promptPlayerForClaritySpendOnDisorientation: () => { ... UI logic ... then call below ... }
        // This is complex for this stage, so onDraw logic for Disorientation remains simple.
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
