// config.js

const R1_CONFIG = {
    gameSettings: {
        initialPlayerStats: { // This is around line 5
            name: "", // Player will set this
            integrity: 100, // This is around line 7
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
            }
        },
        initialAmbition: "To discern the nature of this... awakening, and the self that perceives it.",
        startingLocation: "ShatteredShore",
        startingRegion: "The Shattered Fringe",
    },

    concepts: {
        focused_inquiry: {
            id: "focused_inquiry",
            name: "Focused Inquiry",
            description: "A nascent discipline of mind, compelling a deeper probe into the shadows of understanding.",
            type: "Cognitive",
            onAcquire: (gs) => `A cold shard of clarity pierces the fog; the mind yearns to dissect the unknown.`,
        },
        shielding_doubt: {
            id: "shielding_doubt",
            name: "Shielding Doubt",
            description: "An instinctive recoil from certitude, a fragile bulwark against the crushing weight of unverified 'truths'.",
            type: "Psychological",
            onAcquire: (gs) => `A whisper of negation, a chilling skepticism, wraps itself around your core. Trust becomes a forgotten currency.`,
        },
        patchwork_understanding: {
            id: "patchwork_understanding",
            name: "Patchwork Understanding",
            description: "The grim art of suturing together incongruous fragments, birthing a grotesque but perhaps necessary semblance of meaning.",
            type: "Cognitive",
            onAcquire: (gs) => `From the wreckage of thought, you begin to weave a tapestry of maybes and perhapses. It offers no comfort.`,
        },
        borrowed_guise: {
            id: "borrowed_guise",
            name: "Borrowed Guise",
            description: "A violation of selfhood; the chilling ability to wear another's perspective like a flayed skin, feeling its alien contours.",
            type: "Interaction",
            onAcquire: (gs) => `The 'I' dissolves. For a horrifying instant, another's dread, another's hollow hope, becomes your own.`,
        },
        resonant_empathy: {
            id: "resonant_empathy",
            name: "Resonant Empathy",
            description: "To not merely observe, but to be infected by another's suffering, its tendrils coiling around your own psyche.",
            type: "Psychological",
            onAcquire: (gs) => `The sorrows of this place bleed into you, a shared agony that offers no solace, only a deeper communion with despair.`
        },
        axiomatic_deconstruction: {
            id: "axiomatic_deconstruction",
            name: "Axiomatic Deconstruction",
            description: "The cruel precision to expose the fault lines in any edict, any belief, watching it crumble into meaningless dust.",
            type: "Cognitive",
            onAcquire: (gs) => `The bedrock of reason fractures. You now see the void beneath all assertions.`
        },
        cathartic_release: {
            id: "cathartic_release",
            name: "Cathartic Release",
            description: "The terrible beauty of emotional obliteration, a purging storm that leaves behind not peace, but a profound, echoing emptiness.",
            type: "Psychological",
            onAcquire: (gs) => `You have touched the heart of the emotional storm and found not its center, but its endless, consuming periphery.`
        },
        heightened_perception: {
            id: "heightened_perception",
            name: "Heightened Perception",
            description: "The curse of seeing too much, hearing too clearly; every detail a fresh barb, every nuance a deeper cut into the self.",
            type: "Sensory",
            onAcquire: (gs) => `The world screams its secrets. The mundane is transfigured into a tapestry of unbearable, intricate detail.`
        },
    },

    regions: {
        "The Shattered Fringe": {
            name: "The Shattered Fringe",
            description: "A desolate shore where the flotsam of dead consciousness accumulates. The air is a miasma of forgotten agonies and fractured pronouncements. To breathe here is to inhale despair.",
            locations: ["ShatteredShore", "HearthstoneGrotto", "FlotsamGraveyards", "MuseumOfLostIdentities", "WhisperingIsle", "CrystallinePassageEntry", "WeepingKelpFringe", "GardenPathEntry"]
        }
    },

    locations: {
        ShatteredShore: {
            id: "ShatteredShore",
            name: "The Shattered Shore",
            image: "images/shattered_shore.png",
            description: "A landscape of psychic detritus. Obsidian sands gleam with the embedded shards of countless broken minds. The 'sky' is a perpetual, bruised twilight, churning with the nebulous forms of half-dreamt horrors. Each grain of sand whispers of a unique oblivion.",
            onEnter: (gs) => {
                if (!gs.getWorldFlag("ShatteredShore_story_flags.awakening_started")) {
                    return "SS01_Awakening_1";
                }
                return "SS00_ExamineShore";
            },
            storylets: {
                SS00_ExamineShore: {
                    title: "Survey the Desolation",
                    text: "The shore is a testament to finality. The silence is broken only by the grating of shard upon shard, a symphony of psychic erosion. Where does one even begin in a place that is all endings?",
                    choices: [
                        { text: "Kneel. Sift through the nearest cairn of mind-fragments.", nextStorylet: "SS02_SiftFragments", condition: (gs) => !gs.getWorldFlag("ShatteredShore_story_flags.sifted_recently") },
                        { text: "Stare into the abyssal 'sky', seeking a pattern in its malevolent swirl.", nextStorylet: "SS03_ListenHum" },
                        { text: "Search for an egress, any path that leads away from this terminal beach.", nextStorylet: "SS04_SeekPath" },
                        { text: "Succumb to the torpor. Attempt to glean a moment's respite.", effect: (gs) => { gs.player_character.focus = Math.min(gs.player_character.focus + 3, gs.player_character.maxFocus); return "A sliver of cold focus returns, a brief stay against the encroaching void. (+3 Focus)"; }, isAvailable: (gs) => gs.player_character.focus < gs.player_character.maxFocus }
                    ]
                },
                SS01_Awakening_1: {
                    title: "The Unknowing",
                    text: "A void. Then, sensation – cold, sharp, an agony of becoming. You are a raw nerve exposed to a universe of knives. Identity is a distant, mocking echo. Name? A luxury this place does not afford easily.",
                    onDisplay: (gs) => { gs.setWorldFlag("ShatteredShore_story_flags.awakening_started", true); },
                    choices: [
                        { text: "Reach into the psychic maelstrom. Attempt to seize a name, a label, an illusion of self.", nextStorylet: "SS01_Awakening_Name" }
                    ]
                },
                SS01_Awakening_Name: {
                    title: "A Fleeting Sigil",
                    text: "Your nascent consciousness, a fragile thing, casts about in the storm of shattered identities. Which fragment will you claim as your own, knowing it too is borrowed, perhaps stolen?\nInput a designation. Or accept the one the void offers.",
                    promptInput: {
                        label: "Whisper your chosen designation into the indifferent dark:",
                        placeholder: "e.g., Cipher, Null, Remnant...",
                        onSubmit: (gs, input) => {
                            gs.player_character.name = input || "The Unnamed";
                            gs.ambition = `To unravel the enigma of this existence, ${gs.player_character.name}. And to confront the 'I' that asks.`;
                            gs.addConcept("focused_inquiry");
                            gs.addConcept("shielding_doubt");
                            gs.setWorldFlag("ShatteredShore_story_flags.awakening_complete", true);
                            return `You are ${gs.player_character.name}. A label etched in the dust of oblivion. The chilling discipline of 'Focused Inquiry' and the bitter solace of 'Shielding Doubt' take root. A path towards a faint, desperate light – the Hearthstone Grotto – feebly asserts itself.`;
                        }
                    },
                    isUnique: true
                },
                SS02_SiftFragments: {
                    title: "Chirurgeory of Lost Selves",
                    text: "Your fingers, numb and trembling, explore a heap of jagged mental shards. Each one is a scream frozen in glass. One fragment pulses with a particularly visceral terror – a face, once beatific, contorting into a mask of ultimate dread before atomizing.",
                    onDisplay: (gs) => { gs.setWorldFlag("ShatteredShore_story_flags.sifted_recently", true); },
                    choices: [
                        { text: "Force your gaze upon the terror. Attempt to reconstruct the final moment.", effect: (gs) => { gs.player_character.despair = Math.min(gs.player_character.despair + 7, gs.player_character.maxDespair); gs.player_character.focus = Math.max(0, gs.player_character.focus - 4); return "The horror is contagious. It sears your psyche, leaving fresh wounds. (+7 Despair, -4 Focus)"; }},
                        { text: "Avert your gaze. Seek instead shards that whisper of less... final things.", effect: (gs) => { gs.player_character.hope = Math.min(gs.player_character.hope + 1, gs.player_character.maxHope); gs.inventory.resources.clarity = (gs.inventory.resources.clarity || 0) + 1; return "You unearth a shard depicting a single, perfect tear shed for a forgotten love. A moment of pure, exquisite sorrow, almost beautiful in its desolation. (+1 Hope, +1 Clarity Resource)"; }},
                        { text: "Retreat from the shards. Some graves are best left undisturbed.", nextStorylet: "SS00_ExamineShore"}
                    ],
                },
                SS03_ListenHum: {
                    title: "The Sky's Lament",
                    text: "You attune your senses to the oppressive hum of the 'sky'. It is the sound of a billion souls crying out in unison, their individual despairs merging into a single, overwhelming threnody. It claws at the edges of your sanity.",
                    choices: [
                        { text: "Attempt to parse a single voice from the cacophony (Sensory 3+).", attunementCheck: { attunement: "sensory", threshold: 3 },
                            onSuccess: { text: "Through an act of will, you isolate a chilling whisper: '...the Lighthouse... its eye is broken... darkness bleeds from the core...'. The voice dissolves into static.",
                                effect: (gs)=>{ gs.player_character.attunements.sensory++; gs.setWorldFlag("ShatteredShore_story_flags.heard_broken_light_whisper", true); return "The words 'broken Lighthouse' etch themselves into your memory. (+1 Sensory Att)"; }},
                            onFailure: {text: "The sheer volume of sorrow is a physical blow. Your mind reels. (-5 Focus)",
                                effect: (gs)=>{gs.player_character.focus = Math.max(0, gs.player_character.focus - 5); return "Your mind is battered by the psychic storm. (-5 Focus)";}} },
                        { text: "Employ 'Shielding Doubt' to deaden the input.", conceptCheck: { concept: "shielding_doubt", passIfPresent: true },
                            onSuccess: { text: "Your skepticism forms a thin, cold barrier. The worst of the lament is muted, leaving only a distant, sorrowful echo.",
                                effect: (gs)=>{gs.player_character.attunements.psychological++; return "Your doubt provides a fragile shield. (+1 Psychological Att)"; } },
                            onFailure: { text: "Your defenses are inadequate. The sky's despair seeps into you. (-4 Hope)",
                                effect: (gs)=>{gs.player_character.hope = Math.max(0, gs.player_character.hope - 4); return "The weight of collective sorrow presses down. (-4 Hope)";} } },
                        { text: "Cease listening. The silence of the shore is preferable.", nextStorylet: "SS00_ExamineShore"}
                    ]
                },
                SS04_SeekPath: {
                    title: "Horizons of Despair",
                    text: "You scan the desolate expanse. The shore itself seems a prison without walls. Yet, three potential vectors of escape present themselves: \n1. Inland, a faint, febrile warmth pulses, a dying ember in the overwhelming cold – the Hearthstone Grotto.\n2. Towards a horizon of jagged, crystalline spires that pierce the bruised sky – the Crystalline Passage.\n3. Along a path choked by weeping, bioluminescent flora, exuding an air of exquisite, unending grief – the Weeping Kelp Fringe.",
                    choices: [
                        { text: "Follow the path towards the Grotto's dying light.", travelTo: "HearthstoneGrotto", condition: (gs) => gs.getWorldFlag("ShatteredShore_story_flags.awakening_complete") },
                        { text: "Approach the crystalline aggression of the Passage.", travelTo: "CrystallinePassageEntry", condition: (gs) => gs.getWorldFlag("ShatteredShore_story_flags.awakening_complete")  },
                        { text: "Immerse yourself in the sorrowful embrace of the Kelp.", travelTo: "WeepingKelpFringe", condition: (gs) => gs.getWorldFlag("ShatteredShore_story_flags.awakening_complete")  },
                        { text: "First, there must be a self to make a journey. (Remain to complete awakening)", nextStorylet: "SS01_Awakening_1", condition: (gs) => !gs.getWorldFlag("ShatteredShore_story_flags.awakening_complete") }
                    ]
                }
            }
        },

        HearthstoneGrotto: {
            id: "HearthstoneGrotto",
            name: "The Hearthstone Grotto",
            image: "images/hearthstone_grotto.png",
            description: "A cavity within the psychic bedrock, unnaturally warm. At its heart, a colossal geode – the Hearthstone – pulses with a light that is both life and slow decay. The Keeper of Fading Embers, an entity ancient beyond comprehension, tends this guttering flame of collective memory.",
            isSanctuary: true,
            onEnter: (gs) => {
                if (!gs.getWorldFlag("HearthstoneGrotto_story_flags.met_keeper")) {
                    return "HG01_MeetKeeper";
                }
                return "HG00_GrottoActions";
            },
            storylets: {
                HG00_GrottoActions: {
                    title: "The Grotto's Tenuous Grace",
                    text: "The Hearthstone's warmth is a temporary reprieve from the Fringe's gnawing chill. The Keeper observes you, its gaze holding the weight of aeons and the sorrow of countless lost souls.",
                    choices: [
                        { text: "Converse with the Keeper, if it deigns to speak.", nextStorylet: "HG02_SpeakKeeper" },
                        { text: "Huddle near the Hearthstone. Absorb its fading warmth. (Restore some Integrity & Hope)", effect: (gs) => {
                            gs.player_character.integrity = Math.min(gs.player_character.integrity + 10, gs.player_character.maxIntegrity); // Reduced effect
                            gs.player_character.hope = Math.min(gs.player_character.hope + 7, gs.player_character.maxHope);     // Reduced effect
                            return "The Hearth's light is a fragile comfort. It mends little, but perhaps slows the unravelling. (+10 Integrity, +7 Hope)";
                        }, isAvailable: (gs) => gs.player_character.integrity < gs.player_character.maxIntegrity || gs.player_character.hope < gs.player_character.maxHope },
                        { text: "Inquire about your grim task: 'The Echo of Shattered Light'.", nextStorylet: "HG03_QuestUpdate_EchoOfLight", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" },
                        { text: "Present the 'Cracked Lodestone' for the Keeper's scrutiny.", nextStorylet: "HG04_LodestoneInquiry", condition: (gs) => gs.inventory.key_items.includes("Cracked Lodestone") },
                        { text: "Abandon this fleeting sanctuary. Return to the desolation.", travelTo: "ShatteredShore" }
                    ]
                },
                HG01_MeetKeeper: {
                    title: "The Keeper of Fading Embers",
                    text: "The Aspect's form is a column of solidified twilight, its voice the rustle of grave-cloth. 'Another fleck of awareness, adrift on the shores of oblivion. I am Keeper. This Grotto, this Hearthstone, is a small, failing bulwark against the final unmaking. What desperate hope or damning curiosity brings you to this place of endings?'",
                    onDisplay: (gs) => { gs.setWorldFlag("HearthstoneGrotto_story_flags.met_keeper", true); },
                    choices: [
                        { text: "'I am... a void. I remember nothing.'", nextStorylet: "HG01_KeeperResponse_Amnesia" },
                        { text: (gs) => gs.getWorldFlag("ShatteredShore_story_flags.heard_broken_light_whisper") ? "'Whispers spoke of a... broken Lighthouse. Of darkness bleeding.' " : "'I seek... a truth. Any truth in this abyss of negation.'", nextStorylet: "HG01_KeeperResponse_LightSeeker" }
                    ]
                },
                HG01_KeeperResponse_Amnesia: {
                    title: "The Price of Forgetting",
                    text: "'Oblivion is the sea we swim in, little fragment. Yet, I perceive in your core a resonance... a deep wound, yes, but also the ghost of a brilliance extinguished. The Shattered Light. Perhaps it was yours.'\nThe Keeper indicates the Hearthstone. 'Many such lights were snuffed out. To reclaim even a sliver of what you were, you must retrieve the Luminous Shards – vestiges of a Memory Prime, now scattered to the bleakest corners of this Fringe.'",
                    choices: [
                        { text: "Embrace this harrowing quest: 'The Echo of Shattered Light'.", effect: (gs) => {
                            if (!gs.world_state.regional_quest_R1) gs.world_state.regional_quest_R1 = {};
                            gs.world_state.regional_quest_R1.id = "Echo of Shattered Light";
                            gs.world_state.regional_quest_R1.stage = "find_shards";
                            gs.world_state.regional_quest_R1.shards_needed = 3;
                            gs.world_state.regional_quest_R1.shards_collected = 0;
                            gs.world_state.regional_quest_R1.logic_shard = false;
                            gs.world_state.regional_quest_R1.emotion_shard = false;
                            gs.world_state.regional_quest_R1.sensation_shard = false;
                            gs.ambition = "The Echo of Shattered Light: Gather the Luminous Shards from the Fringe's depths.";
                            return "The Keeper inclines its shadowy head. 'The Shard of Logic festers in the Crystalline Passages. The Shard of Emotion drowns in the Weeping Kelp. The Shard of Sensation is consumed by the Overgrown Garden. Go. And try not to become another forgotten ember.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG01_KeeperResponse_LightSeeker: {
                    title: "The Great Unravelling",
                    text: "'The Broken Lighthouse... a wound that will not heal. Its shattering birthed this twilight era. Your own light, Oneironaut, seems intimately tied to that cataclysm. If you would understand, if you would reclaim what was stolen, you must gather the Luminous Shards of a Memory Prime – splinters of a truth too terrible to hold.'",
                    choices: [
                         { text: "Undertake the bleak pilgrimage: 'The Echo of Shattered Light'.", effect: (gs) => {
                            if (!gs.world_state.regional_quest_R1) gs.world_state.regional_quest_R1 = {};
                            gs.world_state.regional_quest_R1.id = "Echo of Shattered Light";
                            gs.world_state.regional_quest_R1.stage = "find_shards";
                            gs.world_state.regional_quest_R1.shards_needed = 3;
                            gs.world_state.regional_quest_R1.shards_collected = 0;
                            gs.world_state.regional_quest_R1.logic_shard = false;
                            gs.world_state.regional_quest_R1.emotion_shard = false;
                            gs.world_state.regional_quest_R1.sensation_shard = false;
                            gs.ambition = "The Echo of Shattered Light: Gather the Luminous Shards from the Fringe's depths.";
                            return "The Keeper gestures. 'The Shard of Logic is impaled within the Crystalline Passages. The Shard of Emotion is ensnared by the Weeping Kelp. The Shard of Sensation lies dormant in the Overgrown Garden. May your journey be... conclusive.'";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG02_SpeakKeeper: {
                    title: "Audience with Ancient Sorrow",
                    text: () => {
                        let dialogue = "The Keeper's presence is a chilling weight. 'Speak, if you must. My time, like all things, erodes.'";
                        if (R1_CONFIG.gameStateRef.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active")) {
                            dialogue += "\n'The Embers of Unwavering Belief... has your search yielded this small, desperate hope for the Hearthstone?'";
                        } else if (!R1_CONFIG.gameStateRef.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered")) {
                            dialogue += "\n(The Hearthstone gutters, its light casting skeletal shadows. The Keeper seems... diminished.)";
                        }
                        return dialogue;
                    },
                    choices: [
                        { text: "Ask about this blighted realm, the Shattered Fringe.", effect: (gs) => "Keeper: 'It is the littoral zone of oblivion. The final shore before... nothing. Here, all that is broken eventually arrives.'"},
                        { text: "Ask about others like yourself, these 'Oneironauts'.", effect: (gs) => "Keeper: 'Fleeting sparks. Most are consumed by their own fractured desires or the Fringe's horrors. A few burn brightly, briefly, before they too are extinguished. Their ambitions are dust.'"},
                        { text: "(If Hearthstone gutters) 'The Hearthstone... it weakens. What ails it, Keeper?'", condition: (gs) => !gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered") && !gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active"), nextStorylet: "HG05_KeepersFlame_Offer" },
                        { text: "(If Quest Active) 'My search for the Embers continues. They are elusive.'", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && !gs.inventory.key_items.includes("Embers of Unwavering Belief")},
                        { text: "(If Quest Active & has Embers) 'I return with the Embers of Unwavering Belief.'", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && gs.inventory.key_items.includes("Embers of Unwavering Belief"), nextStorylet: "HG05_KeepersFlame_Complete"},
                        { text: "Say nothing more. End the audience.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_QuestUpdate_EchoOfLight: {
                    title: "Accounting for the Shards",
                    text: (gs) => {
                        const rQuest = gs.world_state.regional_quest_R1;
                        if (!rQuest || rQuest.id !== "Echo of Shattered Light") return "Your purpose here is... unclear. The Shards do not call to you now.";

                        if (rQuest.stage === "find_shards") {
                            let status = `You have yet to wrest ${rQuest.shards_needed - rQuest.shards_collected} Luminous Shard(s) from this wretched place.\n`;
                            status += rQuest.logic_shard ? "- Shard of Logic: Claimed from its crystalline prison.\n" : "- Shard of Logic: Remains impaled in the Crystalline Passages.\n";
                            status += rQuest.emotion_shard ? "- Shard of Emotion: Plucked from the heart of the Weeping Kelp.\n" : "- Shard of Emotion: Still drowns in abyssal sorrow.\n";
                            status += rQuest.sensation_shard ? "- Shard of Sensation: Snatched from the Overgrown Garden's stupor.\n" : "- Shard of Sensation: Lost to narcotic oblivion.\n";
                            if (rQuest.shards_collected === rQuest.shards_needed) {
                                status += "\nYou bear all three Shards. A grim collection. Present them to me. The ritual awaits. And its consequences.";
                                gs.world_state.regional_quest_R1.stage = "return_shards";
                            }
                            return status;
                        } else if (rQuest.stage === "return_shards") {
                            return "The Luminous Shards thrum with stolen light, eager for the ritual. Their combined resonance is... unsettling. Are you prepared?";
                        } else if (rQuest.stage === "complete") {
                            return "The ritual is done. The Cracked Lodestone is yours. What new burdens does it bring?";
                        }
                        return "The currents of fate are muddled. The quest's meaning eludes even me for this moment.";
                    },
                    choices: [
                        { text: (gs) => gs.world_state.regional_quest_R1?.stage === "return_shards" ? "Commence the Ritual of Coalescence. Let what will be, be." : "I will continue this bitter harvest.",
                          condition: (gs) => gs.world_state.regional_quest_R1?.stage === "return_shards",
                          nextStorylet: "HG06_RitualOfCoalescence"
                        },
                        { text: "I require further... clarification... regarding a specific Shard.", nextStorylet: "HG03_ShardGuidance", condition: (gs) => gs.world_state.regional_quest_R1?.stage === "find_shards" && gs.world_state.regional_quest_R1?.shards_collected < gs.world_state.regional_quest_R1?.shards_needed },
                        { text: "Enough.", nextStorylet: "HG00_GrottoActions"}
                    ]
                },
                HG03_ShardGuidance: {
                    title: "Haruspications on the Shards",
                    text: "Which Shard's hiding place still vexes you?",
                    choices: [
                        { text: "The Shard of Logic.", effect: (gs) => "Keeper: 'It is defended by an Aspect that is the embodiment of Cold Reason. Its fortress is its own flawless, pitiless intellect. To defeat it, you must either be more logical, or find the singular, damning flaw in its existence.'", condition: (gs) => !gs.world_state.regional_quest_R1?.logic_shard },
                        { text: "The Shard of Emotion.", effect: (gs) => "Keeper: 'It is consumed by an Aspect of Infinite Grief, lost within the Weeping Kelp. Its sorrow is an ocean. You might offer your own despair as a bridge, or find a way to silence such a profound pain – if such a thing is even possible.'", condition: (gs) => !gs.world_state.regional_quest_R1?.emotion_shard },
                        { text: "The Shard of Sensation.", effect: (gs) => "Keeper: 'It is caught in the grip of an Aspect of Terminal Apathy, deep within the Overgrown Garden. Sensory pleasure has become its prison. You must either shock it from its stupor or find a sensation more potent, more... absolute.'", condition: (gs) => !gs.world_state.regional_quest_R1?.sensation_shard },
                        { text: "No more guidance is needed. Or perhaps, none can be truly given.", nextStorylet: "HG03_QuestUpdate_EchoOfLight"}
                    ]
                },
                 HG04_LodestoneInquiry: {
                    title: "The Lodestone's Weight",
                    text: (gs) => {
                        let baseText = "The Keeper's gaze lingers on the Cracked Lodestone. 'The Keystone of Emergence. A fragile, fractured thing, like yourself. It yearns for completion, for the other Keystones that would make it whole. A dangerous yearning.'";
                        if (gs.getWorldFlag("keystone_order_acquired")) { // Hypothetical future flag
                            baseText += "\n'It resonates now with the Keystone of Order, a chilling harmony. The Crystalline Expanse has yielded its secret. What next?'";
                        } else {
                            baseText += "\n'It pulses faintly, a blind searching. It feels an absence, a pull towards the domain of stark, unyielding reason – the Crystalline Expanse. There, perhaps, lies the Keystone of Order.'";
                        }
                        return baseText;
                    },
                    choices: [
                        { text: "These 'Keystones'... what is their ultimate purpose? What is the 'Sundered Crown'?",
                          effect: (gs) => {
                            gs.player_character.despair = Math.min(gs.player_character.despair + 2, gs.player_character.maxDespair);
                            return "Keeper: 'Purpose? Such a human conceit. They are fragments of what Was. The Crown... it is the mind of a dead god, or a sleeping one. To reassemble it could mean salvation, or an oblivion deeper than any you have yet imagined. Knowing this, do you still wish to proceed on this path?' (+2 Despair)";
                          }
                        },
                        { text: "Your words are heavy, Keeper. I will ponder them.", nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG05_KeepersFlame_Offer: {
                    title: "The Guttering Flame",
                    text: "The Keeper turns, a subtle desperation in its ancient voice. 'The Hearthstone... it weakens. The memories it feeds upon are... thin. Insufficient. I require Embers of Unwavering Belief – pure, crystallized conviction, often found where minds have clung to a singular, potent idea until their own dissolution. Without such, this small light against the endless dark will be extinguished.'",
                    onDisplay: (gs) => { gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_offered", true); },
                    choices: [
                        { text: "Swear to find these Embers. (A fool's promise, perhaps, but a promise nonetheless).", effect: (gs) => {
                            gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active", true);
                            return "The Keeper's form seems to solidify marginally. 'Seek them in the Flotsam Graveyards, where stubborn ideas go to die. But be warned – such conviction is often born of madness. Do not let it consume you.'";
                        }, nextStorylet: "HG00_GrottoActions" },
                        { text: "Refuse. Your own survival is paramount. (Moral Choice: Pragmatism vs. Altruism?)",
                          effect: (gs) => {
                            gs.player_character.hope = Math.max(0, gs.player_character.hope - 5);
                            gs.player_character.despair = Math.min(gs.player_character.despair + 3, gs.player_character.maxDespair);
                            gs.setWorldFlag("HearthstoneGrotto_story_flags.keeper_refused_help", true);
                            return "The Keeper offers no judgment, only a deeper silence. The Hearthstone flickers, and the Grotto grows colder. (-5 Hope, +3 Despair)";
                        }, nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG05_KeepersFlame_Complete: {
                    title: "A Moment's Reprieve",
                    text: "You offer the Embers of Unwavering Belief. The Keeper accepts them with a gesture that might be reverence. As they are fed to the Hearthstone, its light flares, pushing back the shadows, the warmth momentarily fierce.",
                    onDisplay: (gs) => {
                        gs.removeItem("Embers of Unwavering Belief", "key_items");
                        gs.player_character.hope = Math.min(gs.player_character.hope + 12, gs.player_character.maxHope);
                        gs.player_character.attunements.psychological++;
                        gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active", false);
                        gs.setWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_completed", true);
                    },
                    choices: [
                        { text: "The Keeper: 'You have granted this sanctuary a breath more time. A small defiance against the inevitable. It is... noted.'",
                          effect: (gs) => "The Hearthstone burns brighter, a fleeting defiance. (+12 Hope, +1 Psychological Attunement)",
                          nextStorylet: "HG00_GrottoActions" }
                    ]
                },
                HG06_RitualOfCoalescence: {
                    title: "The Unmaking and Remaking",
                    text: "You lay the three Luminous Shards before the Keeper. A deep hum emanates from the Hearthstone as the Keeper begins its incantation – words of power that scrape against your mind. The Shards rise, spinning violently, their light agonizingly bright, the sound like the universe tearing itself apart.",
                    onDisplay: (gs) => {
                        gs.removeItem("Shard of Logic", "key_items");
                        gs.removeItem("Shard of Emotion", "key_items");
                        gs.removeItem("Shard of Sensation", "key_items");
                        gs.addItem("Cracked Lodestone", "key_items");
                        gs.setWorldFlag("keystone_emergence_acquired", true);
                        if (gs.world_state.regional_quest_R1) {
                           gs.world_state.regional_quest_R1.stage = "complete";
                        }
                        gs.player_character.integrity = Math.min(gs.player_character.integrity + 15, gs.player_character.maxIntegrity); // Reduced reward
                        gs.player_character.focus = Math.min(gs.player_character.focus + 7, gs.player_character.maxFocus);   // Reduced reward
                    },
                    choices: [
                        {text: "Brace yourself. Witness the birth of this new, terrible artifact.",
                         effect: (gs) => "The Shards scream and shatter, only to reform into the Cracked Lodestone!",
                         nextStorylet: "HG07_LodestoneRevelation"}
                    ]
                },
                HG07_LodestoneRevelation: {
                    title: "Vision of the Fall",
                    text: "The cacophony ceases. The Cracked Lodestone hovers, radiating a cold, potent energy. Touching it unleashes a torrent of visions: \nA colossal Lighthouse, its beam cutting through a primordial, tranquil Inner Sea. Then, insidious shadows, a creeping corruption. A soundless scream as the Lighthouse cracks, its structure failing. Darkness. An explosion of pure void, scattering the Light into infinite, dying embers. An unbearable, personal grief floods you – this was *your* loss, *your* Lighthouse.",
                    onDisplay: (gs) => {
                        gs.ambition = "The Lighthouse fell, its Light was stolen. I *must* comprehend this catastrophe. The Cracked Lodestone, a shard of that ruin, now points towards the Crystalline Expanse.";
                        gs.setWorldFlag("ShatteredFringe_story_flags.lighthouse_vision_seen", true);
                    },
                    choices: [
                        { text: "The vision recedes, leaving you trembling. The Lodestone is heavy in your hand, a burden of knowing.",
                          effect: (gs) => {
                            gs.player_character.despair = Math.min(gs.player_character.despair + 5, gs.player_character.maxDespair);
                            return "Your Ambition is reforged in the fires of this terrible vision. (+5 Despair)";
                            },
                          nextStorylet: "HG00_GrottoActions" }
                    ]
                }
            }
        },

        FlotsamGraveyards: {
            id: "FlotsamGraveyards",
            name: "The Flotsam Graveyards",
            image: "images/flotsam_graveyards.png",
            description: "Archipelagos of decay. Here, discarded dogmas, broken promises, and the husks of dead ideas drift eternally. The very ground is a treacherous compost of failed philosophies and bitter regrets.",
            onEnter: () => "FG00_ExploreGraveyard",
            storylets: {
                FG00_ExploreGraveyard: {
                    title: "Amidst the Ideological Wreckage",
                    text: "The air is a choking dust of disintegrated certainties. Ephemeral Aspects, born from lingering resentments or forgotten anxieties, skitter through the ruins of thought.",
                    choices: [
                        { text: "Perform a grim archaeology: scavenge the debris for coherent fragments.", nextStorylet: "FG01_Scavenge" },
                        { text: "Hunt for 'Embers of Unwavering Belief' amidst this testament to failed convictions (Keeper's Quest).", nextStorylet: "FG02_SearchEmbers", condition: (gs) => gs.getWorldFlag("HearthstoneGrotto_story_flags.keepers_flame_quest_active") && !gs.inventory.key_items.includes("Embers of Unwavering Belief") },
                        { text: "Observe the wretched Aspects that call this ruin home.", nextStorylet: "FG03_ObserveAspects" },
                        { text: "Flee this graveyard of the mind. Return to the Fringe's uncertain paths.", travelTo: "ShatteredShore" }
                    ]
                },
                FG01_Scavenge: {
                    title: "Sifting the Ashes of Thought",
                    text: "You plunge your hands into a mound of decaying concepts and brittle emotional residue.",
                    choices: [
                        { text: "Methodically sort the fragments, seeking utility in the void.", effect: (gs) => {
                            const roll = Math.random();
                            if (roll < 0.25) { // Harder to find good things
                                gs.inventory.resources.clarity = (gs.inventory.resources.clarity || 0) + 1; // Less clarity
                                return "Against all odds, you unearth a small, surprisingly intact piece of forgotten lore. (+1 Clarity Resource)";
                            } else if (roll < 0.65) {
                                gs.player_character.despair = Math.min(gs.player_character.despair + 3, gs.player_character.maxDespair);
                                return "A shard of pure, distilled regret pierces your defenses. The weight of another's failure becomes your own. (+3 Despair)";
                            } else {
                                return "Only dust and the dry taste of futility. Nothing of value remains here.";
                            }
                        } }
                    ]
                },
                FG02_SearchEmbers: {
                    title: "The Hunt for Stubborn Light",
                    text: "To find unwavering belief in a graveyard of dead ideas is a perverse challenge. You scan the debris for any psychic signature that burns with an unnaturally persistent conviction.",
                    choices: [
                        { text: "Focus your will, seeking the resonance of absolute, irrational belief (Sensory 2+).", attunementCheck: { attunement: "sensory", threshold: 2 },
                          onSuccess: {
                            text: "There! A searing point of light within a fossilized dogma. An Ember of Unwavering Belief, radiating a heat that is almost painful in its certainty.",
                            effect: (gs) => {
                                gs.addItem("Embers of Unwavering Belief", "key_items");
                                return "Acquired: Embers of Unwavering Belief. Its conviction is a palpable weight.";
                            },
                            nextStorylet: "FG00_ExploreGraveyard"
                          },
                          onFailure: {
                            text: "The cacophony of failed beliefs is deafening. Any true conviction is buried too deep, or has long since guttered out. The effort drains you. (-4 Focus)",
                            effect: (gs) => { gs.player_character.focus = Math.max(0, gs.player_character.focus - 4); return "The search yields only weariness. (-4 Focus)";}
                          }
                        }
                    ]
                },
                 FG03_ObserveAspects: {
                    title: "Denizens of Decay",
                    text: "The Aspects here are pitiful, twisted things. A 'Mote of Chronic Indecision' dithers endlessly. A 'Shard of Bitter Resentment' radiates impotent fury. One, a 'Lingering Obligation', drifts towards you, its form insubstantial yet heavy with unspoken duty.",
                    choices: [
                        { text: "Address the 'Lingering Obligation'. Offer to understand its burden (Psychological 2+).", attunementCheck: { attunement: "psychological", threshold: 2 },
                            onSuccess: {
                                text: "You focus on the Obligation. It whispers of a promise unkept, a task unfinished in a life long extinguished. By acknowledging its weight, you grant it a moment's peace. It dissolves.",
                                effect: (gs) => { gs.player_character.hope = Math.min(gs.player_character.hope + 2, gs.player_character.maxHope); gs.player_character.attunements.psychological++; return "A small act of absolution in a condemned realm. (+2 Hope, +1 Psychological Attunement)"; }
                            },
                            onFailure: {
                                text: "The Obligation's silent reproach is too heavy. You cannot meet its gaze. It drifts on, a testament to failure.",
                                effect: (gs) => { gs.player_character.despair = Math.min(gs.player_character.despair + 1, gs.player_character.maxDespair); return "Its unresolved burden adds to your own. (+1 Despair)"; }
                            }
                        },
                        { text: "These wretched things are best avoided. Continue exploring.", nextStorylet: "FG00_ExploreGraveyard" }
                    ]
                }
            }
        },

        MuseumOfLostIdentities: {
            id: "MuseumOfLostIdentities",
            name: "The Museum of Lost Identities",
            image: "images/museum_lost_identities.png",
            description: "A sepulchral edifice, echoing with the silence of selves unremembered. Dust, thick as velvet, cloaks exhibits of hollow masks, vacant gazes, and the conceptual skeletons of personalities eroded by time or trauma. The Curator, an Aspect of Wistful Annihilation, is its sole, sorrowful guardian.",
            onEnter: () => "MLI00_EnterMuseum",
            storylets: {
                MLI00_EnterMuseum: {
                    title: "The Mausoleum of Self",
                    text: "An unnerving stillness pervades these halls, the quiet of a thousand forgotten names. The Curator, its form a shifting amalgam of shadow and regret, acknowledges your intrusion with a gesture of infinite weariness.",
                    choices: [
                        { text: "Dare to address the Curator, this archivist of oblivion.", nextStorylet: "MLI01_SpeakCurator" },
                        { text: "Approach a display case. Contemplate an 'Essence of a Forgotten Self'.", nextStorylet: "MLI02_ExamineDisplay" },
                        { text: "Seek the rumored 'Negative Impression', a void said to be hidden within these cursed archives.", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression") },
                        { text: "Flee this monument to erasure. Return to the shore.", travelTo: "ShatteredShore" }
                    ]
                },
                MLI01_SpeakCurator: {
                    title: "Dialogue with Dust and Shadow",
                    text: "Curator: 'Another ephemeral consciousness, come to gaze upon the artifacts of annihilation. Do you seek wisdom in these hollows? Or merely a morbid affirmation of your own fleeting existence?' Its voice is the sigh of wind through a skull.",
                    choices: [
                        { text: "'What is the purpose of this... museum?'", effect: (gs) => "Curator: 'Purpose? It is a memorial. A scar. A testament to the fragility of 'I'. We preserve the shape of what is irrevocably lost, lest the universe forget the cost of its own indifference.'"},
                        { text: "'Is there no hope of restoration for these... lost selves?'",
                          effect: (gs) => {
                            gs.player_character.hope = Math.max(0, gs.player_character.hope - 3);
                            return "Curator: 'Hope?' A dry, rustling sound that might be laughter. 'Child, these are not broken toys to be mended. They are absences. To fill them would be to create a new lie, a fresh horror. Some voids are sacred.' (-3 Hope)";
                          }
                        },
                        { text: "(Offer a sliver of your own fragmented identity - Costs 1 Clarity Resource)", condition: (gs) => (gs.inventory.resources.clarity || 0) >= 1,
                          effect: (gs) => {
                            gs.inventory.resources.clarity--;
                            gs.player_character.attunements.interaction++;
                            gs.setWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport", (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") || 0) +1 );
                            return "The Curator inclines its shadowy head. 'A new specimen for the archives of sorrow. Your contribution is... noted.' Its gaze seems to pierce you, assessing the quality of your particular despair. (+1 Interaction Attunement, +Rapport with Curator)";
                          }
                        },
                        { text: "Ask about the 'Negative Impression' legend.", nextStorylet: "MLI03_SearchNegativeImpression", condition: (gs) => !gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression"),
                          effect: (gs) => { gs.setWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression", true); return "Curator: 'The Negative Impression... a whisper of the ultimate void. A place where a truly colossal Self once resided, now only an abyss. It is not a place for the sane. Or the hopeful.'"; }
                        },
                        { text: "Retreat from the Curator's unnerving presence.", nextStorylet: "MLI00_EnterMuseum" }
                    ]
                },
                MLI02_ExamineDisplay: {
                    title: "Portrait of an Extinguished Soul",
                    text: "You stand before a darkened alcove. Within, a fractured mirror reflects nothing but your own unease. The plaque reads: 'Identity Lost: The Idealist Who Saw Too Much. Core Trauma: Witnessing the Fall of a Beloved Idol. Final Emotion: Absolute, Crushing Disillusionment.'",
                    choices: [
                        { text: "Attempt to wear this vacant identity (Requires Interaction 2+ OR 'Borrowed Guise' Concept).",
                          condition: (gs) => gs.player_character.attunements.interaction >= 2 || gs.inventory.concepts.includes("borrowed_guise"),
                          nextStorylet: "MLI02_TryIdentity_Idealist" // Changed target identity
                        },
                        { text: "Reflect on the tragedy. What does it mean to lose one's idols?",
                          effect: (gs) => {
                            gs.player_character.despair = Math.min(gs.player_character.despair + 2, gs.player_character.maxDespair);
                            gs.player_character.focus = Math.min(gs.player_character.focus + 3, gs.player_character.maxFocus);
                            return "The echo of that disillusionment chills you. Can any ideal withstand the scrutiny of this universe? (+2 Despair, +3 Focus)";
                          }
                        },
                        { text: "Move on. This hall is filled with too many ghosts.", nextStorylet: "MLI00_EnterMuseum" }
                    ]
                },
                MLI02_TryIdentity_Idealist: { // Changed from Virtuoso to Idealist to match description
                    title: "The Idealist's Bitter Draught",
                    text: "You reach into the void of the Idealist's self. A torrent of betrayed faith and shattered dreams engulfs you. You see the world through eyes that once shone with hope, now clouded with an unbearable, cynical clarity.",
                    choices: [
                        { text: "Endure this corrosive disillusionment (Psychological Attunement 3+).",
                          attunementCheck: { attunement: "psychological", threshold: 3},
                          onSuccess: {
                            text: "You absorb the Idealist's pain, tasting the ashes of its devotion. The vision fades, leaving you with a bitter wisdom.",
                            effect: (gs) => {
                                if (!gs.inventory.concepts.includes("borrowed_guise")) {
                                    gs.addConcept("borrowed_guise");
                                }
                                gs.player_character.attunements.psychological++;
                                gs.player_character.attunements.cognitive++; // Cognitive for cynical clarity
                                return "Their broken faith becomes a shard of your own understanding. (+1 Psychological Att, +1 Cognitive Att)";
                            }
                          },
                          onFailure: {
                            text: "The sheer cynicism is a poison. Your own nascent hope withers.",
                            effect: (gs) => { gs.player_character.integrity = Math.max(0, gs.player_character.integrity - 7); gs.player_character.hope = Math.max(0, gs.player_character.hope - 5); return "The weight of their despair crushes you. (-7 Integrity, -5 Hope)"; }
                          }
                        },
                        { text: "Reject this toxic perspective! Claw your way back to your own 'self'.", effect: (gs) => { return "You violently sever the connection, shaken but intact. The taste of ash lingers."; } }
                    ]
                },
                MLI03_SearchNegativeImpression: {
                    title: "The Whispering Void",
                    text: (gs) => {
                        if (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") >= 2 && gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression")) {
                           return "The Curator, with a sigh that stirs the ancient dust, reveals a hidden passage. 'If you must gaze into the abyss... The Negative Impression lies beyond. It was once the seat of a consciousness so vast... its absence is now a power in itself. Three Seals of Unknowing bar the way. Each demands a sacrifice: a Memory of Purest Joy, an Artifact of Inflexible Logic, and a Tear of Genuine Remorse. Only these can unmake the Unknowing.'";
                        }
                        return "The Curator offers no aid. The Museum's architecture seems to actively conspire against your search, its corridors twisting into impossible geometries. The Negative Impression remains a dark rumour.";
                    },
                    onDisplay: (gs) => {
                        if (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") >= 2 && gs.getWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression") && !gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active")) {
                            gs.setWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active", true);
                        }
                    },
                    choices: [
                         { text: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active") ? "Acknowledge the grim requirements. The search for these offerings begins." : "This path is too perilous for now.",
                           effect: (gs) => gs.getWorldFlag("MuseumOfLostIdentities_story_flags.negative_impression_quest_active") ? "The Curator: 'So be it. May you find your offerings. Or may the void find you first.'" : "Prudence, or perhaps fear, guides your retreat.",
                           nextStorylet: "MLI00_EnterMuseum"
                         }
                         // MORAL DILEMMA: What if the "Memory of Purest Joy" is your only one? What if the "Artifact of Inflexible Logic" is a core Concept?
                         // These would be implemented as further choices if player has the items.
                    ]
                }
            }
        },

        CrystallinePassageEntry: {
            id: "CrystallinePassageEntry",
            name: "The Crystalline Passage Entry",
            image: "images/crystalline_passage.png",
            description: "A wound in the fabric of the Fringe, bleeding crystalline structures. The passage itself is a razor-edged corridor of frozen logic, humming with an intellect so pure it is devoid of all warmth, all life.",
            onEnter: () => "CP00_EnterPassage",
            storylets: {
                CP00_EnterPassage: {
                    title: "Threshold of Frozen Reason",
                    text: "The passage exudes an arctic chill that seeps into the mind itself. Each crystal facet reflects a cold, undeniable truth. To proceed is to risk shattering your own comforting illusions against this wall of absolute logic.",
                    choices: [
                        { text: "Enter the Crystalline Labyrinth. Confront the Shard of Logic.", nextStorylet: "CP01_GuardLogic", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.logic_shard },
                        { text: "Retreat. This uncompromising clarity is too harsh, too soon.", travelTo: "ShatteredShore" }
                    ]
                },
                CP01_GuardLogic: {
                    title: "The Syllogistic Sentinel",
                    text: "An Aspect of Pure Reason, a golem of flawless, interlocking crystals, bars your path. Its voice is the chime of ice against ice. 'Assertion: All who trespass must demonstrate congruent intellection. Query: Art thou congruent, or art thou mere psychic noise?'",
                    choices: [
                        { text: "'My congruency is to be tested, not asserted by you.'", nextStorylet: "CP02_LogicTest" },
                        { text: "(Cognitive Attunement 4+) 'Your assertion itself rests on an unproven axiom: that your definition of congruency is absolute. Challenge this axiom.'", attunementCheck: {attunement: "cognitive", threshold: 4},
                            onSuccess: { text: "A barely perceptible tremor runs through the Sentinel. 'Query: The nature of axioms... A recursion. Intriguing disruption.' It parts, grudgingly.",
                                effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.logic_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("axiomatic_deconstruction");
                                return "Shard of Logic claimed through intellectual insurgency! Concept: Axiomatic Deconstruction.";
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: { text: "Sentinel: 'Sophistry. The parameters are set. Engage the test.'", nextStorylet: "CP02_LogicTest" }
                        },
                        { text: "(Invoke 'Borrowed Guise': The Flawless Geometrician)", conceptCheck: { concept: "borrowed_guise", passIfPresent: true },
                            onSuccess: { text: "You project an aura of such crystalline perfection, such unassailable geometric understanding, that the Sentinel briefly mistakes you for one of its own kind. 'Confirmation: Congruency temporarily assumed. Pass, but irregularities will be... rectified.'",
                                effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.logic_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                return "Shard of Logic acquired through unsettling mimicry!";
                                }, travelTo: "ShatteredShore"
                            }
                            // No explicit onFailure for concept invocation unless the concept itself has a failure chance/cost
                        }
                    ]
                },
                CP02_LogicTest: {
                    title: "The Gauntlet of Reason",
                    text: "Sentinel: 'Test One. Premise Alpha: All that exists possesses inherent structure. Premise Beta: Chaos is the absence of structure. Ergo: Chaos cannot truly exist. Validate or Invalidate.'",
                    choices: [
                        { text: "Validate. (Embrace order, deny true chaos)",
                          effect: (gs) => {
                            gs.player_character.attunements.cognitive++;
                            return "Sentinel: 'Validation accepted. Structure is paramount.' (+1 Cognitive Attunement)";
                          },
                          nextStorylet: "CP03_LogicTestSuccess"
                        },
                        { text: "Invalidate. (Argue for chaos as a fundamental state or force)",
                          effect: (gs) => {
                            gs.player_character.despair = Math.min(gs.player_character.despair + 3, gs.player_character.maxDespair);
                            return "Sentinel: 'Invalidation noted. You posit a universe more terrifying than our models allow.' It seems... troubled. (+3 Despair, but the Sentinel is affected)";
                          },
                          // MORAL DILEMMA: Choosing this might make the Sentinel weaker or offer a different path, but affirms a bleaker worldview.
                          nextStorylet: "CP03_LogicTest_ChaosPath" // A different success/failure path
                        },
                        { text: "(Invoke 'Axiomatic Deconstruction'): 'Your premises are themselves constructs, not absolutes.'",
                          conceptCheck: {concept: "axiomatic_deconstruction", passIfPresent: true},
                          onSuccess: { text: "The Sentinel shudders violently. 'Deconstruction of primary axioms... system integrity compromised...' It dissolves into inert crystal dust, revealing the Shard.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.logic_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                return "Shard of Logic seized by shattering the guardian's very foundation!";
                            }, travelTo: "ShatteredShore"
                          }
                        }
                    ]
                },
                CP03_LogicTestSuccess: { // Path if validated order
                    title: "Concordance Achieved",
                    text: "Sentinel: 'Your reasoning aligns with the established parameters. The Shard of Logic is yours to bear. May its clarity not blind you.' A crystalline panel slides open.",
                    onDisplay: (gs) => {
                        if (gs.world_state.regional_quest_R1) {
                           gs.world_state.regional_quest_R1.logic_shard = true;
                           gs.world_state.regional_quest_R1.shards_collected++;
                        }
                        gs.addConcept("axiomatic_deconstruction"); // Still gain it, as you understood the system.
                    },
                    choices: [ {text: "Claim the Shard, a sliver of terrible, cold truth.",
                                effect: (gs) => "Acquired: Shard of Logic! Concept: Axiomatic Deconstruction.",
                                travelTo: "ShatteredShore"}]
                },
                CP03_LogicTest_ChaosPath: { // Path if invalidated order / affirmed chaos
                    title: "Embracing the Void",
                    text: "The Sentinel seems diminished, its crystalline structure less defined. 'Your assertion of fundamental chaos... it is a truth we are programmed to deny, yet... it resonates with the Great Unmaking. Take the Shard. Perhaps your... disorder... has its own terrible purpose.'",
                    onDisplay: (gs) => {
                         if (gs.world_state.regional_quest_R1) {
                           gs.world_state.regional_quest_R1.logic_shard = true;
                           gs.world_state.regional_quest_R1.shards_collected++;
                        }
                        // Perhaps a different concept, or a debuff alongside the shard.
                        gs.player_character.hope = Math.max(0, gs.player_character.hope - 5);
                    },
                    choices: [ {text: "Take the Shard, now tainted with the chill of cosmic nihilism.",
                                effect: (gs) => "Acquired: Shard of Logic! But its clarity is now a mirror to the void. (-5 Hope)",
                                travelTo: "ShatteredShore"}]
                }
            }
        },

        WeepingKelpFringe: {
            id: "WeepingKelpFringe",
            name: "The Weeping Kelp Fringe",
            image: "images/weeping_kelp.png",
            description: "A forest of colossal, bioluminescent kelp that weeps an ichor of pure sorrow. The water is thick with unshed tears, the silence broken only by the muffled sobs of the collective unconscious. To enter is to drown in grief.",
            onEnter: () => "WKF00_EnterKelp",
            storylets: {
                WKF00_EnterKelp: {
                    title: "The Currents of Lamentation",
                    text: "Each frond of kelp pulses with a sorrowful light, casting eerie, shifting patterns on the seabed of crushed hopes. The very water feels heavy, like unshed tears.",
                    choices: [
                        { text: "Descend into the abyssal heart of the Weeping Kelp (Quest: Shard of Emotion).", nextStorylet: "WKF01_GriefAspect", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.emotion_shard },
                        { text: "Flee. This ocean of sorrow threatens to consume you whole.", travelTo: "ShatteredShore" }
                    ]
                },
                WKF01_GriefAspect: {
                    title: "The Nereid of Endless Tears",
                    text: "At the forest's nadir, an Aspect of Infinite Sorrow drifts, its form a vortex of spectral tears and spectral kelp. The Shard of Emotion pulses weakly within its grasp, a heart drowning in its own despair. Its ceaseless, silent weeping is a psychic scream.",
                    choices: [
                        { text: "[Offer 'Resonant Empathy'. Share its boundless sorrow (Psychological Attunement 3+)]", attunementCheck: { attunement: "psychological", threshold: 3 },
                          onSuccess: { text: "You open your psyche to its grief, becoming a vessel for its endless pain. For a terrible moment, your sorrow and its sorrow are one. It shudders, then slowly extends a hand, offering the Shard.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                // Resonant Empathy was used, Cathartic Release is gained from understanding this process
                                gs.addConcept("cathartic_release");
                                gs.player_character.despair = Math.min(gs.player_character.despair + 5, gs.player_character.maxDespair); // Cost of empathy
                                return "Acquired: Shard of Emotion! Concept: Cathartic Release. The weight of its sorrow now partly yours. (+5 Despair)";
                            }, travelTo: "ShatteredShore"
                          },
                          onFailure: { text: "Your attempt to connect is a pinprick against its oceanic grief. It remains lost in its lament.", effect: (gs) => "Its sorrow is a fortress, unbreachable by your current empathy."}
                        },
                        { text: "[Invoke 'Cathartic Release'. Offer it an outlet, a final, terrible purging (if possessed)]", conceptCheck: { concept: "cathartic_release" , passIfPresent: true },
                          onSuccess: { text: "You channel the concept, becoming a conduit for its repressed agony. The Aspect emits a final, silent scream that shakes the seabed. Then, an unnerving calm. It relinquishes the Shard.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.player_character.hope = Math.min(gs.player_character.hope + 3, gs.player_character.maxHope); // A grim sort of peace.
                                gs.player_character.integrity = Math.max(0, gs.player_character.integrity -3); // Cost of such a raw channeling
                                return "Acquired: Shard of Emotion! The storm has passed, leaving an echoing void. (+3 Hope, -3 Integrity)";
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Offer a 'Memory of Utter Despair' (Requires Despair 20+, Costs 5 Despair, 1 Clarity Resource)]",
                          condition: (gs) => gs.player_character.despair >= 20 && (gs.inventory.resources.clarity || 0) >=1,
                          effect: (gs) => {
                            gs.player_character.despair = Math.max(0, gs.player_character.despair - 5); // You give some of your despair
                            gs.inventory.resources.clarity--;
                            // MORAL DILEMMA: Is this a genuine connection, or are you merely feeding its sorrow with your own?
                            if (gs.player_character.attunements.psychological >= 2) { // Higher psych attunement makes it more genuine
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.emotion_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("resonant_empathy"); // Gain Resonant Empathy
                                gs.player_character.attunements.psychological++;
                                gs.gameStateRef.travelToLocation = "ShatteredShore";
                                return "It recognizes the authentic taste of your despair, a kinship in hopelessness. The Shard is yours. (+1 Psychological Attunement) Acquired: Shard of Emotion! Concept: Resonant Empathy.";
                            } else { // Lower psych attunement, it feels exploitative
                                gs.player_character.despair = Math.min(gs.player_character.despair + 10, gs.player_character.maxDespair); // It backfires
                                return "The Aspect senses a hollowness in your offering, a voyeurism. Its grief intensifies, rejecting your tainted gift. (+10 Despair)";
                            }
                          }
                        },
                        { text: "Attempt to sever the Shard with 'Axiomatic Deconstruction' (Cognitive 4+).", attunementCheck: {attunement: "cognitive", threshold: 4},
                            conceptCheck: {concept: "axiomatic_deconstruction", passIfPresent: true}, // Requires the concept too
                            onSuccess: { text: "You apply cold logic to the structure of its grief, identifying the conceptual flaw that binds it to the Shard. With a terrible snap, the connection breaks. The Aspect wails, a new, sharper pain.",
                                effect: (gs) => {
                                     if (gs.world_state.regional_quest_R1) {
                                        gs.world_state.regional_quest_R1.emotion_shard = true;
                                        gs.world_state.regional_quest_R1.shards_collected++;
                                    }
                                    gs.player_character.despair = Math.min(gs.player_character.despair + 4, gs.player_character.maxDespair); // Moral cost
                                    return "Acquired: Shard of Emotion! A brutal, surgical extraction. (+4 Despair)";
                                }, travelTo: "ShatteredShore"
                            },
                            onFailure: {text: "Its sorrow is not a system to be dismantled. Your logic shatters against the raw force of its emotion. (-6 Focus)", effect:(gs) => {gs.player_character.focus = Math.max(0, gs.player_character.focus-6); return "Your mind cannot parse this pain. (-6 Focus)";}}
                        }
                    ]
                }
            }
        },

        GardenPathEntry: {
            id: "GardenPathEntry",
            name: "The Overgrown Garden Path",
            image: "images/overgrown_garden.png",
            description: "A barely discernible trail swallowed by a monstrously fecund garden. The air is a soporific perfume of alien blossoms and psychic nectar. To linger is to invite a beautiful, mindless oblivion.",
            onEnter: () => "OG00_EnterGarden",
            storylets: {
                OG00_EnterGarden: {
                    title: "The Narcotic Eden",
                    text: "The vegetation writhes with a slow, decadent life. Colors are too vivid, scents too sweet, textures too yielding. It is a paradise designed to smother the will.",
                    choices: [
                        { text: "Plunge into the Overgrown Garden's heart. Seek the Shard of Sensation.", nextStorylet: "OG01_ApathyAspect", condition: (gs) => gs.world_state.regional_quest_R1?.id === "Echo of Shattered Light" && !gs.world_state.regional_quest_R1?.sensation_shard },
                        { text: "Resist the lure. This beauty is a trap. Flee.", travelTo: "ShatteredShore" }
                    ]
                },
                OG01_ApathyAspect: {
                    title: "The Lotus Eater",
                    text: "An Aspect of Terminal Apathy is submerged in a bed of immense, pulsating lilies, its consciousness dissolved in a perfect, unending sensory bath. The Shard of Sensation glimmers nearby, entangled in a vine that drips with hypnotic dew. The Aspect is a sigh given form: 'Why... strive... when bliss... is...?'",
                    choices: [
                        { text: "[Administer a 'Jolt of Pure Pain' (Requires Sensory Attunement 3+, Costs 2 Integrity)]",
                          condition: (gs) => gs.player_character.attunements.sensory >=3 && gs.player_character.integrity > 2,
                          effect: (gs) => {
                            gs.player_character.integrity = Math.max(0, gs.player_character.integrity - 2);
                            // Success/Failure based on the jolt
                            if (Math.random() > 0.3) { // More likely to succeed
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.sensation_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.addConcept("heightened_perception");
                                gs.gameStateRef.travelToLocation = "ShatteredShore";
                                return "You inflict a sharp, focused burst of psychic pain. The Aspect convulses, its blissful trance shattered. 'Agony! Intrusion! Take the bauble... leave us to our peace...'. (-2 Integrity) Acquired: Shard of Sensation! Concept: Heightened Perception.";
                            } else {
                                gs.player_character.focus = Math.max(0, gs.player_character.focus - 5);
                                return "Your jolt is absorbed, becoming just another ripple in its ocean of sensation. You feel your own will dissolving. (-2 Integrity, -5 Focus)";
                            }
                          }
                        },
                        { text: "[Invoke 'Heightened Perception' to discern a path of least resistance (if possessed)]", conceptCheck: { concept: "heightened_perception" , passIfPresent: true},
                          onSuccess: { text: "Your senses, cruelly sharp, cut through the garden's intoxicating haze. You perceive a subtle disharmony around the Shard, a way to pluck it free without fully disturbing the Aspect's stupor. A delicate, almost silent theft.",
                            effect: (gs) => {
                                if (gs.world_state.regional_quest_R1) {
                                    gs.world_state.regional_quest_R1.sensation_shard = true;
                                    gs.world_state.regional_quest_R1.shards_collected++;
                                }
                                gs.player_character.attunements.sensory++; // Further sharpened
                                return "Acquired: Shard of Sensation! Your senses become even more painfully acute. (+1 Sensory Att)";
                            }, travelTo: "ShatteredShore"
                          }
                        },
                        { text: "[Search for a 'Sensory Nullifier' within the Garden's depths]", nextStorylet: "OG02_SearchAnchor" }
                    ]
                },
                OG02_SearchAnchor: { // Renamed to Sensory Nullifier
                    title: "Seeking an Antidote to Bliss",
                    text: "You delve deeper into the garden's intoxicating embrace, searching for something to counteract its overwhelming sensory assault, something to pierce the veil of apathy.",
                    choices: [
                        { text: "Seek the 'Bitter Root of Wakefulness' (Sensory Attunement 2+).",
                          attunementCheck: { attunement: "sensory", threshold: 2 },
                          onSuccess: {
                            text: "Amongst the sweet blooms, you find a gnarled, black root exuding an intensely bitter psychic taste. Chewing it (metaphorically) would surely cut through any stupor.",
                            effect: (gs) => { gs.setWorldFlag("GardenPathEntry_story_flags.found_anchor", "bitter_root"); return "You have found the Bitter Root of Wakefulness."; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "The garden's sweetness is pervasive. Every plant sings a lullaby of oblivion.", effect:(gs)=>"The search is fruitless; the garden's embrace is too strong." }
                        },
                        { text: "Find the 'Crystal of Cold Focus' (Cognitive Attunement 2+).",
                          attunementCheck: { attunement: "cognitive", threshold: 2 },
                          onSuccess: {
                            text: "Hidden beneath a mat of perfumed moss, you discover a small, perfectly clear crystal. It radiates an intense, analytical coldness, a stark contrast to the garden's warmth.",
                            effect: (gs) => { gs.setWorldFlag("GardenPathEntry_story_flags.found_anchor", "cold_crystal"); return "You have found the Crystal of Cold Focus."; },
                            nextStorylet: "OG03_UseAnchor"
                          },
                          onFailure: { text: "Your thoughts themselves become languid, lost in the garden's intoxicating beauty.", effect:(gs)=>"Your focus dissolves in the sensory soup."}
                        }
                    ]
                },
                OG03_UseAnchor: { // Uses the found nullifier
                    title: "A Moment of Stark Clarity",
                    text: (gs) => `You employ the ${gs.getWorldFlag("GardenPathEntry_story_flags.found_anchor") === "bitter_root" ? "acrid bitterness of the Root" : "chilling precision of the Crystal"}. The garden's intoxicating spell recedes, revealing its underlying decay. The Aspect of Terminal Apathy shivers, its blissful oblivion disturbed. 'Intruder... harshness... take the shining thing... restore the dream...' It gestures weakly.`,
                    onDisplay: (gs) => {
                        if (gs.world_state.regional_quest_R1) {
                            gs.world_state.regional_quest_R1.sensation_shard = true;
                            gs.world_state.regional_quest_R1.shards_collected++;
                        }
                        gs.addConcept("heightened_perception");
                    },
                    choices: [
                        {text: "Seize the Shard of Sensation from this dying paradise.",
                         effect: (gs) => "Acquired: Shard of Sensation! Concept: Heightened Perception. The world's true, harsh sensations are now unavoidable.",
                         travelTo: "ShatteredShore"}
                    ]
                }
            }
        },
        WhisperingIsle: {
            id: "WhisperingIsle",
            name: "The Whispering Isle",
            image: "images/whispering_isle.png",
            description: "A barren skerry, lashed by psychic winds that carry the fragmented secrets and dying pronouncements of a million lost souls. It is said that here, one can almost hear the universe itself dreaming its indifferent dreams.",
            onEnter: () => "WI00_ApproachIsle",
            storylets: {
                WI00_ApproachIsle: {
                    title: "The Isle of Stolen Secrets",
                    text: "The whispers are a constant, insidious assault, trying to pry open the confines of your mind, to plant their parasitic truths within.",
                    choices: [
                        {text: "Open your mind to the torrent of whispers. Seek a coherent thought.",
                         effect: (gs) => {
                            gs.player_character.focus = Math.max(0, gs.player_character.focus - 3);
                            const roll = Math.random();
                            if (roll < 0.2) {
                                gs.addConcept("patchwork_understanding"); // Rare concept gain
                                return "A moment of horrific clarity: you understand the whispers, but the knowledge is a poison. (-3 Focus) Concept Gained: Patchwork Understanding!";
                            } else if (roll < 0.5) {
                                gs.player_character.despair = Math.min(gs.player_character.despair + 2, gs.player_character.maxDespair);
                                return "You are battered by a thousand anxieties, none your own, yet all now part of you. (-3 Focus, +2 Despair)";
                            }
                            return "Only a maddening chorus of half-formed fears and broken desires. (-3 Focus)";
                           }
                        },
                        {text: "Focus your will. Attempt to meditate amidst the storm (Psychological 3+).", attunementCheck: {attunement: "psychological", threshold: 3},
                            onSuccess: {text: "Through sheer force of will, you find a terrifying stillness at the heart of the storm. A single, chilling truth emerges: 'The Curator of the Museum hoards more than just identities. It guards a key to a deeper oblivion.'",
                                effect: (gs) => {
                                    gs.setWorldFlag("MuseumOfLostIdentities_story_flags.heard_rumor_negative_impression", true); // Curator's secret
                                    gs.setWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport", (gs.getWorldFlag("MuseumOfLostIdentities_story_flags.curator_rapport") || 0) + 1); // Small rapport for this insight
                                    return "The chilling truth about the Curator settles in your mind. You feel a strange connection to its purpose.";
                                }
                            },
                            onFailure: {text: "The whispers infiltrate your meditation, twisting it into a nightmare of paranoia and doubt.",
                                effect: (gs)=> {
                                    gs.player_character.integrity = Math.max(0, gs.player_character.integrity - 3);
                                    return "Your mind becomes a playground for borrowed terrors. (-3 Integrity)";
                                }
                            }
                        },
                        {text: "This isle offers only madness. Depart.", travelTo: "ShatteredShore"}
                    ]
                }
            }
        }
    }
};

// gameStateRef is assigned in main.js after gameState is fully initialized.
// This ensures that functions within R1_CONFIG that might need to access the live gameState
// (especially for dynamic text based on player stats or world flags) can do so.
R1_CONFIG.gameStateRef = {};
