// js/world.js

const World = (() => { // IIFE for a module-like structure

    let currentPsychonautLocationId = null; // ID of the player's current location
    let knownLocations = {}; // Object to store data about discovered locations
    let worldMap = {}; // Adjacency list representing connections: { locationId: { north: targetId, east: targetId ... } }

    // --- Initialization ---
    function init() {
        // For now, load a very simple predefined map structure from config
        // In a real game, this might involve procedural generation or loading more complex data.
        _loadInitialMapData();
        currentPsychonautLocationId = "LOC_START_SANCTUARY"; // Start at the defined sanctuary
        discoverLocation(currentPsychonautLocationId); // Mark starting location as known

        console.log("World initialized. Current Location:", currentPsychonautLocationId);
        // UIManager.updateMapView(this.getCurrentLocationData()); // Main.js would trigger this
    }

    function _loadInitialMapData() {
        // This is a very simplified way to represent map connections.
        // It mirrors the structure one might have in a more extensive LOCATION_DATA object.
        worldMap = {
            "LOC_START_SANCTUARY": {
                north: "LOC_WHISPERING_PATH_NODE_1",
                // No east, south, west from start for this simple example
            },
            "LOC_WHISPERING_PATH_NODE_1": {
                south: "LOC_START_SANCTUARY",
                north_east: "LOC_ANXIETY_FRINGE", // Example of a new location
                north_west: "LOC_FORGOTTEN_MEMORY_EDGE" // Another example
            },
            "LOC_ANXIETY_FRINGE": { // Define connections back if needed
                south_west: "LOC_WHISPERING_PATH_NODE_1"
            },
            "LOC_FORGOTTEN_MEMORY_EDGE": {
                south_east: "LOC_WHISPERING_PATH_NODE_1"
            }
            // ... more connections
        };

        // Populate knownLocations with data from CONFIG if needed for easy access
        // This merges location data with their connections.
        for (const locId in LOCATION_DATA_MINIMAL) {
            if (LOCATION_DATA_MINIMAL.hasOwnProperty(locId)) {
                knownLocations[locId] = {
                    ...LOCATION_DATA_MINIMAL[locId], // Spread data from config
                    connections: worldMap[locId] || {} // Add connections if they exist
                };
            }
        }
        // Add placeholder data for locations defined only in worldMap but not in LOCATION_DATA_MINIMAL
        // This is for development ease, ideally all locations would have full data.
        for (const locId in worldMap) {
            for (const dir in worldMap[locId]) {
                const targetId = worldMap[locId][dir];
                if (!knownLocations[targetId]) {
                     knownLocations[targetId] = {
                        id: targetId,
                        name: targetId.replace(/_/g, ' ').replace("LOC ", "").replace(/\b\w/g, l => l.toUpperCase()), // Generate a name
                        region: "Unknown Region",
                        description: "An uncharted area of the Inner Sea...",
                        type: "ExplorationNode",
                        actions: ["explore_further"],
                        storylets: [],
                        connections: worldMap[targetId] || {}
                    };
                }
            }
        }
    }

    function discoverLocation(locationId) {
        if (LOCATION_DATA_MINIMAL[locationId] && !knownLocations[locationId]?.discovered) {
            // If we had a concept of "undiscovered" vs "known"
            // For now, just ensure it's in knownLocations.
            // knownLocations[locationId].discovered = true;
            // UIManager.addLogEntry(`Discovered: ${knownLocations[locationId].name}`, "discovery");
        }
        // In a fuller system, this might update a visual map, add journal entries, etc.
    }

    // --- Navigation ---
    function canNavigate(direction) {
        const currentLocation = knownLocations[currentPsychonautLocationId];
        if (currentLocation && currentLocation.connections && currentLocation.connections[direction]) {
            return true;
        }
        return false;
    }

    function navigate(direction, player) { // Player object needed for Clarity cost
        if (!player) {
            console.error("Player object not provided for navigation cost.");
            return false;
        }
        const currentLocationData = knownLocations[currentPsychonautLocationId];
        if (currentLocationData && currentLocationData.connections && currentLocationData.connections[direction]) {
            const targetLocationId = currentLocationData.connections[direction];

            // Cost for navigation (e.g., Clarity)
            const navigationCost = 1; // Example cost
            if (player.clarity >= navigationCost) {
                player.modifyClarity(-navigationCost);
                UIManager.addLogEntry(`Navigated ${direction}. Clarity -${navigationCost}.`, "system");

                currentPsychonautLocationId = targetLocationId;
                discoverLocation(targetLocationId); // Mark new location as "known" or trigger discovery events

                // UIManager.updateMapView(this.getCurrentLocationUIData());
                // UIManager.updatePlayerStats(player.getUIData());

                // Trigger arrival event/storylet for the new location
                // This would be handled by main.js orchestrating with StoryletManager
                return knownLocations[currentPsychonautLocationId]; // Return new location data
            } else {
                UIManager.addLogEntry(`Not enough Clarity to navigate ${direction}.`, "warning");
                return false;
            }
        } else {
            UIManager.addLogEntry(`Cannot navigate ${direction} from here.`, "error");
            return false;
        }
    }

    // --- Location Data Access ---
    function getCurrentLocation() {
        return knownLocations[currentPsychonautLocationId];
    }

    function getLocationData(locationId) {
        return knownLocations[locationId];
    }

    function getCurrentLocationUIData() {
        // Prepares data in a format suitable for UIManager.updateMapView
        const loc = getCurrentLocation();
        if (loc) {
            return {
                currentLocation: { // Nesting to match UIManager expectation
                    id: loc.id,
                    name: loc.name,
                    description: loc.description,
                    region: loc.region,
                    type: loc.type,
                    actions: loc.actions, // Action IDs
                    storylets: loc.storylets, // Storylet IDs
                    connections: loc.connections // For UI to show available directions
                }
            };
        }
        return null;
    }

    // --- World State Modification (Placeholder) ---
    // Example: an event changes a location's description or connections
    function updateLocationState(locationId, newDescription, newConnections) {
        if (knownLocations[locationId]) {
            if (newDescription) {
                knownLocations[locationId].description = newDescription;
                UIManager.addLogEntry(`The nature of ${knownLocations[locationId].name} has shifted.`, "world_event");
            }
            if (newConnections) {
                knownLocations[locationId].connections = { ...knownLocations[locationId].connections, ...newConnections };
                 UIManager.addLogEntry(`New paths have opened or closed at ${knownLocations[locationId].name}.`, "world_event");
            }
            // If current location updated, refresh UI
            if (locationId === currentPsychonautLocationId) {
                // UIManager.updateMapView(this.getCurrentLocationUIData());
            }
        }
    }

    function resetWorld() {
        knownLocations = {};
        worldMap = {};
        init(); // Re-initialize with default map
    }


    // --- Public API ---
    return {
        init,
        navigate,
        canNavigate,
        getCurrentLocation,
        getLocationData,
        getCurrentLocationUIData,
        updateLocationState, // For dynamic world changes
        resetWorld
    };

})();

// Initialization would be called by main.js
// World.init();
