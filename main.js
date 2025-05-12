// main.js

class UIManager {
    constructor() {
        // Player Stats
        this.playerNameEl = document.getElementById('player-name');
        this.playerIntegrityEl = document.getElementById('player-integrity');
        this.playerMaxIntegrityEl = document.getElementById('player-max-integrity');
        this.playerFocusEl = document.getElementById('player-focus');
        this.playerMaxFocusEl = document.getElementById('player-max-focus');
        this.playerHopeEl = document.getElementById('player-hope');
        this.playerMaxHopeEl = document.getElementById('player-max-hope');
        this.playerDespairEl = document.getElementById('player-despair');
        this.playerMaxDespairEl = document.getElementById('player-max-despair');

        // Attunements
        this.attPsychologicalEl = document.getElementById('attunement-psychological');
        this.attCognitiveEl = document.getElementById('attunement-cognitive');
        this.attInteractionEl = document.getElementById('attunement-interaction');
        this.attSensoryEl = document.getElementById('attunement-sensory');

        // Location
        this.locationNameEl = document.getElementById('location-name');
        this.locationImageEl = document.getElementById('location-image');
        this.locationDescriptionEl = document.getElementById('location-description');

        // Storylet
        this.storyletDisplayEl = document.getElementById('storylet-display');
        this.storyletTitleEl = document.getElementById('storylet-title');
        this.storyletTextEl = document.getElementById('storylet-text');
        this.storyletChoicesEl = document.getElementById('storylet-choices');

        // Event Log
        this.eventLogContentEl = document.getElementById('event-log-content');

        // Sidebar
        this.ambitionTextEl = document.getElementById('ambition-text');
        this.conceptsListEl = document.getElementById('concepts-list');
        this.keyItemsListEl = document.getElementById('key-items-list');

        // Footer Buttons
        this.mainActionButton = document.getElementById('open-storylet-button'); // Initial main button
    }

    updatePlayerStats(stats) {
        if (this.playerNameEl) this.playerNameEl.textContent = stats.name || "Unnamed";
        if (this.playerIntegrityEl) this.playerIntegrityEl.textContent = Math.max(0, stats.integrity);
        if (this.playerMaxIntegrityEl) this.playerMaxIntegrityEl.textContent = stats.maxIntegrity;
        if (this.playerFocusEl) this.playerFocusEl.textContent = Math.max(0, stats.focus);
        if (this.playerMaxFocusEl) this.playerMaxFocusEl.textContent = stats.maxFocus;
        if (this.playerHopeEl) this.playerHopeEl.textContent = Math.max(0, stats.hope);
        if (this.playerMaxHopeEl) this.playerMaxHopeEl.textContent = stats.maxHope;
        if (this.playerDespairEl) this.playerDespairEl.textContent = Math.max(0, stats.despair);
        if (this.playerMaxDespairEl) this.playerMaxDespairEl.textContent = stats.maxDespair;
    }

    updateAttunements(attunements) {
        if (this.attPsychologicalEl) this.attPsychologicalEl.textContent = attunements.psychological;
        if (this.attCognitiveEl) this.attCognitiveEl.textContent = attunements.cognitive;
        if (this.attInteractionEl) this.attInteractionEl.textContent = attunements.interaction;
        if (this.attSensoryEl) this.attSensoryEl.textContent = attunements.sensory;
    }

    updateLocationDisplay(name, description, imageName) {
        if (this.locationNameEl) this.locationNameEl.textContent = name;
        if (this.locationDescriptionEl) this.locationDescriptionEl.textContent = description;
        if (this.locationImageEl) {
            this.locationImageEl.src = imageName || 'images/placeholder.png'; // Fallback image
            this.locationImageEl.alt = name;
        }
    }

    displayStorylet(title, text) {
        if (this.storyletTitleEl) this.storyletTitleEl.textContent = title;
        if (this.storyletTextEl) this.storyletTextEl.innerHTML = text.replace(/\n/g, '<br>'); // Preserve newlines
    }

    showStoryletDisplay() {
        if (this.storyletDisplayEl) this.storyletDisplayEl.classList.remove('hidden');
    }

    hideStoryletDisplay() {
        if (this.storyletDisplayEl) this.storyletDisplayEl.classList.add('hidden');
        if (this.storyletTitleEl) this.storyletTitleEl.textContent = "";
        if (this.storyletTextEl) this.storyletTextEl.textContent = "";
        if (this.storyletChoicesEl) this.storyletChoicesEl.innerHTML = "";
    }

    createChoiceButton(choiceData, index, isAvailable, requirementText, onClickCallback) {
        const button = document.createElement('button');
        // Ensure gameStateRef is available for dynamic text function if choiceData.text is a function
        let buttonText = typeof choiceData.text === 'function' ? choiceData.text(R1_CONFIG.gameStateRef) : choiceData.text;
        button.innerHTML = `${buttonText} <span class="requirement">${requirementText || ''}</span>`;
        button.disabled = !isAvailable;
        button.onclick = onClickCallback;
        return button;
    }

    updateEventLog(message) {
        if (!this.eventLogContentEl || !message || message.trim() === "") return; // Don't log empty messages
        const newMessageEl = document.createElement('p');
        newMessageEl.textContent = message;
        // Prepend new message to keep latest at top, and limit log size
        this.eventLogContentEl.insertBefore(newMessageEl, this.eventLogContentEl.firstChild);
        while (this.eventLogContentEl.children.length > 20) { // Keep max 20 log entries
            this.eventLogContentEl.removeChild(this.eventLogContentEl.lastChild);
        }
    }

    updateAmbition(ambitionText) {
        if (this.ambitionTextEl) {
            if(this.ambitionTextEl.textContent !== ambitionText) { // Only log if it changes
                this.updateEventLog(`Ambition Updated: ${ambitionText}`);
            }
            this.ambitionTextEl.textContent = ambitionText;
        }
    }

    updateConcepts(playerConcepts, allConceptsData) {
        if (!this.conceptsListEl) return;
        this.conceptsListEl.innerHTML = '';
        playerConcepts.forEach(conceptId => {
            const conceptData = allConceptsData[conceptId];
            if (conceptData) {
                const li = document.createElement('li');
                li.textContent = conceptData.name;
                li.title = conceptData.description; // Tooltip for description
                this.conceptsListEl.appendChild(li);
            }
        });
        if (playerConcepts.length === 0) {
            this.conceptsListEl.innerHTML = '<li>No concepts acquired.</li>';
        }
    }

    updateKeyItems(playerKeyItems) {
        if (!this.keyItemsListEl) return;
        this.keyItemsListEl.innerHTML = '';
        playerKeyItems.forEach(itemName => { // Assuming key items are just strings for now
            const li = document.createElement('li');
            li.textContent = itemName;
            this.keyItemsListEl.appendChild(li);
        });
        if (playerKeyItems.length === 0) {
            this.keyItemsListEl.innerHTML = '<li>No key items held.</li>';
        }
    }

    setMainButton(text, callback) {
        if (this.mainActionButton) {
            // Clone and replace the button to safely change the event listener
            const newButton = this.mainActionButton.cloneNode(true);
            newButton.textContent = text;
            newButton.onclick = callback; // Assign new callback
            this.mainActionButton.parentNode.replaceChild(newButton, this.mainActionButton);
            this.mainActionButton = newButton; // Update the reference
        }
    }
}

// --- Game State and Logic ---
const gameState = {
    player_character: { ...R1_CONFIG.gameSettings.initialPlayerStats }, // Deep copy for safety
    inventory: {
        concepts: [],
        key_items: [],
        resources: {
            // clarity: 0 // Will be initialized from initialPlayerStats if present
        }
    },
    world_state: {
        ShatteredShore_story_flags: {},
        HearthstoneGrotto_story_flags: {},
        FlotsamGraveyards_story_flags: {},
        MuseumOfLostIdentities_story_flags: {},
        CrystallinePassageEntry_story_flags: {},
        WeepingKelpFringe_story_flags: {},
        GardenPathEntry_story_flags: {},
        WhisperingIsle_story_flags: {},
        completed_storylets: [],
        // regional_quest_R1: {} // This will be initialized by the quest giver storylet
    },
    currentLocation: R1_CONFIG.gameSettings.startingLocation,
    currentRegion: R1_CONFIG.gameSettings.startingRegion,
    ambition: R1_CONFIG.gameSettings.initialAmbition,

    // Helper functions to modify gameState
    addConcept: function(conceptId) {
        if (!this.inventory.concepts.includes(conceptId)) {
            this.inventory.concepts.push(conceptId);
            const conceptData = R1_CONFIG.concepts[conceptId];
            let logMsg = "";
            if (conceptData && typeof conceptData.onAcquire === 'function') {
                logMsg = conceptData.onAcquire(this); // Pass 'this' (gameState)
            } else if (conceptData) {
                 logMsg = `New Concept Acquired: ${conceptData.name}`;
            }
            if (uiManager) uiManager.updateEventLog(logMsg); // Check if uiManager is initialized
            if (uiManager) uiManager.updateConcepts(this.inventory.concepts, R1_CONFIG.concepts);
        }
    },
    removeConcept: function(conceptId) {
        this.inventory.concepts = this.inventory.concepts.filter(c => c !== conceptId);
        if (uiManager) uiManager.updateConcepts(this.inventory.concepts, R1_CONFIG.concepts);
    },
    addItem: function(itemName, itemCategory = "key_items") {
        if (itemCategory === "key_items") {
            if (!this.inventory.key_items.includes(itemName)) {
                this.inventory.key_items.push(itemName);
                if (uiManager) uiManager.updateEventLog(`Acquired Item: ${itemName}`);
                if (uiManager) uiManager.updateKeyItems(this.inventory.key_items);
            }
        } else if (itemCategory === "resources") {
            this.inventory.resources[itemName] = (this.inventory.resources[itemName] || 0) + 1;
            if (uiManager) uiManager.updateEventLog(`Gained Resource: ${itemName}`);
            // if (uiManager) uiManager.updateResourcesDisplay(); // If you add a resources display
        }
    },
    removeItem: function(itemName, itemCategory = "key_items") {
        let removed = false;
        if (itemCategory === "key_items") {
            const initialLength = this.inventory.key_items.length;
            this.inventory.key_items = this.inventory.key_items.filter(i => i !== itemName);
            removed = this.inventory.key_items.length < initialLength;
            if (removed && uiManager) uiManager.updateKeyItems(this.inventory.key_items);
        } else if (itemCategory === "resources") {
            if (this.inventory.resources[itemName] && this.inventory.resources[itemName] > 0) {
                this.inventory.resources[itemName]--;
                removed = true;
                if (this.inventory.resources[itemName] <= 0) {
                    delete this.inventory.resources[itemName];
                }
                // if (uiManager) uiManager.updateResourcesDisplay();
            }
        }
        // if (removed && uiManager) uiManager.updateEventLog(`Lost: ${itemName}`); // Optional: Log item loss
        return removed; // Return whether item was actually removed
    },
    setWorldFlag: function(flagPath, value) {
        let path = flagPath.split('.');
        let obj = this.world_state;
        for (let i = 0; i < path.length - 1; i++) {
            if (typeof obj[path[i]] === 'undefined') {
                obj[path[i]] = {};
            }
            obj = obj[path[i]];
        }
        obj[path[path.length - 1]] = value;
    },
    getWorldFlag: function(flagPath) {
        let path = flagPath.split('.');
        let obj = this.world_state;
        for (let i = 0; i < path.length; i++) {
            if (!obj || typeof obj[path[i]] === 'undefined') return undefined;
            obj = obj[path[i]];
        }
        return obj;
    }
};

// --- Initialization ---
let uiManager;
let storyletManager;

window.onload = () => {
    uiManager = new UIManager();

    // Handle 'clarity' if it was in initialPlayerStats and should be a resource
    // Also ensure player_character.attunements is an object
    if (gameState.player_character && !gameState.player_character.attunements) {
        gameState.player_character.attunements = { psychological: 1, cognitive: 1, interaction: 1, sensory: 1 };
    }
    if (R1_CONFIG.gameSettings.initialPlayerStats.clarity !== undefined) { // Check config if clarity was there
        gameState.inventory.resources.clarity = R1_CONFIG.gameSettings.initialPlayerStats.clarity;
        // delete gameState.player_character.clarity; // Only if it was on player_character to begin with
    } else if (typeof gameState.inventory.resources.clarity === 'undefined') {
        // Ensure clarity resource exists if not set from player_character
        gameState.inventory.resources.clarity = 0;
    }


    storyletManager = new StoryletManager(R1_CONFIG, gameState, uiManager);

    // Initial UI setup based on gameState
    uiManager.updatePlayerStats(gameState.player_character);
    uiManager.updateAmbition(gameState.ambition); // This will now also log if ambition changes
    uiManager.updateConcepts(gameState.inventory.concepts, R1_CONFIG.concepts);
    uiManager.updateKeyItems(gameState.inventory.key_items);
    uiManager.updateAttunements(gameState.player_character.attunements);

    // Start the game by loading the first location and its onEnter storylet
    storyletManager.startCurrentLocation();

    // The main button's state (text and action) is primarily managed by storyletManager
    // when a storylet is active or hidden. This is a fallback.
    if (document.getElementById('storylet-display').classList.contains('hidden')) {
        uiManager.setMainButton("Examine Surroundings", () => storyletManager.loadDefaultStoryletForLocation());
    }
};
