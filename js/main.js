// js/main.js

// --- Global Game Object (Namespace) ---
// Encapsulates core game control functions and state.
const Game = (() => {

    let currentPlayer = null; // Instance of the Player class
    let currentWorld = null;  // Instance of the World module's API
    let uiMgr = UIManager;    // Alias for UIManager
    let storyletMgr = StoryletManager;
    let encounterMgr = EncounterManager;

    // Game State Variables
    let currentView = 'map'; // 'map', 'location', 'storylet', 'encounter'
    let isGameOver = false;

    // --- Initialization ---
    function init() {
        console.log("Sunless Psyche initializing...");
        isGameOver = false;

        // Initialize Managers (order can be important for dependencies)
        uiMgr.init(); // Initialize UI elements first

        currentPlayer = new Player(); // Create the player instance
        currentWorld = World; // World is an IIFE, so its public API is directly accessible
        storyletMgr.init(currentPlayer, currentWorld); // Pass player and world references
        encounterMgr.init(currentPlayer); // Pass player reference

        currentWorld.init(); // Initialize the world map and player's starting location

        // Initial UI Setup
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCount());
        _updateHeaderInfo();
        _displayCurrentWorldView(); // Show initial map or location view

        uiMgr.addLogEntry("Welcome, Psychonaut. The Inner Sea awaits.", "system");

        // Setup global event listeners
        _setupEventListeners();

        console.log("Sunless Psyche initialized and ready.");
    }

    function _updateHeaderInfo() {
        uiMgr.getDOMElement('psychonautNameDisplay').textContent = currentPlayer.name;
        uiMgr.getDOMElement('currentAmbitionDisplay').textContent = currentPlayer.ambition;
    }

    // --- Game State & View Management ---
    function _displayCurrentWorldView() {
        const locationData = currentWorld.getCurrentLocation();
        if (locationData) {
            // Check if there's an auto-trigger storylet for this location on arrival
            // (More complex logic: check for uncompleted mandatory storylets)
            if (locationData.storylets && locationData.storylets.length > 0 && !EncounterManager.isActive()) {
                // For simplicity, auto-start the first storylet if available and not in an encounter
                // In a real game, you might have conditions or player choice here.
                // Example: STORYLET_DATA_MINIMAL[locationData.storylets[0]].trigger === "on_arrival"
                // For now, let's assume if a storylet is tied to a location, we try to show it.
                // This needs to be more nuanced; perhaps a location has "on_enter_storylet"
                // For this skeleton, let's assume a location view is primary if no immediate storylet.
                // UIManager.displayLocation(locationData);
                // UIManager.showView(uiMgr.getDOMElement('locationView'));
                // OR:
                uiMgr.updateMapView(currentWorld.getCurrentLocationUIData());
                uiMgr.showView(uiMgr.getDOMElement('mapView')); // Default to map view of current loc
            } else {
                 uiMgr.updateMapView(currentWorld.getCurrentLocationUIData());
                 uiMgr.showView(uiMgr.getDOMElement('mapView'));
            }
        } else {
            console.error("No current location data to display.");
            uiMgr.showView(uiMgr.getDOMElement('mapView')); // Fallback
        }
    }

    function _navigateTo(direction) {
        if (isGameOver || encounterMgr.isActive()) return;

        const newLocation = currentWorld.navigate(direction, currentPlayer);
        if (newLocation) {
            uiMgr.updatePlayerStats(currentPlayer.getUIData()); // For Clarity cost
            // Check for arrival storylets at newLocation
            if (newLocation.storylets && newLocation.storylets.length > 0) {
                // Simplistic: if a location has storylets, start the first one on arrival.
                // More complex: check trigger conditions, player choices, etc.
                const firstStoryletId = newLocation.storylets[0]; // Assuming first one is entry storylet
                if (STORYLET_DATA_MINIMAL[firstStoryletId]) { // Check if storylet exists
                    storyletMgr.startStorylet(firstStoryletId);
                    // UIManager will switch view in displayStorylet
                    return; // Storylet takes precedence
                }
            }
            // If no immediate storylet, update map view
            _displayCurrentWorldView();
        }
        _checkGameOver();
    }

    function _exploreCurrentLocation() {
        if (isGameOver || encounterMgr.isActive()) return;
        const location = currentWorld.getCurrentLocation();
        if (location) {
            uiMgr.addLogEntry(`Exploring ${location.name}...`, "action");
            // If the location has specific storylets, try to trigger one.
            // Otherwise, display generic location actions.
            if (location.storylets && location.storylets.length > 0) {
                 // More sophisticated: choose which storylet based on conditions
                // For now, if a specific storylet is "main" for the location:
                let mainStoryletId = null;
                if (location.type === "Sanctuary" && location.storylets.includes("STORY_SANCTUARY_INTRO")) {
                    mainStoryletId = "STORY_SANCTUARY_INTRO"; // Example
                } else if (location.storylets[0]) { // Fallback to first
                    mainStoryletId = location.storylets[0];
                }

                if (mainStoryletId && storyletMgr.startStorylet(mainStoryletId)) {
                    return; // Storylet started
                }
            }
            // If no storylet, or storylet failed to start, show location view
            uiMgr.displayLocation(location);
        }
    }

    function _handleLocationAction(actionId) {
        if (isGameOver || encounterMgr.isActive()) return;
        uiMgr.addLogEntry(`Location action: ${actionId}`, "action");
        const location = currentWorld.getCurrentLocation();

        switch (actionId) {
            case 'rest':
                currentPlayer.modifyIntegrity(10); // Example rest values
                currentPlayer.modifyHope(1);
                currentPlayer.modifyDespair(-1);
                uiMgr.addLogEntry("You rest for a while, feeling somewhat refreshed.", "system_positive");
                uiMgr.updatePlayerStats(currentPlayer.getUIData());
                // Could cost "time" or resources
                break;
            case 'shop':
                uiMgr.addLogEntry("The Emporium of Thought is not yet stocked in this prototype.", "system");
                // Implement shop UI and logic
                break;
            case 'view_ambition':
                uiMgr.addLogEntry(`Current Ambition: ${currentPlayer.ambition}`, "system");
                uiMgr.addJournalEntry("Ambition Reminder", currentPlayer.ambition);
                break;
            case 'depart': // From a sanctuary's specific storylet outcome usually
                 _displayCurrentWorldView(); // Go back to map/navigation
                break;
            case 'leave-location': // General button from location view
                _displayCurrentWorldView();
                break;
            default:
                // Check if it's a storylet ID defined for this location
                if (location && location.storylets && location.storylets.includes(actionId)) {
                    storyletMgr.startStorylet(actionId);
                } else {
                    uiMgr.addLogEntry(`Action "${actionId}" is not yet implemented.`, "warning");
                }
                break;
        }
        _checkGameOver();
    }

    function _handleStoryletChoice(choiceIndex) {
        if (isGameOver || encounterMgr.isActive()) return; // Should not happen if UI is right
        storyletMgr.makeChoice(choiceIndex);
        // Storylet outcome functions might trigger UI updates or state changes
        // Refresh player stats UI after any potential changes
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCount());
        _checkGameOver();
    }

    // --- Encounter Orchestration ---
    function startEncounter(aspectId) { // Called by storylet outcomes typically
        if (isGameOver) return;
        if (encounterMgr.startEncounter(aspectId)) {
            // UI view switch is handled by UIManager.displayEncounterView called within encounterMgr.startEncounter
        } else {
            uiMgr.addLogEntry(`Failed to start encounter with Aspect ID: ${aspectId}`, "error");
            _displayCurrentWorldView(); // Go back to safety
        }
    }

    function _handleEncounterCardPlay(cardId) {
        if (isGameOver || !encounterMgr.isActive()) return;
        encounterMgr.playConceptCard(cardId);
        // Player stats and aspect stats UI updated within encounterMgr/playConceptCard via UIManager
        // Check game over handled by playConceptCard's call to _checkEncounterWinLoss
        _checkGameOver(); // Double check player integrity
    }

    function _handleEncounterEndTurn() {
        if (isGameOver || !encounterMgr.isActive()) return;
        encounterMgr.playerEndTurn();
        // Subsequent UI updates and turn flow handled by EncounterManager
    }

    function _handleEncounterRevealTrait() {
         if (isGameOver || !encounterMgr.isActive()) return;
         encounterMgr.revealHiddenAspectTrait();
         uiMgr.updatePlayerStats(currentPlayer.getUIData()); // For insight cost
    }

    function returnFromEncounter() { // Called by EncounterManager when encounter ends
        if (isGameOver) return; // If player died in encounter, game over already handled.
        // Refresh UI elements that might have changed due to encounter rewards
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCount());
        _displayCurrentWorldView(); // Go back to map/location
    }


    // --- Game Over & Restart ---
    function _checkGameOver() {
        if (isGameOver) return true; // Already over
        if (currentPlayer.integrity <= 0) {
            isGameOver = true;
            uiMgr.displayGameOver("Psychological Collapse!", "Your Integrity has shattered. The Inner Sea claims you.");
            uiMgr.addLogEntry("GAME OVER: Psychological Collapse.", "critical_system");
            return true;
        }
        // Add other game over conditions (e.g., Ambition failed catastrophically)
        return false;
    }

    function restartGame() {
        console.log("Restarting game...");
        isGameOver = false;
        uiMgr.hideModals();

        currentPlayer.resetForNewRun();
        currentWorld.resetWorld();
        // StoryletManager and EncounterManager are mostly stateless between runs, but could have a reset if needed.

        // Re-initialize UI to reflect fresh state
        uiMgr.updatePlayerStats(currentPlayer.getUIData());
        uiMgr.updateActiveMemories(currentPlayer.memories);
        uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCount());
        _updateHeaderInfo(); // Reset name/ambition if they change
        _displayCurrentWorldView();

        uiMgr.getDOMElement('logEntries').innerHTML = ''; // Clear log
        uiMgr.getDOMElement('journalEntries').innerHTML = ''; // Clear journal
        uiMgr.addLogEntry("A new journey into the psyche begins...", "system");
    }


    // --- Event Listeners Setup ---
    function _setupEventListeners() {
        // Navigation Controls (event delegation on parent)
        const navControls = uiMgr.getDOMElement('navigationControls');
        if (navControls) {
            navControls.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON') {
                    const direction = event.target.dataset.direction;
                    const action = event.target.dataset.action;
                    if (direction) {
                        _navigateTo(direction);
                    } else if (action === 'interact-location') {
                        _exploreCurrentLocation();
                    }
                }
            });
        }

        // Location Actions (event delegation)
        const locActions = uiMgr.getDOMElement('locationActions');
        if (locActions) { // Check as it's dynamically populated
            locActions.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON') {
                    const actionId = event.target.dataset.action;
                    if (actionId) {
                        _handleLocationAction(actionId);
                    }
                }
            });
        }


        // Storylet Choices (event delegation)
        const storyChoices = uiMgr.getDOMElement('storyletChoices');
        if (storyChoices) {
            storyChoices.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON') {
                    const choiceIndex = parseInt(event.target.dataset.choiceIndex);
                    if (!isNaN(choiceIndex)) {
                        _handleStoryletChoice(choiceIndex);
                    }
                }
            });
        }

        // Encounter Controls
        const endTurnBtn = uiMgr.getDOMElement('endTurnEncounterButton');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', _handleEncounterEndTurn);
        }
        const revealTraitBtn = uiMgr.getDOMElement('revealTraitEncounterButton');
        if (revealTraitBtn) {
            revealTraitBtn.addEventListener('click', _handleEncounterRevealTrait);
        }

        // Encounter Hand (event delegation for playing cards)
        const playerHandElem = uiMgr.getDOMElement('playerHandCards');
        if (playerHandElem) {
            playerHandElem.addEventListener('click', (event) => {
                const cardElement = event.target.closest('.encounter-card-placeholder'); // Find card element
                if (cardElement && cardElement.dataset.cardId) {
                    if (encounterMgr.isActive() && !isGameOver) { // Check if encounter is active
                         _handleEncounterCardPlay(cardElement.dataset.cardId);
                    }
                }
            });
             // Add tooltip listeners for cards in hand
            playerHandElem.addEventListener('mouseover', (event) => {
                const cardElement = event.target.closest('.encounter-card-placeholder');
                if (cardElement && cardElement.dataset.cardId) {
                    const cardDef = CONCEPT_CARD_DEFINITIONS[cardElement.dataset.cardId];
                    if (cardDef) {
                        const tooltipContent = `<strong>${cardDef.name}</strong> (Cost: ${cardDef.cost}F)<br><em>${cardDef.type} - ${cardDef.attunement}</em><br>${cardDef.description}<br><small>Keywords: ${cardDef.keywords.join(', ')}</small>`;
                        uiMgr.showTooltip(tooltipContent, event);
                    }
                }
            });
            playerHandElem.addEventListener('mouseout', () => {
                uiMgr.hideTooltip();
            });
            playerHandElem.addEventListener('mousemove', (event) => {
                uiMgr.moveTooltip(event);
            });
        }


        // Modals
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton');
        if (viewDeckBtn) {
            viewDeckBtn.addEventListener('click', () => {
                uiMgr.displayFullDeck(currentPlayer.getFullDeckListData());
            });
        }

        // Event delegation for close modal buttons
        const modalOverlay = uiMgr.getDOMElement('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => {
                if (event.target.classList.contains('close-modal-button') || event.target === modalOverlay) {
                    // Close if clicked on overlay directly or a button with close-modal-button class
                    uiMgr.hideModals();
                }
            });
        }

        const restartBtn = document.getElementById('restart-game-button'); // Specific ID
        if (restartBtn) {
            restartBtn.addEventListener('click', restartGame);
        }

        // Add Journal Entry Button (simple example)
        const addJournalBtn = document.getElementById('add-journal-entry-button');
        if(addJournalBtn) {
            addJournalBtn.addEventListener('click', () => {
                const note = prompt("Enter your personal note for the journal:");
                if (note && note.trim() !== "") {
                    uiMgr.addJournalEntry("Personal Note", note.trim());
                }
            });
        }

        // Global key listeners (e.g., for Esc to close modals) could be added here too
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (!uiMgr.getDOMElement('modalOverlay').classList.contains('view-hidden')) {
                    uiMgr.hideModals();
                }
                // Potentially other Esc key actions
            }
        });

    }

    // --- Public API of Game object ---
    return {
        init,
        restartGame,
        // Expose specific functions if other modules absolutely need to trigger them,
        // but generally, events and callbacks are preferred.
        startEncounter,       // Allow StoryletManager to call this
        returnFromEncounter,  // Allow EncounterManager to call this
        getCurrentPlayer: () => currentPlayer, // For read-only access if needed
        getCurrentWorld: () => currentWorld,   // For read-only access
    };

})();

// --- Start the Game ---
// This is the true entry point once all scripts are loaded.
document.addEventListener('DOMContentLoaded', Game.init);
