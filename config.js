// config.js (CONTINUATION)

// ... (previous content of config.js up to HearthstoneGrotto storylets) ...
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
                    onDisplay: (gs) => { gs.setWorldFlag("HearthstoneGrotto_story_flags.met_keeper", true); },
                    choices: [
                        { text: "'I... I don't know. I don't remember.'", nextStorylet: "HG01_KeeperResponse_Amnesia" },
                        { text: (gs) => gs.getWorldFlag("ShatteredShore_story_flags.heard_broken_light_whisper") ? "'I heard whispers of a broken light...'" : "'I seek understanding. A way out of this... confusion.'", nextStorylet: "HG01_KeeperResponse_LightSeeker" }
                    ]
                },
                HG01_KeeperResponse_Amnesia: {
                    title: "Echoes of Self",
                    text: "'Amnesia is common here. The Sea of Psyche dissolves certainty. But within you, I sense a core, a persistent echo. A hidden wound... and a missing brilliance. The Shattered Light.'\nThe Keeper gestures to the Hearthstone. 'Many lights were lost. Perhaps yours is one of them. If you wish to find it, to find *yourself*, you must gather the Luminous Shards – fragments of a Memory Prime.'",
                    choices: [
                        { text: "Accept the quest: 'The Echo of Shattered Light'.", effect: (gs) => {
                            // Ensure regional_quest_R1 is initialized if it doesn't exist
                            if (!gs.world_state.regional_quest_R1) gs.world_state.regional_quest_R1 = {};
                            gs.world_state.regional_quest_R1.id = "Echo of Shattered Light";
                            gs.world_state.regional_quest_R1.stage = "find_shards";
                            gs.world_state.regional_quest_R1.shards_needed = 3;
                            gs.world_state.regional_quest_R1.shards_collected = 0;
                            gs.world_state.regional_quest_R1.logic_shard = false;
                            gs.world_state.regional_quest_R1.emotion_shard = false;
                            gs.world_state.regional_quest_R1.sensation_shard = false;
                            gs.ambition = "The Echo of Shattered Light: Find the Luminous Shards of a Memory Prime.";
                            // gs.eventLog.push("New Ambition: The Echo of Shattered Light."); // Logged by ambition update
                            return "The Keeper nods. 'The Shard of Logic lies within the Crystalline Passages. The Shard of Emotion is tangled in the Weeping Kelp. The Shard of Sensation is lost in the Overgrown Garden. Seek them, Oneironaut.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG01_KeeperResponse_LightSeeker: {
                    title: "The Great Shattering",
                    text: "'The Broken Light... ah, yes. A tragedy that resonates still. Many such lights were extinguished or scattered when the... event... occurred. Yours feels particularly poignant, Oneironaut. To reclaim it, you must gather the Luminous Shards of a Memory Prime, pieces of what was lost.'",
                    choices: [
                         { text: "Accept the quest: 'The Echo of Shattered Light'.", effect: (gs) => {
                            if (!gs.world_state.regional_quest_R1) gs.world_state.regional_quest_R1 = {};
                            gs.world_state.regional_quest_R1.id = "Echo of Shattered Light";
                            gs.world_state.regional_quest_R1.stage = "find_shards";
                            gs.world_state.regional_quest_R1.shards_needed = 3;
                            gs.world_state.regional_quest_R1.shards_collected = 0;
                            gs.world_state.regional_quest_R1.logic_shard = false;
                            gs.world_state.regional_quest_R1.emotion_shard = false;
                            gs.world_state.regional_quest_R1.sensation_shard = false;
                            gs.ambition = "The Echo of Shattered Light: Find the Luminous Shards of a Memory Prime.";
                            // gs.eventLog.push("New Ambition: The Echo of Shattered Light.");
                            return "The Keeper nods. 'The Shard of Logic lies within the Crystalline Passages. The Shard of Emotion is tangled in the Weeping Kelp. The Shard of Sensation is lost in the Overgrown Garden. Seek them, Oneironaut.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG02_SpeakKeeper: { // General conversation
                    title: "Counsel with the Keeper",
                    text: () => { // Using gameStateRef directly available in config now
                        let dialogue = "The Keeper regards you patiently. 'What weighs on your mind, fragment?'";
                        if (R1_CONFIG.gameStateRef.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active")) {
                            dialogue += "\n'Have you found the Embers of Unwavering Belief for my Hearthstone?'";
                        } else if (!R1_CONFIG.gameStateRef.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered")) {
                            dialogue += "\n(You sense a subtle flicker in the Hearthstone's light, a tremor in the Keeper's voice.)";
                        }
                        return dialogue;
                    },
                    choices: [
                        { text: "Ask about the Shattered Fringe.", effect: (gs) => "The Keeper sighs. 'This is but the outermost edge, where the broken pieces of countless minds wash up. Few find their way deeper. Or back.'"},
                        { text: "Ask about other Oneironauts.", effect: (gs) => "Keeper: 'They come and go. Some seek power, some peace, some oblivion. Most are consumed. A few... a very few... leave a mark, an echo that persists.'"},
                        { text: "(If Hearthstone flickers) 'Is the Hearthstone alright?'", condition: (gs) => !gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered") && !gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active"), nextStorylet: "HG05_KeepersFlame_Offer" },
                        { text: "(If Keepers Flame Quest Active) 'I'm still looking for the Embers.'", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && !gs.inventory.key_items.includes("Embers of Unwavering Belief")},
                        { text: "(If Keepers Flame Quest Active & has Embers) 'I have the Embers of Unwavering Belief.'", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && gs.inventory.key_items.includes("Embers of Unwavering Belief"), nextStorylet: "HG05_KeepersFlame_Complete"},
                        { text: "Nevermind.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_QuestUpdate_EchoOfLight: {
                    title: "The Luminous Shards",
                    text: (gs) => {
                        const rQuest = gs.world_state.regional_quest_R1;
                        if (!rQuest || rQuest.id !== "Echo of Shattered Light") return "You are not currently on the quest for the Luminous Shards.";

                        if (rQuest.stage === "find_shards") {
                            let status = `You seek ${rQuest.shards_needed - rQuest.shards_collected} more Luminous Shard(s).\n`;
                            status += rQuest.logic_shard ? "- Shard of Logic: Acquired.\n" : "- Shard of Logic: Still lost in the Crystalline Passages.\n";
                            status += rQuest.emotion_shard ? "- Shard of Emotion: Acquired.\n" : "- Shard of Emotion: Entangled in the Weeping Kelp.\n";
                            status += rQuest.sensation_shard ? "- Shard of Sensation: Acquired.\n" : "- Shard of Sensation: Obscured in the Overgrown Garden.\n";
                            if (rQuest.shards_collected === rQuest.shards_needed) {
                                status += "\nYou have all the Shards! Return them to the Keeper for the ritual.";
                                gs.world_state.regional_quest_R1.stage = "return_shards"; // Update stage here
                            }
                            return status;
                        } else if (rQuest.stage === "return_shards") {
                            return "You have gathered all three Luminous Shards. The Keeper awaits to perform the Ritual of Coalescence.";
                        } else if (rQuest.stage === "complete") {
                            return "You have completed the quest for the Luminous Shards and obtained the Cracked Lodestone.";
                        }
                        return "An error in the echoes. The quest state is unclear.";
                    },
                    choices: [
                        { text: (gs) => gs.world_state.regional_quest_R1?.stage === "return_shards" ? "Begin the Ritual of Coalescence." : "Continue my search.",
                          condition: (gs) => gs.world_state.regional_quest_R1?.stage === "return_shards",
                          nextStorylet: "HG06_RitualOfCoalescence"
                        },
                        { text: "I need more guidance on a specific Shard.", nextStorylet: "HG03_ShardGuidance", condition: (gs) => gs.world_state.regional_quest_R1?.stage === "find_shards" && gs.world_state.regional_quest_R1?.shards_collected < gs.world_state.regional_quest_R1?.shards_needed },
                        { text: "Understood.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_ShardGuidance: {
                    title: "Guidance on the Shards",
                    text: "Which Shard do you need more insight on?",
                    choices: [
                        { text: "The Shard of Logic.", effect: (gs) => "Keeper: 'It is guarded by an Aspect of Pure, Cold Logic within the Crystalline Passages. Reason is its shield and its weapon. Consider what might bypass or dismantle such a defense.'", condition: (gs) => !gs.world_state.regional_quest_R1?.logic_shard },
                        { text: "The Shard of Emotion.", effect: (gs) => "Keeper: 'It is deeply entwined with an Aspect of Overwhelming Grief in the Weeping Kelp. Empathy may be a key, or perhaps a shared burden.'", condition: (gs) => !gs.world_state.regional_quest_R1?.emotion_shard },
                        { text: "The Shard of Sensation.", effect: (gs) => "Keeper: 'It is lost within the Overgrown Garden, obscured by an Aspect of Hedonistic Apathy or Sensory Overload. You must find a way to ground yourself or cut through the excess.'", condition: (gs) => !gs.world_state.regional_quest_R1?.sensation_shard },
                        { text: "Nevermind.", nextStorylet: "HG03_QuestUpdate_EchoOfLight"}
                    ]
                },
                HG04_LodestoneInquiry: {
                    title: "The Cracked Lodestone",
                    text: (gs) => {
                        let baseText = "The Keeper regards the Cracked Lodestone in your possession. 'A potent artifact, even fractured. It is the Keystone of Emergence, the first piece of your true self, re-formed. It hums with a longing for its counterparts.'";
                        // if (gs.getWorldFlag("region_2_unlocked")) { // Example for later
                        //     baseText += "\n'It now clearly resonates towards the Crystalline Expanse, where the Keystone of Order might be found.'";
                        // } else {
                            baseText += "\n'Its purpose is not yet fully clear, but it strains towards... something. Another piece of the whole.'";
                        // }
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
                    onDisplay: (gs) => { gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered", true); },
                    choices: [
                        { text: "I will search for these Embers. (Accept local quest)", effect: (gs) => {
                            gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active", true);
                            // gs.eventLog.push("New Task: Find Embers of Unwavering Belief for the Keeper.");
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
                    onDisplay: (gs) => { // onDisplay to ensure it runs before choices are processed if any.
                        gs.removeItem("Embers of Unwavering Belief", "key_items");
                        gs.player_character.hope = Math.min(gs.player_character.hope + 10, gs.player_character.maxHope);
                        gs.player_character.attunements.psychological++;
                        // gs.eventLog.push("The Hearthstone is revitalized! (+10 Hope, +1 Psychological Attunement)"); // Logged by return
                        gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active", false);
                        gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_completed", true);
                    },
                    choices: [
                        { text: "The Keeper smiles, a rare sight. 'You have done well. This sanctuary will endure a while longer, thanks to you. Perhaps there is hope for this fragmented world yet.'",
                          effect: (gs) => "The Hearthstone is revitalized! (+10 Hope, +1 Psychological Attunement)", // Return message here
                          nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG06_RitualOfCoalescence: {
                    title: "Ritual of Coalescence",
                    text: "You place the three Luminous Shards before the Keeper. They begin a soft chant, their form shimmering as they draw power from the Hearthstone. The Shards levitate, swirling together, emitting blinding light and a sound like fracturing stars.",
                    onDisplay: (gs) => {
                        gs.removeItem("Shard of Logic", "key_items");
                        gs.removeItem("Shard of Emotion", "key_items");
                        gs.removeItem("Shard of Sensation", "key_items");
                        gs.addItem("Cracked Lodestone", "key_items");
                        gs.setWorldFlag("keystone_emergence_acquired", true); // Global flag for Keystone
                        if (gs.world_state.regional_quest_R1) {
                           gs.world_state.regional_quest_R1.stage = "complete";
                        }
                        // gs.eventLog.push("The Luminous Shards merge into the Cracked Lodestone!"); // Logged by return
                        gs.player_character.integrity = Math.min(gs.player_character.integrity + 20, gs.player_character.maxIntegrity);
                        gs.player_character.focus = Math.min(gs.player_character.focus + 10, gs.player_character.maxFocus);
                    },
                    choices: [
                        {text: "Witness the birth of the Lodestone.",
                         effect: (gs) => "The Luminous Shards merge into the Cracked Lodestone!", // Return message here
                         nextStorylet: "HG07_LodestoneRevelation"}
                    ]
                },
                HG07_LodestoneRevelation: {
                    title: "The Lodestone's Vision",
                    text: "The light subsides, leaving a single, cracked, obsidian-like stone humming in the air – the Cracked Lodestone. As you reach for it, a powerful, fragmented vision sears your mind: \nA towering lighthouse of pure, brilliant white light, standing serene at the heart of a calm Inner Sea. Then, a cataclysm – a creeping shadow, a sudden, violent crack appearing on the lighthouse, an explosion of dark energy. The lighthouse shatters, its light scattered into countless fragments, plunging the Inner Sea into twilight.\nYou feel an echo of immense, personal loss tied to this event, a deep sorrow that mirrors the one you sensed on the Shore.",
                    onDisplay: (gs) => {
                        gs.ambition = "The Stolen Light was from a great Lighthouse. I must understand what destroyed it. The Cracked Lodestone hums, pointing towards the Crystalline Expanse.";
                        // gs.eventLog.push("New Ambition: Uncover the mystery of the Shattered Lighthouse."); // Logged by ambition update
                        // This would be the point to unlock Region 2 in a more complex system
                        // For now, we'll assume CrystallinePassageEntry becomes more significant
                    },
                    choices: [
                        { text: "The vision fades. The Lodestone settles in your hand, warm and faintly vibrating.",
                          effect: (gs) => "Your Ambition updates: Uncover the mystery of the Shattered Lighthouse.",
                          nextStorylet: "HG00_GrottoActions" }
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
                        { text: "Search for 'Embers of Unwavering Belief' (Keeper's Quest).", nextStorylet: "FG02_SearchEmbers", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && !gs.inventory.key_items.includes("Embers of Unwavering Belief") },
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
                                gs.inventory.resources.clarity = (gs.inventory.resources.clarity || 0) + 2;
                                return "You find a cluster of surprisingly coherent thoughts. (+2 Clarity Resource)";
                            } else if (roll < 0.6) {
                                gs.player_character.despair = Math.min(gs.player_character.despair + 2, gs.player_character.maxDespair);
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
                                // gs.eventLog.push("Acquired: Embers of Unwavering Belief."); // Logged by addItem
                                return "Acquired: Embers of Unwavering Belief.";
                            },
                            nextStorylet: "FG00_ExploreGraveyard"
                          },
                          onFailure: {
                            text: "You find many strong beliefs, but they are all fractured or corrupted. The search is tiring. (-3 Focus)",
                            effect: (gs) => { gs.player_character.focus -= 3; return "The search is tiring. (-3 Focus)";}
                          }
                        }
                    ]
                },
                 FG03_ObserveAspects: {
                    title: "Scuttling Forms",
                    text: "Tiny, skittish Aspects made of regret and forgotten chores dart through the debris. One, bolder than the rest, a 'Mote of Unfinished Business', approaches you, vibrating with anxiety.",
                    choices: [
                        { text: "Attempt to soothe it (Psychological 2+).", attunementCheck: { attunement: "psychological", threshold: 2 },
                            onSuccess: {
                                text: "You project a sense of calm completion. The Mote shudders, then dissolves into a tiny puff of relieved dust.",
                                effect: (gs) => { gs.player_character.hope = Math.min(gs.player_character.hope + 1, gs.player_character.maxHope); return "A small act of psychic tidiness. (+1 Hope)"; }
                            },
                            onFailure: {
                                text: "Your attempt at soothing is drowned out by its frantic energy. It zips away, leaving you feeling slightly more harried.",
                                effect: (gs) => { gs.player_character.focus -= 1; return "The Mote's anxiety is infectious. (-1 Focus)"; }
                            }
                        },
                        { text: "Ignore it and continue exploring.", nextStorylet: "FG00_ExploreGraveyard" }
                    ]
                }
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
                        { text: "Search for the 'Negative Impression' exhibit (rumored).", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression") },
                        { text: "Leave the Museum.", travelTo: "ShatteredShore" } // Or map
                    ]
                },
                MLI01_SpeakCurator: {
                    title: "The Archivist of Annihilation",
                    text: "Curator: 'Another visitor to my... collection. Do you come to mourn, to learn, or simply to marvel at what can be so utterly lost? Each empty space here was once a soul, a mind, an identity. Now... just echoes and absences.'",
                    choices: [
                        { text: "'What is this place?'", effect: (gs) => "Curator: 'A testament. A warning. A library of oblivion. We catalogue what the Sea of Psyche erodes.'"},
                        { text: "'Can these identities be restored?'", effect: (gs) => "Curator: 'Restored? Child, some things are not meant to be reassembled. To try is to invite madness. We preserve the *shape* of the loss, not the thing itself.' (A hint of fear here)" },
                        { text: "(Offer a fragmented memory of your own - Costs 1 Clarity Resource)", condition: (gs) => (gs.inventory.resources.clarity || 0) >= 1,
                          effect: (gs) => {
                            gs.inventory.resources.clarity--;
                            gs.player_character.attunements.interaction++;
                            gs.setWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport", (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") || 0) +1 );
                            return "The Curator accepts your fragment with a delicate tendril of dust. 'A fresh ache... thank you. Perhaps this will help others understand their own voids.' (+1 Interaction Attunement, +Rapport with Curator)";
                          }
                        },
                        { text: "Ask about the 'Negative Impression'.", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => !gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression"),
                          effect: (gs) => { gs.setWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression", true); return "Curator: 'The Negative Impression? Ah, a dangerous myth. A hollow so vast it could swallow stars. Best not to seek such things.'"; }
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
                        { text: "Simply observe its tragic beauty.", effect: (gs) => { gs.player_character.hope = Math.max(0, gs.player_character.hope -1); gs.player_character.focus = Math.min(gs.player_character.focus +2, gs.player_character.maxFocus); return "A profound sadness touches you, but also a strange clarity about the nature of ambition. (-1 Hope, +2 Focus)"; } },
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
                                    // gs.eventLog.push("The experience solidifies into a new Concept: Borrowed Guise!"); // Logged by addConcept
                                }
                                gs.player_character.attunements.psychological++;
                                gs.player_character.attunements.interaction++;
                                return "The experience solidifies your understanding. (+1 Psychological Att, +1 Interaction Att)";
                            }
                          },
                          onFailure: {
                            text: "The intensity is too much! You recoil, your own identity fracturing slightly.",
                            effect: (gs) => { gs.player_character.integrity = Math.max(0, gs.player_character.integrity - 5); gs.player_character.despair = Math.min(gs.player_character.despair +3, gs.player_character.maxDespair); return "Your identity frays. (-5 Integrity, +3 Despair)"; }
                          }
                        },
                        { text: "Pull back immediately!", effect: (gs) => { return "You narrowly avoid being overwhelmed, but the echo of that desperate longing lingers."; } }
                    ]
                },
                MLI03_SearchNegativeImpression: {
                    title: "The Locked Exhibit",
                    text: (gs) => {
                        if (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") >= 2) {
                           return "The Curator, seeing your persistence and perhaps trusting you slightly, sighs. 'Very well. The Negative Impression... it is not an exhibit, but a wound in the fabric of this Museum. Behind the grand tapestry in the West Wing. But the way is sealed by three Locks of Misremembering. Each requires a specific... offering... to open. A true memory of Regret, a genuine spark of Uncorrupted Joy, and an Echo of Pure Logic.'";
                        }
                        return "You search for the rumored 'Negative Impression' exhibit, but the Curator actively misdirects you, or the Museum's layout seems to shift, preventing you from finding anything.";
                    },
                    onDisplay: (gs) => {
                        if (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") >= 2 && !gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active")) {
                            gs.setWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active", true);
                            // gs.eventLog.push("The Curator has revealed the path to the Negative Impression, guarded by three Locks."); // Logged by return of choice
                        }
                    },
                    choices: [
                         { text: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active") ? "I will seek these offerings." : "This is too much for now.",
                           effect: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active") ? "The Curator nods gravely. 'Be warned, Oneironaut. Some voids are best left unfilled.'" : "You decide to leave this mystery for another time.",
                           nextStorylet: "MLI00_EnterMuseum"
                         }
                    ]
                }
            }
        },

        // --- LOCATIONS FOR SHARDS (Still within Region 1's conceptual reach for now) ---
        CrystallinePassageEntry: {
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
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.logic_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("axiomatic_deconstruction");
                                return "Acquired: Shard of Logic! Concept: Axiomatic Deconstruction.";
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: { text: "Guardian: 'Irrelevant. The test stands.'", nextStorylet: "CP02_LogicTest" }
                        },
                        { text: "(Invoke 'Borrowed Guise': The Logician's Apprentice)", conceptCheck: { concept: "borrowed_guise", passIfPresent: true },
                            onSuccess: { text: "You project an aura of intense academic focus. The Guardian scrutinizes you. 'A student of the Axiom? Pass, but do not disturb the calculations.'", effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.logic_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                return "Acquired: Shard of Logic! (By guile)";
                                }, travelTo: "ShatteredShore"
                            }
                        }
                    ]
                },
                CP02_LogicTest: {
                    title: "The First Syllogism",
                    text: "Guardian: 'Premise 1: All truly valuable things are difficult to obtain. Premise 2: The Shard of Logic is truly valuable. Conclusion...?'",
                    choices: [
                        { text: "'Therefore, the Shard of Logic is difficult to obtain.' (Correct)", effect: (gs) => "Guardian: 'Coherent.'", nextStorylet: "CP03_LogicTestSuccess" },
                        { text: "'Therefore, all difficult things are Shards of Logic.' (Incorrect)", effect: (gs) => "Guardian: 'Flawed. Try again, or be denied.' (-2 Focus)", nextStorylet: "CP01_GuardLogic" }, // Loop back or different failure
                        { text: "'Therefore, you are difficult to obtain.' (Cheeky)", effect: (gs) => {
                            if (Math.random() > 0.7) { // Small chance of cheeky success
                                gs.player_character.attunements.interaction++;
                                return "Guardian: '...An unexpected but not entirely illogical leap. Amusing. You may pass.' (+1 Interaction)";
                            }
                            return "Guardian: 'Frivolous. Logic demands precision.' (-3 Focus)";
                            },
                          nextStorylet: (gs) => (R1_CONFIG.gameStateRef.player_character.attunements.interaction > 1 && Math.random() > 0.7) ? "CP03_LogicTestSuccess" : "CP01_GuardLogic" // If cheeky worked, proceed, else retry.
                        }
                    ]
                },
                CP03_LogicTestSuccess: {
                    title: "Logical Concordance",
                    text: "The Guardian: 'You may pass and claim the Shard.' A section of the Guardian recedes, revealing the Shard of Logic.",
                    onDisplay: (gs) => { // Use onDisplay to ensure effect happens before player clicks
                        if (gs.world_state.regional_quest_R1) {
                           gs.world_state.regional_quest_R1.logic_shard = true;
                           gs.world_state.regional_quest_R1.shards_collected++;
                        }
                        gs.addConcept("axiomatic_deconstruction");
                    },
                    choices: [ {text: "Take the Shard.",
                                effect: (gs) => "Acquired: Shard of Logic! Concept: Axiomatic Deconstruction.",
                                travelTo: "ShatteredShore"}]
                }
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
                          onSuccess: { text: "You reach out, not with words, but with a wave of shared understanding. The Aspect's sobbing lessens slightly. 'You... feel it too?' It releases the Shard.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("resonant_empathy");
                                return "Acquired: Shard of Emotion! Concept: Resonant Empathy.";
                            }, travelTo: "ShatteredShore"
                          },
                          onFailure: { text: "Your attempt at empathy feels hollow, rejected by the sheer scale of its sorrow. The Aspect wails louder.", effect: (gs) => "The Aspect's grief intensifies."}
                        },
                        { text: "[Invoke Concept: Cathartic Release (if possessed)]", conceptCheck: { concept: "cathartic_release" , passIfPresent: true }, // Changed from Shared Sorrow to Cathartic Release as it's acquired
                          onSuccess: { text: "You invoke the concept, and for a moment, you allow the Aspect's grief a pure, unhindered channel. It shudders, then a fragile peace settles. It offers the Shard.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                // Cathartic Release was the goal, not necessarily another concept here. Maybe a stat boost.
                                gs.player_character.hope = Math.min(gs.player_character.hope + 5, gs.player_character.maxHope);
                                return "Acquired: Shard of Emotion! You feel a sense of shared release. (+5 Hope)";
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Offer a Personal 'Memory of Loss' (Costs 5 Hope, 1 Clarity Resource)]",
                          condition: (gs) => gs.player_character.hope > 5 && (gs.inventory.resources.clarity || 0) >=1,
                          effect: (gs) => {
                            gs.player_character.hope = Math.max(0, gs.player_character.hope - 5);
                            gs.inventory.resources.clarity--;
                            const roll = Math.random();
                            if (roll > 0.4) {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("cathartic_release"); // Acquire Cathartic Release here
                                gs.player_character.attunements.psychological++;
                                gs.gameStateRef.travelToLocation = "ShatteredShore"; // Set travel for manager
                                return "The Aspect clutches your memory, finding a kindred spirit in your pain. It offers the Shard. (+1 Psychological Attunement) Acquired: Shard of Emotion! Concept: Cathartic Release.";
                            } else {
                                gs.player_character.despair = Math.min(gs.player_character.despair + 5, gs.player_character.maxDespair);
                                return "The Aspect recoils. 'Your pain is but a flicker to my inferno! Begone!' (+5 Despair, the Shard remains elusive)";
                            }
                          }
                        },
                        { text: "Attempt to analyze its grief (Cognitive Attunement 4+).", attunementCheck: {attunement: "cognitive", threshold: 4},
                            onSuccess: { text: "Your mind dissects the patterns of its sorrow, identifying core traumas. The Aspect seems momentarily confused by your detached approach, loosening its grip on the Shard.",
                                effect: (gs) => {
                                     if (gs.world_state.regional_quest_R1) {
                                        gs.world_state.regional_quest_R1.emotion_shard = true;
                                        gs.world_state.regional_quest_R1.shards_collected++;
                                    }
                                    return "Acquired: Shard of Emotion! (By cold analysis)";
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: {text: "Its grief is too chaotic, too primal for logical dissection. Your thoughts are swamped by emotion. (-5 Focus)", effect:(gs) => {gs.player_character.focus -=5; return "Your thoughts are swamped. (-5 Focus)";}}
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
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.sensation_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("heightened_perception");
                                return "Acquired: Shard of Sensation! Concept: Heightened Perception.";
                            }, travelTo: "ShatteredShore"
                          },
                          onFailure: { text: "Your attempts are swallowed by the overwhelming sensory bliss it exudes. You feel your own resolve weakening. (-3 Focus, -2 Hope)", effect:(gs) => {gs.player_character.focus-=3; gs.player_character.hope-=2; return "Your resolve weakens. (-3 Focus, -2 Hope)";}}
                        },
                        { text: "[Invoke 'Heightened Perception' (if possessed, to find a subtle way)]", conceptCheck: { concept: "heightened_perception" , passIfPresent: true}, // Changed from Mindful Presence
                          onSuccess: { text: "Using your heightened senses, you notice a tiny, almost invisible thread connecting the Shard to a less narcotic part of the garden. You gently tug it free without disturbing the Aspect.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.sensation_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                // No new concept if using an existing one this way
                                return "Acquired: Shard of Sensation! (With finesse)";
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Find a 'Grounding Anchor' (Requires searching the Garden)]", nextStorylet: "OG02_SearchAnchor" }
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
                            effect: (gs) => { gs.setWorldFlag("GardenPathEntry_story_flags.found_anchor", "thorn"); return "You found a Thorn of Clarity."; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "Everything is too soft, too yielding. No anchor here.", effect:(gs)=>"No anchor found." }
                        },
                        { text: "Listen for a 'Silent Stone' (Cognitive Attunement 2+).",
                          attunementCheck: { attunement: "cognitive", threshold: 2 },
                          onSuccess: {
                            text: "Amidst the riot of sensation, you find a patch of utter sensory silence around a smooth, grey stone. It feels cold and real.",
                            effect: (gs) => { gs.setWorldFlag("GardenPathEntry_story_flags.found_anchor", "stone"); return "You found a Silent Stone."; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "The noise and perfume are too pervasive.", effect:(gs)=>"The sensory overload is too great."}
                        }
                    ]
                },
                OG03_UseAnchor: {
                    title: "Anchored Sensation",
                    text: (gs) => `You use the ${gs.getWorldFlag("GardenPathEntry_story_flags.found_anchor") === "thorn" ? "sharp pain of the Thorn" : "cold reality of the Silent Stone"} to focus your mind, cutting through the apathy. The Aspect of Hedonistic Apathy stirs, annoyed by your clarity. 'Oh, very well. Take the bauble. Spoil all the fun.' It gestures towards the Shard.`,
                    onDisplay: (gs) => { // Use onDisplay for effects that happen when storylet loads
                        if (gs.world_state.regional_quest_R1) {
                            gs.world_state.regional_quest_R1.sensation_shard = true;
                            gs.world_state.regional_quest_R1.shards_collected++;
                        }
                        gs.addConcept("heightened_perception");
                    },
                    choices: [
                        {text: "Claim the Shard of Sensation.",
                         effect: (gs) => "Acquired: Shard of Sensation! Concept: Heightened Perception.",
                         travelTo: "ShatteredShore"}
                    ]
                }
            }
        },
        WhisperingIsle: { // Placeholder, flesh out later
            id: "WhisperingIsle",
            name: "The Whispering Isle",
            image: "images/whispering_isle.png",
            description: "A small, lonely isle where the winds carry fragmented secrets and forgotten names. It is said that if you listen carefully, you can hear the Inner Sea itself thinking.",
            onEnter: () => "WI00_ApproachIsle",
            storylets: {
                WI00_ApproachIsle: {
                    title: "The Isle of Echoes",
                    text: "The whispers here are almost palpable, brushing against your consciousness like unseen fingers.",
                    choices: [
                        {text: "Listen to the whispers.", effect: (gs) => "You hear a thousand half-truths and broken promises. Nothing coherent, yet. (-1 Focus)"},
                        {text: "Meditate, seeking a pattern.", attunementCheck: {attunement: "psychological", threshold: 3},
                            onSuccess: {text: "Among the chaos, a single, clear thought emerges: a clue about a hidden path in the Flotsam Graveyards.", effect: (gs) => {gs.setWorldFlag("FlotsamGraveyards_story_flags.heard_whisper_path", true); return "A clear thought cuts through the noise.";}},
                            onFailure: {text: "The whispers only grow more confusing.", effect: (gs)=> "The whispers overwhelm."}
                        },
                        {text: "Leave the isle.", travelTo: "ShatteredShore"}
                    ]
                }
            }
        }
    }
};

// A little hack to allow storylets to access the main gameState for complex conditions/effects
// We'll assign the actual gameState to this in main.js
R1_CONFIG.gameStateRef = {};
