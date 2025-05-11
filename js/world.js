// js/world.js

const World = (() => { // IIFE for a module-like structure

    let allNodes = {}; // Will store all node data from NODE_MAP_DATA, keyed by ID
    let currentPsychonautNodeId = null; // ID of the player's current node

    // --- Initialization ---
    function init() {
        _loadNodeMapData();
        // Start at the defined initial node for the "Awakening" intro
        currentPsychonautNodeId = "NODE_SHATTERED_SHORE";

        if (!allNodes[currentPsychonautNodeId]) {
            console.error("CRITICAL: Starting node ID 'NODE_SHATTERED_SHORE' not found in allNodes!");
            // Fallback or error handling needed here
            // For now, pick the first available node if start node is missing
            const firstNodeId = Object.keys(allNodes)[0];
            if (firstNodeId) {
                currentPsychonautNodeId = firstNodeId;
                 UIManager.addLogEntry("Error: Default start node missing, starting at first available node: " + allNodes[firstNodeId].name, "error");
            } else {
                 UIManager.addLogEntry("FATAL ERROR: No map nodes defined!", "critical_system");
                 // Game cannot proceed
                 return;
            }
        }

        console.log("World initialized with node map. Current Node:", currentPsychonautNodeId);
    }

    function _loadNodeMapData() {
        allNodes = {}; // Clear previous data if any
        if (NODE_MAP_DATA) {
            for (const nodeId in NODE_MAP_DATA) {
                if (NODE_MAP_DATA.hasOwnProperty(nodeId)) {
                    // Store a copy of the node data
                    allNodes[nodeId] = { ...NODE_MAP_DATA[nodeId] };
                    // Ensure connections is an array, even if not defined in config for a node
                    allNodes[nodeId].connections = allNodes[nodeId].connections || [];
                    // Add reference to location data if this node is also a detailed location
                    if (LOCATION_DATA_MINIMAL[nodeId]) {
                        allNodes[nodeId].locationDetails = { ...LOCATION_DATA_MINIMAL[nodeId] };
                    }
                }
            }
        } else {
            console.error("NODE_MAP_DATA is not defined in config.js!");
        }
    }

    // --- Navigation ---
    function canNavigateToNode(targetNodeId) {
        const currentNode = allNodes[currentPsychonautNodeId];
        if (currentNode && currentNode.connections && currentNode.connections.includes(targetNodeId)) {
            return true;
        }
        // Could also check for locked paths or special conditions here
        return false;
    }

    function navigateToNode(targetNodeId, player) { // Player object needed for Clarity cost
        if (!player) {
            console.error("Player object not provided for navigation cost.");
            UIManager.addLogEntry("Error: Player context missing for navigation.", "error");
            return false;
        }
        if (!allNodes[targetNodeId]) {
            UIManager.addLogEntry(`Error: Target node "${targetNodeId}" does not exist.`, "error");
            return false;
        }

        if (canNavigateToNode(targetNodeId)) {
            const navigationCost = 1; // Example Clarity cost for moving between adjacent intro nodes
                                      // This could be distance-based or node-specific later

            if (player.clarity >= navigationCost || targetNodeId === "NODE_SHATTERED_SHORE") { // Allow first move even if clarity is 0
                if (targetNodeId !== "NODE_SHATTERED_SHORE") { // Don't charge for the "Grasp Awareness" effective move
                    player.modifyClarity(-navigationCost, `navigating to ${allNodes[targetNodeId].name}`);
                }

                const previousNodeName = allNodes[currentPsychonautNodeId].name;
                currentPsychonautNodeId = targetNodeId;
                const newNodeName = allNodes[currentPsychonautNodeId].name;

                UIManager.addLogEntry(`Journeyed from ${previousNodeName} to ${newNodeName}.`, "system");

                // UIManager will be responsible for re-rendering the map and node info
                // Game.onPlayerArrivedAtNode(allNodes[currentPsychonautNodeId]); // Notify main game loop
                return allNodes[currentPsychonautNodeId]; // Return new current node data
            } else {
                UIManager.addLogEntry(`Not enough Clarity to travel to ${allNodes[targetNodeId].name}. (Requires ${navigationCost}, Have: ${player.clarity})`, "warning");
                return false;
            }
        } else {
            UIManager.addLogEntry(`No direct path to ${allNodes[targetNodeId].name} from your current location.`, "warning");
            return false;
        }
    }

    // --- Location & Node Data Access ---
    function getCurrentNode() {
        return allNodes[currentPsychonautNodeId];
    }

    function getNodeData(nodeId) {
        return allNodes[nodeId];
    }

    function getAllNodes() {
        return allNodes; // For UI to render the map
    }

    function getAccessibleNodeIds() {
        const currentNode = getCurrentNode();
        if (currentNode && currentNode.connections) {
            return currentNode.connections.filter(nodeId => allNodes[nodeId]); // Ensure connected node exists
        }
        return [];
    }

    // --- World State Modification ---
    // Example: A storylet outcome reveals new connections from the current node
    function revealNodeConnection(fromNodeId, toNodeId) {
        if (allNodes[fromNodeId] && allNodes[toNodeId]) {
            if (!allNodes[fromNodeId].connections.includes(toNodeId)) {
                allNodes[fromNodeId].connections.push(toNodeId);
                UIManager.addLogEntry(`A new path has opened from ${allNodes[fromNodeId].name} towards ${allNodes[toNodeId].name}.`, "discovery");
                // If the player is at fromNodeId, the UI map needs to be re-rendered by main.js
                return true;
            }
        } else {
            console.error(`Cannot reveal connection: Node ${fromNodeId} or ${toNodeId} not found.`);
        }
        return false;
    }

    // Example: A storylet outcome locks a connection
    function lockNodeConnection(fromNodeId, toNodeId) {
         if (allNodes[fromNodeId] && allNodes[toNodeId]) {
            const index = allNodes[fromNodeId].connections.indexOf(toNodeId);
            if (index > -1) {
                allNodes[fromNodeId].connections.splice(index, 1);
                 // Could add a "lockedConnections" array to nodeData for UI to show it differently
                allNodes[fromNodeId].lockedConnections = allNodes[fromNodeId].lockedConnections || [];
                if (!allNodes[fromNodeId].lockedConnections.includes(toNodeId)) {
                    allNodes[fromNodeId].lockedConnections.push(toNodeId);
                }
                UIManager.addLogEntry(`The path from ${allNodes[fromNodeId].name} to ${allNodes[toNodeId].name} has become impassable.`, "world_event_negative");
                return true;
            }
        }
        return false;
    }

    function updateNodeShortDescription(nodeId, newShortDesc) {
        if (allNodes[nodeId]) {
            allNodes[nodeId].shortDesc = newShortDesc;
            // If current node updated, UI needs refresh via main.js
             if (nodeId === currentPsychonautNodeId) {
                // Game.updateCurrentNodeDisplay(); // Notify main game loop
            }
        }
    }

    function resetWorld() {
        allNodes = {};
        currentPsychonautNodeId = null; // Will be set by init
        init(); // Re-initialize with default map data
    }


    // --- Public API ---
    return {
        init,
        navigateToNode,
        canNavigateToNode,
        getCurrentNode,
        getNodeData,
        getAllNodes,
        getAccessibleNodeIds,
        revealNodeConnection,
        lockNodeConnection,
        updateNodeShortDescription,
        resetWorld
    };

})();

// Initialization would be called by main.js
// World.init();
