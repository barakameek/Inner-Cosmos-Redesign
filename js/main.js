// js/main.js

const Game = (() => {
    // ... (currentPlayer, currentWorld, uiMgr, storyletMgr, encounterMgr as before) ...
    // ... (game state vars as before) ...

    function init() { /* ... as before ... */ }
    function _startGameSequence() { /* ... as before ... */ }
    function _updateHeaderInfo(isPreRecall = false) { /* ... as before ... */ }
    
    // This is the SOLE function responsible for changing the Game's currentViewId
    // AND telling UIManager to update the visible DOM elements.
    function _switchToView(viewId) {
        console.log(`Main: Switching view to: ${viewId}`);
        currentViewId = viewId; // Update Game's internal state
        uiMgr._showViewActualDOM(viewId); // Tell UIManager to change visible DOM
        
        if (viewId === 'map-view') {
            _updateAndRenderNodeMap(); 
        }
        // If switching TO storylet view, UIManager.displayStorylet would have already been called
        // to populate it, just before this _switchToView call.
    }

    function _updateAndRenderNodeMap() { /* ... as before ... */ }
    
    function switchToNodeMapView() { _switchToView('map-view'); } // Public alias

    function storyletEnded() {
        if (isGameOver) return;
        refreshPlayerUI(); 

        if (pendingEncounterId) {
            const encounterToStart = pendingEncounterId;
            pendingEncounterId = null; 
            // When starting an encounter, _switchToView('encounter-view') will be called
            // from within startEncounterFromQueue (or EncounterManager.startEncounter)
            startEncounterFromQueue(encounterToStart, currentViewId); 
        } else {
            const currentNode = currentWorld.getNodeData(currentMapNodeId);
            if (currentViewId === 'location-view' && currentNode && currentNode.isSanctuary) {
                // If we were in a location view (e.g. sanctuary) and a storylet (like talk_keeper) ended,
                // we want to re-display that location view, not necessarily the map.
                uiMgr.displayLocation(currentNode.locationDetails || currentNode); 
                 _switchToView('location-view'); 
            } else {
                 switchToNodeMapView(); 
            }
        }
        _checkGameOver();
    }

    function _handleContinueFromPrecipice() {
        if (!preGameIntroActive) return;
        preGameIntroActive = false;
        uiMgr.clearPreGameIntroTimeout();
        
        const startingNode = currentWorld.placePlayerAtNode("NODE_SHATTERED_SHORE");
        if (startingNode) {
            currentMapNodeId = startingNode.id; 
            uiMgr.addLogEntry("Consciousness coalesces... You are on The Shattered Shore.", "system_major_event");
            
            console.log("Player hand JUST BEFORE STORY_SHORE_ARRIVAL storylet is started (in main.js):", JSON.stringify(currentPlayer.hand));

            if (startingNode.storyletOnArrival) {
                // 1. Switch view conceptually in Game
                // 2. Tell StoryletManager to prepare and UIManager to populate that view's content
                _switchToView('storylet-view'); // Ensures currentViewId is 'storylet-view'
                const storyletInstance = storyletMgr.startStorylet(startingNode.storyletOnArrival); 
                // UIManager.displayStorylet is called inside storyletMgr.startStorylet if successful
                if (!storyletInstance) { // Handle case where storylet failed to load
                    console.error("Failed to start storylet: " + startingNode.storyletOnArrival);
                    switchToNodeMapView(); // Fallback
                }
            } else { /* ... error handling ... */ }
        } else { /* ... error handling ... */ }
    }

    function _navigateToNode(targetNodeId) {
        if (isGameOver || encounterMgr.isActive()) return;
        const newNodeData = currentWorld.navigateToNode(targetNodeId, currentPlayer);
        if (newNodeData) {
            currentMapNodeId = newNodeData.id; 
            refreshPlayerUI(); 
            // _updateAndRenderNodeMap(); // This will be called by _switchToView if going to map

            if (newNodeData.storyletOnArrival) {
                _switchToView('storylet-view');
                if (!storyletMgr.startStorylet(newNodeData.storyletOnArrival)) {
                    switchToNodeMapView(); // Fallback if storylet fails
                }
            } else {
                switchToNodeMapView(); // No storylet, just show the map at new location
            }
        }
        _checkGameOver();
    }

    function _exploreCurrentNode() {
        if (isGameOver || encounterMgr.isActive() || !currentMapNodeId) return;
        const node = currentWorld.getNodeData(currentMapNodeId);
        if (node) {
            uiMgr.addLogEntry(`Delving into ${node.name}...`, "action");
            
            if (node.isSanctuary && node.locationDetails) {
                _switchToView('location-view'); // Switch view first
                uiMgr.displayLocation(node.locationDetails); // Then populate
                return; 
            }
            
            let storyletToStartId = node.storyletOnArrival; 
            if (storyletToStartId && STORYLET_DATA_MINIMAL[storyletToStartId]) {
                _switchToView('storylet-view');
                if (!storyletMgr.startStorylet(storyletToStartId)) {
                    switchToNodeMapView(); // Fallback
                }
            } else { /* ... no storylet message ... */ }
        }
    }

    function _handleLocationAction(actionId) {
        // ... (as before, but if an action starts a storylet, ensure view switch)
        // Example for 'talk_keeper':
        // case 'talk_keeper': 
        //    const keeperStoryletId = ...;
        //    if (keeperStoryletId && ...) {
        //        _switchToView('storylet-view'); 
        //        storyletMgr.startStorylet(keeperStoryletId);
        //    } ...
        // break;
        /* The existing switch statement is mostly fine, assuming storylet outcomes lead to storyletEnded() */
        /* which then correctly calls switchToNodeMapView() or re-displays location view */
        /* For now, let's keep the _handleLocationAction logic as it was, as its storylet calls are okay */
        if (isGameOver || encounterMgr.isActive()) return; const locationNode = currentWorld.getNodeData(currentMapNodeId); if (!locationNode || !locationNode.isSanctuary || !locationNode.locationDetails) { uiMgr.addLogEntry("No specific location actions here.", "warning"); return; } uiMgr.addLogEntry(`Location action: ${actionId}`, "action"); switch (actionId) { case 'rest': currentPlayer.modifyIntegrity(Math.min(20, currentPlayer.maxIntegrity - currentPlayer.integrity), "Sanctuary rest"); currentPlayer.modifyHope(1, "Sanctuary rest"); currentPlayer.modifyDespair(-1, "Sanctuary rest"); uiMgr.addLogEntry("You rest. A fragile peace settles.", "system_positive"); break; case 'shop_intro': uiMgr.addLogEntry("The Keeper offers basic Concepts for Insight. (Shop not yet implemented).", "dialogue"); break; case 'talk_keeper': const keeperStoryletId = locationNode.locationDetails.storyletsOnExplore?.[0]; if (keeperStoryletId && STORYLET_DATA_MINIMAL[keeperStoryletId]) { _switchToView('storylet-view'); storyletMgr.startStorylet(keeperStoryletId); } else { uiMgr.addLogEntry("The Keeper merely observes.", "system"); } break; case 'view_ambition': uiMgr.addLogEntry(`Your current Ambition: ${currentPlayer.ambition}`, "system"); uiMgr.addJournalEntry("Ambition Focused", `I contemplate: "${currentPlayer.ambition}".`); break; default: uiMgr.addLogEntry(`Action "${actionId}" unknown here.`, "warning"); break; } refreshPlayerUI(); _checkGameOver();
    }

    // _handleReturnToMapFromLocation, _handleStoryletChoice (view check in listener now critical)
    // queueEncounter, startEncounterFromQueue (ensure view is switched to encounter)
    
    function startEncounterFromQueue(aspectIdToStart, previousViewBeforeStorylet) {
        if (isGameOver || !aspectIdToStart) return;
        // IMPORTANT: Switch view to encounter BEFORE encounter manager tries to populate it
        _switchToView('encounter-view'); 
        if (encounterMgr.startEncounter(aspectIdToStart, previousViewBeforeStorylet)) {
            // EncounterManager's startEncounter will call UIManager.displayEncounterView
        } else {
            uiMgr.addLogEntry(`Failed to start queued encounter: ${aspectIdToStart}`, "error");
            storyletEnded(); // Recover
        }
    }


    // ... (rest of main.js functions: _handleEncounterCardPlay, _handleEncounterEndTurn, etc.
    //      revealAwakeningMapConnections, playerRecalledName, refreshPlayerUI, 
    //      _checkGameOver, triggerGameOver, triggerMentalFogEffects, triggerCriticalDespairEffects,
    //      restartGame, _setupGlobalEventListeners, return object)
    //      The _setupGlobalEventListeners includes the critical fix for storylet choice clicks.

    function _handleReturnToMapFromLocation() { switchToNodeMapView(); }
    function _handleStoryletChoice(choiceIndex) { if (isGameOver || encounterMgr.isActive()) return; storyletMgr.makeChoice(choiceIndex); }
    // queueEncounter is fine as is.
    function _handleEncounterCardPlay(cardId) { /* ... as before (with confirm) ... */ if (isGameOver || !encounterMgr.isActive()) return; const cardDef = CONCEPT_CARD_DEFINITIONS[cardId]; if (!cardDef) return; if (cardId !== "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) { if (confirm("Disorientation increases Concept costs by 1 Focus this turn.\nSpend 1 Clarity to negate this effect?")) { if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation(); } } encounterMgr.playConceptCard(cardId); refreshPlayerUI(); _checkGameOver(); }
    function _handleEncounterEndTurn() { /* ... as before ... */ if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.playerEndTurn(); }
    function _handleEncounterRevealTrait() { /* ... as before ... */ if (isGameOver || !encounterMgr.isActive()) return; encounterMgr.revealHiddenAspectTrait(); refreshPlayerUI(); }
    function returnFromEncounter(viewToRestore) { /* ... as before ... */ if (isGameOver && currentPlayer.integrity > 0) { console.warn("returnFromEncounter called while game over by other means."); } else if (isGameOver && currentPlayer.integrity <= 0) { return; } refreshPlayerUI(); const node = currentWorld.getNodeData(currentMapNodeId); if (viewToRestore === 'location-view' && node && node.isSanctuary) { _switchToView('location-view'); uiMgr.displayLocation(node.locationDetails || node);  } else { switchToNodeMapView(); } } // Added displayLocation for consistency
    function revealAwakeningMapConnections() { /* ... as before ... */ currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WRECKAGE_OF_THOUGHT"); currentWorld.revealNodeConnection("NODE_SHATTERED_SHORE", "NODE_WEEPING_NICHE"); if (currentViewId === 'map-view') _updateAndRenderNodeMap(); uiMgr.addJournalEntry("Paths Unveiled", "The vision from 'The Fall' revealed new pathways from the Shattered Shore."); }
    function playerRecalledName() { /* ... as before ... */ _updateHeaderInfo(false); refreshPlayerUI(); } 
    function refreshPlayerUI() { /* ... as before ... */ uiMgr.updatePlayerStats(currentPlayer.getUIData()); uiMgr.updatePlayerHand(currentPlayer.getHandCardDefinitions()); uiMgr.updateDeckInfo(currentPlayer.deck.length, currentPlayer.hand.length, currentPlayer.discardPile.length, currentPlayer.getTraumaCountInPlay()); uiMgr.updateActiveMemories(currentPlayer.memories); }
    function _checkGameOver() { /* ... as before ... */ if (isGameOver) return true; if (currentPlayer.integrity <= 0) { return true; } return false; }
    function triggerGameOver(title, message) { /* ... as before ... */ if (isGameOver) return; isGameOver = true; uiMgr.displayGameOver(title, message); uiMgr.addLogEntry(`GAME OVER: ${title}`, "critical_system"); }
    function triggerMentalFogEffects() { /* ... as before ... */ uiMgr.addLogEntry("The Mental Fog thickens, treacherous and sluggish.", "world_event_negative"); }
    function triggerCriticalDespairEffects() { /* ... as before ... */ uiMgr.addLogEntry("Overwhelming Despair attracts Nightmares and distorts perception!", "world_event_critical"); }
    function restartGame() { /* ... as before ... */ console.log("Restarting game..."); isGameOver = false; preGameIntroActive = true; pendingEncounterId = null; currentMapNodeId = null; uiMgr.hideModals(); currentPlayer.resetForNewRun(); currentWorld.resetWorld(); _startGameSequence(); const logEntriesEl = uiMgr.getDOMElement('logEntries'); if(logEntriesEl) logEntriesEl.innerHTML = ''; const journalEntriesEl = uiMgr.getDOMElement('journalEntries'); if(journalEntriesEl) journalEntriesEl.innerHTML = `<p class="journal-entry placeholder">The pages are blank, aching for input...</p>`; uiMgr.addLogEntry("A new cycle of consciousness begins...", "system_major_event"); }
    
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
                if (currentViewId !== 'storylet-view' || (uiMgr.getDOMElement('storyletView') && uiMgr.getDOMElement('storyletView').classList.contains('view-hidden'))) {
                    console.warn("Storylet choice click ignored: Storylet view not active/visible.");
                    return; 
                }
                if (event.target.tagName === 'BUTTON' && event.target.dataset.choiceIndex && !encounterMgr.isActive()) {
                    const button = event.target;
                    if(button.disabled) {
                        console.warn("Clicked on a disabled storylet choice button.");
                        return;
                    }
                    button.disabled = true; 
                    _handleStoryletChoice(parseInt(event.target.dataset.choiceIndex)); 
                }
            });
        }
        
        const endTurnBtnEnc = uiMgr.getDOMElement('endTurnEncounterButton'); if (endTurnBtnEnc) endTurnBtnEnc.addEventListener('click', _handleEncounterEndTurn);
        const revealTraitBtnEnc = uiMgr.getDOMElement('revealTraitEncounterButton'); if (revealTraitBtnEnc) revealTraitBtnEnc.addEventListener('click', _handleEncounterRevealTrait);
        const playerHandElemEnc = uiMgr.getDOMElement('playerHandCards');  if (playerHandElemEnc) {  playerHandElemEnc.addEventListener('click', (event) => { const cardElement = event.target.closest('.encounter-card-placeholder'); if (cardElement && cardElement.dataset.cardId && encounterMgr.isActive() && !isGameOver) _handleEncounterCardPlay(cardElement.dataset.cardId); });  playerHandElemEnc.addEventListener('mouseover', (event) => { const el = event.target.closest('.encounter-card-placeholder'); if(el && el.dataset.cardId && typeof CONCEPT_CARD_DEFINITIONS !== 'undefined' && CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]) { const c = CONCEPT_CARD_DEFINITIONS[el.dataset.cardId]; uiMgr.showTooltip(`<strong>${c.name}</strong> (${c.cost}F)<br><em>${c.type} - ${c.attunement}</em><br>${(c.description || "").replace(/\n/g, "<br>")}<br><small>Keywords: ${(c.keywords || []).join(', ')}</small>`, event);}});  playerHandElemEnc.addEventListener('mouseout', () => uiMgr.hideTooltip());  playerHandElemEnc.addEventListener('mousemove', (event) => uiMgr.moveTooltip(event));  } 
        const viewDeckBtn = uiMgr.getDOMElement('viewDeckButton'); if (viewDeckBtn) viewDeckBtn.addEventListener('click', () => uiMgr.displayFullDeck(currentPlayer.getFullDeckCardDefinitions()));
        const modalOverlay = uiMgr.getDOMElement('modalOverlay'); if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target.classList.contains('close-modal-button') || event.target === modalOverlay) uiMgr.hideModals(); });
        const restartBtnModal = uiMgr.getDOMElement('restartGameButton'); if (restartBtnModal) restartBtnModal.addEventListener('click', restartGame);
        const addJournalBtn = uiMgr.getDOMElement('addJournalEntryButton'); if(addJournalBtn) addJournalBtn.addEventListener('click', () => { const note = prompt("Personal Note (max 100 chars):"); if (note && note.trim() !== "") uiMgr.addJournalEntry("Personal Note", note.trim().substring(0, 100)); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { const modalOverlayEl = uiMgr.getDOMElement('modalOverlay'); if (modalOverlayEl && !modalOverlayEl.classList.contains('view-hidden')) uiMgr.hideModals(); } });
    }

    return {
        init, restartGame, triggerGameOver,
        storyletEnded, returnFromEncounter, queueEncounter, 
        revealAwakeningMapConnections, playerRecalledName,
        refreshPlayerUI, 
        switchToNodeMapView, 
        triggerMentalFogEffects, triggerCriticalDespairEffects, 
        handleTraumaOnDraw: (cardId, onDrawFunctionName) => { /* ... (Identical, with confirm dialog) ... */ if (encounterMgr.isActive()) { const effectFn = EncounterManager.getConceptCardEffectFunction(onDrawFunctionName); if (effectFn && typeof effectFn === 'function') { effectFn(CONCEPT_CARD_DEFINITIONS[cardId]); refreshPlayerUI(); } else { console.warn(`onDraw function ${onDrawFunctionName} for ${cardId} not found or not a function in EncounterManager.`); if (cardId === "TRM001" && encounterMgr.canSpendClarityForDisorientation && encounterMgr.canSpendClarityForDisorientation()) { if (confirm("Disorientation clouds your thoughts, making Concepts cost +1 Focus this turn.\nSpend 1 Clarity to clear this effect for the turn?")) { if(encounterMgr.spendClarityForDisorientation) encounterMgr.spendClarityForDisorientation(); refreshPlayerUI(); } else { UIManager.addLogEntry("You endure Disorientation's effects this turn.", "player_action_negative"); } } } } else { UIManager.addLogEntry(`Drew ${CONCEPT_CARD_DEFINITIONS[cardId]?.name} (Trauma) outside of encounter - effect not applied now.`, "system_warning"); } },
        getCurrentPlayer: () => currentPlayer, 
        // Expose for StoryletManager outcomes to directly call Game-level view changes or actions
        // if absolutely necessary, though callbacks like storyletEnded are preferred.
        // E.g. if an outcome needs to *immediately* switch to map AND do something else.
        // For now, most things flow back through storyletEnded.
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
