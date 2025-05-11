// js/config.js

// --- Initial Game Configurations & Constants ---
const CONFIG = {
    INITIAL_PSYCHONAUT_NAME: "The Awakened", // Updated for intro
    INITIAL_AMBITION_TEXT: "To Grasp What Was Lost", // Updated for intro

    MAX_HAND_SIZE: 5, // Slightly smaller hand for more focused intro
    INITIAL_CARD_DRAW_ENCOUNTER: 3,
    AWAKENING_DECK_INITIAL_DRAW: 1, // Special for "Grasp for Awareness"
    TURN_START_CARD_DRAW: 1,

    LOG_MAX_ENTRIES: 50,
    JOURNAL_MAX_ENTRIES: 20,

    // For the pre-game intro text display
    PRE_GAME_INTRO_LINE_DELAY: 2000, // ms between lines
    PRE_GAME_INTRO_FADE_DURATION: 1500, // ms for fade-in (should match CSS animation)
};

// --- Player Initial Stats & Resources (For "The Precipice" Start) ---
const PLAYER_INITIAL_STATS = {
    integrity: 10,
    maxIntegrity: 10, // Starts low, "Echo of a Name" will increase it
    focus: 1,
    maxFocus: 1, // Starts low
    clarity: 1,
    maxClarity: 20, // Max clarity is still decent
    hope: 0,
    maxHope: 10,
    despair: 7, // Starts high
    maxDespair: 10,
    insight: 0,

    attunements: {
        attraction: 0,
        interaction: 0,
        sensory: 0,
        psychological: 0,
        cognitive: 0,
        relational: 0,
        rolefocus: 0,
    },

    memories: [],
    personaStance: null,
};

// --- Attunement Definitions (Names & Descriptions) ---
const ATTUNEMENT_DEFINITIONS = {
    attraction: { name: "Attraction (A)", description: "Influence through allure, magnetism, and understanding of desire." },
    interaction: { name: "Interaction (I)", description: "Direct engagement, confrontation, setting boundaries, and debate." },
    sensory: { name: "Sensory (S)", description: "Perception, body awareness, managing sensory input, finding meaning in raw experience." },
    psychological: { name: "Psychological (P)", description: "Empathy, intuition, emotional understanding, therapeutic approaches." },
    cognitive: { name: "Cognitive (C)", description: "Logic, analysis, pattern recognition, intellectual detachment." },
    relational: { name: "Relational (R)", description: "Understanding connection, roles, dependency, and group dynamics." },
    rolefocus: { name: "RoleFocus (RF)", description: "Adopting personas, performance, and control through defined roles." }
};

// --- Concept Card Definitions (Expanded for Intro) ---
const CONCEPT_CARD_DEFINITIONS = {
    // Awakening Deck Cards
    "AWK001": {
        id: "AWK001",
        name: "Grasp for Awareness",
        type: "Technique",
        attunement: "Cognitive",
        cost: 0,
        keywords: ["#Focus", "#Draw"],
        description: "A primal urge to understand. Gain 1 Focus. Draw 1 card from your Awakening insights.",
        effectFunctionName: "playGraspForAwareness"
    },
    "AWK002": {
        id: "AWK002",
        name: "Fragmented Memory: The Fall",
        type: "Insight",
        attunement: "Cognitive",
        cost: 1,
        keywords: ["#Reveal", "#Clarity", "#TraumaSource"],
        description: "Witness a sliver of how you arrived. Gain 2 Clarity. Add 'Disorientation' (Trauma) to your discard pile.",
        effectFunctionName: "playFragmentedMemoryTheFall"
    },
    "AWK003": {
        id: "AWK003",
        name: "Echo of a Name",
        type: "Technique",
        attunement: "Psychological",
        cost: 1,
        keywords: ["#Self", "#Heal", "#IntegrityBoost"],
        description: `Recall a faint echo. Your name is ${CONFIG.INITIAL_PSYCHONAUT_NAME}. Gain +40 Max Integrity. Heal 20 Integrity.`,
        effectFunctionName: "playEchoOfAName"
    },
    "AWK004": {
        id: "AWK004",
        name: "Primal Fear",
        type: "Expression",
        attunement: "Interaction", // Or Sensory
        cost: 1,
        keywords: ["#Pressure", "#Fear", "#DissonanceSource"],
        description: "A raw, instinctual reaction. Apply 3 'Fear' (Pressure) to an unformed threat. Builds 1 Dissonance with self.",
        effectFunctionName: "playPrimalFear"
    },

    // Trauma Card
    "TRM001": {
        id: "TRM001",
        name: "Disorientation",
        type: "Trauma",
        attunement: "None",
        cost: 0, // Effect is on draw or passive
        keywords: ["#Clutter", "#Debuff"],
        description: "When drawn: All Concepts cost +1 Focus this turn unless you spend 1 Clarity to negate this effect.",
        onDrawFunctionName: "onDrawDisorientation", // Special function for on-draw effects
        effectFunctionName: "playDisorientation" // Effect if explicitly played (maybe none)
    },

    // Cards gained from Intro Locations
    "CON001": {
        id: "CON001",
        name: "Shared Sorrow",
        type: "Expression",
        attunement: "Psychological",
        cost: 1,
        keywords: ["#Gentle", "#Resonate", "#Heal"],
        description: "Connect with sadness. Build 2 Resonance with Aspects having 'Sadness' or 'Wounded' traits. Heal 1 Player Integrity.",
        effectFunctionName: "playSharedSorrow"
    },
    "CON002": {
        id: "CON002",
        name: "Detached Observation",
        type: "Technique",
        attunement: "Cognitive",
        cost: 0,
        keywords: ["#Reveal", "#Draw", "#Focus"],
        description: "Objectively assess. The next card played that reveals an Aspect Trait costs 1 less Focus. Draw 1 card.",
        effectFunctionName: "playDetachedObservation"
    },
    // Basic cards for later if needed (from original config)
     "C001_STD": { // Renamed to avoid clash if AWK used similar numbers
        id: "C001_STD",
        name: "Standard Inquiry",
        type: "Technique",
        attunement: "Psychological",
        cost: 1,
        keywords: ["#Gentle", "#Reveal"],
        description: "Probe the Aspect. Reveal one of its Hidden Traits. Builds 1 Resonance.",
        effectFunctionName: "playStandardInquiry"
    },
    "C002_STD": {
        id: "C002_STD",
        name: "Standard Challenge",
        type: "Expression",
        attunement: "Interaction",
        cost: 2,
        keywords: ["#Challenge", "#Pressure"],
        description: "Directly challenge the Aspect. Apply 4 Pressure. Builds 1 Dissonance.",
        effectFunctionName: "playStandardChallenge"
    }
};

// --- Initial Decks for the "Awakening" Intro ---
const PLAYER_INITIAL_AWAKENING_HAND = ["AWK001"]; // Starts with only "Grasp for Awareness"
const PLAYER_AWAKENING_DECK_CONTENTS = ["AWK002", "AWK003", "AWK004"]; // Cards to be drawn by AWK001

// Player's actual deck will be empty initially, populated by AWK001's draws.
// Then, new cards are added via storylets.
const PLAYER_INITIAL_DECK = []; // Starts empty, "Grasp for Awareness" builds it.


// --- Aspect Templates (Intro Aspect) ---
const ASPECT_TEMPLATES = {
    "ASP_LINGERING_DOUBT": {
        id: "ASP_LINGERING_DOUBT",
        name: "Lingering Doubt",
        baseResolve: 5,
        baseComposure: 0,
        resonanceGoal: 2, // Low goal for a quick encounter
        dissonanceThreshold: 3,
        visibleTraits: [
            { name: "Ephemeral", description: "Fades if not addressed quickly." },
            { name: "Feeds on Negativity", description: "Gains 1 Composure if player plays a card that builds Dissonance with self."}
        ],
        hiddenTraits: [
            { name: "Craves Certainty", description: "#Reveal Concepts deal +1 Pressure to it." }
        ],
        intents: [
            { id: "INT_DOUBT_01", name: "Sow Confusion", description: "Attempts to add 1 'Minor Confusion' (Trauma) to player's discard.", functionName: "intentSowConfusion", params: { traumaId: "TRM_MINOR_CONFUSION" } },
            { id: "INT_DOUBT_02", name: "Whisper Discouragement", description: "Player loses 1 Hope.", functionName: "intentWhisperDiscouragement" },
            { id: "INT_DOUBT_03", name: "Fade Away", description: "Aspect attempts to disengage after 3 turns if Resolve > 0.", functionName: "intentFadeAway"}
        ],
        rewards: {
            insight: 2,
            // No card/memory rewards from this very minor aspect
        }
    }
    // ... more aspects for later game
};

// --- Artifact/Memory Definitions ---
const MEMORY_DEFINITIONS = {
    "MEM_TARNISHED_LOCKET": {
        id: "MEM_TARNISHED_LOCKET",
        name: "Tarnished Locket",
        type: "Passive", // Could be "Equippable", "Consumable"
        description: "A dim, silver locket, cold to the touch. It feels familiar, a phantom weight against a forgotten chest. When Hope is critically low (1 or 0), provides +1 Hope at the start of your 'day' (major rest/new region entry).",
        // Actual effect logic would be in Player.js or main game loop checks
        onHopeCriticallyLowFunctionName: "effectTarnishedLocketHope"
    }
};

// --- Node Map Data for Intro ---
const NODE_MAP_DATA = {
    "NODE_SHATTERED_SHORE": {
        id: "NODE_SHATTERED_SHORE",
        name: "The Shattered Shore",
        shortDesc: "A desolate, rocky outcrop.",
        position: { x: 50, y: 300 }, // Example coordinates for rendering (percentage or pixels)
        storyletOnArrival: "STORY_SHORE_ARRIVAL",
        connections: [] // Initially no connections, revealed by storylet
    },
    "NODE_WRECKAGE_OF_THOUGHT": {
        id: "NODE_WRECKAGE_OF_THOUGHT",
        name: "Wreckage of a Thought",
        shortDesc: "Twisted, broken spars of logic.",
        position: { x: 250, y: 150 },
        storyletOnArrival: "STORY_WRECKAGE_ARRIVAL",
        connections: ["NODE_SHATTERED_SHORE"] // Connects back
    },
    "NODE_WEEPING_NICHE": {
        id: "NODE_WEEPING_NICHE",
        name: "The Weeping Niche",
        shortDesc: "An alcove of sorrow.",
        position: { x: 250, y: 450 },
        storyletOnArrival: "STORY_NICHE_ARRIVAL",
        connections: ["NODE_SHATTERED_SHORE"] // Connects back
    },
    "NODE_THRESHOLD_SANCTUM": {
        id: "NODE_THRESHOLD_SANCTUM",
        name: "The Threshold Sanctum",
        shortDesc: "A beacon of faint, steady light.",
        position: { x: 450, y: 300 },
        isSanctuary: true, // Special flag
        storyletOnArrival: "STORY_SANCTUARY_INTRO_AWAKENING", // New intro storylet for here
        connections: ["NODE_WRECKAGE_OF_THOUGHT", "NODE_WEEPING_NICHE"] // Connects back
    }
};

// --- Location Data (for nodes that are more than just pass-throughs) ---
// For the intro, most "location" interaction is via storylet on arrival.
// The Sanctum is the main "Location" with actions.
const LOCATION_DATA_MINIMAL = { // Renamed as this won't contain ALL nodes
    "NODE_THRESHOLD_SANCTUM": { // Use Node ID for consistency
        id: "NODE_THRESHOLD_SANCTUM",
        name: "The Threshold Sanctum",
        region: "The Precipice Edge", // A new "region" for the intro area
        description: "A faintly glowing space, offering a moment of respite. The air hums with a quiet potential. The Keeper watches you.",
        type: "Sanctuary",
        actions: ["rest", "shop_intro", "talk_keeper", "view_ambition"], // Specific actions for this intro sanctuary
        storyletsOnExplore: ["STORY_KEEPER_ADVICE_OPTIONAL"] // Optional storylets if player "explores" again
    }
    // Other nodes are primarily driven by their storyletOnArrival from NODE_MAP_DATA
};

// --- Storylet Data (Expanded for Intro) ---
const PRE_GAME_INTRO_LINES = [ // For the very start
    "The edges fray.",
    "Cohesion... a forgotten luxury.",
    "Where <em>am</em> I?",
    "No... <em>what</em> am I becoming?",
    "Falling.",
    "Or... surfacing?"
];

const STORYLET_DATA_MINIMAL = { // Renamed to avoid conflict
    "STORY_SHORE_ARRIVAL": {
        id: "STORY_SHORE_ARRIVAL",
        title: "Adrift",
        text: "You claw your way onto something solid, though 'solid' feels like a generous term. Jagged, obsidian-like rock presses into you, cold and indifferent. The air is thick with the scent of ozone and something anciently sorrowful. Your thoughts are a fractured mess. A single, primal urge cuts through the fog: to simply *be* aware.",
        choices: [
            // Only one choice initially, representing the first card play
            // This will be handled specially by main.js to use the "Grasp for Awareness" card
            // For now, let's represent it as a storylet that auto-triggers an action.
            // This storylet essentially sets the scene, the "Grasp for Awareness" is the actual first *action*.
        ],
        autoTriggerAction: "PLAY_GRASP_FOR_AWARENESS" // Special flag for main.js
    },
    "STORY_WRECKAGE_ARRIVAL": {
        id: "STORY_WRECKAGE_ARRIVAL",
        title: "Splintered Logic",
        text: "This... this was something. A structure of reason? A carefully constructed argument? Now, just splintered concepts and the lingering heat of its collapse. A faint whisper catches your attention, '<em>...not meant to see...not for you...</em>'",
        choices: [
            { text: "Sift through the debris carefully. (Costs 1 Focus)", outcomeFunctionName: "outcomeSiftWreckage", conditionFunctionName: "conditionHasFocus1" },
            { text: "Focus on the whisper, try to understand.", outcomeFunctionName: "outcomeListenWhisperWreckage" },
            { text: "Leave it be. This place feels dangerous.", outcomeFunctionName: "outcomeLeaveWreckage" }
        ]
    },
    "STORY_NICHE_ARRIVAL": {
        id: "STORY_NICHE_ARRIVAL",
        title: "The Weeping Niche",
        text: "A narrow cleft in the rock, damp and cold. The sorrow here is a palpable presence, clinging to you like a shroud. The source of a faint, mournful sound is a single, tear-shaped fungus, pulsing with a faint, melancholy light. It seems to... respond to your proximity.",
        choices: [
            { text: "Reach out to the fungus with empathy.", outcomeFunctionName: "outcomeTouchFungusEmpathy" },
            { text: "Observe the fungus from a distance, analyze it.", outcomeFunctionName: "outcomeObserveFungusCognitive" },
            { text: "Attempt to harvest the fungus.", outcomeFunctionName: "outcomeHarvestFungus" }
        ]
    },
    "STORY_SANCTUARY_INTRO_AWAKENING": { // New version for intro
        id: "STORY_SANCTUARY_INTRO_AWAKENING",
        title: "The Keeper's Gaze",
        text: "The Keeper of the Threshold Sanctum regards you with ancient, luminous eyes. 'Another stray spark, washed up on the shores of the unthought. You are tattered, child of the surface, more echo than substance. But perhaps not entirely lost. This Threshold is but a small haven in the Inner Sea, the ocean of consciousness. What do you seek from this place, or from me?'",
        choices: [
            { text: "\"Where am I? What is this place?\"", outcomeFunctionName: "outcomeKeeperExplainInnerSea" },
            { text: "\"How do I leave? How do I get back to... before?\"", outcomeFunctionName: "outcomeKeeperExplainReturn" },
            { text: "\"I feel... broken. Unmade.\"", outcomeFunctionName: "outcomeKeeperOfferRest", conditionFunctionName: "conditionPlayerWounded"},
            { text: "\"I need to understand these whispers... this sense of loss.\"", outcomeFunctionName: "outcomeKeeperAddressAmbition" }
        ]
    },
    "STORY_KEEPER_ADVICE_OPTIONAL": { // Example of an optional storylet
        id: "STORY_KEEPER_ADVICE_OPTIONAL",
        title: "Further Counsel",
        text: "The Keeper inclines their head. 'You have more questions, or seek a different path now?'",
        choices: [
             { text: "Ask about surviving the Inner Sea.", outcomeFunctionName: "outcomeKeeperSurvivalTips" },
             { text: "Inquire about the nature of 'Concepts'.", outcomeFunctionName: "outcomeKeeperExplainConcepts" },
             { text: "No more questions for now.", outcomeFunctionName: "outcomeEndConversationWithKeeper" }
        ]
    }
    // ... more storylets
};

// --- Persona Stance Definitions (Basic) ---
const PERSONA_STANCE_DEFINITIONS = {
    "OBSERVER": {
        id: "OBSERVER",
        name: "Observer Stance",
        description: "A balanced, cautious stance. +1 Focus regeneration at the start of your turn in encounters.",
        modifiers: { focusRegenBonus: 1 }
    },
    // Other stances would be unlocked later
};
