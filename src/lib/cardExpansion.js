// 100 expansion cards (C101-C200) designed with balance report considerations:
// - Commons/Uncommons have no passive (stripped by engine for total < 17)
// - Rares+ use diverse passives, avoiding stripped debuffs (enemy_debuff/frost/plague)
// - commander/colossus/longevity/mirror used sparingly (max 1 each)
// - No card exceeds total 30 (balance report: Dragon Sovereign at 31 is too high)
// - New passives: lone_wolf, bloodlust, guardian, overwhelm, pincer, trapper

export const EXPANSION_CARDS = [
  // ── KNIGHTS (13) ──
  { card_id:"C101",name:"Page Boy",faction:"Knights",north:2,east:3,south:3,west:2,passive_id:"none",flavour_text:"He carries the shield until he can wield the sword." },
  { card_id:"C102",name:"Conscript",faction:"Knights",north:3,east:2,south:3,west:3,passive_id:"none",flavour_text:"Drafted at dawn, drilled by dusk." },
  { card_id:"C103",name:"Militia",faction:"Knights",north:2,east:2,south:3,west:2,passive_id:"none",flavour_text:"Farmhands with pitchforks, standing tall." },
  { card_id:"C104",name:"Foot Soldier",faction:"Knights",north:3,east:3,south:2,west:3,passive_id:"none",flavour_text:"The backbone of every army." },
  { card_id:"C105",name:"Man-at-Arms",faction:"Knights",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Trained, armoured, and ready." },
  { card_id:"C106",name:"Herald",faction:"Knights",north:3,east:4,south:3,west:3,passive_id:"none",flavour_text:"His trumpet calls the charge." },
  { card_id:"C107",name:"Templar Novice",faction:"Knights",north:4,east:4,south:4,west:3,passive_id:"none",flavour_text:"Sworn to the order, learning its ways." },
  { card_id:"C108",name:"Vanguard Knight",faction:"Knights",north:5,east:4,south:5,west:4,passive_id:"edge_boost",flavour_text:"First to the front, last to leave." },
  { card_id:"C109",name:"Dawnbringer",faction:"Knights",north:5,east:5,south:5,west:4,passive_id:"ally_aura",flavour_text:"Her presence lights the battlefield." },
  { card_id:"C110",name:"Banner Lord",faction:"Knights",north:4,east:5,south:5,west:5,passive_id:"overwhelm",flavour_text:"Where his banner flies, the line holds." },
  { card_id:"C111",name:"Doom Knight",faction:"Knights",north:6,east:6,south:6,west:5,passive_id:"flip_immunity_low",flavour_text:"His oath is unbreakable, his shield impenetrable." },
  { card_id:"C112",name:"Ironclad",faction:"Knights",north:6,east:7,south:6,west:5,passive_id:"anchor",flavour_text:"An immovable fortress of steel." },
  { card_id:"C113",name:"Aegis Prime",faction:"Knights",north:8,east:7,south:8,west:6,passive_id:"corner_boost",flavour_text:"The ultimate guardian of the realm." },

  // ── DRAGONS (12) ──
  { card_id:"C114",name:"Spark Drake",faction:"Dragons",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"Static crackles along its spine." },
  { card_id:"C115",name:"Young Wyrm",faction:"Dragons",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"Its scales have not yet hardened." },
  { card_id:"C116",name:"Cave Lizard",faction:"Dragons",north:2,east:2,south:2,west:3,passive_id:"none",flavour_text:"A distant cousin of the great wyrms." },
  { card_id:"C117",name:"Wind Serpent",faction:"Dragons",north:3,east:3,south:2,west:3,passive_id:"none",flavour_text:"It rides the thermals effortlessly." },
  { card_id:"C118",name:"Bronze Drake",faction:"Dragons",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Its scales gleam like polished metal." },
  { card_id:"C119",name:"Cliff Glider",faction:"Dragons",north:3,east:4,south:3,west:4,passive_id:"none",flavour_text:"It nests where no predator can reach." },
  { card_id:"C120",name:"Coral Snake",faction:"Dragons",north:3,east:3,south:4,west:3,passive_id:"none",flavour_text:"Beautiful, but deadly." },
  { card_id:"C121",name:"Inferno Drake",faction:"Dragons",north:6,east:5,south:4,west:4,passive_id:"attack_boost",flavour_text:"Its rage ignites the sky." },
  { card_id:"C122",name:"Bog Wyrm",faction:"Dragons",north:4,east:5,south:5,west:4,passive_id:"trapper",flavour_text:"It lurks where the ground is treacherous." },
  { card_id:"C123",name:"Thunder Wyrm",faction:"Dragons",north:6,east:6,south:5,west:5,passive_id:"endgame_boost",flavour_text:"The storm builds as the battle rages." },
  { card_id:"C124",name:"Abyssal Drake",faction:"Dragons",north:5,east:7,south:6,west:5,passive_id:"domination",flavour_text:"From the depths, it demands obedience." },
  { card_id:"C125",name:"Celestial Dragon",faction:"Dragons",north:8,east:8,south:7,west:6,passive_id:"centre_boost",flavour_text:"It ascends from the stars themselves." },

  // ── BEASTS (13) ──
  { card_id:"C126",name:"Field Mouse",faction:"Beasts",north:2,east:2,south:2,west:2,passive_id:"none",flavour_text:"Small but nimble, quick to flee." },
  { card_id:"C127",name:"Wild Dog",faction:"Beasts",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"It scavenges at the edges of battle." },
  { card_id:"C128",name:"Mountain Goat",faction:"Beasts",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"Sure-footed on the steepest cliffs." },
  { card_id:"C129",name:"River Otter",faction:"Beasts",north:3,east:2,south:2,west:3,passive_id:"none",flavour_text:"Playful, but surprisingly fierce." },
  { card_id:"C130",name:"Stag",faction:"Beasts",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Its antlers gleam in the moonlight." },
  { card_id:"C131",name:"Warthog",faction:"Beasts",north:3,east:4,south:4,west:3,passive_id:"none",flavour_text:"Charges first, asks questions never." },
  { card_id:"C132",name:"Lynx",faction:"Beasts",north:3,east:4,south:3,west:4,passive_id:"none",flavour_text:"Silent, patient, and lethal." },
  { card_id:"C133",name:"Dire Wolf",faction:"Beasts",north:5,east:4,south:4,west:4,passive_id:"beast_synergy",flavour_text:"The alpha of a feral pack." },
  { card_id:"C134",name:"Badger Lord",faction:"Beasts",north:4,east:5,south:5,west:4,passive_id:"surrounded_fury",flavour_text:"Never back a badger into a corner." },
  { card_id:"C135",name:"Cave Lion",faction:"Beasts",north:5,east:5,south:4,west:5,passive_id:"flip_reward",flavour_text:"Each kill makes it bolder." },
  { card_id:"C136",name:"Glyptodon",faction:"Beasts",north:5,east:5,south:7,west:5,passive_id:"titan",flavour_text:"A walking fortress of bone and scale." },
  { card_id:"C137",name:"Rampaging Bull",faction:"Beasts",north:6,east:5,south:7,west:5,passive_id:"berserker",flavour_text:"Once it starts, nothing stops it." },
  { card_id:"C138",name:"Primordial Beast",faction:"Beasts",north:8,east:7,south:8,west:6,passive_id:"longevity",flavour_text:"Older than civilization, patient as stone." },

  // ── MAGES (12) ──
  { card_id:"C139",name:"Novice",faction:"Mages",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"She has memorized the first page." },
  { card_id:"C140",name:"Herb Witch",faction:"Mages",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"Her potions heal and harm in equal measure." },
  { card_id:"C141",name:"Scroll Bearer",faction:"Mages",north:2,east:2,south:3,west:3,passive_id:"none",flavour_text:"He carries knowledge he cannot yet use." },
  { card_id:"C142",name:"Rune Scribe",faction:"Mages",north:3,east:3,south:2,west:3,passive_id:"none",flavour_text:"Every rune tells a story of power." },
  { card_id:"C143",name:"Hedge Mage",faction:"Mages",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Self-taught, surprisingly effective." },
  { card_id:"C144",name:"Diviner",faction:"Mages",north:3,east:4,south:3,west:4,passive_id:"none",flavour_text:"She sees what others cannot." },
  { card_id:"C145",name:"Alchemist",faction:"Mages",north:4,east:4,south:3,west:4,passive_id:"none",flavour_text:"Transmutation is its own reward." },
  { card_id:"C146",name:"Elementalist",faction:"Mages",north:5,east:5,south:4,west:5,passive_id:"mage_synergy",flavour_text:"All elements answer her call." },
  { card_id:"C147",name:"Warlock",faction:"Mages",north:4,east:5,south:5,west:5,passive_id:"tactician",flavour_text:"Every battle is a puzzle to solve." },
  { card_id:"C148",name:"Oracle",faction:"Mages",north:6,east:5,south:6,west:5,passive_id:"harmony",flavour_text:"She sees the connections between all things." },
  { card_id:"C149",name:"Voidwalker",faction:"Mages",north:5,east:7,south:5,west:6,passive_id:"empty_throne",flavour_text:"He walks where nothing exists." },
  { card_id:"C150",name:"Archon of Magic",faction:"Mages",north:8,east:7,south:7,west:7,passive_id:"mirror",flavour_text:"The reflection of all magic combined." },

  // ── MACHINES (13) ──
  { card_id:"C151",name:"Scrap Bot",faction:"Machines",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"Built from discarded parts, running on fumes." },
  { card_id:"C152",name:"Tinker Toy",faction:"Machines",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"A prototype that never quite worked." },
  { card_id:"C153",name:"Wind-up Soldier",faction:"Machines",north:2,east:2,south:3,west:3,passive_id:"none",flavour_text:"Turn the key and watch it march." },
  { card_id:"C154",name:"Clockwork Mouse",faction:"Machines",north:3,east:3,south:2,west:3,passive_id:"none",flavour_text:"Built to scout, not to fight." },
  { card_id:"C155",name:"Gear Knight",faction:"Machines",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Precision-engineered for battle." },
  { card_id:"C156",name:"Piston Walker",faction:"Machines",north:3,east:4,south:4,west:3,passive_id:"none",flavour_text:"Every step hisses with steam." },
  { card_id:"C157",name:"Brass Sentinel",faction:"Machines",north:4,east:4,south:3,west:4,passive_id:"none",flavour_text:"It watches, it waits, it strikes." },
  { card_id:"C158",name:"Shield Drone",faction:"Machines",north:4,east:5,south:5,west:4,passive_id:"machine_shield",flavour_text:"It projects a protective field over nearby units." },
  { card_id:"C159",name:"Swarm Bot",faction:"Machines",north:4,east:4,south:5,west:5,passive_id:"ally_count_boost",flavour_text:"Strength in proximity." },
  { card_id:"C160",name:"Watchtower",faction:"Machines",north:6,east:4,south:4,west:5,passive_id:"sentinel",flavour_text:"It sees all approaches, north and south." },
  { card_id:"C161",name:"Juggernaut",faction:"Machines",north:6,east:6,south:6,west:5,passive_id:"flip_revenge",flavour_text:"It converts damage into fuel." },
  { card_id:"C162",name:"Railgun Mech",faction:"Machines",north:7,east:6,south:5,west:6,passive_id:"flanker",flavour_text:"Devastating from the sides." },
  { card_id:"C163",name:"Apex Construct",faction:"Machines",north:8,east:7,south:8,west:6,passive_id:"colossus",flavour_text:"The pinnacle of mechanical evolution." },

  // ── SPIRITS (12) ──
  { card_id:"C164",name:"Mote",faction:"Spirits",north:2,east:2,south:2,west:3,passive_id:"none",flavour_text:"A speck of light in the void." },
  { card_id:"C165",name:"Tiny Spark",faction:"Spirits",north:3,east:2,south:2,west:2,passive_id:"none",flavour_text:"A fragment of a greater flame." },
  { card_id:"C166",name:"Dust Devil",faction:"Spirits",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"A swirl of restless energy." },
  { card_id:"C167",name:"Whisper",faction:"Spirits",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"A voice from beyond the veil." },
  { card_id:"C168",name:"Glow",faction:"Spirits",north:4,east:3,south:3,west:4,passive_id:"none",flavour_text:"It illuminates the darkest corners." },
  { card_id:"C169",name:"Echo",faction:"Spirits",north:3,east:4,south:4,west:3,passive_id:"none",flavour_text:"A sound that refuses to fade." },
  { card_id:"C170",name:"Mistling",faction:"Spirits",north:4,east:3,south:4,west:4,passive_id:"none",flavour_text:"Born of fog and twilight." },
  { card_id:"C171",name:"Spectral Hound",faction:"Spirits",north:5,east:4,south:5,west:4,passive_id:"spirit_walk",flavour_text:"It hunts through walls and wards." },
  { card_id:"C172",name:"Fog Wraith",faction:"Spirits",north:4,east:5,south:4,west:5,passive_id:"underdog",flavour_text:"Stronger when the odds are against it." },
  { card_id:"C173",name:"Revenant Spirit",faction:"Spirits",north:6,east:5,south:6,west:5,passive_id:"phoenix",flavour_text:"It returns from destruction, renewed." },
  { card_id:"C174",name:"Haunt",faction:"Spirits",north:5,east:7,south:5,west:6,passive_id:"lone_wolf",flavour_text:"It prowls the empty spaces, alone." },
  { card_id:"C175",name:"Eternal Warden",faction:"Spirits",north:8,east:7,south:7,west:7,passive_id:"commander",flavour_text:"An ancient guardian that inspires all who fight beside it." },

  // ── ASSASSINS (13) ──
  { card_id:"C176",name:"Urchin",faction:"Assassins",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"Small hands, quick fingers." },
  { card_id:"C177",name:"Cutpurse",faction:"Assassins",north:3,east:2,south:3,west:2,passive_id:"none",flavour_text:"A blade in the crowd." },
  { card_id:"C178",name:"Street Rat",faction:"Assassins",north:2,east:2,south:3,west:3,passive_id:"none",flavour_text:"Nobody notices him until it's too late." },
  { card_id:"C179",name:"Courier",faction:"Assassins",north:3,east:3,south:2,west:3,passive_id:"none",flavour_text:"He knows every back alley." },
  { card_id:"C180",name:"Thug",faction:"Assassins",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Brute force disguised as subtlety." },
  { card_id:"C181",name:"Burglar",faction:"Assassins",north:3,east:4,south:3,west:4,passive_id:"none",flavour_text:"In and out before the alarm sounds." },
  { card_id:"C182",name:"Knifethrower",faction:"Assassins",north:4,east:4,south:4,west:3,passive_id:"none",flavour_text:"Every blade finds its mark." },
  { card_id:"C183",name:"Duelist",faction:"Assassins",north:5,east:5,south:4,west:5,passive_id:"duelist",flavour_text:"One blade, one opponent, one outcome." },
  { card_id:"C184",name:"Backstabber",faction:"Assassins",north:5,east:6,south:5,west:4,passive_id:"assassin_strike",flavour_text:"The blade you never see coming." },
  { card_id:"C185",name:"Ambusher",faction:"Assassins",north:5,east:5,south:5,west:5,passive_id:"pincer",flavour_text:"It strikes from two sides at once." },
  { card_id:"C186",name:"Executioner",faction:"Assassins",north:6,east:7,south:5,west:6,passive_id:"attack_boost",flavour_text:"The sentence is death." },
  { card_id:"C187",name:"Crimson Killer",faction:"Assassins",north:6,east:7,south:6,west:5,passive_id:"bloodlust",flavour_text:"Every drop of blood fuels the frenzy." },
  { card_id:"C188",name:"Shadow King",faction:"Assassins",north:8,east:7,south:7,west:7,passive_id:"played_last_boost",flavour_text:"The final shadow falls on all." },

  // ── UNDEAD (12) ──
  { card_id:"C189",name:"Bone Shard",faction:"Undead",north:2,east:2,south:2,west:3,passive_id:"none",flavour_text:"A fragment of something greater." },
  { card_id:"C190",name:"Husk",faction:"Undead",north:3,east:2,south:2,west:2,passive_id:"none",flavour_text:"Empty, but still moving." },
  { card_id:"C191",name:"Rotting Corpse",faction:"Undead",north:2,east:3,south:2,west:3,passive_id:"none",flavour_text:"It shambles forward relentlessly." },
  { card_id:"C192",name:"Skeletal Archer",faction:"Undead",north:3,east:2,south:3,west:3,passive_id:"none",flavour_text:"Death has not dulled its aim." },
  { card_id:"C193",name:"Ghoul",faction:"Undead",north:4,east:3,south:4,west:3,passive_id:"none",flavour_text:"Hunger drives it forward." },
  { card_id:"C194",name:"Crypt Stalker",faction:"Undead",north:3,east:4,south:4,west:3,passive_id:"none",flavour_text:"It knows every tunnel beneath the earth." },
  { card_id:"C195",name:"Bone Colossus",faction:"Undead",north:4,east:4,south:4,west:4,passive_id:"none",flavour_text:"Assembled from a hundred warriors." },
  { card_id:"C196",name:"Death Acolyte",faction:"Undead",north:5,east:4,south:5,west:4,passive_id:"undead_rising",flavour_text:"He serves the endless horde." },
  { card_id:"C197",name:"Soul Reaver",faction:"Undead",north:4,east:5,south:5,west:5,passive_id:"flip_reward",flavour_text:"Each soul stolen adds to its power." },
  { card_id:"C198",name:"Wight King",faction:"Undead",north:6,east:6,south:5,west:6,passive_id:"endgame_boost",flavour_text:"It grows stronger as the dead pile high." },
  { card_id:"C199",name:"Tomb Guard",faction:"Undead",north:6,east:5,south:6,west:6,passive_id:"guardian",flavour_text:"It shields its allies from beyond the grave." },
  { card_id:"C200",name:"Lich God",faction:"Undead",north:8,east:7,south:7,west:7,passive_id:"final_card_boost",flavour_text:"The last card played is always his." },
];