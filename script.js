// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const aspectNameEl = document.getElementById('aspect-name');
    const aspectResolveEl = document.getElementById('aspect-resolve');
    const aspectResolveBarEl = document.getElementById('aspect-resolve-bar');
    const aspectComposureEl = document.getElementById('aspect-composure');
    const aspectComposureBarEl = document.getElementById('aspect-composure-bar');
    const resonanceValueEl = document.getElementById('resonance-value');
    const resonanceBarEl = document.getElementById('resonance-bar');
    const dissonanceValueEl = document.getElementById('dissonance-value');
    const dissonanceBarEl = document.getElementById('dissonance-bar');
    const visibleTraitsListEl = document.getElementById('visible-traits-list');
    const hiddenTraitsListEl = document.getElementById('hidden-traits-list');
    const aspectIntentTextEl = document.getElementById('aspect-intent-text');
    const aspectStatesListEl = document.getElementById('aspect-states-list');

    const playerIntegrityEl = document.getElementById('player-integrity');
    const playerIntegrityBarEl = document.getElementById('player-integrity-bar');
    const playerFocusEl = document.getElementById('player-focus');
    const playerStatesListEl = document.getElementById('player-states-list');
    const playerHandEl = document.getElementById('player-hand');
    const deckCountEl = document.getElementById('deck-count');
    const discardCountEl = document.getElementById('discard-count');

    const endTurnButton = document.getElementById('end-turn-button');
    const messageLogEl = document.getElementById('message-log');

    const gameOverScreenEl = document.getElementById('game-over-screen');
    const gameOverMessageEl = document.getElementById('game-over-message');
    const restartButton = document.getElementById('restart-button');

    const tooltipEl = document.getElementById('tooltip');

    // --- Game State Variables ---
    let player = {};
    let aspect = {};
    let game = {};

    // --- Card Definitions ---
    // For prototype, card IDs can just be their names for simplicity
    const CARD_DEFINITIONS = {
        "Forceful Confrontation": {
            id: "Forceful Confrontation",
            name: "Forceful Confrontation",
            attunement: "Interaction (I)",
            type: "Expression",
            keywords: ["#Challenge", "#Direct"],
            cost: 1,
            description: "Apply 5 Pressure. If Echo's Composure is 0, build 1 Dissonance.",
            effect: (card) => {
                addLogMessage("Played Forceful Confrontation.");
                const pressureAmount = 5;
                applyPressureToAspect(pressureAmount);

                if (aspect.composure <= 0) {
                    addLogMessage("Echo had no composure, built 1 Dissonance.");
                    buildDissonance(1);
                }
                // Trait: Lashes Out When Cornered
                if (aspect.resolve < 10 && aspect.revealedTraits.includes("Lashes Out When Cornered")) {
                    addLogMessage("TRAIT TRIGGER: Resentful Echo 'Lashes Out When Cornered'!");
                    // Immediately execute Bitter Jab
                    const bitterJabIntent = aspect.intents.find(intent => intent.id === "Bitter Jab");
                    if (bitterJabIntent) {
                        bitterJabIntent.execute();
                    }
                    applyStateToAspect("Enraged", { duration: 1, pressureBoost: 2 }); // Enraged: Pressure +2 for 1 turn
                }
            }
        },
        "Patient Listening": {
            id: "Patient Listening",
            name: "Patient Listening",
            attunement: "Psychological (P)",
            type: "Technique",
            keywords: ["#Understanding", "#Gentle"],
            cost: 1,
            description: "Gain 4 Composure (Player). Build 1 Resonance. If Aspect has 'Wounded' Trait, build +1 additional Resonance.",
            effect: (card) => {
                addLogMessage("Played Patient Listening.");
                // Player Composure is not explicitly in prototype stats, but we can log it or add it if needed.
                // For now, let's interpret "Gain Composure" as a defensive move reducing next incoming damage conceptually
                // Or, if we want player composure:
                // gainPlayerComposure(4);
                addLogMessage("Player gains conceptual composure (effect TBD for player).");

                let resonanceGain = 1;
                if (aspect.visibleTraits.some(t => t.name === "Wounded") || aspect.revealedTraits.includes("Wounded")) { // Wounded is visible
                    resonanceGain += 1;
                    addLogMessage("Wounded Trait: +1 bonus Resonance.");
                }
                buildResonance(resonanceGain);

                // Trait: Seeks Acknowledgment
                const stressState = player.states.find(s => s.name === "Stress");
                const echoStressCount = aspect.states.filter(s => s.name === "Stress" && s.target === 'aspect').length; // Assuming stress can be on aspect too

                if ((aspect.revealedTraits.includes("Seeks Acknowledgment") || aspect.visibleTraits.some(t => t.name === "Seeks Acknowledgment")) &&
                    ( (stressState && stressState.stacks >=3) || countAspectStress() >=3 ) ) { // Check for 3+ stress on player or aspect
                    addLogMessage("TRAIT TRIGGER: Resentful Echo 'Seeks Acknowledgment'!");
                    buildResonance(2);
                }
            }
        },
        "Deflect Negativity": {
            id: "Deflect Negativity",
            name: "Deflect Negativity",
            attunement: "Cognitive (C)",
            type: "Technique",
            keywords: ["#Protective", "#Detachment"],
            cost: 1,
            description: "Gain 6 Composure (Player).",
            effect: (card) => {
                addLogMessage("Played Deflect Negativity.");
                // gainPlayerComposure(6); // Similar to Patient Listening, player composure needs full implementation
                addLogMessage("Player gains 6 conceptual composure.");
                // For prototype: let's treat player composure as a temporary buff that reduces next incoming Pressure
                applyStateToPlayer("Deflecting", { duration: 1, damageReduction: 6 });
            }
        },
        "Insightful Query": {
            id: "Insightful Query",
            name: "Insightful Query",
            attunement: "Cognitive (C)",
            type: "Technique",
            keywords: ["#Reveal", "#Cognitive"],
            cost: 2, // As per brief
            description: "Reveal one Hidden Trait on the Aspect. Draw 1 card.",
            effect: (card) => {
                addLogMessage("Played Insightful Query.");
                revealHiddenTrait();
                drawCards(1);
            }
        }
    };

    // --- Aspect Definition (Prototype: The Resentful Echo) ---
    const RESENTFUL_ECHO_BASE = {
        name: "The Resentful Echo",
        maxResolve: 25,
        maxComposureCap: 20, // Arbitrary cap for UI bar
        maxResonance: 5,
        maxDissonance: 3,
        visibleTraits: [
            { name: "Grudge Holder", description: "Resists #Gentle approaches initially (mechanic TBD). Each time Resentful Echo takes Pressure, it gains 1 Composure next turn." },
            { name: "Wounded", description: "Playing #Understanding cards on Resentful Echo builds +1 bonus Resonance." }
        ],
        hiddenTraits: [
            { name: "Seeks Acknowledgment", description: "Resonance Key: If player plays 'Patient Listening' while Echo or Player has 3+ 'Stress' tokens, gain +2 Resonance." },
            { name: "Lashes Out When Cornered", description: "Trigger: If Echo's Resolve is below 10 and player plays a #Challenge card, Echo immediately uses 'Bitter Jab' and gains 'Enraged' (Pressure +2) for 1 turn." }
        ],
        intents: [
            {
                id: "Mutter Grievances",
                description: "Gain 3 Composure. Prime: Next 'Bitter Jab' also applies 1 'Stress' to Alchemist.",
                execute: () => {
                    addLogMessage("Echo uses Mutter Grievances.");
                    gainAspectComposure(3);
                    // Prime effect - set a flag or a temporary state on the aspect
                    aspect.primedEffect = "StressfulJab";
                    addLogMessage("Echo is primed for a Stressful Jab.");
                }
            },
            {
                id: "Bitter Jab",
                description: "Deal 4 Pressure to Alchemist. Apply 1 'Stress' to Alchemist if primed.",
                execute: () => {
                    addLogMessage("Echo uses Bitter Jab.");
                    let pressureDealt = 4;
                    const enragedState = aspect.states.find(s => s.name === "Enraged");
                    if (enragedState) {
                        pressureDealt += enragedState.pressureBoost;
                        addLogMessage("Enraged: Bitter Jab deals +"+enragedState.pressureBoost+" Pressure!");
                    }

                    applyPressureToPlayer(pressureDealt);

                    if (aspect.primedEffect === "StressfulJab") {
                        addLogMessage("Primed effect: Alchemist gains 1 Stress.");
                        applyStateToPlayer("Stress", { stacks: 1, maxStacks: 3, focusReduction: 1 });
                        aspect.primedEffect = null; // Consume prime
                    }
                }
            },
            {
                id: "Wallow",
                description: "Builds 1 Dissonance if Alchemist ends turn with 0 (conceptual) Composure. If Dissonance Meter is full, Echo heals 5 Resolve.",
                execute: () => {
                    addLogMessage("Echo uses Wallow.");
                    // Check player's conceptual composure (e.g. if 'Deflecting' state is active)
                    const deflectingState = player.states.find(s => s.name === "Deflecting");
                    if (!deflectingState || deflectingState.duration <= 0) { // Simplified check
                        addLogMessage("Alchemist has no active deflection, Echo builds 1 Dissonance.");
                        buildDissonance(1);
                    } else {
                        addLogMessage("Alchemist's deflection prevents Dissonance from Wallow this turn.");
                    }

                    if (aspect.dissonance >= aspect.maxDissonance) {
                        addLogMessage("Dissonance is full! Echo Wallows and heals 5 Resolve.");
                        healAspectResolve(5);
                    }
                }
            }
        ]
    };

    // --- Initialization ---
    function initGame() {
        player = {
            integrity: 30,
            maxIntegrity: 30,
            focus: 3,
            maxFocus: 3,
            deck: [],
            hand: [],
            discardPile: [],
            states: [] // { name, duration, stacks, etc. }
        };

        aspect = {
            name: RESENTFUL_ECHO_BASE.name,
            resolve: RESENTFUL_ECHO_BASE.maxResolve,
            maxResolve: RESENTFUL_ECHO_BASE.maxResolve,
            composure: 0,
            maxComposureCap: RESENTFUL_ECHO_BASE.maxComposureCap,
            resonance: 0,
            maxResonance: RESENTFUL_ECHO_BASE.maxResonance,
            dissonance: 0,
            maxDissonance: RESENTFUL_ECHO_BASE.maxDissonance,
            visibleTraits: JSON.parse(JSON.stringify(RESENTFUL_ECHO_BASE.visibleTraits)), // Deep copy
            hiddenTraits: JSON.parse(JSON.stringify(RESENTFUL_ECHO_BASE.hiddenTraits)),   // Deep copy
            revealedTraits: [], // Store names of revealed hidden traits
            intents: RESENTFUL_ECHO_BASE.intents, // Shallow copy is fine for intents array, functions are shared
            currentIntent: null,
            primedEffect: null, // For "Mutter Grievances"
            states: [], // { name, duration, data }
            tookPressureThisTurn: false // For Grudge Holder trait
        };

        game = {
            isPlayerTurn: true,
            gameOver: false,
            turnNumber: 1
        };

        // Populate deck with prototype cards
        // For prototype, let's give 2 of each. A real game would have more variety.
        player.deck = [
            { ...CARD_DEFINITIONS["Forceful Confrontation"] },
            { ...CARD_DEFINITIONS["Forceful Confrontation"] },
            { ...CARD_DEFINITIONS["Patient Listening"] },
            { ...CARD_DEFINITIONS["Patient Listening"] },
            { ...CARD_DEFINITIONS["Deflect Negativity"] },
            { ...CARD_DEFINITIONS["Deflect Negativity"] },
            { ...CARD_DEFINITIONS["Insightful Query"] },
            // { ...CARD_DEFINITIONS["Insightful Query"] } // Maybe only one Insightful Query to make it more valuable
        ];
        shuffleDeck();

        // Clear logs, states, etc.
        messageLogEl.innerHTML = '<p>Encounter started with "The Resentful Echo".</p>';
        gameOverScreenEl.classList.add('hidden');
        endTurnButton.disabled = false;


        startPlayerTurn(); // Includes drawing initial hand
        updateUI();
    }

    // --- UI Update Functions ---
    function updateUI() {
        // Aspect UI
        aspectNameEl.textContent = aspect.name;
        aspectResolveEl.textContent = aspect.resolve;
        aspectResolveBarEl.style.width = `${(aspect.resolve / aspect.maxResolve) * 100}%`;
        aspectComposureEl.textContent = aspect.composure;
        aspectComposureBarEl.style.width = `${(aspect.composure / aspect.maxComposureCap) * 100}%`; // Cap at 100% if composure > maxComposureCap

        resonanceValueEl.textContent = `${aspect.resonance} / ${aspect.maxResonance}`;
        resonanceBarEl.style.width = `${(aspect.resonance / aspect.maxResonance) * 100}%`;
        dissonanceValueEl.textContent = `${aspect.dissonance} / ${aspect.maxDissonance}`;
        dissonanceBarEl.style.width = `${(aspect.dissonance / aspect.maxDissonance) * 100}%`;

        // Traits
        visibleTraitsListEl.innerHTML = '';
        aspect.visibleTraits.forEach(trait => {
            const li = document.createElement('li');
            li.textContent = `${trait.name}: ${trait.description}`;
            visibleTraitsListEl.appendChild(li);
        });

        hiddenTraitsListEl.innerHTML = '';
        aspect.hiddenTraits.forEach(trait => {
            if (aspect.revealedTraits.includes(trait.name)) {
                const li = document.createElement('li');
                li.textContent = `${trait.name}: ${trait.description}`;
                li.classList.add('revealed'); // Could add styling for revealed
                hiddenTraitsListEl.appendChild(li);
            } else {
                 const li = document.createElement('li');
                 li.textContent = `Hidden Trait (Play "Insightful Query" to reveal)`;
                 li.classList.add('hidden-trait-placeholder');
                 hiddenTraitsListEl.appendChild(li);
            }
        });


        // Intent
        if (aspect.currentIntent) {
            aspectIntentTextEl.textContent = aspect.currentIntent.description;
        } else {
            aspectIntentTextEl.textContent = "Choosing action...";
        }

        // Aspect States
        aspectStatesListEl.innerHTML = '';
        aspect.states.forEach(state => {
            const li = document.createElement('li');
            let text = state.name;
            if (state.duration) text += ` (${state.duration}t)`;
            if (state.stacks) text += ` (x${state.stacks})`;
            if (state.pressureBoost) text += ` (P+${state.pressureBoost})`;
            li.textContent = text;
            if(state.pressureBoost > 0) li.classList.add('buff'); else li.classList.add('debuff');
            aspectStatesListEl.appendChild(li);
        });


        // Player UI
        playerIntegrityEl.textContent = player.integrity;
        playerIntegrityBarEl.style.width = `${(player.integrity / player.maxIntegrity) * 100}%`;
        playerFocusEl.textContent = `${player.focus} / ${player.maxFocus}`;

        // Player States
        playerStatesListEl.innerHTML = '';
        player.states.forEach(state => {
            const li = document.createElement('li');
            let text = state.name;
            if (state.duration) text += ` (${state.duration}t)`;
            if (state.stacks) text += ` (x${state.stacks})`;
            if (state.focusReduction) text += ` (F-${state.focusReduction})`;
            if (state.damageReduction) text += ` (DR ${state.damageReduction})`;
            li.textContent = text;
            if(state.damageReduction > 0) li.classList.add('buff'); else li.classList.add('debuff');
            playerStatesListEl.appendChild(li);
        });


        // Hand
        playerHandEl.innerHTML = '';
        player.hand.forEach(card => {
            playerHandEl.appendChild(createCardElement(card));
        });

        // Deck/Discard
        deckCountEl.textContent = player.deck.length;
        discardCountEl.textContent = player.discardPile.length;

        // Disable cards if not enough focus or not player's turn
        document.querySelectorAll('.card').forEach(cardEl => {
            const cardData = CARD_DEFINITIONS[cardEl.dataset.cardId];
            if (!game.isPlayerTurn || player.focus < cardData.cost || game.gameOver) {
                cardEl.classList.add('disabled-interaction');
            } else {
                cardEl.classList.remove('disabled-interaction');
            }
        });

        endTurnButton.disabled = !game.isPlayerTurn || game.gameOver;
    }

    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.dataset.cardId = card.id; // Store unique ID for retrieval

        cardDiv.innerHTML = `
            <div class="card-cost">${card.cost}F</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${card.type} - ${card.attunement}</div>
            <div class="card-effect">${card.description}</div>
            <div class="card-keywords">${card.keywords.join(', ')}</div>
        `;

        cardDiv.addEventListener('click', () => {
            if (game.isPlayerTurn && player.focus >= card.cost && !game.gameOver) {
                playCard(card);
            } else if (player.focus < card.cost) {
                addLogMessage(`Not enough Focus to play ${card.name}.`);
            }
        });

        // Tooltip listeners
        cardDiv.addEventListener('mouseenter', (event) => showTooltip(card, event));
        cardDiv.addEventListener('mouseleave', hideTooltip);
        cardDiv.addEventListener('mousemove', moveTooltip);


        return cardDiv;
    }

    // --- Game Flow & Turn Management ---
    function startPlayerTurn() {
        addLogMessage(`--- Player Turn ${game.turnNumber} ---`);
        game.isPlayerTurn = true;
        player.focus = player.maxFocus; // Regenerate focus

        // Reduce duration of player states
        updatePlayerStates();


        // Stress effect: reduce focus
        const stressState = player.states.find(s => s.name === "Stress");
        if (stressState && stressState.stacks > 0) {
            const focusLoss = stressState.stacks * stressState.focusReduction;
            player.focus = Math.max(0, player.focus - focusLoss);
            addLogMessage(`Stress reduces Focus by ${focusLoss}.`);
        }


        drawCards(1); // Draw 1 card at start of turn (standard for many deckbuilders)
        // Reset aspect's "took pressure this turn" for Grudge Holder
        aspect.tookPressureThisTurn = false;

        updateUI();
        checkGameOver();
    }

    function endTurn() {
        if (!game.isPlayerTurn || game.gameOver) return;

        addLogMessage("Player ends turn.");
        game.isPlayerTurn = false;
        updateUI(); // Disable player cards

        // Aspect's turn logic will be triggered after a short delay
        setTimeout(startAspectTurn, 1000);
    }

    function startAspectTurn() {
        if (game.gameOver) return;
        addLogMessage(`--- Aspect Turn ${game.turnNumber} ---`);

        // Grudge Holder Trait: Gain composure if took pressure
        if (aspect.tookPressureThisTurn && (aspect.visibleTraits.some(t => t.name === "Grudge Holder") || aspect.revealedTraits.includes("Grudge Holder")) ) {
            addLogMessage("TRAIT: Grudge Holder - Echo gains 1 Composure.");
            gainAspectComposure(1);
        }

        // Reduce duration of aspect states
        updateAspectStates();

        // Aspect chooses and executes intent
        chooseAspectIntent();
        if (aspect.currentIntent && aspect.currentIntent.execute) {
            aspect.currentIntent.execute();
        } else {
            addLogMessage("Aspect is confused and does nothing."); // Fallback
        }

        updateUI();
        checkGameOver(); // Check after aspect action

        if (!game.gameOver) {
            game.turnNumber++;
            setTimeout(startPlayerTurn, 1000); // Start player's next turn after a delay
        }
    }

    // --- Card & Deck Management ---
    function shuffleDeck() {
        for (let i = player.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
        }
    }

    function drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (player.hand.length >= 10) { // Max hand size
                addLogMessage("Max hand size reached.");
                break;
            }
            if (player.deck.length === 0) {
                if (player.discardPile.length === 0) {
                    addLogMessage("No cards left in deck or discard pile.");
                    break; // No cards left anywhere
                }
                // Reshuffle discard into deck
                addLogMessage("Deck empty. Reshuffling discard pile.");
                player.deck = [...player.discardPile];
                player.discardPile = [];
                shuffleDeck();
            }
            if (player.deck.length > 0) { // Check again after potential reshuffle
                const card = player.deck.pop();
                player.hand.push(card);
            }
        }
        updateUI();
    }

    function playCard(cardToPlay) {
        if (player.focus < cardToPlay.cost || !game.isPlayerTurn || game.gameOver) return;

        player.focus -= cardToPlay.cost;

        // Find the card in hand and remove it
        const cardIndex = player.hand.findIndex(c => c.id === cardToPlay.id && c.description === cardToPlay.description); // Simple check
        if (cardIndex > -1) {
            const playedCard = player.hand.splice(cardIndex, 1)[0];
            player.discardPile.push(playedCard);

            // Execute card effect
            if (cardToPlay.effect) {
                cardToPlay.effect(cardToPlay);
            }
        } else {
            console.error("Card not found in hand:", cardToPlay);
            addLogMessage(`Error: Card ${cardToPlay.name} not found in hand.`);
            player.focus += cardToPlay.cost; // Refund focus if error
            return;
        }

        updateUI();
        checkGameOver(); // Check if playing the card won/lost the game
    }

    // --- Player Actions & Effects ---
    function applyPressureToPlayer(amount) {
        let actualAmount = amount;
        const deflectingState = player.states.find(s => s.name === "Deflecting");
        if (deflectingState && deflectingState.damageReduction > 0) {
            const reduction = Math.min(actualAmount, deflectingState.damageReduction);
            actualAmount -= reduction;
            deflectingState.damageReduction -= reduction; // Reduce shield
            addLogMessage(`Deflecting state absorbed ${reduction} Pressure.`);
            if (deflectingState.damageReduction <= 0) {
                // Remove state if shield is gone, or let it expire by duration
                // For simplicity, let's assume it's consumed.
                player.states = player.states.filter(s => s.name !== "Deflecting");
                 addLogMessage(`Deflecting state consumed.`);
            }
        }

        player.integrity -= actualAmount;
        addLogMessage(`Alchemist takes ${actualAmount} Psychological Damage.`);
        if (player.integrity < 0) player.integrity = 0;
        updateUI();
    }

    function applyStateToPlayer(stateName, options = {}) {
        let existingState = player.states.find(s => s.name === stateName);
        if (existingState) {
            if (options.stacks && existingState.stacks !== undefined) {
                existingState.stacks = Math.min((existingState.stacks + options.stacks), options.maxStacks || existingState.stacks + options.stacks);
            }
            if (options.duration) { // Refresh or set duration
                existingState.duration = Math.max(existingState.duration || 0, options.duration);
            }
        } else {
            player.states.push({ name: stateName, ...options });
            existingState = player.states[player.states.length-1];
        }
        addLogMessage(`Alchemist gains ${stateName}${options.stacks ? ' x'+options.stacks : ''}${options.duration ? ' ('+options.duration+'t)' : ''}.`);
        updateUI();
    }

    function updatePlayerStates() {
        player.states = player.states.filter(state => {
            if (state.duration !== undefined) {
                state.duration--;
                return state.duration > 0;
            }
            // States without duration (like stacked Stress) persist until removed by other means
            return true;
        });
        // Decay stress by 1 per turn (as per brief example for Stress, but needs clarification if applies to all stacks or just one)
        // Let's assume it decays one stack per turn IF it's a "decaying" stress.
        // The brief's "Stress: -1 Focus next turn per stack, max 3. Decays by 1 per turn" is a bit ambiguous.
        // For now, Stress effect is applied at start of turn, and it doesn't auto-decay unless explicitly coded.
        // If "Decays by 1 per turn" means one STACK decays, then:
        let stress = player.states.find(s => s.name === "Stress");
        if (stress && stress.stacks > 0) {
            // stress.stacks--; // if it decays by 1 stack
            // addLogMessage("Stress decays by 1 stack.");
            // if(stress.stacks <=0) player.states = player.states.filter(s => s.name !== "Stress");
            // For now, let's just let duration handle it if a duration is set, or manual removal.
        }
    }

    // --- Aspect Actions & Effects ---
    function applyPressureToAspect(amount) {
        let pressureApplied = amount;
        // Consider "Grudge Holder" resist #Gentle (not implemented in cards yet)

        if (aspect.composure > 0) {
            const absorbed = Math.min(pressureApplied, aspect.composure);
            aspect.composure -= absorbed;
            pressureApplied -= absorbed;
            addLogMessage(`Aspect's Composure absorbs ${absorbed} Pressure.`);
        }
        if (pressureApplied > 0) {
            aspect.resolve -= pressureApplied;
            addLogMessage(`Aspect takes ${pressureApplied} Pressure.`);
            aspect.tookPressureThisTurn = true; // For Grudge Holder
        }
        if (aspect.resolve < 0) aspect.resolve = 0;
        updateUI();
    }

    function healAspectResolve(amount) {
        aspect.resolve = Math.min(aspect.maxResolve, aspect.resolve + amount);
        addLogMessage(`Aspect heals ${amount} Resolve.`);
        updateUI();
    }

    function gainAspectComposure(amount) {
        aspect.composure += amount;
        // aspect.composure = Math.min(aspect.composure, aspect.maxComposureCap); // Cap if desired
        addLogMessage(`Aspect gains ${amount} Composure.`);
        updateUI();
    }

    function buildResonance(amount) {
        aspect.resonance = Math.min(aspect.maxResonance, aspect.resonance + amount);
        addLogMessage(`Resonance builds by ${amount}.`);
        updateUI();
        // No immediate game over check here, usually at end of turn or after full action
    }

    function buildDissonance(amount) {
        aspect.dissonance = Math.min(aspect.maxDissonance, aspect.dissonance + amount);
        addLogMessage(`Dissonance builds by ${amount}.`);
        if (aspect.dissonance >= aspect.maxDissonance) {
            addLogMessage("Dissonance Meter is full! Crisis Point (effect TBD).");
            // Implement "Crisis Point" effect if desired (e.g., empower aspect)
        }
        updateUI();
    }

    function revealHiddenTrait() {
        const unrevealedTraits = aspect.hiddenTraits.filter(ht => !aspect.revealedTraits.includes(ht.name));
        if (unrevealedTraits.length > 0) {
            const traitToReveal = unrevealedTraits[Math.floor(Math.random() * unrevealedTraits.length)];
            aspect.revealedTraits.push(traitToReveal.name);
            addLogMessage(`Revealed Hidden Trait: ${traitToReveal.name} - ${traitToReveal.description}`);
        } else {
            addLogMessage("No more hidden traits to reveal.");
        }
        updateUI();
    }
    function countAspectStress() { // Helper if stress can be on aspect
        return aspect.states.filter(s => s.name === "Stress").reduce((sum, s) => sum + (s.stacks || 0), 0);
    }


    function applyStateToAspect(stateName, options = {}) {
        let existingState = aspect.states.find(s => s.name === stateName);
        if (existingState) {
            if (options.stacks && existingState.stacks !== undefined) {
                existingState.stacks = Math.min((existingState.stacks + options.stacks), options.maxStacks || existingState.stacks + options.stacks);
            }
            if (options.duration) { // Refresh or set duration
                existingState.duration = Math.max(existingState.duration || 0, options.duration);
            }
             if (options.pressureBoost !== undefined) existingState.pressureBoost = options.pressureBoost;

        } else {
            aspect.states.push({ name: stateName, ...options });
             existingState = aspect.states[player.states.length-1];
        }
        addLogMessage(`Aspect gains ${stateName}${options.stacks ? ' x'+options.stacks : ''}${options.duration ? ' ('+options.duration+'t)' : ''}.`);
        updateUI();
    }

     function updateAspectStates() {
        aspect.states = aspect.states.filter(state => {
            if (state.duration !== undefined) {
                state.duration--;
                return state.duration > 0;
            }
            return true; // Persist if no duration
        });
    }


    function chooseAspectIntent() {
        // Simple cycling logic for prototype, or random
        if (!aspect.intents || aspect.intents.length === 0) {
            aspect.currentIntent = { description: "No actions available.", execute: () => {} };
            return;
        }
        // Cycle through intents for predictability in prototype
        const currentIndex = aspect.intents.indexOf(aspect.currentIntent);
        const nextIndex = (currentIndex + 1) % aspect.intents.length;
        aspect.currentIntent = aspect.intents[nextIndex];
        // Random alternative:
        // aspect.currentIntent = aspect.intents[Math.floor(Math.random() * aspect.intents.length)];
        updateUI();
    }

    // --- Game Over & Utility ---
    function checkGameOver() {
        if (game.gameOver) return true;

        let gameOverMsg = "";
        if (player.integrity <= 0) {
            gameOverMsg = "Psychological Collapse! The Alchemist's Integrity is shattered.";
            game.gameOver = true;
        } else if (aspect.resolve <= 0) {
            gameOverMsg = "Understanding Achieved! The Resentful Echo is comprehended.";
            game.gameOver = true;
        } else if (aspect.resonance >= aspect.maxResonance) {
            gameOverMsg = "Integration Achieved! The Resentful Echo finds peace and resonates with the Self.";
            game.gameOver = true;
        }
        // Dissonance max doesn't end game in prototype, but triggers effects

        if (game.gameOver) {
            handleGameOver(gameOverMsg);
            return true;
        }
        return false;
    }

    function handleGameOver(message) {
        addLogMessage(message);
        gameOverMessageEl.textContent = message;
        gameOverScreenEl.classList.remove('hidden');
        endTurnButton.disabled = true;
        // Disable card interactions further
        playerHandEl.classList.add('disabled-interaction');
    }

    function addLogMessage(message) {
        const p = document.createElement('p');
        p.textContent = `[T${game.turnNumber}${game.isPlayerTurn ? 'P' : 'A'}] ${message}`;
        messageLogEl.appendChild(p);
        messageLogEl.scrollTop = messageLogEl.scrollHeight; // Auto-scroll
    }

    // Tooltip Functions
    function showTooltip(card, event) {
        if (!card) return;
        tooltipEl.innerHTML = `
            <div class="tooltip-name">${card.name} <span class="tooltip-cost">${card.cost}F</span></div>
            <div class="tooltip-type">${card.type} - ${card.attunement}</div>
            <div class="tooltip-effect">${card.description}</div>
            <div class="tooltip-keywords">Keywords: ${card.keywords.join(', ')}</div>
        `;
        tooltipEl.classList.remove('hidden');
        moveTooltip(event); // Initial position
    }

    function hideTooltip() {
        tooltipEl.classList.add('hidden');
    }

    function moveTooltip(event) {
        // Position tooltip near cursor, ensuring it stays within viewport
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const gameRect = document.getElementById('game-container').getBoundingClientRect(); // Game container bounds

        if (x + tooltipRect.width > window.innerWidth - gameRect.left) { // Check against right edge of game container or window
            x = event.clientX - tooltipRect.width - 15;
        }
        if (y + tooltipRect.height > window.innerHeight - gameRect.top) { // Check against bottom edge
            y = event.clientY - tooltipRect.height - 15;
        }
        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
    }


    // --- Event Listeners ---
    endTurnButton.addEventListener('click', endTurn);
    restartButton.addEventListener('click', initGame);

    // --- Start Game ---
    initGame();
});
