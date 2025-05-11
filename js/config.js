// js/config.js

// --- Initial Game Configurations & Constants ---
const CONFIG = {
    INITIAL_PSYCHONAUT_NAME: "The Wanderer",
    INITIAL_AMBITION_TEXT: "To Understand the Whispers",

    MAX_HAND_SIZE: 7, // Max concepts in hand during encounter
    INITIAL_CARD_DRAW_ENCOUNTER: 3, // How many cards drawn at start of an encounter
    TURN_START_CARD_DRAW: 1, // Cards drawn at start of player's turn in encounter

    LOG_MAX_ENTRIES: 50, // Max entries in the event log before older ones are trimmed
    JOURNAL_MAX_ENTRIES: 20,
};

// --- Player Initial Stats & Resources ---
const PLAYER_INITIAL_STATS = {
    integrity: 100,
    maxIntegrity: 100,
    focus: 5,
    maxFocus: 5,
    clarity: 20, // Represents "mental supplies" for travel
    maxClarity: 20,
    hope: 5,
    maxHope: 10,
    despair: 0,
    maxDespair: 10,
    insight: 0, // Meta-currency / in-run special action currency

    attunements: {
        attraction: 0,
        interaction: 0,
        sensory: 0,
        psychological: 0,
        cognitive: 0,
        relational: 0,
        rolefocus: 0,
    },

    memories: [], // Array for active artifact names/objects
    personaStance: null, // Current active stance
};

// --- Attunement Definitions (Names & Descriptions) ---
// Actual mechanics linked to these would be in player.js or encounter_manager.js
const ATTUNEMENT_DEFINITIONS = {
    attraction: { name: "Attraction (A)", description: "Influence through allure, magnetism, and understanding of desire." },
    interaction: { name: "Interaction (I)", description: "Direct engagement, confrontation, setting boundaries, and debate." },
    sensory: { name: "Sensory (S)", description: "Perception, body awareness, managing sensory input, finding meaning in raw experience." },
    psychological: { name: "Psychological (P)", description: "Empathy, intuition, emotional understanding, therapeutic approaches." },
    cognitive: { name: "Cognitive (C)", description: "Logic, analysis, pattern recognition, intellectual detachment." },
    relational: { name: "Relational (R)", description: "Understanding connection, roles, dependency, and group dynamics." },
    rolefocus: { name: "RoleFocus (RF)", description: "Adopting personas, performance, and control through defined roles." }
};

// --- Concept Card Definitions ---
// This will be a large object/dictionary. Card effects will be functions.
// For simplicity here, effects are strings, but they'd be complex functions in reality.
const CONCEPT_CARD_DEFINITIONS = {
    "C001": {
        id: "C001",
        name: "Tentative Inquiry",
        type: "Technique", // Expression, Technique, Insight, Trauma
        attunement: "Psychological", // Primary attunement for scaling/synergy
        cost: 1, // Focus cost
        keywords: ["#Gentle", "#Reveal"],
        description: "Gently probe the Aspect. Reveal one of its Hidden Traits. Builds 1 Resonance.",
        effectFunctionName: "playTentativeInquiry" // Name of function in encounter_manager.js or concept_cards.js
        // In a more complex system, the effect function itself might be defined here or imported
    },
    "C002": {
        id: "C002",
        name: "Assertive Stance",
        type: "Expression",
        attunement: "Interaction",
        cost: 2,
        keywords: ["#Challenge", "#Pressure"],
        description: "Directly challenge the Aspect. Apply 4 Pressure. Builds 1 Dissonance.",
        effectFunctionName: "playAssertiveStance"
    },
    "C003": {
        id: "C003",
        name: "Moment of Composure",
        type: "Technique",
        attunement: "Cognitive",
        cost: 1,
        keywords: ["#Shield", "#Focus"], // Hypothetical #Focus keyword if it interacts with Focus regen
        description: "Center yourself. Gain 5 Player Composure (absorbs next incoming Pressure).",
        effectFunctionName: "playMomentOfComposure"
    },
    "T001": { // Example Trauma card
        id: "T001",
        name: "Whispers of Doubt",
        type: "Trauma",
        attunement: "None",
        cost: 0, // Traumas often have 0 cost but negative on-draw or on-play effects
        keywords: ["#DissonanceSource"],
        description: "When drawn: Lose 1 Focus this turn. If played: Builds 1 Dissonance.",
        onDrawFunctionName: "onDrawWhispersOfDoubt", // Special function for on-draw effects
        effectFunctionName: "playWhispersOfDoubt"
    }
    // ... more cards
};

// --- Starting Deck ---
const PLAYER_INITIAL_DECK = [
    "C001", "C001", // 2x Tentative Inquiry
    "C002",         // 1x Assertive Stance
    "C003", "C003", "C003" // 3x Moment of Composure
];


// --- Aspect Templates ---
// Similar to cards, effects/intents would be functions or point to function names
const ASPECT_TEMPLATES = {
    "ASP001": {
        id: "ASP001",
        name: "Fleeting Anxiety",
        baseResolve: 15,
        baseComposure: 0,
        resonanceGoal: 3,
        dissonanceThreshold: 3,
        visibleTraits: [
            { name: "Jittery", description: "Has a 25% chance to change its Intent randomly each turn." }
        ],
        hiddenTraits: [
            { name: "Seeks Reassurance", description: "#Gentle Concepts build +1 bonus Resonance." }
        ],
        intents: [ // Array of intent objects or function names that define intent logic
            { id: "INT001A", name: "Minor Worry Spike", description: "Deals 2 Psychological Damage.", functionName: "intentMinorWorrySpike" },
            { id: "INT001B", name: "Sudden Retreat", description: "Gains 5 Composure.", functionName: "intentSuddenRetreat" }
        ],
        rewards: { // Potential rewards upon resolution
            insight: 5,
            conceptPool: ["C001_UPG", "C004"] // IDs of potential card rewards
        }
    },
    "ASP002": {
        id: "ASP002",
        name: "Fragment of Stubbornness",
        baseResolve: 25,
        baseComposure: 5,
        resonanceGoal: 5,
        dissonanceThreshold: 4,
        visibleTraits: [
            { name: "Unyielding", description: "Reduces all incoming Pressure by 1." },
            { name: "Provoked by Challenge", description: "Gains +2 Composure when hit by a #Challenge Concept." }
        ],
        hiddenTraits: [
            { name: "Secretly Insecure", description: "Vulnerable to #Understanding Concepts when Composure is 0." }
        ],
        intents: [
            { id: "INT002A", name: "Dismissive Glare", description: "Deals 3 Psychological Damage. Player discards 1 random Concept.", functionName: "intentDismissiveGlare" },
            { id: "INT002B", name: "Reinforce Beliefs", description: "Gains 3 Composure. Builds 1 Dissonance.", functionName: "intentReinforceBeliefs" }
        ],
        rewards: {
            insight: 10,
            memoryPool: ["MEM001_Resilience"] // ID of potential memory/artifact
        }
    }
    // ... more aspects
};

// --- Location Data (Simplified Example) ---
// In a real game, this would be much more extensive, possibly in its own file or database
const LOCATION_DATA_MINIMAL = {
    "LOC_START_SANCTUARY": {
        id: "LOC_START_SANCTUARY",
        name: "The Threshold Sanctum",
        region: "The Shallows of Awakening",
        description: "A faintly glowing space, offering a moment of respite before the deeper journey. The air hums with a quiet potential.",
        type: "Sanctuary", // "Sanctuary", "IsleOfMemory", "ChallengingDomain", "HiddenShrine"
        actions: ["rest", "shop", "view_ambition", "depart"], // Identifiers for available actions
        storylets: ["STORY_SANCTUARY_INTRO"], // IDs of storylets available here
        // connections: { "north": "LOC_WHISPERING_PATH" } // How navigation works
    },
    "LOC_WHISPERING_PATH_NODE_1": {
        id: "LOC_WHISPERING_PATH_NODE_1",
        name: "A Murmuring Intersection",
        region: "The Shallows of Awakening",
        description: "Faint whispers echo around you, too indistinct to grasp but hinting at multiple paths forward.",
        type: "ExplorationNode",
        storylets: ["STORY_PATH_CHOICE_A"],
        // connections: { "north_east": "LOC_ANXIETY_FRINGE", "north_west": "LOC_FORGOTTEN_MEMORY_EDGE" }
    }
    // ... more locations
};

// --- Storylet Data (Simplified Example) ---
const STORYLET_DATA_MINIMAL = {
    "STORY_SANCTUARY_INTRO": {
        id: "STORY_SANCTUARY_INTRO",
        title: "A Moment of Preparation",
        text: "The Keeper of the Threshold Sanctum regards you with ancient eyes. 'The Inner Sea is vast, Psychonaut. What guidance do you seek before you embark, or are you ready to face the echoes within?'",
        choices: [
            { text: "Ask about the current Ambition.", outcomeFunctionName: "storyOutcomeAskAmbition" },
            { text: "Inquire about recent disturbances in the Shallows.", outcomeFunctionName: "storyOutcomeAskDisturbances" },
            { text: "State readiness to depart.", outcomeFunctionName: "storyOutcomeDepartSanctuary" }
        ]
    },
    // ... more storylets
};


// --- Persona Stance Definitions (Basic) ---
const PERSONA_STANCE_DEFINITIONS = {
    "OBSERVER": {
        id: "OBSERVER",
        name: "Observer Stance",
        description: "A balanced, cautious stance. +1 Focus regeneration during encounters.",
        // Modifiers would be applied by encounter_manager or player.js
        modifiers: { focusRegenBonus: 1 }
    },
    "EMPATH": {
        id: "EMPATH",
        name: "Empathic Listener",
        description: "#Gentle and #Understanding Concepts are more effective. Start encounters with +2 Player Composure.",
        attunementReq: { psychological: 3 }, // Example requirement
        modifiers: { gentleBonus: 1, understandingBonus: 1, startComposure: 2 }
    }
    // ... more stances
};

// Make data accessible (if not using ES6 modules, attach to window or a global object)
// For simplicity in this non-module setup, we might need a global game object later
// or ensure scripts are loaded in an order that makes these available.
// For now, they are just consts in this file.
