// js/world.js

const World = (() => { 

    let allNodes = {}; 
    let currentPsychonautNodeId = null; 

    function init() {
        allNodes = {}; 
        currentPsychonautNodeId = null; 
        _loadNodeMapData(); 

        if (Object.keys(allNodes).length === 0) {
            console.error("CRITICAL: No map nodes loaded from NODE_MAP_DATA in config.js!");
            if (typeof Game !== 'undefined' && Game.notify) {
                Game.notify("FATAL ERROR: The Inner Sea's geography is undefined!", "critical_system");
            }
        } else {
            console.log("World (v2.1 Awakening - Full Corrected v2) initialized.");
        }
    }

    function _loadNodeMapData() {
        if (typeof NODE_MAP_DATA !== 'undefined') {
            for (const nodeId in NODE_MAP_DATA) {
                if (NODE_MAP_DATA.hasOwnProperty(nodeId)) {
                    allNodes[nodeId] = { ...NODE_MAP_DATA[nodeId] };
                    allNodes[nodeId].connections = Array.isArray(allNodes[nodeId].connections) ? [...allNodes[nodeId].connections] : [];
                    allNodes[nodeId].arrivalStoryletCompleted = false; 
                    if (typeof LOCATION_DATA_MINIMAL !== 'undefined' && LOCATION_DATA_MINIMAL[nodeId]) { 
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
                                type: "Unknown",
                                arrivalStoryletCompleted: false 
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
            if (typeof Game !== 'undefined' && Game.notify) { 
                Game.notify(`Consciousness anchors at: ${allNodes[nodeId].name}.`, "system_major_event");
            }
            return allNodes[nodeId];
        } else {
            console.error(`Cannot place player: Node ID "${nodeId}" does not exist.`);
            if (typeof Game !== 'undefined' && Game.notify) {
                Game.notify(`Error: Cannot materialize at unknown node "${nodeId}".`, "error");
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
        if (!player) { console.error("Player object not provided for navigation cost in World.navigateToNode."); if(typeof Game !== 'undefined' && Game.notify) Game.notify("Error: Player context missing for navigation.", "error"); return false; }
        if (!allNodes[targetNodeId]) { if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Error: Target node "${targetNodeId}" does not exist.`, "error"); return false; }

        if (canNavigateToNode(targetNodeId)) {
            const navigationCost = 1; 
            if (player.clarity >= navigationCost) {
                player.modifyClarity(-navigationCost, `navigating to ${allNodes[targetNodeId].name}`);
                const previousNodeName = allNodes[currentPsychonautNodeId].name;
                currentPsychonautNodeId = targetNodeId;
                const newNodeName = allNodes[currentPsychonautNodeId].name;
                if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Journeyed from ${previousNodeName} to ${newNodeName}.`, "system");
                return allNodes[currentPsychonautNodeId];
            } else {
                if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Not enough Clarity to travel to ${allNodes[targetNodeId].name}. (Requires ${navigationCost}, Have: ${player.clarity})`, "warning");
                return false;
            }
        } else {
            if(typeof Game !== 'undefined' && Game.notify) Game.notify(`No direct path to ${allNodes[targetNodeId].name} from ${allNodes[currentPsychonautNodeId]?.name || 'your current position'}.`, "warning");
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
                if(typeof Game !== 'undefined' && Game.notify) Game.notify(`A new path has opened from ${allNodes[fromNodeId].name} towards ${allNodes[toNodeId].name}.`, "discovery");
                return true;
            }
        } else {
            console.error(`Cannot reveal connection: Node ${fromNodeId} or ${toNodeId} not found.`);
            if(typeof Game !== 'undefined' && Game.notify) Game.notify(`Error: Could not map path between unknown echoes (${fromNodeId} to ${toNodeId}).`, "error");
        }
        return false;
    }

    function lockNodeConnection(fromNodeId, toNodeId) { 
        if (allNodes[fromNodeId] && allNodes[toNodeId] && allNodes[fromNodeId].connections && Array.isArray(allNodes[fromNodeId].connections)) { 
            const index = allNodes[fromNodeId].connections.indexOf(toNodeId); 
            if (index > -1) { 
                allNodes[fromNodeId].connections.splice(index, 1); 
                allNodes[fromNodeId].lockedConnections = allNodes[fromNodeId].lockedConnections || []; 
                if (!allNodes[fromNodeId].lockedConnections.includes(toNodeId)) { 
                    allNodes[fromNodeId].lockedConnections.push(toNodeId); 
                } 
                if(typeof Game !== 'undefined' && Game.notify) Game.notify(`The path from ${allNodes[fromNodeId].name} to ${allNodes[toNodeId].name} has become impassable.`, "world_event_negative"); 
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
    
    function markArrivalStoryletCompleted(nodeId) {
        if (allNodes[nodeId]) {
            allNodes[nodeId].arrivalStoryletCompleted = true;
            console.log(`Arrival storylet for node ${nodeId} ('${allNodes[nodeId].name}') marked as completed.`);
        } else {
            console.warn(`Attempted to mark arrival storylet completed for non-existent node: ${nodeId}`);
        }
    }

    function resetWorld() {
        init(); 
        console.log("World (v2.1) has been reset.");
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
        markArrivalStoryletCompleted, 
        resetWorld
    };
})();
