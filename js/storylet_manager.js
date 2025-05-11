// js/storylet_manager.js

const StoryletManager = (() => { // IIFE for a module-like structure

    let activeStorylet = null; // Holds the data of the currently active storylet
    let currentPlayerRef = null; // Reference to the main player object
    let currentWorldRef = null; // Reference to the world object

    function init(player, world) {
        currentPlayerRef = player;
        currentWorldRef = world;
        console.log("StoryletManager initialized.");
    }

    function startStorylet(storyletId) {
        if (STORYLET_DATA_MINIMAL[storyletId]) {
            activeStorylet = { ...STORYLET_DATA_MINIMAL[storyletId] }; // Make a copy to work with
            UIManager.addLogEntry(`Engaging storylet: ${activeStorylet.title}`, "story");
            UIManager.displayStorylet(activeStorylet); // Tell UI to show it
            return true;
        } else {
            UIManager.addLogEntry(`Error: Storylet ID "${storyletId}" not found.`, "error");
            console.error(`Storylet ID "${storyletId}" not found.`);
            activeStorylet = null;
            UIManager.showView(UIManager.getDOMElement('mapView')); // Go back to map view or current location view
            return false;
        }
    }

    function makeChoice(choiceIndex) {
        if (!activeStorylet || !activeStorylet.choices || choiceIndex < 0 || choiceIndex >= activeStorylet.choices.length) {
            UIManager.addLogEntry("Invalid storylet choice.", "error");
            console.error("Invalid storylet choice or no active storylet.");
            return;
        }

        const chosenOption = activeStorylet.choices[choiceIndex];
        UIManager.addLogEntry(`Chose: "${chosenOption.text}"`, "choice");

        // Process the outcome
        // The outcomeFunctionName would map to a function defined below or in a dedicated outcomes module
        if (chosenOption.outcomeFunctionName && typeof storyletOutcomes[chosenOption.outcomeFunctionName] === 'function') {
            storyletOutcomes[chosenOption.outcomeFunctionName](chosenOption.params || {}); // Pass params if any
        } else {
            UIManager.addLogEntry(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented.`, "error");
            console.warn(`Outcome function "${chosenOption.outcomeFunctionName}" not implemented.`);
            // Default behavior: just end the storylet and go back to previous view
            endStorylet();
        }
        // The outcome function itself should handle what happens next (e.g., endStorylet, start another, start encounter)
    }

    function endStorylet() {
        activeStorylet = null;
        // Determine which view to return to.
        // This logic might be more sophisticated based on game state.
        // For now, if at a location, show location view, otherwise map view.
        const currentLocation = currentWorldRef.getCurrentLocation();
        if (currentLocation && UIManager.getDOMElement('locationView').classList.contains('view-active')) {
             // If we were viewing a location before the storylet, re-display it (actions might have changed)
             // This needs to be coordinated by main.js, storylet manager shouldn't directly call displayLocation
             // Main.js.displayCurrentLocation(); // Ideal
             // For now, a simpler fallback:
             UIManager.displayLocation(currentLocation); // This might be problematic if state changed
        } else {
            UIManager.showView(UIManager.getDOMElement('mapView'));
        }
    }

    // --- Storylet Outcome Functions ---
    // These functions define what happens when a choice is made.
    // They would be numerous in a full game.
    const storyletOutcomes = {
        storyOutcomeAskAmbition: (params) => {
            UIManager.addLogEntry(`The Keeper elaborates: "${currentPlayerRef.ambition} is a worthy, if perilous, goal..."`, "dialogue");
            // Could add a journal entry or a temporary buff.
            // For now, just logs and then the storylet would typically end or offer new choices.
            // To demonstrate chaining, let's assume this leads to another part of the conversation
            // or simply ends the current interaction for this example.
            // In a real scenario, this might unlock a new choice in the current storylet, or a new storylet.
            UIManager.addJournalEntry("Ambition Guidance", "The Keeper offered some words on my current ambition.");
            endStorylet(); // Or transition to another part of the storylet
        },

        storyOutcomeAskDisturbances: (params) => {
            UIManager.addLogEntry("The Keeper sighs, 'The Shallows are restless. Anxious thought-forms gather near the old pathways. Tread carefully.'", "dialogue");
            // Could reveal a temporary point of interest on the map or give a clue.
            // World.revealTemporaryPOI("LOC_ANXIETY_FRINGE", "Increased Anxious Activity");
            UIManager.addJournalEntry("Local Disturbances", "Keeper warned of anxious thought-forms in the Shallows.");
            endStorylet();
        },

        storyOutcomeDepartSanctuary: (params) => {
            UIManager.addLogEntry("You nod to the Keeper and step out from the Sanctum's comforting glow, back into the whispers of the Inner Sea.", "narrative");
            endStorylet(); // This will trigger UIManager to go back to map view
        },

        gainResourcesTest: (params) => {
            const integrityGain = params.integrity || 0;
            const focusGain = params.focus || 0;
            const insightGain = params.insight || 0;

            if (integrityGain) currentPlayerRef.modifyIntegrity(integrityGain);
            if (focusGain) currentPlayerRef.modifyFocus(focusGain);
            if (insightGain) currentPlayerRef.modifyInsight(insightGain);

            UIManager.addLogEntry(`Gained ${integrityGain} Integrity, ${focusGain} Focus, ${insightGain} Insight.`, "reward");
            // Update UI (main.js should coordinate this after player state changes)
            // UIManager.updatePlayerStats(currentPlayerRef.getUIData());
            endStorylet();
        },

        changeAttunementTest: (params) => {
            const attunement = params.attunement; // e.g., "psychological"
            const amount = params.amount || 0;
            if (attunement && amount) {
                currentPlayerRef.modifyAttunement(attunement, amount);
            }
            // Update UI
            // UIManager.updatePlayerStats(currentPlayerRef.getUIData());
            endStorylet();
        },

        startEncounterTest: (params) => {
            const aspectId = params.aspectId || "ASP001"; // Default to Fleeting Anxiety
            UIManager.addLogEntry(`A presence coalesces... an encounter begins with ${ASPECT_TEMPLATES[aspectId]?.name || 'an Aspect'}!`, "critical");
            // Main.js would then call EncounterManager.startEncounter(aspectId)
            // For now, we'll just switch view (this is a simplification)
            // This is where main.js orchestration is key
            Game.startEncounter(aspectId); // Assuming Game is the main controller object in main.js
            // endStorylet() might not be called immediately if an encounter starts.
            // The encounter resolution would determine the next state.
        },

        moveToLocationTest: (params) => {
            const locationId = params.locationId;
            if (locationId && currentWorldRef.getLocationData(locationId)) {
                UIManager.addLogEntry(`A shift occurs... you find yourself at ${currentWorldRef.getLocationData(locationId).name}.`, "narrative");
                // This is a direct teleport, normally navigation would handle movement
                // currentWorldRef.setCurrentLocation(locationId); // This method would need to exist in World.js
                // UIManager.updateMapView(currentWorldRef.getCurrentLocationUIData());
                // For now, this is highly simplified. main.js would coordinate.
                // After moving, typically the storylet ends.
                // Game.forcePlayerMove(locationId); // Hypothetical main game controller function
            } else {
                UIManager.addLogEntry(`Failed to shift location: ${locationId} not found.`, "error");
            }
            endStorylet();
        },

        addCardTest: (params) => {
            const cardId = params.cardId;
            const destination = params.destination || "deck"; // "deck", "hand", "discard"
            if (cardId && CONCEPT_CARD_DEFINITIONS[cardId]) {
                switch(destination) {
                    case "hand": currentPlayerRef.addCardToHand(cardId); break;
                    case "discard": currentPlayerRef.addCardToDiscard(cardId); break;
                    default: currentPlayerRef.addCardToDeck(cardId, true); // Shuffle in
                }
                // UIManager.updateDeckInfo(...) - main.js coordination
            }
            endStorylet();
        },
        // ... more outcome functions
    };


    // --- Public API ---
    return {
        init,
        startStorylet,
        makeChoice,
        endStorylet, // May be called by outcome functions or main game loop
        // Potentially expose outcome functions if they need to be called from elsewhere,
        // but it's cleaner to keep them internal or managed by a dedicated outcome processor.
        executeOutcome: (functionName, params) => { // Allow external triggering of outcomes if necessary
            if (storyletOutcomes[functionName] && typeof storyletOutcomes[functionName] === 'function') {
                storyletOutcomes[functionName](params || {});
                return true;
            }
            return false;
        }
    };

})();

// Initialization would be called by main.js
// StoryletManager.init(GamePlayer, World); // Passing references to player and world
