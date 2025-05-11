// js/ui_manager.js

const UIManager = (() => { // Using an IIFE to create a module-like structure

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
        attunementsListItems: {},
        activeMemoriesList: null,

        // World Interaction Panel (Views)
        preGameIntroView: null, // NEW
        preGameTitle: null, // NEW
        preGameTextArea: null, // NEW
        continueFromPrecipiceButton: null, // NEW

        mapView: null,
        locationView: null,
        storyletView: null,
        encounterView: null,

        // Map View (Node Map)
        nodeMapContainer: null, // NEW for node map
        currentNodeMapName: null, // NEW Title for map view
        mapNodeInfo: null, // NEW
        currentNodeNameDisplay: null, // NEW
        currentNodeDescriptionDisplay: null, // NEW
        exploreCurrentNodeButton: null, // NEW

        // Location View
        locationName: null,
        locationDescription: null,
        locationActions: null,
        returnToMapFromLocationButton: null, // NEW

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
        playerComposureEncounter: null, // Added this
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
        addJournalEntryButton: null, // NEW

        // Footer
        gameMenuButton: null,

        // Modals
        modalOverlay: null,
        modalDeckView: null,
        fullDeckList: null,
        modalGameOver: null,
        gameOverTitle: null,
        gameOverText: null,
        restartGameButton: null, // NEW

        // Tooltip
        tooltip: null,
    };

    let preGameIntroLineIndex = 0;
    let preGameIntroTimeout = null;

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

        for (const key in ATTUNEMENT_DEFINITIONS) {
            DOM.attunementsListItems[key] = document.getElementById(`attunement-${key.charAt(0).toLowerCase()}`);
        }
        DOM.activeMemoriesList = document.getElementById('active-memories-list');

        DOM.preGameIntroView = document.getElementById('pre-game-intro-view');
        DOM.preGameTitle = document.getElementById('pre-game-title');
        DOM.preGameTextArea = document.getElementById('pre-game-text-area');
        DOM.continueFromPrecipiceButton = document.getElementById('continue-from-precipice');

        DOM.mapView = document.getElementById('map-view');
        DOM.locationView = document.getElementById('location-view');
        DOM.storyletView = document.getElementById('storylet-view');
        DOM.encounterView = document.getElementById('encounter-view');

        DOM.nodeMapContainer = document.getElementById('node-map-container');
        DOM.currentNodeMapName = document.getElementById('current-node-map-name');
        DOM.mapNodeInfo = document.getElementById('map-node-info');
        DOM.currentNodeNameDisplay = document.getElementById('current-node-name-display');
        DOM.currentNodeDescriptionDisplay = document.getElementById('current-node-description-display');
        DOM.exploreCurrentNodeButton = document.getElementById('explore-current-node-button');

        DOM.locationName = document.getElementById('location-name');
        DOM.locationDescription = document.getElementById('location-description');
        DOM.locationActions = document.getElementById('location-actions');
        DOM.returnToMapFromLocationButton = document.getElementById('return-to-map-from-location');

        DOM.storyletTitle = document.getElementById('storylet-title');
        DOM.storyletText = document.getElementById('storylet-text');
        DOM.storyletChoices = document.getElementById('storylet-choices');

        DOM.aspectNameEncounter = document.getElementById('aspect-name-encounter');
        DOM.aspectResolveEncounter = document.getElementById('aspect-resolve-encounter');
        DOM.aspectComposureEncounter = document.getElementById('aspect-composure-encounter');
        DOM.aspectResonanceEncounter = document.getElementById('aspect-resonance-encounter');
        DOM.aspectDissonanceEncounter = document.getElementById('aspect-dissonance-encounter');
        DOM.aspectIntentEncounter = document.getElementById('aspect-intent-encounter');
        DOM.aspectTraitsEncounter = document.getElementById('aspect-traits-encounter');
        DOM.playerFocusEncounter = document.getElementById('player-focus-encounter');
        DOM.playerIntegrityEncounter = document.getElementById('player-integrity-encounter');
        DOM.playerComposureEncounter = document.getElementById('player-composure-encounter');
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
        DOM.addJournalEntryButton = document.getElementById('add-journal-entry-button');

        DOM.gameMenuButton = document.getElementById('game-menu-button');

        DOM.modalOverlay = document.getElementById('modal-overlay');
        DOM.modalDeckView = document.getElementById('modal-deck-view');
        DOM.fullDeckList = document.getElementById('full-deck-list');
        DOM.modalGameOver = document.getElementById('modal-game-over');
        DOM.gameOverTitle = document.getElementById('game-over-title');
        DOM.gameOverText = document.getElementById('game-over-text');
        DOM.restartGameButton = document.getElementById('restart-game-button');

        DOM.tooltip = document.getElementById('tooltip');
        console.log("UIManager initialized and DOM elements cached.");
    }

    // --- Helper Functions ---
    function _updateBar(barElement, value, maxValue) {
        if (barElement && typeof value === 'number' && typeof maxValue === 'number' && maxValue >= 0) {
            const percentage = maxValue === 0 ? 0 : Math.max(0, Math.min(100, (value / maxValue) * 100));
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
    function _setHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    }

    // --- View Management ---
    function showView(viewToShowId) { // Pass ID of the view to show
        const views = [
            DOM.preGameIntroView, DOM.mapView, DOM.locationView,
            DOM.storyletView, DOM.encounterView
        ];
        views.forEach(view => {
            if (view) {
                if (view.id === viewToShowId) {
                    view.classList.remove('view-hidden');
                    view.classList.add('view-active');
                } else {
                    view.classList.remove('view-active');
                    view.classList.add('view-hidden');
                }
            }
        });
    }

    // --- Pre-Game Intro ---
    function startPreGameIntro() {
        showView('pre-game-intro-view');
        preGameIntroLineIndex = 0;
        if (DOM.preGameTextArea) DOM.preGameTextArea.innerHTML = ''; // Clear previous lines
        if (DOM.continueFromPrecipiceButton) DOM.continueFromPrecipiceButton.classList.add('view-hidden');
        _displayNextPreGameLine();
    }

    function _displayNextPreGameLine() {
        if (preGameIntroLineIndex < PRE_GAME_INTRO_LINES.length) {
            const p = document.createElement('p');
            p.classList.add('intro-line');
            p.innerHTML = PRE_GAME_INTRO_LINES[preGameIntroLineIndex]; // Use innerHTML for <em>
            if (DOM.preGameTextArea) DOM.preGameTextArea.appendChild(p);
            preGameIntroLineIndex++;
            // CSS animation handles the fade-in of the line itself
            preGameIntroTimeout = setTimeout(_displayNextPreGameLine, CONFIG.PRE_GAME_INTRO_LINE_DELAY);
        } else {
            // All lines displayed, show the continue button
            if (DOM.continueFromPrecipiceButton) {
                 DOM.continueFromPrecipiceButton.classList.remove('view-hidden');
                 // Add animation to button if desired
            }
        }
    }

    function clearPreGameIntroTimeout() { // To stop timeout if player clicks early
        if (preGameIntroTimeout) {
            clearTimeout(preGameIntroTimeout);
            preGameIntroTimeout = null;
        }
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
        DOM.activeMemoriesList.innerHTML = '';
        if (memoriesArray && memoriesArray.length > 0) {
            memoriesArray.forEach(memory => { // Assuming memory is an object with 'name'
                const li = document.createElement('li');
                li.textContent = memory.name || memory;
                DOM.activeMemoriesList.appendChild(li);
            });
        } else {
            _setHTML(DOM.activeMemoriesList, `<li><span class="placeholder">No memories stir...</span></li>`);
        }
    }

    // --- World Interaction Updates (Node Map) ---
    function renderNodeMap(allNodes, currentNodeId, accessibleNodeIds = []) {
        if (!DOM.nodeMapContainer) return;
        DOM.nodeMapContainer.innerHTML = ''; // Clear previous map

        // Basic rendering: create divs for each node
        // A real implementation might use SVG for lines and more complex positioning.
        for (const nodeId in allNodes) {
            const nodeData = allNodes[nodeId];
            const nodeEl = document.createElement('div');
            nodeEl.classList.add('map-node');
            nodeEl.dataset.nodeId = nodeId;
            nodeEl.style.left = `${nodeData.position.x}%`; // Use percentages for responsiveness
            nodeEl.style.top = `${nodeData.position.y}%`;  // Or fixed pixels

            nodeEl.innerHTML = `<span class="map-node-name">${nodeData.name}</span><span class="map-node-type">${nodeData.type || nodeData.shortDesc || ""}</span>`;

            if (nodeId === currentNodeId) {
                nodeEl.classList.add('current');
            }
            if (accessibleNodeIds.includes(nodeId) && nodeId !== currentNodeId) {
                nodeEl.classList.add('accessible');
            } else if (nodeId !== currentNodeId) {
                nodeEl.classList.add('inaccessible'); // Or 'locked' based on game logic
            }
            DOM.nodeMapContainer.appendChild(nodeEl);
        }
        // TODO: Draw connection lines (e.g., using SVG or by absolutely positioned divs)
        // This is complex and omitted for this skeleton.
    }

    function updateCurrentNodeInfo(nodeData) {
        if (!nodeData) {
            _setText(DOM.currentNodeMapName, "The Uncharted Void");
            _setText(DOM.currentNodeNameDisplay, "Lost");
            _setHTML(DOM.currentNodeDescriptionDisplay, "Your senses fail to grasp this place.");
            return;
        }
        _setText(DOM.currentNodeMapName, nodeData.name); // For the h2 title of map view
        _setText(DOM.currentNodeNameDisplay, nodeData.name);
        _setHTML(DOM.currentNodeDescriptionDisplay, nodeData.shortDesc || nodeData.description || "An unknown space.");
    }


    function displayLocation(locationData) { // For Sanctuaries / complex hubs
        if (!locationData) return;
        showView('location-view');
        _setText(DOM.locationName, locationData.name);
        _setHTML(DOM.locationDescription, `<p>${locationData.description || "..."}</p>`);

        if (DOM.locationActions) {
            DOM.locationActions.innerHTML = '<h3>Actions:</h3>';
            if (locationData.actions && locationData.actions.length > 0) {
                locationData.actions.forEach(actionId => {
                    const button = document.createElement('button');
                    button.dataset.action = actionId;
                    button.textContent = actionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    DOM.locationActions.appendChild(button);
                });
            }
            // The "Return to Navigation" button is static in HTML, just ensure it's visible
            if (DOM.returnToMapFromLocationButton) DOM.returnToMapFromLocationButton.classList.remove('view-hidden');
        }
    }

    function displayStorylet(storyletData) {
        if (!storyletData) return;
        showView('storylet-view');
        _setText(DOM.storyletTitle, storyletData.title);
        _setHTML(DOM.storyletText, `<p>${(storyletData.text || "").replace(/\n/g, '</p><p>')}</p>`);

        if (DOM.storyletChoices) {
            DOM.storyletChoices.innerHTML = '<h3>Choices:</h3>';
            if (storyletData.choices && storyletData.choices.length > 0) {
                storyletData.choices.forEach((choice, index) => {
                    const button = document.createElement('button');
                    button.dataset.choiceIndex = index;
                    button.textContent = choice.text;
                    // Disable choice if condition not met (logic in StoryletManager, UI reflects)
                    if (choice.disabled) {
                        button.disabled = true;
                        button.title = choice.disabledReason || "Cannot choose this option";
                    }
                    DOM.storyletChoices.appendChild(button);
                });
            }
        }
    }

    // --- Encounter View Updates ---
    function displayEncounterView(aspectData, playerData, playerEncounterState) { // Added playerEncounterState
        showView('encounter-view');
        if (!aspectData || !playerData || !playerEncounterState) return;

        _setText(DOM.aspectNameEncounter, aspectData.name);
        _setText(DOM.aspectResolveEncounter, `${aspectData.resolve}/${aspectData.maxResolve}`);
        _setText(DOM.aspectComposureEncounter, aspectData.composure);
        _setText(DOM.aspectResonanceEncounter, `${aspectData.resonance}/${aspectData.resonanceGoal}`);
        _setText(DOM.aspectDissonanceEncounter, `${aspectData.dissonance}/${aspectData.dissonanceThreshold}`);
        _setText(DOM.aspectIntentEncounter, aspectData.currentIntent ? aspectData.currentIntent.description : "Scheming...");

        if (DOM.aspectTraitsEncounter) {
            DOM.aspectTraitsEncounter.innerHTML = '';
            (aspectData.visibleTraits || []).forEach(trait => _addTraitLi(trait.name, trait.description));
            (aspectData.hiddenTraits || []).forEach(trait => {
                if (aspectData.revealedTraits && aspectData.revealedTraits.includes(trait.name)) {
                    _addTraitLi(trait.name, trait.description, true);
                }
            });
        }
        function _addTraitLi(name, description, isRevealed = false) {
            const li = document.createElement('li');
            li.innerHTML = `${isRevealed ? '<em>(Revealed)</em> ' : ''}<strong>${name}:</strong> ${description}`;
            DOM.aspectTraitsEncounter.appendChild(li);
        }

        _setText(DOM.playerFocusEncounter, `${playerData.focus}/${playerData.maxFocus}`);
        _setText(DOM.playerIntegrityEncounter, `${playerData.integrity}/${playerData.maxIntegrity}`);
        _setText(DOM.playerComposureEncounter, playerEncounterState.composure); // Display player's encounter composure
        _setText(DOM.playerStanceEncounter, playerData.activePersonaStance ? playerData.activePersonaStance.name : "None");
    }

    function updatePlayerHand(handCardDefinitions) { // Expects array of full card def objects
        if (!DOM.playerHandCards) return;
        DOM.playerHandCards.innerHTML = '';
        if (handCardDefinitions && handCardDefinitions.length > 0) {
            handCardDefinitions.forEach(cardDef => {
                const cardEl = document.createElement('div');
                cardEl.classList.add('encounter-card-placeholder'); // Re-using class, but now it's styled better
                cardEl.dataset.cardId = cardDef.id;
                cardEl.innerHTML = `
                    <div class="card-name-encounter">${cardDef.name} <span class="card-cost-encounter">${cardDef.cost}F</span></div>
                    <div class="card-type-encounter">${cardDef.type} - ${cardDef.attunement}</div>
                    <div class="card-desc-encounter">${cardDef.description}</div>
                    <div class="card-keywords-encounter">${(cardDef.keywords || []).join(', ')}</div>
                `;
                DOM.playerHandCards.appendChild(cardEl);
            });
        } else {
            _setHTML(DOM.playerHandCards, `<span class="placeholder">No concepts in hand.</span>`);
        }
    }


    // --- Context Panel Updates ---
    function updateDeckInfo(deckCount, discardCount, traumaCount) {
        _setText(DOM.deckCountDisplay, deckCount);
        _setText(DOM.discardCountDisplay, discardCount);
        _setText(DOM.traumaCountDisplay, traumaCount);
    }

    function addLogEntry(message, type = "normal") {
        if (!DOM.logEntries) return;
        const p = document.createElement('p');
        p.classList.add('log-entry', type); // Add base and specific type class
        p.innerHTML = message; // Use innerHTML if message contains formatting
        DOM.logEntries.appendChild(p);
        DOM.logEntries.scrollTop = DOM.logEntries.scrollHeight;
        if (DOM.logEntries.children.length > (CONFIG.LOG_MAX_ENTRIES || 50)) {
            DOM.logEntries.removeChild(DOM.logEntries.firstChild);
        }
    }

    function addJournalEntry(title, text) {
        if (!DOM.journalEntries) return;
        if (DOM.journalEntries.querySelector('.placeholder')) {
            DOM.journalEntries.innerHTML = ''; // Clear placeholder if it's the first entry
        }
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('journal-entry');
        entryDiv.innerHTML = `<span class="entry-title">${title}:</span> ${text.replace(/\n/g, '<br>')}`;
        DOM.journalEntries.appendChild(entryDiv);
        DOM.journalEntries.scrollTop = DOM.journalEntries.scrollHeight;
        if (DOM.journalEntries.children.length > (CONFIG.JOURNAL_MAX_ENTRIES || 20)) {
            DOM.journalEntries.removeChild(DOM.journalEntries.firstChild);
        }
    }

    // --- Modal Management ---
    function showModal(modalContentElementId) { // Pass ID of the modal content to show
        if (DOM.modalOverlay) {
            const allModals = DOM.modalOverlay.querySelectorAll('.modal-content');
            allModals.forEach(mod => mod.classList.add('view-hidden'));

            const targetModal = document.getElementById(modalContentElementId);
            if (targetModal) {
                targetModal.classList.remove('view-hidden');
                DOM.modalOverlay.classList.remove('view-hidden');
            } else {
                console.error("Modal content not found:", modalContentElementId);
            }
        }
    }

    function hideModals() {
        if (DOM.modalOverlay) {
            DOM.modalOverlay.classList.add('view-hidden');
            const allModals = DOM.modalOverlay.querySelectorAll('.modal-content');
            allModals.forEach(mod => mod.classList.add('view-hidden'));
        }
    }

    function displayFullDeck(deckCardDefinitions) {
        if (!DOM.fullDeckList) return;
        DOM.fullDeckList.innerHTML = '';
        if (deckCardDefinitions && deckCardDefinitions.length > 0) {
            deckCardDefinitions.forEach(cardDef => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${cardDef.name}</strong> (Cost: ${cardDef.cost}F) <br><small><em>${cardDef.type} - ${cardDef.attunement}</em></small><br><small>${cardDef.description}</small>`;
                DOM.fullDeckList.appendChild(li);
            });
        } else {
            _setHTML(DOM.fullDeckList, `<li>Your deck is empty.</li>`);
        }
        showModal('modal-deck-view');
    }

    function displayGameOver(title, message) {
        _setText(DOM.gameOverTitle, title);
        _setText(DOM.gameOverText, message);
        showModal('modal-game-over');
    }

    // --- Tooltip Management ---
    function showTooltip(content, event) {
        if (!DOM.tooltip) return;
        DOM.tooltip.innerHTML = content;
        DOM.tooltip.classList.remove('view-hidden');
        moveTooltip(event);
    }

    function hideTooltip() {
        if (DOM.tooltip) DOM.tooltip.classList.add('view-hidden');
    }

    function moveTooltip(event) {
        if (!DOM.tooltip || DOM.tooltip.classList.contains('view-hidden')) return;
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        const tooltipRect = DOM.tooltip.getBoundingClientRect();
        if (x + tooltipRect.width > window.innerWidth) x = event.clientX - tooltipRect.width - 15;
        if (y + tooltipRect.height > window.innerHeight) y = event.clientY - tooltipRect.height - 15;
        DOM.tooltip.style.left = `${x}px`;
        DOM.tooltip.style.top = `${y}px`;
    }

    return {
        init,
        // Pre-Game
        startPreGameIntro,
        clearPreGameIntroTimeout,
        // Player
        updatePlayerStats,
        updateActiveMemories,
        // Views
        showView,
        // Map
        renderNodeMap,
        updateCurrentNodeInfo,
        // Location
        displayLocation,
        // Storylet
        displayStorylet,
        // Encounter
        displayEncounterView,
        updatePlayerHand,
        // Context
        updateDeckInfo,
        addLogEntry,
        addJournalEntry,
        // Modals
        showModal, // Now takes modal content ID
        hideModals,
        displayFullDeck,
        displayGameOver,
        // Tooltip
        showTooltip,
        hideTooltip,
        moveTooltip,
        getDOMElement: (elementName) => DOM[elementName]
    };
})();
