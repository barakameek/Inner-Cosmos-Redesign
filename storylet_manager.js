// storylet_manager.js

class StoryletManager {
    constructor(config, gameState, uiManager) {
        this.config = config;
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.config.gameStateRef = this.gameState; // Give config access to live gameState
        this.currentStoryletId = null;
        this.currentLocationId = null;
    }

    startCurrentLocation() {
        this.currentLocationId = this.gameState.currentLocation;
        const locationData = this.config.locations[this.currentLocationId];
        if (!locationData) {
            console.error(`Error: Location data not found for ${this.currentLocationId}`);
            this.uiManager.updateEventLog(`Error: Could not load location ${this.currentLocationId}.`);
            return;
        }

        this.uiManager.updateLocationDisplay(locationData.name, locationData.description, locationData.image);
        this.uiManager.updatePlayerStats(this.gameState.player_character);
        this.uiManager.updateAmbition(this.gameState.ambition);
        this.uiManager.updateConcepts(this.gameState.inventory.concepts, this.config.concepts);
        this.uiManager.updateKeyItems(this.gameState.inventory.key_items);
        this.uiManager.updateAttunements(this.gameState.player_character.attunements);


        if (typeof locationData.onEnter === 'function') {
            const storyletId = locationData.onEnter(this.gameState);
            if (storyletId) {
                this.loadStorylet(storyletId);
            } else {
                // No specific onEnter storylet, hide storylet display or show default
                this.uiManager.hideStoryletDisplay();
                this.uiManager.setMainButton("Examine Surroundings", () => this.loadDefaultStoryletForLocation());
            }
        } else if (locationData.onEnter) { // It's an ID string
             this.loadStorylet(locationData.onEnter);
        } else {
            this.uiManager.hideStoryletDisplay();
            this.uiManager.setMainButton("Examine Surroundings", () => this.loadDefaultStoryletForLocation());
        }
    }

    loadDefaultStoryletForLocation() {
        const locationData = this.config.locations[this.currentLocationId];
        if (locationData && locationData.storylets && Object.keys(locationData.storylets).length > 0) {
            // Try to find a generic "examine" or first available storylet
            // For simplicity, let's assume the first storylet in its definition is a good default if no specific onEnter exists
            const defaultStoryletId = Object.keys(locationData.storylets)[0]; // Fallback if no onEnter logic.
            // A more robust way would be to define a "default_storylet_id" in location_data
            // For ShatteredShore, SS00_ExamineShore is a good default.
            if (locationData.id === "ShatteredShore" && locationData.storylets["SS00_ExamineShore"]) {
                 this.loadStorylet("SS00_ExamineShore");
            } else if (defaultStoryletId) {
                 this.loadStorylet(defaultStoryletId);
            } else {
                this.uiManager.updateEventLog("There's nothing more to examine here for now.");
                this.uiManager.hideStoryletDisplay();
            }
        } else {
            this.uiManager.updateEventLog("There's nothing more to examine here for now.");
            this.uiManager.hideStoryletDisplay();
        }
    }


    loadStorylet(storyletId) {
        this.currentStoryletId = storyletId;
        const locationData = this.config.locations[this.gameState.currentLocation];
        if (!locationData || !locationData.storylets || !locationData.storylets[storyletId]) {
            console.error(`Error: Storylet ${storyletId} not found in location ${this.gameState.currentLocation}`);
            this.uiManager.updateEventLog(`Error: Encountered an unknown narrative thread (${storyletId}).`);
            this.uiManager.hideStoryletDisplay();
            this.uiManager.setMainButton("Examine Surroundings", () => this.loadDefaultStoryletForLocation());
            return;
        }

        const storyletData = locationData.storylets[storyletId];

        if (storyletData.isUnique && this.gameState.world_state.completed_storylets?.includes(storyletId)) {
            this.uiManager.updateEventLog("You've already experienced this moment fully.");
            this.uiManager.hideStoryletDisplay();
            // Potentially load a fallback or default storylet here
            this.loadDefaultStoryletForLocation();
            return;
        }

        if (typeof storyletData.onDisplay === 'function') {
            storyletData.onDisplay(this.gameState);
        }

        let storyletText = typeof storyletData.text === 'function' ? storyletData.text(this.gameState) : storyletData.text;
        this.uiManager.displayStorylet(storyletData.title, storyletText);

        const choicesContainer = document.getElementById('storylet-choices');
        choicesContainer.innerHTML = ''; // Clear previous choices

        if (storyletData.choices && storyletData.choices.length > 0) {
            storyletData.choices.forEach((choice, index) => {
                let isAvailable = true;
                let requirementText = "";

                if (typeof choice.condition === 'function') {
                    isAvailable = choice.condition(this.gameState);
                }

                if (isAvailable && choice.attunementCheck) {
                    const playerAttunement = this.gameState.player_character.attunements[choice.attunementCheck.attunement];
                    if (playerAttunement < choice.attunementCheck.threshold) {
                        // Choice still visible but marked as failed check if no separate onFailure path
                        requirementText = ` (Requires ${choice.attunementCheck.attunement} ${choice.attunementCheck.threshold}+)`;
                        if (!choice.onFailure) isAvailable = false; // If no explicit failure path, disable it.
                    } else {
                         requirementText = ` (${choice.attunementCheck.attunement} ${playerAttunement}/${choice.attunementCheck.threshold})`;
                    }
                }

                if (isAvailable && choice.conceptCheck) {
                    const hasConcept = this.gameState.inventory.concepts.includes(choice.conceptCheck.concept);
                    if (!hasConcept && choice.conceptCheck.passIfPresent) {
                        requirementText = ` (Requires Concept: ${this.config.concepts[choice.conceptCheck.concept]?.name || choice.conceptCheck.concept})`;
                        if (!choice.onFailure) isAvailable = false;
                    } else if (hasConcept) {
                        requirementText = ` (Invoke: ${this.config.concepts[choice.conceptCheck.concept]?.name || choice.conceptCheck.concept})`;
                    }
                }

                const choiceButton = this.uiManager.createChoiceButton(choice, index, isAvailable, requirementText, () => this.handleChoice(choice));
                choicesContainer.appendChild(choiceButton);
            });
        } else if (storyletData.promptInput) {
            const promptData = storyletData.promptInput;
            const inputLabel = document.createElement('label');
            inputLabel.textContent = promptData.label;
            inputLabel.htmlFor = 'storylet-input-field';

            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.id = 'storylet-input-field';
            inputField.placeholder = promptData.placeholder || "";

            const submitButton = document.createElement('button');
            submitButton.textContent = promptData.buttonText || "Submit";
            submitButton.onclick = () => {
                const inputValue = inputField.value.trim();
                if (promptData.onSubmit && typeof promptData.onSubmit === 'function') {
                    const outcomeMessage = promptData.onSubmit(this.gameState, inputValue);
                    if (outcomeMessage) this.uiManager.updateEventLog(outcomeMessage);
                     if (storyletData.isUnique) {
                        if (!this.gameState.world_state.completed_storylets) this.gameState.world_state.completed_storylets = [];
                        this.gameState.world_state.completed_storylets.push(this.currentStoryletId);
                    }
                    this.updateGameAfterChoice(); // Update UI and potentially load next location/storylet
                    // Check if onSubmit itself dictates next step, otherwise default
                    if(!this.gameState.nextStorylet && !this.gameState.travelToLocation){
                        this.loadDefaultStoryletForLocation();
                    }
                }
            };
            choicesContainer.appendChild(inputLabel);
            choicesContainer.appendChild(inputField);
            choicesContainer.appendChild(submitButton);
        } else {
            // Storylet with no choices (e.g., just an informational one)
            // Might need a "Continue" button or auto-advance logic
            const continueButton = document.createElement('button');
            continueButton.textContent = "Continue";
            continueButton.onclick = () => {
                if (storyletData.isUnique) {
                    if (!this.gameState.world_state.completed_storylets) this.gameState.world_state.completed_storylets = [];
                    this.gameState.world_state.completed_storylets.push(this.currentStoryletId);
                }
                this.loadDefaultStoryletForLocation(); // Or a specific next step if defined
            };
            choicesContainer.appendChild(continueButton);
        }
        this.uiManager.showStoryletDisplay();
        this.uiManager.setMainButton("View Location", () => {
            this.uiManager.hideStoryletDisplay();
            this.uiManager.setMainButton("Examine Surroundings", () => this.loadStorylet(this.currentStoryletId));
        });
    }

    handleChoice(choiceData) {
        let outcomeMessage = "";
        let nextStoryletId = choiceData.nextStorylet;
        let travelToLocationId = choiceData.travelTo;

        // Handle Attunement Checks
        if (choiceData.attunementCheck) {
            const playerAttunement = this.gameState.player_character.attunements[choiceData.attunementCheck.attunement];
            if (playerAttunement >= choiceData.attunementCheck.threshold) {
                if (choiceData.onSuccess) {
                    if (typeof choiceData.onSuccess.effect === 'function') outcomeMessage = choiceData.onSuccess.effect(this.gameState) || "";
                    else outcomeMessage = choiceData.onSuccess.text || "";
                    nextStoryletId = choiceData.onSuccess.nextStorylet || nextStoryletId;
                    travelToLocationId = choiceData.onSuccess.travelTo || travelToLocationId;
                }
            } else {
                if (choiceData.onFailure) {
                    if (typeof choiceData.onFailure.effect === 'function') outcomeMessage = choiceData.onFailure.effect(this.gameState) || "";
                    else outcomeMessage = choiceData.onFailure.text || "";
                    nextStoryletId = choiceData.onFailure.nextStorylet || nextStoryletId;
                    travelToLocationId = choiceData.onFailure.travelTo || travelToLocationId;
                } else { // Generic failure if no specific one defined
                    outcomeMessage = `Your ${choiceData.attunementCheck.attunement} is insufficient.`;
                }
            }
        }
        // Handle Concept Checks
        else if (choiceData.conceptCheck) {
            const hasConcept = this.gameState.inventory.concepts.includes(choiceData.conceptCheck.concept);
            if (hasConcept && choiceData.conceptCheck.passIfPresent) { // Or other logic for concept use
                if (choiceData.onSuccess) {
                    if (typeof choiceData.onSuccess.effect === 'function') outcomeMessage = choiceData.onSuccess.effect(this.gameState) || "";
                    else outcomeMessage = choiceData.onSuccess.text || "";
                    nextStoryletId = choiceData.onSuccess.nextStorylet || nextStoryletId;
                    travelToLocationId = choiceData.onSuccess.travelTo || travelToLocationId;
                }
            } else { // Failed concept check (or concept not present when needed)
                 if (choiceData.onFailure) {
                    if (typeof choiceData.onFailure.effect === 'function') outcomeMessage = choiceData.onFailure.effect(this.gameState) || "";
                    else outcomeMessage = choiceData.onFailure.text || "";
                    nextStoryletId = choiceData.onFailure.nextStorylet || nextStoryletId;
                    travelToLocationId = choiceData.onFailure.travelTo || travelToLocationId;
                } else {
                    outcomeMessage = `You lack the required Concept: ${this.config.concepts[choiceData.conceptCheck.concept]?.name || choiceData.conceptCheck.concept}.`;
                }
            }
        }
        // Handle direct effects
        else if (typeof choiceData.effect === 'function') {
            outcomeMessage = choiceData.effect(this.gameState) || "";
        }


        if (outcomeMessage) {
            this.uiManager.updateEventLog(outcomeMessage);
        }

        const storyletData = this.config.locations[this.gameState.currentLocation].storylets[this.currentStoryletId];
        if (storyletData.isUnique) {
             if (!this.gameState.world_state.completed_storylets) this.gameState.world_state.completed_storylets = [];
             this.gameState.world_state.completed_storylets.push(this.currentStoryletId);
        }

        // Store for updateGameAfterChoice to handle
        this.gameState.nextStorylet = nextStoryletId;
        this.gameState.travelToLocation = travelToLocationId;

        this.updateGameAfterChoice();
    }

    updateGameAfterChoice() {
        // Update UI elements that might have changed due to effects
        this.uiManager.updatePlayerStats(this.gameState.player_character);
        this.uiManager.updateAmbition(this.gameState.ambition);
        this.uiManager.updateConcepts(this.gameState.inventory.concepts, this.config.concepts);
        this.uiManager.updateKeyItems(this.gameState.inventory.key_items);
        this.uiManager.updateAttunements(this.gameState.player_character.attunements);

        // Handle navigation
        if (this.gameState.travelToLocation) {
            const newLocation = this.gameState.travelToLocation;
            delete this.gameState.travelToLocation; // Consume the travel instruction
            delete this.gameState.nextStorylet;    // Clear any pending storylet from previous location
            this.gameState.currentLocation = newLocation;
            this.uiManager.updateEventLog(`You travel to ${this.config.locations[newLocation]?.name || newLocation}.`);
            this.startCurrentLocation(); // This will load the new location and its onEnter storylet
        } else if (this.gameState.nextStorylet) {
            const nextStorylet = this.gameState.nextStorylet;
            delete this.gameState.nextStorylet; // Consume the instruction
            this.loadStorylet(nextStorylet);
        } else {
            // No specific next step, hide storylet and revert main button
            this.uiManager.hideStoryletDisplay();
            this.uiManager.setMainButton("Examine Surroundings", () => this.loadDefaultStoryletForLocation());
        }
    }
}
