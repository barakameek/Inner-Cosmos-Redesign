// js/world.js

const World = (() => { // IIFE for a module-like structure

    let allNodes = {}; // Will store all node data from NODE_MAP_DATA, keyed by ID
    let currentPsychonautNodeId = null; // ID of the player's current node

    // --- Initialization ---
    function init() {
        allNodes = {}; 
        currentPsychonautNodeId = null; 

        _loadNodeMapData(); 

        if (Object.keys(allNodes).length === 0) {
            console.error("CRITICAL: No map nodes loaded from NODE_MAP_DATA in config.js!");
            if (typeof UIManager !== 'undefined' && UIManager.addLogEntry) {
                UIManager.addLogEntry("FATAL ERROR: The Inner Sea's geography is undefined!", "critical_system");
            }
        } else {
            console.log("World (v2 Awakening - Full) initialized with node map data. Player position to be set by Game sequence.");
        }
    }

    function _loadNodeMapData() {
        // Assumes NODE_MAP_DATA and LOCATION_DATA_MINIMAL are globally available from config.js
        if (NODE_MAP_DATA) {
            for (const nodeId in NODE_MAP_DATA) {
                if (NODE_MAP_DATA.hasOwnProperty(nodeId)) {
                    allNodes[nodeId] = { ...NODE_MAP_DATA[nodeId] };
                    allNodes[nodeId].connections = Array.isArray(allNodes[nodeId].connections) ? [...allNodes[nodeId].connections] : [];
                    if (LOCATION_DATA_MINIMAL && LOCATION_DATA_MINIMAL[nodeId]) { 
                        allNodes[nodeId].locationDetails = { ...LOCATION_DATA_MINIMAL[nodeId] };
                    }
                }
            }
            for (const nodeId in allNodes) {
                const node = allNodes[nodeId];
                if(node.connections && Array.isArray(node.connections)) { 
                    node.connections.forEach(connectedNodeId => {
                        if (!allNodes[connectedNodeId]) {
                            console.warn(`Node "${connectedNodeId}" (connected from "${nodeId}") not found in NODE_MAP_DATA. Creating placeholder.`);
                            allNodes[connectedNodeId] = {
                                id: connectedNodeId,
                                name: connectedNodeId.replace(/_/g, ' ').replace("NODE ", "").replace(/\b\w/g, l => l.toUpperCase()),
                                shortDesc: "An uncharted echo...",
                                position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, 
                                storyletOnArrival: null,
                                connections: [],
                                type: "Unknown"
                            };
                        }
                    });
                }
            }
        } else {
            console.error("NODE_MAP_DATA is not defined in config.js!");
        }
    }

    function placePlayerAtNode(nodeId) {
        if (allNodes[nodeId]) {
            currentPsychonautNodeId = nodeId;
            if (typeof UIManager !== 'undefined' && UIManager.addLogEntry) {
                UIManager.addLogEntry(`Consciousness anchors at: ${allNodes[nodeId].name}.`, "system_major_event");
            }
            return allNodes[nodeId];
        } else {
            console.error(`Cannot place player: Node ID "${nodeId}" does not exist.`);
            if (typeof UIManager !== 'undefined' && UIManager.addLogEntry) {
                UIManager.addLogEntry(`Error: Cannot materialize at unknown node "${nodeId}".`, "error");
            }
            return null;
        }
    }

    function canNavigateToNode(targetNodeId) {
        if (!currentPsychonautNodeId) return false;
        const currentNode = allNodes[currentPsychonautNodeId];
        if (currentNode && currentNode.connections && currentNode.connections.includes(targetNodeId)) {
            if (allNodes[targetNodeId]) {
                return true;
            }
        }
        return false;
    }

    function navigateToNode(targetNodeId, player) {
        if (!player) { console.error("Player object not provided for navigation cost in World.navigateToNode."); if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry("Error: Player context missing for navigation.", "error"); return false; }
        if (!allNodes[targetNodeId]) { if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`Error: Target node "${targetNodeId}" does not exist.`, "error"); return false; }

        if (canNavigateToNode(targetNodeId)) {
            const navigationCost = 1; 
            if (player.clarity >= navigationCost) {
                player.modifyClarity(-navigationCost, `navigating to ${allNodes[targetNodeId].name}`);
                const previousNodeName = allNodes[currentPsychonautNodeId].name;
                currentPsychonautNodeId = targetNodeId;
                const newNodeName = allNodes[currentPsychonautNodeId].name;
                if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`Journeyed from ${previousNodeName} to ${newNodeName}.`, "system");
                return allNodes[currentPsychonautNodeId];
            } else {
                if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`Not enough Clarity to travel to ${allNodes[targetNodeId].name}. (Requires ${navigationCost}, Have: ${player.clarity})`, "warning");
                return false;
            }
        } else {
            if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`No direct path to ${allNodes[targetNodeId].name} from ${allNodes[currentPsychonautNodeId]?.name || 'your current position'}.`, "warning");
            return false;
        }
    }

    function getCurrentNode() { if (!currentPsychonautNodeId) { console.warn("getCurrentNode called but currentPsychonautNodeId is null."); return null; } return allNodes[currentPsychonautNodeId]; }
    function getNodeData(nodeId) { return allNodes[nodeId]; }
    function getAllNodes() { return allNodes; }
    function getAccessibleNodeIds(fromNodeId = null) { const sourceNodeId = fromNodeId || currentPsychonautNodeId; if (!sourceNodeId) return []; const sourceNode = allNodes[sourceNodeId]; if (sourceNode && sourceNode.connections && Array.isArray(sourceNode.connections)) { return sourceNode.connections.filter(nodeId => allNodes[nodeId]); } return []; }

    function revealNodeConnection(fromNodeId, toNodeId) {
        if (allNodes[fromNodeId] && allNodes[toNodeId]) {
            if (!allNodes[fromNodeId].connections.includes(toNodeId)) {
                allNodes[fromNodeId].connections.push(toNodeId);
                if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`A new path has opened from ${allNodes[fromNodeId].name} towards ${allNodes[toNodeId].name}.`, "discovery");
                return true;
            }
        } else {
            console.error(`Cannot reveal connection: Node ${fromNodeId} or ${toNodeId} not found.`);
            if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`Error: Could not map path between unknown echoes (${fromNodeId} to ${toNodeId}).`, "error");
        }
        return false;
    }

    function lockNodeConnection(fromNodeId, toNodeId) { if (allNodes[fromNodeId] && allNodes[toNodeId] && allNodes[fromNodeId].connections) { const index = allNodes[fromNodeId].connections.indexOf(toNodeId); if (index > -1) { allNodes[fromNodeId].connections.splice(index, 1); allNodes[fromNodeId].lockedConnections = allNodes[fromNodeId].lockedConnections || []; if (!allNodes[fromNodeId].lockedConnections.includes(toNodeId)) { allNodes[fromNodeId].lockedConnections.push(toNodeId); } if(UIManager && UIManager.addLogEntry) UIManager.addLogEntry(`The path from ${allNodes[fromNodeId].name} to ${allNodes[toNodeId].name} has become impassable.`, "world_event_negative"); return true; } } return false; }
    function updateNodeShortDescription(nodeId, newShortDesc) { if (allNodes[nodeId]) { allNodes[nodeId].shortDesc = newShortDesc; } }

    function resetWorld() {
        init(); 
    }

    return {
        init,
        placePlayerAtNode,
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
