// js/ui_manager.js

const UIManager = (() => { 

    const DOM = {
        // Header
        psychonautNameDisplay: null,
        currentAmbitionDisplay: null,

        // Player Status Panel (Now Dashboard & Status Modal)
        // No direct bar elements here anymore, they are in dashboard or status modal

        // World Interaction Panel (Views on Main Stage)
        preGameIntroView: null,
        preGameTitle: null,
        preGameTextArea: null,
        continueFromPrecipiceButton: null,

        mapView: null,
        mapHeaderTitle: null,
        nodeMapContainer: null,
        mapNodeInfoPanel: null,
        currentNodeNameDisplay: null,
        currentNodeDescriptionDisplay: null,
        exploreCurrentNodeButton: null,
        reflectInsightsButton: null,

        locationView: null,
        locationName: null,
        locationDescriptionMain: null,
        locationActionsMain: null,
        returnToMapFromLocationMainButton: null,

        storyletView: null,
        storyletTitle: null,
        storyletTextMain: null,
        storyletChoicesMain: null,

        encounterView: null,
        encounterHeaderTitle: null,
        encounterAspectDisplay: null,
        aspectResolveEncounter: null,
        aspectComposureEncounter: null,
        aspectResonanceEncounter: null,
        aspectDissonanceEncounter: null,
        aspectIntentEncounter: null,
        aspectTraitsEncounterMinimal: null,
        playerHandEncounterOverlay: null,
        revealTraitEncounterButton: null,
        endTurnEncounterButton: null,

        // Dashboard (Bottom Bar)
        dashboard: null,
        vitalIntegrityValue: null,
        vitalFocusValue: null,
        vitalClarityValue: null,
        vitalHopeValue: null,
        vitalDespairValue: null,
        dashboardJournalButton: null,
        dashboardStatusButton: null,
        dashboardConceptsButton: null,
        dashboardMenuButton: null,

        // Event Log Notifications
        eventLogNotificationsContainer: null,

        // Full Screen Modals
        modalOverlayFullscreen: null,
        journalModal: null,
        journalEntriesModal: null,
        addJournalEntryModalButton: null,
        statusModal: null,
        statusAttunementsModal: null, // Div inside status modal for attunements
        statusMemoriesModal: null,   // Div inside status modal for memories
        conceptsModal: null,
        conceptsDeckInfoModal: null,
        conceptsFullDeckListModal: null,
        reflectInsightsModal: null,
        playableInsightsList: null,
        gameOverModalFullscreen: null,
        gameOverTitleFullscreen: null,
        gameOverTextFullscreen: null,
        restartGameModalButton: null,
        closeFullscreenModalButtons: [],

        // Tooltip
        tooltip: null,
    };

    let preGameIntroLineIndex = 0;
    let preGameIntroTimeout = null;

    function init() {
        DOM.psychonautNameDisplay = document.querySelector('#psychonaut-name-display .value');
        DOM.currentAmbitionDisplay = document.querySelector('#current-ambition-display .value');

        DOM.preGameIntroView = document.getElementById('pre-game-intro-view');
        DOM.preGameTitle = document.getElementById('pre-game-title');
        DOM.preGameTextArea = document.getElementById('pre-game-text-area');
        DOM.continueFromPrecipiceButton = document.getElementById('continue-from-precipice');

        DOM.mapView = document.getElementById('map-view');
        DOM.mapHeaderTitle = document.querySelector('#map-view #map-header h2 span.value'); // Assuming span holds the dynamic part
        DOM.nodeMapContainer = document.getElementById('node-map-container');
        DOM.mapNodeInfoPanel = document.getElementById('map-node-interaction-panel');
        DOM.currentNodeNameDisplay = document.getElementById('current-node-name-display');
        DOM.currentNodeDescriptionDisplay = document.getElementById('current-node-description-display');
        DOM.exploreCurrentNodeButton = document.getElementById('explore-current-node-button');
        DOM.reflectInsightsButton = document.getElementById('reflect-insights-button');

        DOM.locationView = document.getElementById('location-view');
        DOM.locationName = document.querySelector('#location-view #location-name');
        DOM.locationDescriptionMain = document.getElementById('location-description-main');
        DOM.locationActionsMain = document.getElementById('location-actions-main');
        DOM.returnToMapFromLocationMainButton = document.getElementById('return-to-map-from-location-main');

        DOM.storyletView = document.getElementById('storylet-view');
        DOM.storyletTitle = document.querySelector('#storylet-view #storylet-title');
        DOM.storyletTextMain = document.getElementById('storylet-text-main');
        DOM.storyletChoicesMain = document.getElementById('storylet-choices-main');

        DOM.encounterView = document.getElementById('encounter-view');
        DOM.encounterHeaderTitle = document.querySelector('#encounter-view #encounter-header span'); // Assuming span for aspect name
        DOM.encounterAspectDisplay = document.getElementById('encounter-aspect-display');
        DOM.aspectResolveEncounter = document.getElementById('aspect-resolve-encounter');
        DOM.aspectComposureEncounter = document.getElementById('aspect-composure-encounter');
        DOM.aspectResonanceEncounter = document.getElementById('aspect-resonance-encounter');
        DOM.aspectDissonanceEncounter = document.getElementById('aspect-dissonance-encounter');
        DOM.aspectIntentEncounter = document.getElementById('aspect-intent-encounter');
        DOM.aspectTraitsEncounterMinimal = document.getElementById('aspect-traits-encounter-minimal');
        DOM.playerHandEncounterOverlay = document.getElementById('player-hand-encounter-overlay');
        DOM.revealTraitEncounterButton = document.querySelector('#encounter-view #reveal-trait-encounter');
        DOM.endTurnEncounterButton = document.querySelector('#encounter-view #end-turn-encounter');

        DOM.dashboard = document.getElementById('psychonaut-dashboard');
        DOM.vitalIntegrityValue = document.querySelector('#vital-integrity .value');
        DOM.vitalFocusValue = document.querySelector('#vital-focus .value');
        DOM.vitalClarityValue = document.querySelector('#vital-clarity .value');
        DOM.vitalHopeValue = document.querySelector('#vital-hope .value');
        DOM.vitalDespairValue = document.querySelector('#vital-despair .value');
        DOM.dashboardJournalButton = document.getElementById('dashboard-journal-button');
        DOM.dashboardStatusButton = document.getElementById('dashboard-status-button');
        DOM.dashboardConceptsButton = document.getElementById('dashboard-concepts-button');
        DOM.dashboardMenuButton = document.getElementById('dashboard-menu-button');

        DOM.eventLogNotificationsContainer = document.getElementById('event-log-notifications');

        DOM.modalOverlayFullscreen = document.getElementById('modal-overlay-fullscreen');
        DOM.journalModal = document.getElementById('journal-modal');
        DOM.journalEntriesModal = document.getElementById('journal-entries-modal');
        DOM.addJournalEntryModalButton = document.getElementById('add-journal-entry-modal-button');
        DOM.statusModal = document.getElementById('status-modal');
        DOM.statusAttunementsModal = document.getElementById('status-attunements-modal');
        DOM.statusMemoriesModal = document.getElementById('status-memories-modal');
        DOM.conceptsModal = document.getElementById('concepts-modal');
        DOM.conceptsDeckInfoModal = document.getElementById('concepts-deck-info-modal');
        DOM.conceptsFullDeckListModal = document.getElementById('concepts-full-deck-list-modal');
        DOM.reflectInsightsModal = document.getElementById('reflect-insights-modal');
        DOM.playableInsightsList = document.getElementById('playable-insights-list');
        DOM.gameOverModalFullscreen = document.getElementById('game-over-modal-fullscreen');
        DOM.gameOverTitleFullscreen = document.getElementById('game-over-title-fullscreen');
        DOM.gameOverTextFullscreen = document.getElementById('game-over-text-fullscreen');
        DOM.restartGameModalButton = document.getElementById('restart-game-modal-button');
        DOM.closeFullscreenModalButtons = document.querySelectorAll('.close-fullscreen-modal-button');

        DOM.tooltip = document.getElementById('tooltip');
        console.log("UIManager (v3 Immersive UI - Full Corrected v2) initialized.");
    }

    function _setText(element, text) { if (element) element.textContent = text; }
    function _setHTML(element, html) { if (element) element.innerHTML = html; }

    function _showViewActualDOM(viewToShowId) {
        const views = [ DOM.preGameIntroView, DOM.mapView, DOM.locationView, DOM.storyletView, DOM.encounterView ];
        views.forEach(view => {
            if (view) { 
                if (view.id === viewToShowId) {
                    view.classList.remove('view-hidden'); view.classList.add('view-active');
                } else {
                    view.classList.remove('view-active'); view.classList.add('view-hidden');
                }
            }
        });
    }

    function startPreGameIntro() { 
        _showViewActualDOM('pre-game-intro-view'); 
        preGameIntroLineIndex = 0; 
        if (DOM.preGameTextArea) DOM.preGameTextArea.innerHTML = ''; 
        if (DOM.continueFromPrecipiceButton) DOM.continueFromPrecipiceButton.classList.add('view-hidden'); 
        _displayNextPreGameLine(); 
    }

    function _displayNextPreGameLine() { 
        if (typeof PRE_GAME_INTRO_LINES !== 'undefined' && typeof CONFIG !== 'undefined' && preGameIntroLineIndex < PRE_GAME_INTRO_LINES.length) { 
            const p = document.createElement('p'); 
            p.classList.add('intro-line'); 
            p.style.animationDelay = `${preGameIntroLineIndex * 0.25}s`; 
            p.innerHTML = PRE_GAME_INTRO_LINES[preGameIntroLineIndex]; 
            if (DOM.preGameTextArea) DOM.preGameTextArea.appendChild(p); 
            preGameIntroLineIndex++; 
            preGameIntroTimeout = setTimeout(_displayNextPreGameLine, CONFIG.PRE_GAME_INTRO_LINE_DELAY); 
        } else { 
            if (DOM.continueFromPrecipiceButton) { 
                DOM.continueFromPrecipiceButton.classList.remove('view-hidden'); 
            } 
        } 
    }
    function clearPreGameIntroTimeout() { if (preGameIntroTimeout) clearTimeout(preGameIntroTimeout); preGameIntroTimeout = null; }

    function updateDashboardVitals(playerData) {
        if (!playerData || !DOM.dashboard) return;
        _setText(DOM.vitalIntegrityValue, `${playerData.integrity}/${playerData.maxIntegrity}`);
        _setText(DOM.vitalFocusValue, `${playerData.focus}/${playerData.maxFocus}`);
        _setText(DOM.vitalClarityValue, `${playerData.clarity}/${playerData.maxClarity}`);
        _setText(DOM.vitalHopeValue, `${playerData.hope}/${playerData.maxHope}`);
        _setText(DOM.vitalDespairValue, `${playerData.despair}/${playerData.maxDespair}`);
    }
    
    function updateStatusModal(playerData) {
        if (!DOM.statusAttunementsModal || !playerData || !playerData.attunements) return;
        DOM.statusAttunementsModal.innerHTML = '<h3>Attunements</h3><ul>';
        if (typeof ATTUNEMENT_DEFINITIONS !== 'undefined') {
            for (const key in playerData.attunements) {
                const attunementName = ATTUNEMENT_DEFINITIONS[key] ? ATTUNEMENT_DEFINITIONS[key].name : key;
                DOM.statusAttunementsModal.innerHTML += `<li>${attunementName}: <span class="value">${playerData.attunements[key]}</span></li>`;
            }
        }
        DOM.statusAttunementsModal.innerHTML += '</ul>';

        if (!DOM.statusMemoriesModal) return;
        DOM.statusMemoriesModal.innerHTML = '<h3>Active Memories</h3><ul>';
        if (playerData.memories && playerData.memories.length > 0) {
            playerData.memories.forEach(memory => {
                DOM.statusMemoriesModal.innerHTML += `<li><strong>${memory.name}:</strong> ${memory.description || "An echo of the past."}</li>`;
            });
        } else {
            DOM.statusMemoriesModal.innerHTML += `<li><span class="placeholder">No memories stir...</span></li>`;
        }
        DOM.statusMemoriesModal.innerHTML += '</ul>';
    }

    function renderNodeMap(allNodesData, currentNodeId, accessibleNodeIds = []) { 
        if (!DOM.nodeMapContainer) return; 
        DOM.nodeMapContainer.innerHTML = ''; 
        for (const nodeId in allNodesData) { 
            const nodeData = allNodesData[nodeId]; 
            const nodeEl = document.createElement('div'); 
            nodeEl.classList.add('map-node'); 
            nodeEl.dataset.nodeId = nodeId; 
            nodeEl.style.left = `calc(${nodeData.position.x}% - ${130/2}px)`; 
            nodeEl.style.top = `calc(${nodeData.position.y}% - ${75/2}px)`;  
            nodeEl.innerHTML = `<span class="map-node-name">${nodeData.name}</span><span class="map-node-type">${nodeData.type || nodeData.shortDesc || ""}</span>`; 
            if (nodeId === currentNodeId) nodeEl.classList.add('current'); 
            if (accessibleNodeIds.includes(nodeId) && nodeId !== currentNodeId) { 
                nodeEl.classList.add('accessible'); 
            } else if (nodeId !== currentNodeId) { 
                nodeEl.classList.add('inaccessible'); 
            } 
            DOM.nodeMapContainer.appendChild(nodeEl); 
        } 
    }
    function updateCurrentNodeInfo(nodeData) { 
        const mapHeaderTitleEl = DOM.mapHeaderTitle || document.querySelector('#map-view #map-header h2 span.value'); // Fallback selector
        if (!nodeData) { 
            if(mapHeaderTitleEl) _setText(mapHeaderTitleEl, "The Uncharted Void");
            _setText(DOM.currentNodeNameDisplay, "Lost"); 
            _setHTML(DOM.currentNodeDescriptionDisplay, "Your senses fail to grasp this place."); 
            if(DOM.exploreCurrentNodeButton) DOM.exploreCurrentNodeButton.disabled = true;
            if(DOM.reflectInsightsButton) DOM.reflectInsightsButton.classList.add('view-hidden');
            return; 
        } 
        if(mapHeaderTitleEl) _setText(mapHeaderTitleEl, nodeData.name); 
        _setText(DOM.currentNodeNameDisplay, nodeData.name); 
        _setHTML(DOM.currentNodeDescriptionDisplay, nodeData.shortDesc || nodeData.description || "An unknown space."); 
        if(DOM.exploreCurrentNodeButton) DOM.exploreCurrentNodeButton.disabled = false;
    }

    function displayLocation(locationData) { 
        if (!locationData) return; 
        _setText(DOM.locationName, locationData.name); 
        _setHTML(DOM.locationDescriptionMain, `<p>${(locationData.description || "...").replace(/\n/g, '</p><p>')}</p>`); 
        if (DOM.locationActionsMain) { 
            DOM.locationActionsMain.innerHTML = '<h3>Actions:</h3>'; 
            if (locationData.actions && locationData.actions.length > 0) { 
                locationData.actions.forEach(actionId => { 
                    const button = document.createElement('button'); 
                    button.dataset.action = actionId; 
                    button.textContent = actionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); 
                    DOM.locationActionsMain.appendChild(button); 
                }); 
            }
            if(DOM.returnToMapFromLocationMainButton) { 
                if (!DOM.locationActionsMain.contains(DOM.returnToMapFromLocationMainButton)) {
                     DOM.locationActionsMain.appendChild(DOM.returnToMapFromLocationMainButton.cloneNode(true)); // Re-add if cleared
                }
                DOM.returnToMapFromLocationMainButton.classList.remove('view-hidden');
            }
        } 
    }
    function displayStorylet(storyletInstanceData) { 
        if (!storyletInstanceData) return; 
        _setText(DOM.storyletTitle, storyletInstanceData.title); 
        _setHTML(DOM.storyletTextMain, `<p>${(storyletInstanceData.text || "").replace(/\n/g, '</p><p>')}</p>`); 
        if (DOM.storyletChoicesMain) { 
            DOM.storyletChoicesMain.innerHTML = '<h3>Choices:</h3>'; 
            if (storyletInstanceData.choices && storyletInstanceData.choices.length > 0) { 
                storyletInstanceData.choices.forEach((choice, index) => { 
                    const button = document.createElement('button'); 
                    button.dataset.choiceIndex = index; 
                    button.textContent = choice.text; 
                    if (choice.disabled) { button.disabled = true; button.title = choice.disabledReason || "This choice is currently unavailable."; } 
                    DOM.storyletChoicesMain.appendChild(button); 
                }); 
            } else { _setHTML(DOM.storyletChoicesMain, `<p class="placeholder">No choices present themselves.</p>`); } 
        } 
    }
    function displayEncounterView(aspectData, playerData, playerEncounterState) { 
        if (!aspectData || !playerData || !playerEncounterState) return; 
        const encounterHeaderTitleEl = DOM.encounterHeaderTitle || document.querySelector('#encounter-view #encounter-header span');
        if(encounterHeaderTitleEl) _setText(encounterHeaderTitleEl, aspectData.name); 
        _setText(DOM.aspectResolveEncounter, `${aspectData.resolve}/${aspectData.maxResolve}`); 
        _setText(DOM.aspectComposureEncounter, aspectData.composure); 
        _setText(DOM.aspectResonanceEncounter, `${aspectData.resonance}/${aspectData.resonanceGoal}`); 
        _setText(DOM.aspectDissonanceEncounter, `${aspectData.dissonance}/${aspectData.dissonanceThreshold}`); 
        _setText(DOM.aspectIntentEncounter, aspectData.currentIntent ? aspectData.currentIntent.description : "Contemplating..."); 
        if (DOM.aspectTraitsEncounterMinimal) { 
            DOM.aspectTraitsEncounterMinimal.innerHTML = 'Traits: '; 
            (aspectData.visibleTraits || []).forEach(trait => _addTraitSpanToEncounterUI(trait.name)); 
            (aspectData.hiddenTraits || []).forEach(trait => { if (aspectData.revealedTraits && aspectData.revealedTraits.includes(trait.name)) { _addTraitSpanToEncounterUI(trait.name, true); } }); 
        } 
        function _addTraitSpanToEncounterUI(name, isRevealed = false) { 
            const span = document.createElement('span'); 
            span.innerHTML = `${isRevealed ? '<em>(R)</em> ' : ''}${name}; `; 
            if (DOM.aspectTraitsEncounterMinimal) DOM.aspectTraitsEncounterMinimal.appendChild(span); 
        } 
        // These IDs are for the simplified encounter player status, not dashboard
        const playerFocusEncEl = document.querySelector('#encounter-view #player-focus-encounter');
        const playerIntegrityEncEl = document.querySelector('#encounter-view #player-integrity-encounter');
        const playerCompEncEl = document.querySelector('#encounter-view #player-composure-encounter');
        const playerStanceEncEl = document.querySelector('#encounter-view #player-stance-encounter');

        if(playerFocusEncEl) _setText(playerFocusEncEl, `${playerData.focus}/${playerData.maxFocus}`); 
        if(playerIntegrityEncEl) _setText(playerIntegrityEncEl, `${playerData.integrity}/${playerData.maxIntegrity}`); 
        if(playerCompEncEl) _setText(playerCompEncEl, playerEncounterState.composure); 
        if(playerStanceEncEl) _setText(playerStanceEncEl, playerData.activePersonaStance ? playerData.activePersonaStance.name : "None"); 
    }
    function updatePlayerHand(handCardDefinitions) { 
        if (!DOM.playerHandEncounterOverlay) return; 
        DOM.playerHandEncounterOverlay.innerHTML = ''; 
        if (handCardDefinitions && handCardDefinitions.length > 0) { 
            handCardDefinitions.forEach(cardDef => { 
                const cardEl = document.createElement('div'); 
                cardEl.classList.add('encounter-card-placeholder'); 
                cardEl.dataset.cardId = cardDef.id; 
                cardEl.innerHTML = ` <div class="card-name-encounter">${cardDef.name} <span class="card-cost-encounter">${cardDef.cost}F</span></div> <div class="card-type-encounter">${cardDef.type}</div> <div class="card-desc-encounter">${(cardDef.description || "").substring(0,50)}...</div> <div class="card-keywords-encounter">${(cardDef.keywords || []).join(', ')}</div> `; 
                DOM.playerHandEncounterOverlay.appendChild(cardEl); 
            }); 
        } else { _setHTML(DOM.playerHandEncounterOverlay, `<span class="placeholder">No concepts in hand.</span>`); } 
    }

    function addEventLogNotification(message, type = "normal", duration) { 
        if (!DOM.eventLogNotificationsContainer || typeof CONFIG === 'undefined') return; 
        const noteEl = document.createElement('div'); 
        noteEl.classList.add('event-log-notification-item', type); 
        noteEl.innerHTML = message; 
        DOM.eventLogNotificationsContainer.appendChild(noteEl); 
        const displayDuration = duration || CONFIG.EVENT_NOTIFICATION_DURATION; 
        setTimeout(() => { 
            noteEl.style.opacity = '0'; 
            setTimeout(() => { 
                if (noteEl.parentElement) noteEl.remove(); 
            }, 500); 
        }, displayDuration - 500); 
    }
    
    function addJournalEntryDOM(title, text) { 
        if (!DOM.journalEntriesModal || typeof CONFIG === 'undefined') return;
        if (DOM.journalEntriesModal.querySelector('.placeholder')) {
            DOM.journalEntriesModal.innerHTML = ''; 
        }
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('journal-entry');
        entryDiv.innerHTML = `<h4 class="entry-title">${title}</h4><p>${text.replace(/\n/g, '<br>')}</p>`;
        DOM.journalEntriesModal.appendChild(entryDiv);
        DOM.journalEntriesModal.scrollTop = DOM.journalEntriesModal.scrollHeight;
        if (DOM.journalEntriesModal.children.length > (CONFIG.JOURNAL_MAX_ENTRIES || 20)) {
            DOM.journalEntriesModal.removeChild(DOM.journalEntriesModal.firstChild);
        }
    }

    function displayJournalModal(journalEntriesDataArray) { 
        if (!DOM.journalEntriesModal) return;
        DOM.journalEntriesModal.innerHTML = '';
        if (journalEntriesDataArray && journalEntriesDataArray.length > 0) {
            journalEntriesDataArray.forEach(entry => {
                // Call internal DOM updater, assuming Game.addJournalEntry handles data storage
                addJournalEntryDOM(entry.title, entry.text); 
            });
        } else {
            _setHTML(DOM.journalEntriesModal, `<p class="placeholder">The journal is empty.</p>`);
        }
        _showModalActualDOM('journal-modal');
    }

    function displayConceptsModal(deckInfo, fullDeckCardDefinitions) { 
        if (!DOM.conceptsDeckInfoModal || !DOM.conceptsFullDeckListModal) return; 
        _setHTML(DOM.conceptsDeckInfoModal, ` <p>In Deck: <span class="value">${deckInfo.deck}</span> | In Hand: <span class="value">${deckInfo.hand}</span></p> <p>In Discard: <span class="value">${deckInfo.discard}</span> | Traumas: <span class="value">${deckInfo.traumas}</span></p> `); 
        DOM.conceptsFullDeckListModal.innerHTML = ''; 
        if (fullDeckCardDefinitions && fullDeckCardDefinitions.length > 0) { 
            fullDeckCardDefinitions.forEach(cardDef => { 
                const li = document.createElement('li'); 
                li.innerHTML = `<strong>${cardDef.name}</strong> (Cost: ${cardDef.cost}F) <br><small><em>${cardDef.type} - ${cardDef.attunement}</em></small><br><small>${(cardDef.description || "").replace(/\n/g,"<br>")}</small>`; 
                DOM.conceptsFullDeckListModal.appendChild(li); 
            }); 
        } else { _setHTML(DOM.conceptsFullDeckListModal, `<li>Your psyche is currently devoid of defined concepts.</li>`); } 
        _showModalActualDOM('concepts-modal'); 
    }
    
    function displayReflectInsightsModal(playableInsightCards) { 
        if (!DOM.playableInsightsList) return; 
        DOM.playableInsightsList.innerHTML = ''; 
        if (playableInsightCards && playableInsightCards.length > 0) { 
            playableInsightCards.forEach(cardDef => { 
                const button = document.createElement('button'); 
                button.dataset.cardId = cardDef.id; 
                button.innerHTML = `<strong>${cardDef.name}</strong> (Cost: ${cardDef.cost}F)<br><small>${cardDef.description}</small>`; 
                DOM.playableInsightsList.appendChild(button); 
            }); 
        } else { _setHTML(DOM.playableInsightsList, `<p class="placeholder">No immediate insights to reflect upon.</p>`); } 
        _showModalActualDOM('reflect-insights-modal'); 
    }

    function displayGameOver(title, message) { 
        _setText(DOM.gameOverTitleFullscreen, title); 
        _setText(DOM.gameOverTextFullscreen, message); 
        _showModalActualDOM('game-over-modal-fullscreen'); 
    }

    function _showModalActualDOM(modalContentElementId) { 
        if (DOM.modalOverlayFullscreen) { 
            const allModals = DOM.modalOverlayFullscreen.querySelectorAll('.fullscreen-modal-content'); 
            allModals.forEach(mod => mod.classList.add('view-hidden')); 
            const targetModal = document.getElementById(modalContentElementId); 
            if (targetModal) { 
                targetModal.classList.remove('view-hidden'); 
                DOM.modalOverlayFullscreen.classList.remove('view-hidden'); 
            } else { console.error("Modal content not found:", modalContentElementId); } 
        } 
    }
    function hideModals() { 
        if (DOM.modalOverlayFullscreen) { 
            DOM.modalOverlayFullscreen.classList.add('view-hidden'); 
            const allModals = DOM.modalOverlayFullscreen.querySelectorAll('.fullscreen-modal-content'); 
            allModals.forEach(mod => mod.classList.add('view-hidden')); 
        } 
    }

    function showTooltip(content, event) { if (!DOM.tooltip) return; DOM.tooltip.innerHTML = content; DOM.tooltip.classList.remove('view-hidden'); moveTooltip(event); }
    function hideTooltip() { if (DOM.tooltip) DOM.tooltip.classList.add('view-hidden'); }
    function moveTooltip(event) { if (!DOM.tooltip || DOM.tooltip.classList.contains('view-hidden')) return; let x = event.clientX + 15; let y = event.clientY + 15; const tooltipRect = DOM.tooltip.getBoundingClientRect(); if (x + tooltipRect.width > window.innerWidth) x = event.clientX - tooltipRect.width - 15; if (y + tooltipRect.height > window.innerHeight) y = event.clientY - tooltipRect.height - 15; DOM.tooltip.style.left = `${x}px`; DOM.tooltip.style.top = `${y}px`; }

    return {
        init,
        startPreGameIntro, clearPreGameIntroTimeout,
        updateDashboardVitals, updateStatusModal, 
        _showViewActualDOM, 
        renderNodeMap, updateCurrentNodeInfo,
        displayLocation, displayStorylet, 
        displayEncounterView, updatePlayerHand,
        // updateDeckInfo, // Removed, as deck info is part of concepts modal now
        addEventLogNotification, 
        addJournalEntryDOM, 
        displayJournalModal, displayConceptsModal, displayReflectInsightsModal, 
        hideModals, 
        displayGameOver,
        showTooltip, hideTooltip, moveTooltip,
        getDOMElement: (elementName) => DOM[elementName]
    };
})();
