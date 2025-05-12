// config.js

const R1_CONFIG = {
    gameSettings: {
        initialPlayerStats: {
            name: "", // To be set by player
            integrity: 100,
            maxIntegrity: 100,
            focus: 50,
            maxFocus: 50,
            hope: 75,
            maxHope: 100,
            despair: 10,
            maxDespair: 100,
            attunements: {
                psychological: 1,
                cognitive: 1,
                interaction: 1,
                sensory: 1,
            },
        },
        initialAmbition: "To understand where you are, and who you are.",
        startingLocation: "ShatteredShore",
        startingRegion: "The Shattered Fringe",
    },

    concepts: {
        // Basic starting concepts
        focused_inquiry: {
            id: "focused_inquiry",
            name: "Focused Inquiry",
            description: "A sharpened ability to ask pertinent questions and analyze details.",
            type: "Cognitive", // Can be used for filtering or just flavor
            onAcquire: (gameState) => `You feel a flicker of clarity, the urge to question, to understand.`,
        },
        shielding_doubt: {
            id: "shielding_doubt",
            name: "Shielding Doubt",
            description: "A healthy skepticism that can protect against harmful influences or deceptions.",
            type: "Psychological",
            onAcquire: (gameState) => `A mantle of caution settles over you, a whisper to question the apparent.`,
        },
        // Concepts acquired through story
        patchwork_understanding: {
            id: "patchwork_understanding",
            name: "Patchwork Understanding",
            description: "The ability to glean insights from fragmented information, piecing together a semblance of truth.",
            type: "Cognitive",
            onAcquire: (gameState) => `Disconnected fragments begin to coalesce into fragile patterns in your mind.`,
        },
        borrowed_guise: {
            id: "borrowed_guise",
            name: "Borrowed Guise",
            description: "The unsettling knack for briefly adopting the surface traits or perspectives of another.",
            type: "Interaction",
            onAcquire: (gameState) => `The edges of your own identity feel... permeable. For a moment, you glimpse the world through another's eyes.`,
        },
        resonant_empathy: {
            id: "resonant_empathy",
            name: "Resonant Empathy",
            description: "A profound ability to feel and understand the emotional state of another Aspect.",
            type: "Psychological",
            onAcquire: (gameState) => `The currents of others' feelings now flow more clearly through you, a heavy but insightful burden.`
        },
        axiomatic_deconstruction: {
            id: "axiomatic_deconstruction",
            name: "Axiomatic Deconstruction",
            description: "The power to dismantle flawed logical structures by identifying their core contradictions.",
            type: "Cognitive",
            onAcquire: (gameState) => `The hidden flaws in arguments now shine like cracks in crystal.`
        },
        cathartic_release: {
            id: "cathartic_release",
            name: "Cathartic Release",
            description: "Understanding that intense emotional expression can lead to purification and peace.",
            type: "Psychological",
            onAcquire: (gameState) => `You recognize the cleansing power of a storm, be it of sorrow or fury.`
        },
        heightened_perception: {
            id: "heightened_perception",
            name: "Heightened Perception",
            description: "Senses are sharpened, allowing discernment of subtle details and energies.",
            type: "Sensory",
            onAcquire: (gameState) => `The world around you hums with a new layer of sensory detail, almost overwhelming.`
        },
    },

    regions: {
        "The Shattered Fringe": {
            name: "The Shattered Fringe",
            description: "A desolate expanse where the debris of consciousness washes ashore. The air hums with lost thoughts and fractured emotions.",
            locations: ["ShatteredShore", "HearthstoneGrotto", "FlotsamGraveyards", "MuseumOfLostIdentities", "WhisperingIsle", "CrystallinePassageEntry", "WeepingKelpFringe", "GardenPathEntry"]
        }
        // We'll define locations needed for Shard quests within the Fringe for now,
        // representing them as distinct but accessible sub-zones or significant landmarks.
    },

    locations: {
        // --- THE SHATTERED SHORE ---
        ShatteredShore: {
            id: "ShatteredShore",
            name: "The Shattered Shore",
            image: "images/shattered_shore.png", // Replace with actual image path
            description: "A desolate, windswept beach littered with shimmering, broken fragments of glass-like memories. A constant, faint, dissonant hum echoes from the swirling twilight 'sky'. The taste of salt and ozone – or is it static and regret? – is sharp on your tongue.",
            onEnter: (gameState) => {
                if (!gameState.world_state.ShatteredShore_story_flags?.awakening_started) {
                    return "SS01_Awakening_1"; // Start the awakening sequence
                }
                return "SS00_ExamineShore"; // Default storylet
            },
            storylets: {
                SS00_ExamineShore: {
                    title: "Survey the Wreckage",
                    text: "The shore stretches endlessly, a graveyard of forgotten moments. The psychic debris shifts with an unseen tide. What do you focus on?",
                    choices: [
                        { text: "Sift through the nearest pile of shimmering fragments.", nextStorylet: "SS02_SiftFragments", condition: (gs) => !gs.world_state.ShatteredShore_story_flags?.sifted_recently },
                        { text: "Listen to the dissonant hum of the 'sky'.", nextStorylet: "SS03_ListenHum" },
                        { text: "Look for a path leading away from the shore.", nextStorylet: "SS04_SeekPath" },
                        { text: "Simply rest and try to gather your thoughts.", effect: (gs) => { gs.player_character.focus = Math.min(gs.player_character.focus + 5, gs.player_character.maxFocus); return "A moment of quiet amidst the chaos. You regain a little Focus."; }, isAvailable: (gs) => gs.player_character.focus < gs.player_character.maxFocus }
                    ]
                },
                SS01_Awakening_1: {
                    title: "Adrift",
                    text: "Darkness. Then, a pinprick of awareness. You... are. But *what* are you? And *where*?\nYour senses gradually return, revealing this desolate shore. An overwhelming sense of amnesia presses down. You don't even recall your name.",
                    onDisplay: (gs) => { gs.world_state.ShatteredShore_story_flags = { ...gs.world_state.ShatteredShore_story_flags, awakening_started: true }; },
                    choices: [
                        { text: "Try to grasp a name from the psychic ether...", nextStorylet: "SS01_Awakening_Name" }
                    ]
                },
                SS01_Awakening_Name: {
                    title: "A Name in the Static",
                    text: "You reach out with your nascent consciousness, sifting through the chaotic whispers around you. Fragments of names, titles, designations float by...\nChoose one, or forge your own.",
                    promptInput: {
                        label: "What name resonates with you, or what name do you choose?",
                        placeholder: "e.g., The Seeker, Echo, Meridian, or type your own",
                        onSubmit: (gs, input) => {
                            gs.player_character.name = input || "The Wanderer";
                            gs.ambition = `To discover the meaning of this place, ${gs.player_character.name}. And the truth of yourself.`;
                            gs.addConcept("focused_inquiry");
                            gs.addConcept("shielding_doubt");
                            gs.eventLog.push(`You are ${gs.player_character.name}. A sliver of identity in the vast unknown.`);
                            gs.eventLog.push(`The concepts 'Focused Inquiry' and 'Shielding Doubt' take root in your mind.`);
                            gs.world_state.ShatteredShore_story_flags.awakening_complete = true;
                            return `With a name, a small anchor forms. You feel a nascent urge to question (Focused Inquiry) and a protective layer of caution (Shielding Doubt). The path to the Hearthstone Grotto seems to shimmer faintly in the distance.`;
                        }
                    },
                    isUnique: true // Only show once
                },
                SS02_SiftFragments: {
                    title: "Shards of Memory",
                    text: "You carefully pick through a pile of razor-sharp fragments. Most are incoherent flashes of sensation or emotion. One catches your eye – it depicts a serene face, quickly contorting in terror before shattering.",
                    onDisplay: (gs) => { gs.world_state.ShatteredShore_story_flags.sifted_recently = true; },
                    choices: [
                        { text: "Try to piece together more of the terrified face.", effect: (gs) => { gs.player_character.despair = Math.min(gs.player_character.despair + 5, gs.player_character.maxDespair); gs.player_character.focus -= 3; return "A jolt of primal fear. The image is too fractured, too painful. (+5 Despair, -3 Focus)"; }},
                        { text: "Look for fragments of calmer memories.", effect: (gs) => { gs.player_character.hope = Math.min(gs.player_character.hope + 2, gs.player_character.maxHope); gs.player_character.clarity = (gs.player_character.clarity || 0) + 1; return "You find a tiny, intact shard showing a child's laugh. A fleeting warmth. (+2 Hope, +1 Clarity Resource)"; }},
                        { text: "Leave the fragments be.", nextStorylet: "SS00_ExamineShore"}
                    ],
                    onTimeout: (gs) => { delete gs.world_state.ShatteredShore_story_flags.sifted_recently; } // Allow sifting again after some time/actions
                },
                SS03_ListenHum: {
                    title: "The Dissonant Sky",
                    text: "You focus on the constant, unsettling hum. It seems to writhe with countless trapped voices, a chorus of confusion and faint sorrow. It presses against your mind.",
                    choices: [
                        { text: "Try to isolate a single voice.", attunementCheck: { attunement: "sensory", threshold: 3 }, onSuccess: { text: "With effort, you latch onto a faint, sobbing whisper speaking of a 'broken light'. It fades before you learn more. (+1 Sensory Att, +Insight)", effect: (gs)=>{ gs.player_character.attunements.sensory++; gs.world_state.ShatteredShore_story_flags.heard_broken_light_whisper = true; return "The whisper of 'broken light' echoes in your mind."; }}, onFailure: {text: "The cacophony is too overwhelming. Your head throbs. (-5 Focus)", effect: (gs)=>{gs.player_character.focus -=5;}} },
                        { text: "Shield your mind from the noise.", conceptCheck: { concept: "shielding_doubt", passIfPresent: true }, onSuccess: { text: "Your doubt forms a protective barrier, muffling the worst of the oppressive sound. (+1 Psychological Att)", effect: (gs)=>{gs.player_character.attunements.psychological++; return "Your mental fortitude strengthens."; } }, onFailure: { text: "The noise seeps in, unsettling you. (-3 Hope)", effect: (gs)=>{gs.player_character.hope -=3;} } },
                        { text: "Stop listening.", nextStorylet: "SS00_ExamineShore"}
                    ]
                },
                SS04_SeekPath: {
                    title: "A Way Forward?",
                    text: "You scan the horizon. The shore seems to stretch infinitely in either direction, but inland, a faint, warm glow pulses intermittently, like a distant hearth. Another path, colder and more precise, glitters towards what looks like a crystalline formation. A third path is choked with mournful, drooping flora.",
                    choices: [
                        { text: "Head towards the warm glow (Hearthstone Grotto).", travelTo: "HearthstoneGrotto", condition: (gs) => gs.world_state.ShatteredShore_story_flags?.awakening_complete },
                        { text: "Investigate the path towards the crystalline formation (Crystalline Passage).", travelTo: "CrystallinePassageEntry", condition: (gs) => gs.world_state.ShatteredShore_story_flags?.awakening_complete  },
                        { text: "Explore the path of mournful flora (Weeping Kelp Fringe).", travelTo: "WeepingKelpFringe", condition: (gs) => gs.world_state.ShatteredShore_story_flags?.awakening_complete  },
                        { text: "Perhaps you should complete your awakening first.", nextStorylet: "SS01_Awakening_1", condition: (gs) => !gs.world_state.ShatteredShore_story_flags?.awakening_complete }
                    ]
                }
            }
        },

        // --- HEARTHSTONE GROTTO (Sanctuary) ---
        HearthstoneGrotto: {
            id: "HearthstoneGrotto",
            name: "The Hearthstone Grotto",
            image: "images/hearthstone_grotto.png",
            description: "A surprisingly warm and stable cave, lit by a large, gently pulsing geode at its center – the Hearthstone. An ancient, weary consciousness, the Keeper of Fading Embers, tends to it.",
            isSanctuary: true,
            onEnter: (gameState) => {
                if (!gameState.world_state.HearthstoneGrotto_story_flags?.met_keeper) {
                    return "HG01_MeetKeeper";
                }
                return "HG00_GrottoActions";
            },
            storylets: {
                HG00_GrottoActions: {
                    title: "The Hearth's Embrace",
                    text: "The Hearthstone's warmth seeps into your core. The Keeper watches you with ancient eyes.",
                    choices: [
                        { text: "Speak with the Keeper.", nextStorylet: "HG02_SpeakKeeper" },
                        { text: "Rest by the Hearthstone. (Restore some Integrity & Hope)", effect: (gs) => {
                            gs.player_character.integrity = Math.min(gs.player_character.integrity + 15, gs.player_character.maxIntegrity);
                            gs.player_character.hope = Math.min(gs.player_character.hope + 10, gs.player_character.maxHope);
                            return "The Hearth's gentle light soothes your frayed edges. (+15 Integrity, +10 Hope)";
                        }, isAvailable: (gs) => gs.player_character.integrity < gs.player_character.maxIntegrity || gs.player_character.hope < gs.player_character.maxHope },
                        { text: "Ask about the 'Echo of Shattered Light' quest.", nextStorylet: "HG03_QuestUpdate_EchoOfLight", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" },
                        { text: "Ask about your 'Cracked Lodestone'.", nextStorylet: "HG04_LodestoneInquiry", condition: (gs) => gs.inventory.key_items.includes("Cracked Lodestone") },
                        { text: "Leave the Grotto.", travelTo: "ShatteredShore" } // Or a map screen
                    ]
                },
                HG01_MeetKeeper: {
                    title: "The Keeper of Fading Embers",
                    text: "The ancient Aspect turns its multifaceted gaze upon you. Its voice is like rustling leaves and distant chimes. 'Another soul washes ashore, fragmented and lost. I am the Keeper. This is Hearthstone, a small anchor against the unravelling. What do you seek, little spark?'",
                    onDisplay: (gs) => { gs.world_state.HearthstoneGrotto_story_flags = { ...gs.world_state.HearthstoneGrotto_story_flags, met_keeper: true }; },
                    choices: [
                        { text: "'I... I don't know. I don't remember.'", nextStorylet: "HG01_KeeperResponse_Amnesia" },
                        { text: (gs) => gs.world_state.ShatteredShore_story_flags?.heard_broken_light_whisper ? "'I heard whispers of a broken light...'" : "'I seek understanding. A way out of this... confusion.'", nextStorylet: "HG01_KeeperResponse_LightSeeker" }
                    ]
                },
                HG01_KeeperResponse_Amnesia: {
                    title: "Echoes of Self",
                    text: "'Amnesia is common here. The Sea of Psyche dissolves certainty. But within you, I sense a core, a persistent echo. A hidden wound... and a missing brilliance. The Shattered Light.'\nThe Keeper gestures to the Hearthstone. 'Many lights were lost. Perhaps yours is one of them. If you wish to find it, to find *yourself*, you must gather the Luminous Shards – fragments of a Memory Prime.'",
                    choices: [
                        { text: "Accept the quest: 'The Echo of Shattered Light'.", effect: (gs) => {
                            gs.world_state.regional_quest_R1 = { id: "Echo of Shattered Light", stage: "find_shards", shards_needed: 3, shards_collected: 0, logic_shard: false, emotion_shard: false, sensation_shard: false };
                            gs.ambition = "The Echo of Shattered Light: Find the Luminous Shards of a Memory Prime.";
                            gs.eventLog.push("New Ambition: The Echo of Shattered Light.");
                            return "The Keeper nods. 'The Shard of Logic lies within the Crystalline Passages. The Shard of Emotion is tangled in the Weeping Kelp. The Shard of Sensation is lost in the Overgrown Garden. Seek them, Oneironaut.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG01_KeeperResponse_LightSeeker: {
                    title: "The Great Shattering",
                    text: "'The Broken Light... ah, yes. A tragedy that resonates still. Many such lights were extinguished or scattered when the... event... occurred. Yours feels particularly poignant, Oneironaut. To reclaim it, you must gather the Luminous Shards of a Memory Prime, pieces of what was lost.'",
                    choices: [
                         { text: "Accept the quest: 'The Echo of Shattered Light'.", effect: (gs) => {
                            gs.world_state.regional_quest_R1 = { id: "Echo of Shattered Light", stage: "find_shards", shards_needed: 3, shards_collected: 0, logic_shard: false, emotion_shard: false, sensation_shard: false };
                            gs.ambition = "The Echo of Shattered Light: Find the Luminous Shards of a Memory Prime.";
                            gs.eventLog.push("New Ambition: The Echo of Shattered Light.");
                            return "The Keeper nods. 'The Shard of Logic lies within the Crystalline Passages. The Shard of Emotion is tangled in the Weeping Kelp. The Shard of Sensation is lost in the Overgrown Garden. Seek them, Oneironaut.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG02_SpeakKeeper: { // General conversation
                    title: "Counsel with the Keeper",
                    text: () => {
                        let dialogue = "The Keeper regards you patiently. 'What weighs on your mind, fragment?'";
                        if (R1_CONFIG.gameStateRef.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_active) {
                            dialogue += "\n'Have you found the Embers of Unwavering Belief for my Hearthstone?'";
                        } else if (!R1_CONFIG.gameStateRef.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_offered) {
                            dialogue += "\n(You sense a subtle flicker in the Hearthstone's light, a tremor in the Keeper's voice.)";
                        }
                        return dialogue;
                    },
                    choices: [
                        { text: "Ask about the Shattered Fringe.", effect: (gs) => "The Keeper sighs. 'This is but the outermost edge, where the broken pieces of countless minds wash up. Few find their way deeper. Or back.'"},
                        { text: "Ask about other Oneironauts.", effect: (gs) => "The Keeper: 'They come and go. Some seek power, some peace, some oblivion. Most are consumed. A few... a very few... leave a mark, an echo that persists.'"},
                        { text: "(If Hearthstone flickers) 'Is the Hearthstone alright?'", condition: (gs) => !gs.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_offered && !gs.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_active, nextStorylet: "HG05_KeepersFlame_Offer" },
                        { text: "(If Keepers Flame Quest Active) 'I'm still looking for the Embers.'", condition: (gs) => gs.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_active && !gs.inventory.key_items.includes("Embers of Unwavering Belief")},
                        { text: "(If Keepers Flame Quest Active & has Embers) 'I have the Embers of Unwavering Belief.'", condition: (gs) => gs.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_active && gs.inventory.key_items.includes("Embers of Unwavering Belief"), nextStorylet: "HG05_KeepersFlame_Complete"},
                        { text: "Nevermind.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_QuestUpdate_EchoOfLight: {
                    title: "The Luminous Shards",
                    text: (gs) => {
                        const rQuest = gs.world_state.regional_quest_R1;
                        if (rQuest.stage === "find_shards") {
                            let status = `You seek ${rQuest.shards_needed - rQuest.shards_collected} more Luminous Shard(s).\n`;
                            status += rQuest.logic_shard ? "- Shard of Logic: Acquired.\n" : "- Shard of Logic: Still lost in the Crystalline Passages.\n";
                            status += rQuest.emotion_shard ? "- Shard of Emotion: Acquired.\n" : "- Shard of Emotion: Entangled in the Weeping Kelp.\n";
                            status += rQuest.sensation_shard ? "- Shard of Sensation: Acquired.\n" : "- Shard of Sensation: Obscured in the Overgrown Garden.\n";
                            if (rQuest.shards_collected === rQuest.shards_needed) {
                                status += "\nYou have all the Shards! Return them to the Keeper for the ritual.";
                                rQuest.stage = "return_shards";
                            }
                            return status;
                        } else if (rQuest.stage === "return_shards") {
                            return "You have gathered all three Luminous Shards. The Keeper awaits to perform the Ritual of Coalescence.";
                        }
                        return "An error in the echoes. The quest state is unclear.";
                    },
                    choices: [
                        { text: (gs) => gs.world_state.regional_quest_R1.stage === "return_shards" ? "Begin the Ritual of Coalescence." : "Continue my search.",
                          condition: (gs) => gs.world_state.regional_quest_R1.stage === "return_shards",
                          nextStorylet: "HG06_RitualOfCoalescence"
                        },
                        { text: "I need more guidance on a specific Shard.", nextStorylet: "HG03_ShardGuidance", condition: (gs) => gs.world_state.regional_quest_R1.stage === "find_shards" && gs.world_state.regional_quest_R1.shards_collected < gs.world_state.regional_quest_R1.shards_needed },
                        { text: "Understood.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_ShardGuidance: {
                    title: "Guidance on the Shards",
                    text: "Which Shard do you need more insight on?",
                    choices: [
                        { text: "The Shard of Logic.", effect: (gs) => "Keeper: 'It is guarded by an Aspect of Pure, Cold Logic within the Crystalline Passages. Reason is its shield and its weapon. Consider what might bypass or dismantle such a defense.'", condition: (gs) => !gs.world_state.regional_quest_R1.logic_shard },
                        { text: "The Shard of Emotion.", effect: (gs) => "Keeper: 'It is deeply entwined with an Aspect of Overwhelming Grief in the Weeping Kelp. Empathy may be a key, or perhaps a shared burden.'", condition: (gs) => !gs.world_state.regional_quest_R1.emotion_shard },
                        { text: "The Shard of Sensation.", effect: (gs) => "Keeper: 'It is lost within the Overgrown Garden, obscured by an Aspect of Hedonistic Apathy or Sensory Overload. You must find a way to ground yourself or cut through the excess.'", condition: (gs) => !gs.world_state.regional_quest_R1.sensation_shard },
                        { text: "Nevermind.", nextStorylet: "HG03_QuestUpdate_EchoOfLight"}
                    ]
                },
                HG04_LodestoneInquiry: {
                    title: "The Cracked Lodestone",
                    text: (gs) => {
                        let baseText = "The Keeper regards the Cracked Lodestone in your possession. 'A potent artifact, even fractured. It is the Keystone of Emergence, the first piece of your true self, re-formed. It hums with a longing for its counterparts.'";
                        if (gs.world_state.region_2_unlocked) {
                            baseText += "\n'It now clearly resonates towards the Crystalline Expanse, where the Keystone of Order might be found.'";
                        } else {
                            baseText += "\n'Its purpose is not yet fully clear, but it strains towards... something. Another piece of the whole.'";
                        }
                        return baseText;
                    },
                    choices: [
                        { text: "Can you tell me more about these 'Keystones'?", effect: (gs) => "Keeper: 'They are fundamental aspects of a whole consciousness. Order, Depth, Creation... and the Emergence you now hold. Legend whispers they can unlock the path to the Sundered Crown, the very heart of the Prime Consciousness that was shattered.'\n(The Keeper seems reluctant to say more, a shadow of fear in their ancient eyes.)" },
                        { text: "Thank you, Keeper.", nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG05_KeepersFlame_Offer: {
                    title: "The Faltering Hearth",
                    text: "The Keeper looks troubled. 'The Hearthstone... it wanes. Its core memories, the ones that sustain its light, are growing thin. I need... Embers of Unwavering Belief. They are rare, potent concentrations of conviction, sometimes found where lesser minds have clung fiercely to a single, powerful idea. Without them, this sanctuary may fade.'",
                    onDisplay: (gs) => { gs.world_state.HearthstoneGrotto_story_flags.keepers_flame_quest_offered = true; },
                    choices: [
                        { text: "I will search for these Embers. (Accept local quest)", effect: (gs) => {
                            gs.world_state.HearthstoneGrotto_story_flags.keepers_flame_quest_active = true;
                            gs.eventLog.push("New Task: Find Embers of Unwavering Belief for the Keeper.");
                            return "The Keeper offers a grateful nod. 'Search in places of strong, unyielding conviction. The Flotsam Graveyards sometimes hold such... crystallized stubbornness. Be wary; such belief can be blinding.'";
                        }, nextStorylet: "HG00_GrottoActions" },
                        { text: "I cannot help you with this now.", effect: (gs) => {
                            gs.player_character.hope -= 2;
                            return "The Keeper's light seems to dim further. 'As you will, Oneironaut. The Psyche is a selfish sea.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG05_KeepersFlame_Complete: {
                    title: "Embers for the Hearth",
                    text: "You present the Embers of Unwavering Belief to the Keeper. They carefully place them within the Hearthstone. The geode pulses, its light strengthening, the Grotto growing warmer.",
                    onDisplay: (gs) => {
                        gs.removeItem("Embers of Unwavering Belief");
                        gs.player_character.hope += 10;
                        gs.player_character.attunements.psychological++;
                        gs.eventLog.push("The Hearthstone is revitalized! (+10 Hope, +1 Psychological Attunement)");
                        delete gs.world_state.HearthstoneGrotto_story_flags.keepers_flame_quest_active;
                        gs.world_state.HearthstoneGrotto_story_flags.keepers_flame_quest_completed = true;
                    },
                    choices: [
                        { text: "The Keeper smiles, a rare sight. 'You have done well. This sanctuary will endure a while longer, thanks to you. Perhaps there is hope for this fragmented world yet.'", nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG06_RitualOfCoalescence: {
                    title: "Ritual of Coalescence",
                    text: "You place the three Luminous Shards before the Keeper. They begin a soft chant, their form shimmering as they draw power from the Hearthstone. The Shards levitate, swirling together, emitting blinding light and a sound like fracturing stars.",
                    onDisplay: (gs) => {
                        gs.removeItem("Shard of Logic"); // Assuming items are removed
                        gs.removeItem("Shard of Emotion");
                        gs.removeItem("Shard of Sensation");
                        gs.addItem("Cracked Lodestone", "key_items");
                        gs.world_state.keystone_emergence_acquired = true;
                        gs.world_state.regional_quest_R1.stage = "complete";
                        gs.eventLog.push("The Luminous Shards merge into the Cracked Lodestone!");
                        gs.player_character.integrity += 20; // Reward
                        gs.player_character.focus += 10;
                    },
                    choices: [
                        {text: "Witness the birth of the Lodestone.", nextStorylet: "HG07_LodestoneRevelation"}
                    ]
                },
                HG07_LodestoneRevelation: {
                    title: "The Lodestone's Vision",
                    text: "The light subsides, leaving a single, cracked, obsidian-like stone humming in the air – the Cracked Lodestone. As you reach for it, a powerful, fragmented vision sears your mind: \nA towering lighthouse of pure, brilliant white light, standing serene at the heart of a calm Inner Sea. Then, a cataclysm – a creeping shadow, a sudden, violent crack appearing on the lighthouse, an explosion of dark energy. The lighthouse shatters, its light scattered into countless fragments, plunging the Inner Sea into twilight.\nYou feel an echo of immense, personal loss tied to this event, a deep sorrow that mirrors the one you sensed on the Shore.",
                    onDisplay: (gs) => {
                        gs.ambition = "The Stolen Light was from a great Lighthouse. I must understand what destroyed it. The Cracked Lodestone hums, pointing towards the Crystalline Expanse.";
                        gs.eventLog.push("New Ambition: Uncover the mystery of the Shattered Lighthouse.");
                        // This would be the point to unlock Region 2 in a more complex system
                        // For now, we'll assume CrystallinePassageEntry becomes more significant
                    },
                    choices: [
                        { text: "The vision fades. The Lodestone settles in your hand, warm and faintly vibrating.", nextStorylet: "HG00_GrottoActions" }
                    ]
                }
            }
        },

        // --- FLOTSAM GRAVEYARDS (Sub-location in Shattered Fringe) ---
        FlotsamGraveyards: {
            id: "FlotsamGraveyards",
            name: "Flotsam Graveyards",
            image: "images/flotsam_graveyards.png",
            description: "Islands formed from compacted psychic debris – broken ideas, discarded beliefs, and emotional residue. Unstable ground, both literally and metaphorically.",
            onEnter: () => "FG00_ExploreGraveyard",
            storylets: {
                FG00_ExploreGraveyard: {
                    title: "Navigating the Junk Heaps",
                    text: "The air is thick with the dust of forgotten thoughts. Strange, half-formed Aspects scuttle amidst the wreckage.",
                    choices: [
                        { text: "Scavenge for useful fragments.", nextStorylet: "FG01_Scavenge" },
                        { text: "Search for 'Embers of Unwavering Belief' (Keeper's Quest).", nextStorylet: "FG02_SearchEmbers", condition: (gs) => gs.world_state.HearthstoneGrotto_story_flags?.keepers_flame_quest_active && !gs.inventory.key_items.includes("Embers of Unwavering Belief") },
                        { text: "Observe the scuttling Aspects.", nextStorylet: "FG03_ObserveAspects" },
                        { text: "Return to the main paths of the Shattered Fringe.", travelTo: "ShatteredShore" } // Or map
                    ]
                },
                FG01_Scavenge: {
                    title: "Sifting Through Detritus",
                    text: "You dig through a pile of discarded emotions and broken logic.",
                    choices: [
                        { text: "Carefully sort the fragments.", effect: (gs) => {
                            const roll = Math.random();
                            if (roll < 0.3) {
                                gs.player_character.clarity = (gs.player_character.clarity || 0) + 2;
                                return "You find a cluster of surprisingly coherent thoughts. (+2 Clarity Resource)";
                            } else if (roll < 0.6) {
                                gs.player_character.despair += 2;
                                return "A wave of pure despair washes over you from a particularly dark fragment. (+2 Despair)";
                            } else {
                                return "Nothing but useless psychic chaff.";
                            }
                        } }
                    ]
                },
                FG02_SearchEmbers: {
                    title: "Seeking Conviction",
                    text: "You search for a potent concentration of belief, something that has resisted the decay of the Graveyards.",
                    choices: [
                        { text: "Focus your senses on the most 'solid' psychic signatures.", attunementCheck: { attunement: "sensory", threshold: 2 },
                          onSuccess: {
                            text: "You find it! A small, intensely burning ember, radiating stubborn conviction. It's surprisingly heavy.",
                            effect: (gs) => {
                                gs.addItem("Embers of Unwavering Belief", "key_items");
                                gs.eventLog.push("Acquired: Embers of Unwavering Belief.");
                            },
                            nextStorylet: "FG00_ExploreGraveyard"
                          },
                          onFailure: {
                            text: "You find many strong beliefs, but they are all fractured or corrupted. The search is tiring. (-3 Focus)",
                            effect: (gs) => { gs.player_character.focus -= 3; }
                          }
                        }
                    ]
                },
                // ... More storylets for Flotsam Graveyards: encounters with minor Aspects, finding oddities...
            }
        },

        // --- MUSEUM OF LOST IDENTITIES (Sub-location in Shattered Fringe) ---
        MuseumOfLostIdentities: {
            id: "MuseumOfLostIdentities",
            name: "The Museum of Lost Identities",
            image: "images/museum_lost_identities.png",
            description: "A vast, dusty hall filled with empty picture frames, mannequins draped in ill-fitting mental constructs, and display cases holding 'Essences of Forgotten Selves'. The Curator, a mournful Aspect, drifts through the exhibits.",
            onEnter: () => "MLI00_EnterMuseum",
            storylets: {
                MLI00_EnterMuseum: {
                    title: "Halls of Who We Were",
                    text: "The silence here is heavy, laden with the weight of unremembered lives. The Curator, a being seemingly woven from dust motes and regret, turns its many-eyed gaze towards you.",
                    choices: [
                        { text: "Approach the Curator.", nextStorylet: "MLI01_SpeakCurator" },
                        { text: "Examine a nearby display of 'Forgotten Selves'.", nextStorylet: "MLI02_ExamineDisplay" },
                        { text: "Search for the 'Negative Impression' exhibit (rumored).", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => gs.world_state.MuseumOfLostIdentities_story_flags?.heard_rumor_negative_impression },
                        { text: "Leave the Museum.", travelTo: "ShatteredShore" } // Or map
                    ]
                },
                MLI01_SpeakCurator: {
                    title: "The Archivist of Annihilation",
                    text: "Curator: 'Another visitor to my... collection. Do you come to mourn, to learn, or simply to marvel at what can be so utterly lost? Each empty space here was once a soul, a mind, an identity. Now... just echoes and absences.'",
                    choices: [
                        { text: "'What is this place?'", effect: (gs) => "Curator: 'A testament. A warning. A library of oblivion. We catalogue what the Sea of Psyche erodes.'"},
                        { text: "'Can these identities be restored?'", effect: (gs) => "Curator: 'Restored? Child, some things are not meant to be reassembled. To try is to invite madness. We preserve the *shape* of the loss, not the thing itself.' (A hint of fear here)" },
                        { text: "(Offer a fragmented memory of your own - Costs 1 Clarity)", condition: (gs) => (gs.player_character.clarity || 0) >= 1,
                          effect: (gs) => {
                            gs.player_character.clarity--;
                            gs.player_character.attunements.interaction++;
                            gs.world_state.MuseumOfLostIdentities_story_flags = { ...gs.world_state.MuseumOfLostIdentities_story_flags, curator_rapport: (gs.world_state.MuseumOfLostIdentities_story_flags?.curator_rapport || 0) +1 };
                            return "The Curator accepts your fragment with a delicate tendril of dust. 'A fresh ache... thank you. Perhaps this will help others understand their own voids.' (+1 Interaction Attunement, +Rapport with Curator)";
                          }
                        },
                        { text: "Ask about the 'Negative Impression'.", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => !gs.world_state.MuseumOfLostIdentities_story_flags?.heard_rumor_negative_impression,
                          effect: (gs) => { gs.world_state.MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression = true; return "Curator: 'The Negative Impression? Ah, a dangerous myth. A hollow so vast it could swallow stars. Best not to seek such things.'"; }
                        },
                        { text: "Leave the Curator.", nextStorylet: "MLI00_EnterMuseum" }
                    ]
                },
                MLI02_ExamineDisplay: {
                    title: "Essence of a Forgotten Self",
                    text: "You approach a display case. Inside, a shimmering, oil-slick orb pulses faintly. The label reads: 'Subject 734: The Unfulfilled Virtuoso. Dominant Traits: Perfectionism, Crippling Self-Doubt, A Longing for Applause That Never Came.'",
                    choices: [
                        { text: "Attempt to 'try on' this identity (Requires Interaction 2+ OR 'Borrowed Guise' Concept).",
                          condition: (gs) => gs.player_character.attunements.interaction >= 2 || gs.inventory.concepts.includes("borrowed_guise"),
                          nextStorylet: "MLI02_TryIdentity_Virtuoso"
                        },
                        { text: "Simply observe its tragic beauty.", effect: (gs) => { gs.player_character.hope -=1; gs.player_character.focus +=2; return "A profound sadness touches you, but also a strange clarity about the nature of ambition. (-1 Hope, +2 Focus)"; } },
                        { text: "Move to another display.", nextStorylet: "MLI00_EnterMuseum" }
                    ]
                },
                MLI02_TryIdentity_Virtuoso: {
                    title: "Wearing the Virtuoso's Skin",
                    text: "You reach out, mentally or perhaps even physically if you possess 'Borrowed Guise'. For a moment, the gallery blurs, replaced by the stark glare of stage lights, the crushing weight of an audience's expectation, the bitter taste of a flawed note...",
                    choices: [
                        { text: "Endure the sensations (Psychological Attunement 3+).",
                          attunementCheck: { attunement: "psychological", threshold: 3},
                          onSuccess: {
                            text: "You ride the wave of emotion, understanding the core of this forgotten self's struggle. The world snaps back, leaving you shaken but enlightened.",
                            effect: (gs) => {
                                if (!gs.inventory.concepts.includes("borrowed_guise")) {
                                    gs.addConcept("borrowed_guise");
                                    gs.eventLog.push("The experience solidifies into a new Concept: Borrowed Guise!");
                                }
                                gs.player_character.attunements.psychological++;
                                gs.player_character.attunements.interaction++;
                                return "(+1 Psychological Att, +1 Interaction Att)";
                            }
                          },
                          onFailure: {
                            text: "The intensity is too much! You recoil, your own identity fracturing slightly.",
                            effect: (gs) => { gs.player_character.integrity -= 5; gs.player_character.despair +=3; return "(-5 Integrity, +3 Despair)"; }
                          }
                        },
                        { text: "Pull back immediately!", effect: (gs) => { return "You narrowly avoid being overwhelmed, but the echo of that desperate longing lingers."; } }
                    ]
                },
                MLI03_SearchNegativeImpression: {
                    title: "The Locked Exhibit",
                    text: (gs) => {
                        if (gs.world_state.MuseumOfLostIdentities_story_flags?.curator_rapport >= 2) { // Higher rapport needed
                           return "The Curator, seeing your persistence and perhaps trusting you slightly, sighs. 'Very well. The Negative Impression... it is not an exhibit, but a wound in the fabric of this Museum. Behind the grand tapestry in the West Wing. But the way is sealed by three Locks of Misremembering. Each requires a specific... offering... to open. A true memory of Regret, a genuine spark of Uncorrupted Joy, and an Echo of Pure Logic.'";
                        }
                        return "You search for the rumored 'Negative Impression' exhibit, but the Curator actively misdirects you, or the Museum's layout seems to shift, preventing you from finding anything.";
                    },
                    onDisplay: (gs) => {
                        if (gs.world_state.MuseumOfLostIdentities_story_flags?.curator_rapport >= 2) {
                            gs.world_state.MuseumOfLostIdentities_story_flags.negative_impression_quest_active = true;
                            gs.eventLog.push("The Curator has revealed the path to the Negative Impression, guarded by three Locks.");
                        }
                    },
                    choices: [
                        { text: "This is too much for now.", nextStorylet: "MLI00_EnterMuseum" }
                        // Further choices to interact with the Locks would appear if quest active and items possessed
                    ]
                }
                // ... More local stories, like helping the Curator catalogue a new "find" or dealing with an identity that's "leaking" into the Museum.
            }
        },

        // --- LOCATIONS FOR SHARDS (Still within Region 1's conceptual reach for now) ---
        CrystallinePassageEntry: { // This is more of a gateway now
            id: "CrystallinePassageEntry",
            name: "Crystalline Passage Entry",
            image: "images/crystalline_passage.png",
            description: "A shimmering fissure in the psychic bedrock leads into a passage lined with jagged, glowing crystals. The air is cold and hums with a precise, analytical energy.",
            onEnter: () => "CP00_EnterPassage",
            storylets: {
                CP00_EnterPassage: {
                    title: "The Crystal Veins",
                    text: "The passage glitters menacingly. Each crystal seems to pulse with cold, hard logic.",
                    choices: [
                        { text: "Proceed into the Crystalline Labyrinth (Quest: Shard of Logic).", nextStorylet: "CP01_GuardLogic", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.logic_shard },
                        { text: "This path feels too sharp for me right now.", travelTo: "ShatteredShore" }
                    ]
                },
                CP01_GuardLogic: {
                    title: "The Guardian of Pure Logic",
                    text: "A towering Aspect of flawless, interlocking crystals blocks your path. It speaks in pure syllogisms: 'All who seek entry must demonstrate logical coherency. All illogical entities are denied. You are an entity. Therefore...?'",
                    choices: [
                        { text: "'Therefore, if I am logical, I may pass. If illogical, I am denied.'", nextStorylet: "CP02_LogicTest" },
                        { text: "(Cognitive Attunement 4+) 'Your premise assumes a binary. What if one is both, or neither?'", attunementCheck: {attunement: "cognitive", threshold: 4},
                            onSuccess: { text: "The Guardian hesitates, a flicker in its crystalline structure. 'Paradox... intriguing. Proceed with caution, anomaly.'", effect: (gs) => {
                                gs.world_state.regional_quest_R1.logic_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("axiomatic_deconstruction");
                                gs.eventLog.push("Acquired: Shard of Logic! Concept: Axiomatic Deconstruction.");
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: { text: "Guardian: 'Irrelevant. The test stands.'", nextStorylet: "CP02_LogicTest" }
                        },
                        { text: "(Invoke 'Borrowed Guise': The Logician's Apprentice)", conceptCheck: { concept: "borrowed_guise", passIfPresent: true },
                            onSuccess: { text: "You project an aura of intense academic focus. The Guardian scrutinizes you. 'A student of the Axiom? Pass, but do not disturb the calculations.'", effect: (gs) => {
                                gs.world_state.regional_quest_R1.logic_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.eventLog.push("Acquired: Shard of Logic! (By guile)");
                                }, travelTo: "ShatteredShore"
                            },
                            // No real 'failure' for invoke unless we add a check
                        }
                    ]
                },
                CP02_LogicTest: {
                    title: "The First Syllogism",
                    text: "Guardian: 'Premise 1: All truly valuable things are difficult to obtain. Premise 2: The Shard of Logic is truly valuable. Conclusion...?'",
                    choices: [
                        { text: "'Therefore, the Shard of Logic is difficult to obtain.' (Correct)", nextStorylet: "CP03_LogicTestSuccess" },
                        { text: "'Therefore, all difficult things are Shards of Logic.' (Incorrect)", nextStorylet: "CP03_LogicTestFailure" },
                        { text: "'Therefore, you are difficult to obtain.' (Cheeky, might fail or pass based on luck/hidden stat)", nextStorylet: "CP03_LogicTestCheeky" }
                    ]
                },
                CP03_LogicTestSuccess: {
                    title: "Logical Concordance",
                    text: "Guardian: 'Coherent. You may pass and claim the Shard.' A section of the Guardian recedes, revealing the Shard of Logic.",
                    effect: (gs) => {
                        gs.world_state.regional_quest_R1.logic_shard = true;
                        gs.world_state.regional_quest_R1.shards_collected++;
                        gs.addConcept("axiomatic_deconstruction");
                        gs.eventLog.push("Acquired: Shard of Logic! Concept: Axiomatic Deconstruction.");
                    },
                    choices: [ {text: "Take the Shard.", travelTo: "ShatteredShore"}]
                },
                // ... other test outcomes
            }
        },

        WeepingKelpFringe: {
            id: "WeepingKelpFringe",
            name: "Weeping Kelp Fringe",
            image: "images/weeping_kelp.png",
            description: "The edge of a vast, submerged forest of kelp that seems to weep a sorrowful, bioluminescent ichor. The air is heavy with unspoken grief.",
            onEnter: () => "WKF00_EnterKelp",
            storylets: {
                WKF00_EnterKelp: {
                    title: "The Sorrowful Tides",
                    text: "Each strand of kelp sways mournfully, trailing tears of faint light into the murky psychic waters.",
                    choices: [
                        { text: "Venture into the Weeping Kelp Forest (Quest: Shard of Emotion).", nextStorylet: "WKF01_GriefAspect", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.emotion_shard },
                        { text: "The sorrow is too profound. Turn back.", travelTo: "ShatteredShore" }
                    ]
                },
                WKF01_GriefAspect: {
                    title: "The Heart of the Kelp",
                    text: "At the heart of the forest, an Aspect of Overwhelming Grief sobs, its form a vortex of tears and tangled kelp. The Shard of Emotion is clutched in its ephemeral hand. 'So much... lost... so much pain...'",
                    choices: [
                        { text: "[Offer Empathy (Psychological Attunement 3+)]", attunementCheck: { attunement: "psychological", threshold: 3 },
                          onSuccess: { text: "You reach out, not with words, but with a wave of shared understanding. The Aspect's sobbing lessens slightly. 'You... feel it too?'",
                            effect: (gs) => {
                                gs.world_state.regional_quest_R1.emotion_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("resonant_empathy"); // Or Cathartic Release
                                gs.eventLog.push("Acquired: Shard of Emotion! Concept: Resonant Empathy.");
                            }, travelTo: "ShatteredShore"
                          },
                          onFailure: { text: "Your attempt at empathy feels hollow, rejected by the sheer scale of its sorrow. The Aspect wails louder." }
                        },
                        { text: "[Invoke Concept: Shared Sorrow (if possessed)]", conceptCheck: { concept: "Shared Sorrow" /* Assuming this exists */, passIfPresent: true },
                          onSuccess: { text: "You invoke the concept, and for a moment, you bear a fraction of its immense grief. It looks at you with dawning recognition and releases the Shard.",
                            effect: (gs) => {
                                gs.world_state.regional_quest_R1.emotion_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("cathartic_release");
                                gs.player_character.despair += 5; // Cost of sharing
                                gs.eventLog.push("Acquired: Shard of Emotion! Concept: Cathartic Release. You feel the weight of shared sorrow.");
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Offer a Personal 'Memory of Loss' (Costs 5 Hope, removes 1 Clarity Resource if available)]",
                          condition: (gs) => gs.player_character.hope > 5,
                          effect: (gs) => {
                            gs.player_character.hope -= 5;
                            if (gs.player_character.clarity && gs.player_character.clarity > 0) gs.player_character.clarity--;
                            // MORAL DILEMMA: Are you exploiting its grief or genuinely connecting?
                            const roll = Math.random();
                            if (roll > 0.4) { // Success
                                gs.world_state.regional_quest_R1.emotion_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("cathartic_release");
                                gs.eventLog.push("Acquired: Shard of Emotion! Concept: Cathartic Release. Your shared loss resonates.");
                                return "The Aspect clutches your memory, finding a kindred spirit in your pain. It offers the Shard. (+1 Psychological Attunement)";
                            } else { // Failure - it sees it as a superficial gesture
                                gs.player_character.despair += 5;
                                return "The Aspect recoils. 'Your pain is but a flicker to my inferno! Begone!' (-5 Despair, the Shard remains elusive)";
                            }
                          },
                          // If successful, add travelTo ShatteredShore
                        },
                        { text: "Attempt to analyze its grief (Cognitive Attunement 4+).", attunementCheck: {attunement: "cognitive", threshold: 4},
                            onSuccess: { text: "Your mind dissects the patterns of its sorrow, identifying core traumas. The Aspect seems momentarily confused by your detached approach, loosening its grip on the Shard.",
                                effect: (gs) => {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                    gs.eventLog.push("Acquired: Shard of Emotion! (By cold analysis)");
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: {text: "Its grief is too chaotic, too primal for logical dissection. Your thoughts are swamped by emotion. (-5 Focus)"}
                        }
                    ]
                }
            }
        },

        GardenPathEntry: {
            id: "GardenPathEntry",
            name: "Overgrown Garden Path",
            image: "images/overgrown_garden.png",
            description: "A barely visible path disappearing into a riot of vibrant, almost aggressive flora. The air is thick with cloying perfume and the buzz of unseen psychic insects.",
            onEnter: () => "OG00_EnterGarden",
            storylets: {
                OG00_EnterGarden: {
                    title: "The Wild Bloom",
                    text: "The vegetation presses in, a dizzying array of colors, scents, and textures. It's beautiful, but also suffocating.",
                    choices: [
                        { text: "Push through into the Overgrown Garden (Quest: Shard of Sensation).", nextStorylet: "OG01_ApathyAspect", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.sensation_shard },
                        { text: "The sensory overload is too much. Retreat.", travelTo: "ShatteredShore" }
                    ]
                },
                OG01_ApathyAspect: {
                    title: "The Lounger in the Lilies",
                    text: "An Aspect of Hedonistic Apathy lies sprawled amongst enormous, narcotic lilies, lost in a blissful stupor. The Shard of Sensation glimmers faintly on a vine nearby, almost swallowed by a pulsating bloom. The Aspect barely registers your presence. 'Mmm... such... delight... why bother...?'",
                    choices: [
                        { text: "[Attempt to rouse it with sharp stimuli (Sensory Attunement 3+)]", attunementCheck: { attunement: "sensory", threshold: 3},
                          onSuccess: { text: "You clap sharply/release a pungent mental scent. The Aspect jolts, its blissful haze disturbed. 'Wha-? Oh, take the shiny. Too much effort.' It waves a languid hand at the Shard.",
                            effect: (gs) => {
                                gs.world_state.regional_quest_R1.sensation_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("heightened_perception");
                                gs.eventLog.push("Acquired: Shard of Sensation! Concept: Heightened Perception.");
                            }, travelTo: "ShatteredShore"
                          },
                          onFailure: { text: "Your attempts are swallowed by the overwhelming sensory bliss it exudes. You feel your own resolve weakening. (-3 Focus, -2 Hope)"}
                        },
                        { text: "[Invoke 'Mindful Presence' (if possessed)]", conceptCheck: { concept: "Mindful Presence" /* Assuming */, passIfPresent: true},
                          onSuccess: { text: "You center yourself, cutting through the sensory fog. Your clarity is a stark contrast to the Aspect's haze. It stirs uncomfortably and gestures for you to take the Shard and leave it in peace.",
                            effect: (gs) => {
                                gs.world_state.regional_quest_R1.sensation_shard = true;
                                gs.world_state.regional_quest_R1.shards_collected++;
                                gs.addConcept("heightened_perception");
                                gs.eventLog.push("Acquired: Shard of Sensation! Concept: Heightened Perception.");
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Find a 'Grounding Anchor' (Requires searching the Garden - leads to sub-storylet)]", nextStorylet: "OG02_SearchAnchor" }
                    ]
                },
                OG02_SearchAnchor: {
                    title: "Seeking Grounding",
                    text: "You search the overwhelming garden for something to cut through the sensory overload and apathy.",
                    choices: [
                        { text: "Look for a 'Thorn of Clarity' (Sensory Attunement 2+).",
                          attunementCheck: { attunement: "sensory", threshold: 2 },
                          onSuccess: {
                            text: "You find a small, sharp thorn that radiates a surprisingly clear, painful sensation. This could work as an anchor.",
                            effect: (gs) => { gs.world_state.OvergrownGarden_story_flags = { ...gs.world_state.OvergrownGarden_story_flags, found_anchor: "thorn" }; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "Everything is too soft, too yielding. No anchor here." }
                        },
                        { text: "Listen for a 'Silent Stone' (Cognitive Attunement 2+).",
                          attunementCheck: { attunement: "cognitive", threshold: 2 },
                          onSuccess: {
                            text: "Amidst the riot of sensation, you find a patch of utter sensory silence around a smooth, grey stone. It feels cold and real.",
                            effect: (gs) => { gs.world_state.OvergrownGarden_story_flags = { ...gs.world_state.OvergrownGarden_story_flags, found_anchor: "stone" }; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "The noise and perfume are too pervasive."}
                        }
                    ]
                },
                OG03_UseAnchor: {
                    title: "Anchored Sensation",
                    text: (gs) => `You use the ${gs.world_state.OvergrownGarden_story_flags?.found_anchor === "thorn" ? "sharp pain of the Thorn" : "cold reality of the Silent Stone"} to focus your mind, cutting through the apathy. The Aspect of Hedonistic Apathy stirs, annoyed by your clarity. 'Oh, very well. Take the bauble. Spoil all the fun.' It gestures towards the Shard.`,
                    effect: (gs) => {
                        gs.world_state.regional_quest_R1.sensation_shard = true;
                        gs.world_state.regional_quest_R1.shards_collected++;
                        gs.addConcept("heightened_perception");
                        gs.eventLog.push("Acquired: Shard of Sensation! Concept: Heightened Perception.");
                    },
                    choices: [
                        {text: "Claim the Shard of Sensation.", travelTo: "ShatteredShore"}
                    ]
                }
            }
        }
        // ... other locations like WhisperingIsle would be fleshed out similarly.
    }
};

// A little hack to allow storylets to access the main gameState for complex conditions/effects
// We'll assign the actual gameState to this in main.js
R1_CONFIG.gameStateRef = {};
