// js/ui_manager.js

const UIManager = (() => { // Using an IIFE to create a module-like structure

    // --- Cache DOM Elements ---
    // We'll cache frequently accessed elements to avoid repeated DOM lookups.
    // This will be populated in an init() function.
    const DOM = {
        // Header
        psychonautNameDisplay: null,
        currentAmbitionDisplay: null,

        // Player Status Panel
        playerIntegrityBar: null,
        playerIntegrityValue: null,
        playerFocusBar: null,
        playerFocusValue: null,
        playerClarityBar: null,
        playerClarityValue: null,
        playerHopeBar: null,
        playerHopeValue: null,
        playerDespairBar: null,
        playerDespairValue: null,
        attunementsListItems: {}, // e.g., attunementsListItems.attraction for the span
        activeMemoriesList: null,

        // World Interaction Panel (Views)
        mapView: null,
        locationView: null,
        storyletView: null,
        encounterView: null,

        // Map View
        mapDisplayArea: null,
        currentRegionName: null,
        navigationControls: null,

        // Location View
        locationName: null,
        locationDescription: null,
        locationActions: null,

        // Storylet View
        storyletTitle: null,
        storyletText: null,
        storyletChoices: null,

        // Encounter View
        aspectNameEncounter: null,
        aspectResolveEncounter: null,
        aspectComposureEncounter: null,
        aspectResonanceEncounter: null,
        aspectDissonanceEncounter: null,
        aspectIntentEncounter: null,
        aspectTraitsEncounter: null,
        playerFocusEncounter: null,
        playerIntegrityEncounter: null,
        playerStanceEncounter: null,
        playerHandCards: null,
        endTurnEncounterButton: null,
        revealTraitEncounterButton: null,


        // Context Panel
        deckCountDisplay: null,
        discardCountDisplay: null,
        traumaCountDisplay: null,
        viewDeckButton: null,
        logEntries: null,
        journalEntries: null,

        // Footer
        gameMenuButton: null,

        // Modals
        modalOverlay: null,
        modalDeckView: null,
        fullDeckList: null,
        modalGameOver: null,
        gameOverTitle: null,
        gameOverText: null,

        // Tooltip
        tooltip: null,
    };

    // --- Initialization ---
    function init() {
        // Cache all DOM elements
        DOM.psychonautNameDisplay = document.querySelector('#psychonaut-name-display .value');
        DOM.currentAmbitionDisplay = document.querySelector('#current-ambition-display .value');

        DOM.playerIntegrityBar = document.getElementById('player-integrity-bar');
        DOM.playerIntegrityValue = document.getElementById('player-integrity-value');
        DOM.playerFocusBar = document.getElementById('player-focus-bar');
        DOM.playerFocusValue = document.getElementById('player-focus-value');
        DOM.playerClarityBar = document.getElementById('player-clarity-bar');
        DOM.playerClarityValue = document.getElementById('player-clarity-value');
        DOM.playerHopeBar = document.getElementById('player-hope-bar');
        DOM.playerHopeValue = document.getElementById('player-hope-value');
        DOM.playerDespairBar = document.getElementById('player-despair-bar');
        DOM.playerDespairValue = document.getElementById('player-despair-value');

        // Cache attunement spans
        for (const key in ATTUNEMENT_DEFINITIONS) {
            DOM.attunementsListItems[key] = document.getElementById(`attunement-${key.charAt(0).toLowerCase()}`);
        }
        DOM.activeMemoriesList = document.getElementById('active-memories-list');

        DOM.mapView = document.getElementById('map-view');
        DOM.locationView = document.getElementById('location-view');
        DOM.storyletView = document.getElementById('storylet-view');
        DOM.encounterView = document.getElementById('encounter-view');

        DOM.mapDisplayArea = document.getElementById('map-display-area');
        DOM.currentRegionName = document.querySelector('#current-region-name');
        DOM.navigationControls = document.getElementById('navigation-controls');

        DOM.locationName = document.getElementById('location-name');
        DOM.locationDescription = document.getElementById('location-description');
        DOM.locationActions = document.getElementById('location-actions');

        DOM.storyletTitle = document.getElementById('storylet-title');
        DOM.storyletText = document.getElementById('storylet-text');
        DOM.storyletChoices = document.getElementById('storylet-choices');

        // Encounter View elements
        DOM.aspectNameEncounter = document.getElementById('aspect-name-encounter');
        DOM.aspectResolveEncounter = document.getElementById('aspect-resolve-encounter');
        DOM.aspectComposureEncounter = document.getElementById('aspect-composure-encounter');
        DOM.aspectResonanceEncounter = document.getElementById('aspect-resonance-encounter');
        DOM.aspectDissonanceEncounter = document.getElementById('aspect-dissonance-encounter');
        DOM.aspectIntentEncounter = document.getElementById('aspect-intent-encounter');
        DOM.aspectTraitsEncounter = document.getElementById('aspect-traits-encounter');
        DOM.playerFocusEncounter = document.getElementById('player-focus-encounter');
        DOM.playerIntegrityEncounter = document.getElementById('player-integrity-encounter');
        DOM.playerStanceEncounter = document.getElementById('player-stance-encounter');
        DOM.playerHandCards = document.getElementById('player-hand-cards');
        DOM.endTurnEncounterButton = document.getElementById('end-turn-encounter');
        DOM.revealTraitEncounterButton = document.getElementById('reveal-trait-encounter');

        DOM.deckCountDisplay = document.getElementById('deck-count-display');
        DOM.discardCountDisplay = document.getElementById('discard-count-display');
        DOM.traumaCountDisplay = document.getElementById('trauma-count-display');
        DOM.viewDeckButton = document.getElementById('view-deck-button');
        DOM.logEntries = document.getElementById('log-entries');
        DOM.journalEntries = document.getElementById('journal-entries');

        DOM.gameMenuButton = document.getElementById('game-menu-button');

        DOM.modalOverlay = document.getElementById('modal-overlay');
        DOM.modalDeckView = document.getElementById('modal-deck-view');
        DOM.fullDeckList = document.getElementById('full-deck-list');
        DOM.modalGameOver = document.getElementById('modal-game-over');
        DOM.gameOverTitle = document.getElementById('game-over-title');
        DOM.gameOverText = document.getElementById('game-over-text');

        DOM.tooltip = document.getElementById('tooltip');

        console.log("UIManager initialized and DOM elements cached.");
    }

    // --- Helper Functions ---
    function _updateBar(barElement, value, maxValue) {
        if (barElement && maxValue > 0) {
            const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
            barElement.style.width = percentage + '%';
        } else if (barElement) {
            barElement.style.width = '0%';
        }
    }

    function _setText(element, text) {
        if (element) {
            element.textContent = text;
        }
    }

    // --- View Management ---
    function showView(viewToShow) {
        const views = [DOM.mapView, DOM.locationView, DOM.storyletView, DOM.encounterView];
        views.forEach(view => {
            if (view) { // Check if element exists
                if (view === viewToShow) {
                    view.classList.remove('view-hidden');
                    view.classList.add('view-active');
                } else {
                    view.classList.remove('view-active');
                    view.classList.add('view-hidden');
                }
            }
        });
    }

    // --- Player Status Updates ---
    function updatePlayerStats(playerData) {
        if (!playerData) return;

        _setText(DOM.playerIntegrityValue, `${playerData.integrity}/${playerData.maxIntegrity}`);
        _updateBar(DOM.playerIntegrityBar, playerData.integrity, playerData.maxIntegrity);

        _setText(DOM.playerFocusValue, `${playerData.focus}/${playerData.maxFocus}`);
        _updateBar(DOM.playerFocusBar, playerData.focus, playerData.maxFocus);

        _setText(DOM.playerClarityValue, `${playerData.clarity}/${playerData.maxClarity}`);
        _updateBar(DOM.playerClarityBar, playerData.clarity, playerData.maxClarity);

        _setText(DOM.playerHopeValue, `${playerData.hope}/${playerData.maxHope}`);
        _updateBar(DOM.playerHopeBar, playerData.hope, playerData.maxHope);

        _setText(DOM.playerDespairValue, `${playerData.despair}/${playerData.maxDespair}`);
        _updateBar(DOM.playerDespairBar, playerData.despair, playerData.maxDespair);

        if (playerData.attunements) {
            for (const key in playerData.attunements) {
                if (DOM.attunementsListItems[key]) {
                    _setText(DOM.attunementsListItems[key], playerData.attunements[key]);
                }
            }
        }
    }

    function updateActiveMemories(memoriesArray) {
        if (!DOM.activeMemoriesList) return;
        DOM.activeMemoriesList.innerHTML = ''; // Clear old memories
        if (memoriesArray && memoriesArray.length > 0) {
            memoriesArray.forEach(memory => {
                const li = document.createElement('li');
                // Assuming memory is an object with a 'name' property
                li.textContent = memory.name || memory; // Fallback if it's just a string
                DOM.activeMemoriesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.innerHTML = `<span class="placeholder">No active memories</span>`;
            DOM.activeMemoriesList.appendChild(li);
        }
    }

    // --- World Interaction Updates ---
    function updateMapView(worldData) {
        if (!worldData || !worldData.currentLocation) return;
        _setText(DOM.currentRegionName, worldData.currentLocation.region || "Unknown Region");
        // More complex map rendering would go here (e.g., text-based, or drawing on a canvas)
        if (DOM.mapDisplayArea) {
            DOM.mapDisplayArea.innerHTML = `<p>${worldData.currentLocation.description || "You are somewhere in the Inner Sea."}</p>`;
            DOM.mapDisplayArea.innerHTML += `<p>Current Region: <span id="current-region-name" class="value">${worldData.currentLocation.region || "Unknown Region"}</span></p>`;
             // Re-assign because innerHTML overwrites
            DOM.currentRegionName = DOM.mapDisplayArea.querySelector('#current-region-name');
        }
    }

    function displayLocation(locationData) {
        if (!locationData) return;
        showView(DOM.locationView);
        _setText(DOM.locationName, locationData.name);
        if (DOM.locationDescription) {
            DOM.locationDescription.innerHTML = `<p>${locationData.description}</p>`;
        }
        // Populate location actions dynamically
        if (DOM.locationActions) {
            DOM.locationActions.innerHTML = '<h3>Actions:</h3>'; // Clear old actions
            if (locationData.actions && locationData.actions.length > 0) {
                locationData.actions.forEach(actionId => {
                    // In a real game, actionId would map to a defined action
                    const button = document.createElement('button');
                    button.dataset.action = actionId;
                    button.textContent = actionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Prettify
                    DOM.locationActions.appendChild(button);
                });
            }
            const leaveButton = document.createElement('button');
            leaveButton.dataset.action = "leave-location";
            leaveButton.textContent = "Return to Navigation";
            DOM.locationActions.appendChild(leaveButton);
        }
    }

    function displayStorylet(storyletData) {
        if (!storyletData) return;
        showView(DOM.storyletView);
        _setText(DOM.storyletTitle, storyletData.title);
        if (DOM.storyletText) {
            DOM.storyletText.innerHTML = `<p>${storyletData.text.replace(/\n/g, '</p><p>')}</p>`; // Handle newlines
        }
        if (DOM.storyletChoices) {
            DOM.storyletChoices.innerHTML = '<h3>Choices:</h3>'; // Clear old choices
            if (storyletData.choices && storyletData.choices.length > 0) {
                storyletData.choices.forEach((choice, index) => {
                    const button = document.createElement('button');
                    button.dataset.choiceIndex = index; // Use index for simplicity
                    button.textContent = choice.text;
                    DOM.storyletChoices.appendChild(button);
                });
            }
        }
    }

    // --- Encounter View Updates ---
    function displayEncounterView(aspectData, playerData) {
        showView(DOM.encounterView);
        if (!aspectData || !playerData) return;

        _setText(DOM.aspectNameEncounter, aspectData.name);
        _setText(DOM.aspectResolveEncounter, `${aspectData.resolve}/${aspectData.maxResolve}`);
        _setText(DOM.aspectComposureEncounter, aspectData.composure);
        _setText(DOM.aspectResonanceEncounter, `${aspectData.resonance}/${aspectData.resonanceGoal}`);
        _setText(DOM.aspectDissonanceEncounter, `${aspectData.dissonance}/${aspectData.dissonanceThreshold}`);
        _setText(DOM.aspectIntentEncounter, aspectData.currentIntent ? aspectData.currentIntent.description : "Thinking...");

        if (DOM.aspectTraitsEncounter) {
            DOM.aspectTraitsEncounter.innerHTML = '';
            aspectData.visibleTraits.forEach(trait => {
                const li = document.createElement('li');
                li.textContent = `${trait.name}: ${trait.description}`;
                DOM.aspectTraitsEncounter.appendChild(li);
            });
            aspectData.hiddenTraits.forEach(trait => { // Show revealed hidden traits
                 if (aspectData.revealedTraits && aspectData.revealedTraits.includes(trait.name)) {
                    const li = document.createElement('li');
                    li.innerHTML = `<em>(Revealed)</em> ${trait.name}: ${trait.description}`;
                    DOM.aspectTraitsEncounter.appendChild(li);
                } else {
                    // Could add a placeholder for hidden ones if desired
                }
            });
        }

        _setText(DOM.playerFocusEncounter, `${playerData.focus}/${playerData.maxFocus}`);
        _setText(DOM.playerIntegrityEncounter, `${playerData.integrity}/${playerData.maxIntegrity}`);
        _setText(DOM.playerStanceEncounter, playerData.personaStance ? playerData.personaStance.name : "None");
    }

    function updatePlayerHand(hand) { // hand is an array of card objects
        if (!DOM.playerHandCards) return;
        DOM.playerHandCards.innerHTML = ''; // Clear current hand
        if (hand && hand.length > 0) {
            hand.forEach(cardData => { // cardData from CONCEPT_CARD_DEFINITIONS
                const cardEl = document.createElement('div');
                cardEl.classList.add('encounter-card-placeholder'); // Use placeholder style for now
                cardEl.dataset.cardId = cardData.id;
                cardEl.innerHTML = `<strong>${cardData.name}</strong><br><small>Cost: ${cardData.cost}F</small><br><small>${cardData.keywords.join(', ')}</small>`;
                // Add event listener for playing the card (handled by encounter_manager)
                DOM.playerHandCards.appendChild(cardEl);
            });
        } else {
            DOM.playerHandCards.innerHTML = `<span class="placeholder">No concepts in hand.</span>`;
        }
    }


    // --- Context Panel Updates ---
    function updateDeckInfo(deckCount, discardCount, traumaCount) {
        _setText(DOM.deckCountDisplay, deckCount);
        _setText(DOM.discardCountDisplay, discardCount);
        _setText(DOM.traumaCountDisplay, traumaCount);
    }

    function addLogEntry(message, type = "normal") { // type can be 'normal', 'system', 'error', 'reward'
        if (!DOM.logEntries) return;
        const p = document.createElement('p');
        p.classList.add('log-entry');
        if (type) {
            p.classList.add(type); // For specific styling
        }
        p.textContent = message;
        DOM.logEntries.appendChild(p);
        // Auto-scroll to bottom
        DOM.logEntries.scrollTop = DOM.logEntries.scrollHeight;

        // Optional: Trim log if it gets too long
        if (DOM.logEntries.children.length > (CONFIG.LOG_MAX_ENTRIES || 50)) {
            DOM.logEntries.removeChild(DOM.logEntries.firstChild);
        }
    }

    function addJournalEntry(title, text) {
        if (!DOM.journalEntries) return;
        const entryDiv = document.createElement('div'); // Could be a p or more complex
        entryDiv.classList.add('journal-entry');
        entryDiv.innerHTML = `<span class="entry-title">${title}:</span> ${text}`;
        DOM.journalEntries.appendChild(entryDiv);
        DOM.journalEntries.scrollTop = DOM.journalEntries.scrollHeight;

        if (DOM.journalEntries.children.length > (CONFIG.JOURNAL_MAX_ENTRIES || 20)) {
            DOM.journalEntries.removeChild(DOM.journalEntries.firstChild);
        }
    }

    // --- Modal Management ---
    function showModal(modalElement) {
        if (DOM.modalOverlay && modalElement) {
            // Hide all other modals first
            const allModals = DOM.modalOverlay.querySelectorAll('.modal-content');
            allModals.forEach(mod => mod.classList.add('view-hidden'));

            modalElement.classList.remove('view-hidden');
            DOM.modalOverlay.classList.remove('view-hidden');
        }
    }

    function hideModals() {
        if (DOM.modalOverlay) {
            DOM.modalOverlay.classList.add('view-hidden');
            const allModals = DOM.modalOverlay.querySelectorAll('.modal-content');
            allModals.forEach(mod => mod.classList.add('view-hidden'));
        }
    }

    function displayFullDeck(deckArray) { // deckArray is array of card objects
        if (!DOM.fullDeckList) return;
        DOM.fullDeckList.innerHTML = '';
        if (deckArray && deckArray.length > 0) {
            deckArray.forEach(cardData => {
                const li = document.createElement('li');
                li.textContent = `${cardData.name} (Cost: ${cardData.cost}F) - ${cardData.description}`;
                DOM.fullDeckList.appendChild(li);
            });
        } else {
            DOM.fullDeckList.innerHTML = `<li>Your deck is empty.</li>`;
        }
        showModal(DOM.modalDeckView);
    }

    function displayGameOver(title, message) {
        if (DOM.gameOverTitle) _setText(DOM.gameOverTitle, title);
        if (DOM.gameOverText) _setText(DOM.gameOverText, message);
        showModal(DOM.modalGameOver);
    }

    // --- Tooltip Management ---
    function showTooltip(content, event) {
        if (!DOM.tooltip) return;
        DOM.tooltip.innerHTML = content;
        DOM.tooltip.classList.remove('view-hidden');
        moveTooltip(event); // Initial position
    }

    function hideTooltip() {
        if (DOM.tooltip) {
            DOM.tooltip.classList.add('view-hidden');
        }
    }

    function moveTooltip(event) {
        if (!DOM.tooltip || DOM.tooltip.classList.contains('view-hidden')) return;
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        const tooltipRect = DOM.tooltip.getBoundingClientRect();
        // Basic boundary check to prevent tooltip from going off-screen
        if (x + tooltipRect.width > window.innerWidth) {
            x = event.clientX - tooltipRect.width - 15;
        }
        if (y + tooltipRect.height > window.innerHeight) {
            y = event.clientY - tooltipRect.height - 15;
        }
        DOM.tooltip.style.left = `${x}px`;
        DOM.tooltip.style.top = `${y}px`;
    }


    // --- Public API ---
    // Expose only the functions that other modules need to call
    return {
        init,
        updatePlayerStats,
        updateActiveMemories,
        showView,
        updateMapView,
        displayLocation,
        displayStorylet,
        displayEncounterView,
        updatePlayerHand,
        updateDeckInfo,
        addLogEntry,
        addJournalEntry,
        showModal,
        hideModals,
        displayFullDeck,
        displayGameOver,
        showTooltip,
        hideTooltip,
        moveTooltip,
        // Expose DOM elements if needed by other modules for event listeners, though it's often cleaner
        // to set up event listeners within UIManager or have main.js coordinate.
        // For now, let's keep it minimal.
        getDOMElement: (elementName) => DOM[elementName] // Provide controlled access if needed
    };

})();

// Event listener to initialize UIManager once DOM is loaded
// This should ideally be called from main.js after all scripts are loaded.
// document.addEventListener('DOMContentLoaded', UIManager.init);
// For now, we'll assume main.js will handle the calling order.
