// js/world.js

const World = (() => { // IIFE for a module-like structure

    let allNodes = {}; // Will store all node data from NODE_MAP_DATA, keyed by ID
    let currentPsychonautNodeId = null; // ID of the player's current node

    // --- Initialization ---
    function init() {
        allNodes = {}; // Clear previous data if any
        currentPsychonautNodeId = null; // Reset current node before loading

        _loadNodeMapData(); // Load map from config

        // The actual setting of the starting node (NODE_SHATTERED_SHORE)
        // will now be handled by main.js in _handleContinueFromPrecipice
        // by calling a specific placement function or navigateToNode with a special flag.
        // For now, let's ensure it can be set.
        // currentPsychonautNodeId = "NODE_SHATTERED_SHORE"; // This might be too early.
                                                        // Main.js controls player placement.

        if (Object.keys(allNodes).length === 0) {
            console.error("CRITICAL: No map nodes loaded from NODE_MAP_DATA in config.js!");
            UIManager.addLogEntry("FATAL ERROR: The Inner Sea's geography is undefined!", "critical_system");
        } else {
            console.log("World (v2) initialized with node map data. Player position to be set by Game sequence.");
        }
    }

    function _loadNodeMapData() {
        if (NODE_MAP_DATA) {
            for (const nodeId in NODE_MAP_DATA) {
                if (NODE_MAP_DATA.hasOwnProperty(nodeId)) {
                    allNodes[nodeId] = { ...NODE_MAP_DATA[nodeId] };
                    allNodes[nodeId].connections = Array.isArray(allNodes[nodeId].connections) ? [...allNodes[nodeId].connections] : [];
                    if (LOCATION_DATA_MINIMAL[nodeId]) { // Check LOCATION_DATA_MINIMAL
                        allNodes[nodeId].locationDetails = { ...LOCATION_DATA_MINIMAL[nodeId] };
                    }
                }
            }
            // Ensure all connected nodes exist in allNodes, creating placeholders if not fully defined
            for (const nodeId in allNodes) {
                const node = allNodes[nodeId];
                node.connections.forEach(connectedNodeId => {
                    if (!allNodes[connectedNodeId]) {
                        console.warn(`Node "${connectedNodeId}" (connected from "${nodeId}") not found in NODE_MAP_DATA. Creating placeholder.`);
                        allNodes[connectedNodeId] = {
                            id: connectedNodeId,
                            name: connectedNodeId.replace(/_/g, ' ').replace("NODE ", "").replace(/\b\w/g, l => l.toUpperCase()),
                            shortDesc: "An uncharted echo...",
                            position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Random placeholder position
                            storyletOnArrival: null,
                            connections: [], // Placeholder connections
                            type: "Unknown"
                        };
                    }
                });
            }

        } else {
            console.error("NODE_MAP_DATA is not defined in config.js!");
        }
    }

    // Special function for initial placement, bypassing normal navigation rules/costs
    function placePlayerAtNode(nodeId) {
        if (allNodes[nodeId]) {
            currentPsychonautNodeId = nodeId;
            UIManager.addLogEntry(`Consciousness anchors at: ${allNodes[nodeId].name}.`, "system_major_event");
            return allNodes[nodeId];
        } else {
            console.error(`Cannot place player: Node ID "${nodeId}" does not exist.`);
            UIManager.addLogEntry(`Error: Cannot materialize at unknown node "${nodeId}".`, "error");
            return null;
        }
    }

    // --- Navigation ---
    function canNavigateToNode(targetNodeId) {
        if (!currentPsychonautNodeId) return false; // Cannot navigate if not placed yet
        const currentNode = allNodes[currentPsychonautNodeId];
        if (currentNode && currentNode.connections && currentNode.connections.includes(targetNodeId)) {
            if (allNodes[targetNodeId]) { // Ensure target node actually exists
                return true;
            }
        }
        return false;
    }

    function navigateToNode(targetNodeId, player) {
        if (!player) {
            console.error("Player object not provided for navigation cost in World.navigateToNode.");
            UIManager.addLogEntry("Error: Player context missing for navigation.", "error");
            return false;
        }
        if (!allNodes[targetNodeId]) {
            UIManager.addLogEntry(`Error: Target node "${targetNodeId}" does not exist.`, "error");
            return false;
        }

        if (canNavigateToNode(targetNodeId)) {
            const navigationCost = 1; // Default cost for now
            // TODO: Implement node-specific or distance-based clarity costs later

            if (player.clarity >= navigationCost) {
                player.modifyClarity(-navigationCost, `navigating to ${allNodes[targetNodeId].name}`);

                const previousNodeName = allNodes[currentPsychonautNodeId].name;
                currentPsychonautNodeId = targetNodeId;
                const newNodeName = allNodes[currentPsychonautNodeId].name;

                UIManager.addLogEntry(`Journeyed from ${previousNodeName} to ${newNodeName}.`, "system");
                // Game.onPlayerArrivedAtNode(allNodes[currentPsychonautNodeId]); // Notify main.js
                return allNodes[currentPsychonautNodeId];
            } else {
                UIManager.addLogEntry(`Not enough Clarity to travel to ${allNodes[targetNodeId].name}. (Requires ${navigationCost}, Have: ${player.clarity})`, "warning");
                return false;
            }
        } else {
            UIManager.addLogEntry(`No direct path to ${allNodes[targetNodeId].name} from ${allNodes[currentPsychonautNodeId]?.name || 'your current position'}.`, "warning");
            return false;
        }
    }

    // --- Location & Node Data Access ---
    function getCurrentNode() {
        if (!currentPsychonautNodeId) {
             // This case should ideally be handled by main.js ensuring player is placed first
            console.warn("getCurrentNode called but currentPsychonautNodeId is null.");
            return null;
        }
        return allNodes[currentPsychonautNodeId];
    }

    function getNodeData(nodeId) {
        return allNodes[nodeId];
    }

    function getAllNodes() {
        return allNodes;
    }

    function getAccessibleNodeIds(fromNodeId = null) { // Optionally specify source node
        const sourceNodeId = fromNodeId || currentPsychonautNodeId;
        if (!sourceNodeId) return [];

        const sourceNode = allNodes[sourceNodeId];
        if (sourceNode && sourceNode.connections) {
            // Filter to ensure connected nodes actually exist in our allNodes map
            return sourceNode.connections.filter(nodeId => allNodes[nodeId]);
        }
        return [];
    }

    // --- World State Modification ---
    function revealNodeConnection(fromNodeId, toNodeId) {
        if (allNodes[fromNodeId] && allNodes[toNodeId]) {
            if (!allNodes[fromNodeId].connections.includes(toNodeId)) {
                allNodes[fromNodeId].connections.push(toNodeId);
                // For bidirectional, also add from toNodeId to fromNodeId if appropriate
                // if (allNodes[toNodeId] && !allNodes[toNodeId].connections.includes(fromNodeId)) {
                //     allNodes[toNodeId].connections.push(fromNodeId);
                // }
                UIManager.addLogEntry(`A new path has opened from ${allNodes[fromNodeId].name} towards ${allNodes[toNodeId].name}.`, "discovery");
                return true;
            }
        } else {
            console.error(`Cannot reveal connection: Node ${fromNodeId} or ${toNodeId} not found.`);
            UIManager.addLogEntry(`Error: Could not map path between unknown echoes (${fromNodeId} to ${toNodeId}).`, "error");
        }
        return false;
    }

    function lockNodeConnection(fromNodeId, toNodeId) {
        // ... (Identical to previous World.js implementation) ...
        if (allNodes[fromNodeId] && allNodes[toNodeId]) {
            const index = allNodes[fromNodeId].connections.indexOf(toNodeId);
            if (index > -1) {
                allNodes[fromNodeId].connections.splice(index, 1);
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
        }
    }

    function resetWorld() {
        // currentPsychonautNodeId is reset by main.js calling placePlayerAtNode
        init(); // Re-loads NODE_MAP_DATA and clears states
    }

    // --- Public API ---
    return {
        init,
        placePlayerAtNode, // NEW for explicit initial placement
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
