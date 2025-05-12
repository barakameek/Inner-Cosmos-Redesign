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

    showStoryletDisplay() { // <<< --- METHOD ADDED HERE ---
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
        // Ensure gameStateRef is available for dynamic text function
        let buttonText = typeof choiceData.text === 'function' ? choiceData.text(R1_CONFIG.gameStateRef) : choiceData.text;
        button.innerHTML = `${buttonText} <span class="requirement">${requirementText || ''}</span>`;
        button.disabled = !isAvailable;
        button.onclick = onClickCallback;
        return button;
    }

    updateEventLog(message) {
        if (!this.eventLogContentEl) return;
        const newMessageEl = document.createElement('p');
        newMessageEl.textContent = message;
        // Prepend new message to keep latest at top, and limit log size
        this.eventLogContentEl.insertBefore(newMessageEl, this.eventLogContentEl.firstChild);
        while (this.eventLogContentEl.children.length > 20) { // Keep max 20 log entries
            this.eventLogContentEl.removeChild(this.eventLogContentEl.lastChild);
        }
    }

    updateAmbition(ambitionText) {
        if (this.ambitionTextEl) this.ambitionTextEl.textContent = ambitionText;
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
            this.mainActionButton.textContent = text;
            // To avoid multiple listeners piling up if callback is an anonymous function:
            // Clone and replace the button, or manage event listeners more carefully.
            // For simplicity here, we'll just reassign, assuming callbacks are managed.
            const newButton = this.mainActionButton.cloneNode(true);
            newButton.textContent = text;
            newButton.onclick = callback;
            this.mainActionButton.parentNode.replaceChild(newButton, this.mainActionButton);
            this.mainActionButton = newButton;
        }
    }
}

// --- Game State and Logic ---
const gameState = {
    player_character: { ...R1_CONFIG.gameSettings.initialPlayerStats },
    inventory: {
        concepts: [],
        key_items: [],
        resources: { // Example: clarity, etc.
            clarity: 0
        }
    },
    world_state: { // For story flags, completed storylets, etc.
        // Example: ShatteredShore_story_flags: { awakening_complete: true }
        // Example: completed_storylets: ["SS01_Awakening_Name"]
        ShatteredShore_story_flags: {}, // Initialize story flags for locations
        HearthstoneGrotto_story_flags: {},
        FlotsamGraveyards_story_flags: {},
        MuseumOfLostIdentities_story_flags: {},
        CrystallinePassageEntry_story_flags: {},
        WeepingKelpFringe_story_flags: {},
        GardenPathEntry_story_flags: {},
        completed_storylets: []
    },
    currentLocation: R1_CONFIG.gameSettings.startingLocation,
    currentRegion: R1_CONFIG.gameSettings.startingRegion,
    ambition: R1_CONFIG.gameSettings.initialAmbition,

    // Helper functions to modify gameState, ensuring UI updates can be triggered
    addConcept: function(conceptId) {
        if (!this.inventory.concepts.includes(conceptId)) {
            this.inventory.concepts.push(conceptId);
            const conceptData = R1_CONFIG.concepts[conceptId];
            if (conceptData && typeof conceptData.onAcquire === 'function') {
                uiManager.updateEventLog(conceptData.onAcquire(this)); // Pass 'this' (gameState)
            } else if (conceptData) {
                 uiManager.updateEventLog(`New Concept Acquired: ${conceptData.name}`);
            }
            uiManager.updateConcepts(this.inventory.concepts, R1_CONFIG.concepts);
        }
    },
    removeConcept: function(conceptId) {
        this.inventory.concepts = this.inventory.concepts.filter(c => c !== conceptId);
        uiManager.updateConcepts(this.inventory.concepts, R1_CONFIG.concepts);
    },
    addItem: function(itemName, itemCategory = "key_items") { // itemCategory can be 'key_items' or 'resources'
        if (itemCategory === "key_items") {
            if (!this.inventory.key_items.includes(itemName)) {
                this.inventory.key_items.push(itemName);
                uiManager.updateEventLog(`Acquired Item: ${itemName}`);
                uiManager.updateKeyItems(this.inventory.key_items);
            }
        } else if (itemCategory === "resources") { // Note: 'clarity' is under player_character in config, this is for generic resources
            this.inventory.resources[itemName] = (this.inventory.resources[itemName] || 0) + 1;
            // uiManager.updateResourcesDisplay(); // If you add a resources display
            uiManager.updateEventLog(`Gained Resource: ${itemName}`);
        }
    },
    removeItem: function(itemName, itemCategory = "key_items") {
        if (itemCategory === "key_items") {
            this.inventory.key_items = this.inventory.key_items.filter(i => i !== itemName);
            uiManager.updateKeyItems(this.inventory.key_items);
        } else if (itemCategory === "resources") {
            if (this.inventory.resources[itemName]) {
                this.inventory.resources[itemName]--;
                if (this.inventory.resources[itemName] <= 0) {
                    delete this.inventory.resources[itemName];
                }
                // uiManager.updateResourcesDisplay();
            }
        }
    },
    setWorldFlag: function(flagPath, value) {
        let path = flagPath.split('.');
        let obj = this.world_state;
        for (let i = 0; i < path.length - 1; i++) {
            if (typeof obj[path[i]] === 'undefined') { // Ensure intermediate objects exist
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
    // Initialize gameState.player_character.clarity if it's meant to be a resource in inventory
    if (typeof gameState.player_character.clarity !== 'undefined') {
        gameState.inventory.resources.clarity = gameState.player_character.clarity;
        delete gameState.player_character.clarity; // Remove from player_character if it's now in inventory.resources
    }


    storyletManager = new StoryletManager(R1_CONFIG, gameState, uiManager);

    // Initial UI setup based on gameState
    uiManager.updatePlayerStats(gameState.player_character);
    uiManager.updateAmbition(gameState.ambition);
    uiManager.updateConcepts(gameState.inventory.concepts, R1_CONFIG.concepts);
    uiManager.updateKeyItems(gameState.inventory.key_items);
    uiManager.updateAttunements(gameState.player_character.attunements);

    // Start the game by loading the first location and its onEnter storylet
    storyletManager.startCurrentLocation();

    // Setup initial main button action (will be overridden by storylet manager if storylet is active)
    // The storyletManager.loadStorylet also sets this button when a storylet is active
    // This is a fallback for when no storylet is active.
    if (document.getElementById('storylet-display').classList.contains('hidden')) {
        uiManager.setMainButton("Examine Surroundings", () => storyletManager.loadDefaultStoryletForLocation());
    }
};
