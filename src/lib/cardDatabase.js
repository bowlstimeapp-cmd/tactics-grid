// 100 unique cards - no duplicate stat combos, each with unique passive
const CARDS = [
  // ── KNIGHTS (13) ──
  { card_id:"C001",name:"Squire",faction:"Knights",north:3,east:2,south:4,west:2,passive_id:"played_first_boost",flavour_text:"Every legend begins with a single step." },
  { card_id:"C002",name:"Shield Bearer",faction:"Knights",north:5,east:3,south:6,west:2,passive_id:"defend_boost",flavour_text:"His shield has never been breached." },
  { card_id:"C003",name:"Lance Captain",faction:"Knights",north:6,east:5,south:3,west:4,passive_id:"attack_boost",flavour_text:"The first to charge, the last to fall." },
  { card_id:"C004",name:"Royal Guard",faction:"Knights",north:4,east:4,south:5,west:5,passive_id:"corner_boost",flavour_text:"Sworn to protect the crown at any cost." },
  { card_id:"C005",name:"Paladin",faction:"Knights",north:7,east:5,south:6,west:4,passive_id:"ally_aura",flavour_text:"His light inspires all who fight beside him." },
  { card_id:"C006",name:"War Marshal",faction:"Knights",north:6,east:6,south:5,west:5,passive_id:"commander",flavour_text:"A single command can turn the tide." },
  { card_id:"C007",name:"Bannerman",faction:"Knights",north:3,east:3,south:3,west:4,passive_id:"knight_honor",flavour_text:"Where the banner flies, knights rally." },
  { card_id:"C008",name:"Jousting Champion",faction:"Knights",north:7,east:4,south:2,west:4,passive_id:"duelist",flavour_text:"Undefeated in single combat." },
  { card_id:"C009",name:"Fortress Knight",faction:"Knights",north:5,east:5,south:5,west:3,passive_id:"anchor",flavour_text:"Immovable as the mountain itself." },
  { card_id:"C010",name:"Crusader",faction:"Knights",north:6,east:4,south:5,west:6,passive_id:"flip_immunity_low",flavour_text:"Faith makes him unbreakable." },
  { card_id:"C011",name:"Knight Errant",faction:"Knights",north:4,east:6,south:3,west:5,passive_id:"edge_boost",flavour_text:"He wanders, but never without purpose." },
  { card_id:"C012",name:"Grand Master",faction:"Knights",north:8,east:7,south:6,west:7,passive_id:"played_last_boost",flavour_text:"The final move is always his." },
  { card_id:"C013",name:"Sentinel Knight",faction:"Knights",north:5,east:3,south:5,west:4,passive_id:"sentinel",flavour_text:"Watching the north and south gates." },

  // ── DRAGONS (13) ──
  { card_id:"C014",name:"Whelpling",faction:"Dragons",north:3,east:3,south:2,west:3,passive_id:"dragon_synergy",flavour_text:"Small, but its fire burns bright." },
  { card_id:"C015",name:"Fire Drake",faction:"Dragons",north:5,east:6,south:4,west:3,passive_id:"attack_boost",flavour_text:"Its breath melts steel." },
  { card_id:"C016",name:"Frost Wyrm",faction:"Dragons",north:6,east:4,south:6,west:5,passive_id:"frost",flavour_text:"Where it flies, winter follows." },
  { card_id:"C017",name:"Storm Dragon",faction:"Dragons",north:7,east:6,south:5,west:6,passive_id:"centre_boost",flavour_text:"Lightning dances between its scales." },
  { card_id:"C018",name:"Elder Dragon",faction:"Dragons",north:8,east:8,south:7,west:6,passive_id:"endgame_boost",flavour_text:"Ancient beyond memory." },
  { card_id:"C019",name:"Hatchling",faction:"Dragons",north:2,east:3,south:3,west:2,passive_id:"ally_count_boost",flavour_text:"Its siblings are never far behind." },
  { card_id:"C020",name:"Magma Serpent",faction:"Dragons",north:6,east:5,south:5,west:4,passive_id:"flip_reward",flavour_text:"Each victory makes it hungrier." },
  { card_id:"C021",name:"Sky Leviathan",faction:"Dragons",north:7,east:7,south:4,west:5,passive_id:"corner_boost",flavour_text:"It roosts only at the world's edge." },
  { card_id:"C022",name:"Void Dragon",faction:"Dragons",north:5,east:7,south:6,west:7,passive_id:"enemy_debuff",flavour_text:"Its presence drains all will to fight." },
  { card_id:"C023",name:"Twin-Head Drake",faction:"Dragons",north:6,east:6,south:6,west:3,passive_id:"flanker",flavour_text:"One head watches east, the other west." },
  { card_id:"C024",name:"Phoenix Dragon",faction:"Dragons",north:5,east:5,south:4,west:4,passive_id:"phoenix",flavour_text:"From ashes, it rises stronger." },
  { card_id:"C025",name:"Dragon Sovereign",faction:"Dragons",north:9,east:7,south:8,west:7,passive_id:"domination",flavour_text:"Kneel or burn." },
  { card_id:"C026",name:"Ember Wyvern",faction:"Dragons",north:4,east:5,south:3,west:5,passive_id:"empty_throne",flavour_text:"Thrives in open spaces." },

  // ── BEASTS (12) ──
  { card_id:"C027",name:"Forest Wolf",faction:"Beasts",north:3,east:4,south:3,west:3,passive_id:"beast_synergy",flavour_text:"The pack hunts as one." },
  { card_id:"C028",name:"Great Bear",faction:"Beasts",north:6,east:3,south:7,west:4,passive_id:"defend_boost",flavour_text:"Do not wake the bear." },
  { card_id:"C029",name:"Thunderhawk",faction:"Beasts",north:4,east:7,south:3,west:6,passive_id:"played_first_boost",flavour_text:"First to strike from the sky." },
  { card_id:"C030",name:"Ancient Tortoise",faction:"Beasts",north:3,east:3,south:3,west:7,passive_id:"titan",flavour_text:"It has outlived empires." },
  { card_id:"C031",name:"Dire Boar",faction:"Beasts",north:5,east:5,south:4,west:3,passive_id:"surrounded_fury",flavour_text:"Cornered, it fights twice as hard." },
  { card_id:"C032",name:"Jungle Panther",faction:"Beasts",north:4,east:6,south:5,west:5,passive_id:"edge_boost",flavour_text:"Silent death from the treeline." },
  { card_id:"C033",name:"Mammoth",faction:"Beasts",north:7,east:4,south:7,west:6,passive_id:"flip_immunity_low",flavour_text:"Nothing moves a mammoth." },
  { card_id:"C034",name:"Serpent King",faction:"Beasts",north:5,east:8,south:5,west:6,passive_id:"tactician",flavour_text:"It studies every creature it meets." },
  { card_id:"C035",name:"Rabbit Scout",faction:"Beasts",north:2,east:2,south:1,west:3,passive_id:"ally_aura",flavour_text:"Small, but inspires courage." },
  { card_id:"C036",name:"Ironback Rhino",faction:"Beasts",north:6,east:5,south:6,west:6,passive_id:"anchor",flavour_text:"Charge and hold the line." },
  { card_id:"C037",name:"Alpha Wolf",faction:"Beasts",north:5,east:6,south:4,west:6,passive_id:"commander",flavour_text:"The pack follows its howl." },
  { card_id:"C038",name:"World Turtle",faction:"Beasts",north:8,east:6,south:8,west:7,passive_id:"longevity",flavour_text:"Time is its greatest ally." },

  // ── MAGES (13) ──
  { card_id:"C039",name:"Apprentice",faction:"Mages",north:2,east:3,south:2,west:4,passive_id:"mage_synergy",flavour_text:"Every master was once a student." },
  { card_id:"C040",name:"Pyromancer",faction:"Mages",north:5,east:6,south:3,west:5,passive_id:"attack_boost",flavour_text:"Fire answers his call." },
  { card_id:"C041",name:"Chronomancer",faction:"Mages",north:4,east:4,south:4,west:6,passive_id:"longevity",flavour_text:"She bends time like water." },
  { card_id:"C042",name:"Illusionist",faction:"Mages",north:3,east:5,south:4,west:5,passive_id:"mirror",flavour_text:"Is it real? Does it matter?" },
  { card_id:"C043",name:"Archmage",faction:"Mages",north:7,east:7,south:7,west:5,passive_id:"centre_boost",flavour_text:"Power flows from the nexus." },
  { card_id:"C044",name:"Storm Caller",faction:"Mages",north:6,east:5,south:4,west:7,passive_id:"enemy_debuff",flavour_text:"Thunder obeys her voice." },
  { card_id:"C045",name:"Ward Mage",faction:"Mages",north:4,east:3,south:6,west:5,passive_id:"debuff_shield",flavour_text:"No curse may pass his wards." },
  { card_id:"C046",name:"Enchantress",faction:"Mages",north:5,east:4,south:5,west:7,passive_id:"ally_aura",flavour_text:"Her spells weave strength into allies." },
  { card_id:"C047",name:"Void Scholar",faction:"Mages",north:6,east:7,south:5,west:3,passive_id:"empty_throne",flavour_text:"The void reveals what others cannot see." },
  { card_id:"C048",name:"Battlemage",faction:"Mages",north:7,east:5,south:5,west:5,passive_id:"duelist",flavour_text:"Spell and sword in harmony." },
  { card_id:"C049",name:"Sage of Ages",faction:"Mages",north:8,east:6,south:7,west:8,passive_id:"harmony",flavour_text:"All magic is connected." },
  { card_id:"C050",name:"Frost Mage",faction:"Mages",north:5,east:4,south:4,west:5,passive_id:"frost",flavour_text:"Her touch freezes the soul." },
  { card_id:"C051",name:"Hex Weaver",faction:"Mages",north:4,east:5,south:3,west:6,passive_id:"plague",flavour_text:"A whisper that weakens armies." },

  // ── MACHINES (12) ──
  { card_id:"C052",name:"Clockwork Scout",faction:"Machines",north:3,east:4,south:2,west:4,passive_id:"played_first_boost",flavour_text:"Always the first deployed." },
  { card_id:"C053",name:"Siege Engine",faction:"Machines",north:7,east:3,south:3,west:7,passive_id:"attack_boost",flavour_text:"Walls crumble before it." },
  { card_id:"C054",name:"Iron Golem",faction:"Machines",north:5,east:5,south:6,west:4,passive_id:"defend_boost",flavour_text:"Forged to endure." },
  { card_id:"C055",name:"Steam Tank",faction:"Machines",north:6,east:6,south:4,west:6,passive_id:"flip_immunity_low",flavour_text:"Armoured beyond measure." },
  { card_id:"C056",name:"Repair Drone",faction:"Machines",north:2,east:4,south:3,west:3,passive_id:"machine_shield",flavour_text:"It keeps the others running." },
  { card_id:"C057",name:"Automaton",faction:"Machines",north:4,east:4,south:4,west:4,passive_id:"ally_count_boost",flavour_text:"Strength in numbers." },
  { card_id:"C058",name:"War Mech",faction:"Machines",north:7,east:6,south:7,west:5,passive_id:"berserker",flavour_text:"Damage only makes it angrier." },
  { card_id:"C059",name:"Cannon Tower",faction:"Machines",north:8,east:5,south:2,west:5,passive_id:"sentinel",flavour_text:"It never misses." },
  { card_id:"C060",name:"Hover Drone",faction:"Machines",north:3,east:6,south:3,west:6,passive_id:"flanker",flavour_text:"Fast and agile." },
  { card_id:"C061",name:"Titan Mech",faction:"Machines",north:8,east:7,south:7,west:7,passive_id:"colossus",flavour_text:"The ground trembles." },
  { card_id:"C062",name:"Arc Generator",faction:"Machines",north:4,east:5,south:5,west:4,passive_id:"ally_aura",flavour_text:"Power to all nearby units." },
  { card_id:"C063",name:"Omega Unit",faction:"Machines",north:9,east:6,south:6,west:8,passive_id:"final_card_boost",flavour_text:"Deployed only as a last resort." },

  // ── SPIRITS (13) ──
  { card_id:"C064",name:"Wisp",faction:"Spirits",north:1,east:2,south:2,west:3,passive_id:"spirit_walk",flavour_text:"A flickering light in the dark." },
  { card_id:"C065",name:"Forest Spirit",faction:"Spirits",north:4,east:3,south:5,west:3,passive_id:"beast_synergy",flavour_text:"Guardian of ancient groves." },
  { card_id:"C066",name:"Shade",faction:"Spirits",north:3,east:5,south:3,west:4,passive_id:"underdog",flavour_text:"Stronger when outnumbered." },
  { card_id:"C067",name:"Wraith",faction:"Spirits",north:5,east:6,south:5,west:3,passive_id:"flip_revenge",flavour_text:"Death only angers it." },
  { card_id:"C068",name:"Moon Spirit",faction:"Spirits",north:6,east:4,south:4,west:6,passive_id:"centre_boost",flavour_text:"Power flows from the centre." },
  { card_id:"C069",name:"Elemental",faction:"Spirits",north:5,east:5,south:5,west:5,passive_id:"tactician",flavour_text:"It adapts to every foe." },
  { card_id:"C070",name:"Guardian Angel",faction:"Spirits",north:4,east:6,south:6,west:4,passive_id:"debuff_shield",flavour_text:"Nothing harmful passes." },
  { card_id:"C071",name:"Will-o-Wisp",faction:"Spirits",north:2,east:4,south:2,west:2,passive_id:"empty_throne",flavour_text:"Feeds on emptiness." },
  { card_id:"C072",name:"Phoenix Spirit",faction:"Spirits",north:6,east:5,south:7,west:4,passive_id:"phoenix",flavour_text:"Eternal flame, eternal return." },
  { card_id:"C073",name:"Ancestor",faction:"Spirits",north:7,east:5,south:6,west:6,passive_id:"commander",flavour_text:"Guides the living from beyond." },
  { card_id:"C074",name:"Banshee",faction:"Spirits",north:5,east:7,south:4,west:6,passive_id:"enemy_debuff",flavour_text:"Its wail saps the will to fight." },
  { card_id:"C075",name:"Celestial",faction:"Spirits",north:8,east:8,south:6,west:6,passive_id:"harmony",flavour_text:"All spirits are one in the Celestial." },
  { card_id:"C076",name:"Phantom",faction:"Spirits",north:4,east:3,south:4,west:5,passive_id:"mirror",flavour_text:"It becomes what it touches." },

  // ── ASSASSINS (12) ──
  { card_id:"C077",name:"Pickpocket",faction:"Assassins",north:2,east:4,south:2,west:5,passive_id:"flip_reward",flavour_text:"Quick hands, quicker blade." },
  { card_id:"C078",name:"Shadow Dancer",faction:"Assassins",north:4,east:6,south:2,west:6,passive_id:"edge_boost",flavour_text:"She strikes from the periphery." },
  { card_id:"C079",name:"Blade Master",faction:"Assassins",north:6,east:7,south:4,west:5,passive_id:"duelist",flavour_text:"One opponent at a time." },
  { card_id:"C080",name:"Poisoner",faction:"Assassins",north:3,east:5,south:5,west:5,passive_id:"plague",flavour_text:"A single drop is enough." },
  { card_id:"C081",name:"Night Stalker",faction:"Assassins",north:5,east:4,south:6,west:5,passive_id:"endgame_boost",flavour_text:"Patience is the deadliest weapon." },
  { card_id:"C082",name:"Infiltrator",faction:"Assassins",north:4,east:5,south:4,west:4,passive_id:"corner_boost",flavour_text:"Already behind enemy lines." },
  { card_id:"C083",name:"Venom Fang",faction:"Assassins",north:5,east:6,south:6,west:3,passive_id:"frost",flavour_text:"Its venom slows and weakens." },
  { card_id:"C084",name:"Phantom Blade",faction:"Assassins",north:7,east:8,south:3,west:5,passive_id:"assassin_strike",flavour_text:"One strike, one kill." },
  { card_id:"C085",name:"Silent Death",faction:"Assassins",north:6,east:5,south:5,west:7,passive_id:"attack_boost",flavour_text:"You never hear it coming." },
  { card_id:"C086",name:"Grandmaster Assassin",faction:"Assassins",north:8,east:7,south:5,west:8,passive_id:"played_last_boost",flavour_text:"The final move. Always." },
  { card_id:"C087",name:"Smoke Bomb",faction:"Assassins",north:3,east:3,south:4,west:3,passive_id:"debuff_shield",flavour_text:"Concealment is protection." },
  { card_id:"C088",name:"Twin Daggers",faction:"Assassins",north:5,east:7,south:3,west:7,passive_id:"flanker",flavour_text:"Attacks from both sides at once." },

  // ── UNDEAD (12) ──
  { card_id:"C089",name:"Skeleton",faction:"Undead",north:2,east:2,south:3,west:2,passive_id:"undead_rising",flavour_text:"They never stop coming." },
  { card_id:"C090",name:"Zombie Brute",faction:"Undead",north:5,east:3,south:6,west:3,passive_id:"berserker",flavour_text:"Pain is forgotten." },
  { card_id:"C091",name:"Lich",faction:"Undead",north:7,east:6,south:4,west:7,passive_id:"enemy_debuff",flavour_text:"Its gaze withers the living." },
  { card_id:"C092",name:"Death Knight",faction:"Undead",north:6,east:7,south:6,west:5,passive_id:"flip_reward",flavour_text:"Each soul taken adds to its power." },
  { card_id:"C093",name:"Bone Golem",faction:"Undead",north:7,east:4,south:8,west:4,passive_id:"titan",flavour_text:"Built from a thousand fallen." },
  { card_id:"C094",name:"Ghoul Pack",faction:"Undead",north:4,east:4,south:3,west:4,passive_id:"ally_count_boost",flavour_text:"Feeding frenzy." },
  { card_id:"C095",name:"Vampire Lord",faction:"Undead",north:6,east:6,south:7,west:6,passive_id:"flip_revenge",flavour_text:"Defeat only makes him thirstier." },
  { card_id:"C096",name:"Necromancer",faction:"Undead",north:5,east:5,south:3,west:6,passive_id:"commander",flavour_text:"He commands the endless horde." },
  { card_id:"C097",name:"Revenant",faction:"Undead",north:6,east:4,south:7,west:5,passive_id:"phoenix",flavour_text:"Cannot stay dead." },
  { card_id:"C098",name:"Corpse Titan",faction:"Undead",north:8,east:6,south:9,west:5,passive_id:"endgame_boost",flavour_text:"It rises when the battle is almost over." },
  { card_id:"C099",name:"Banshee Queen",faction:"Undead",north:7,east:7,south:5,west:7,passive_id:"domination",flavour_text:"Her scream commands obedience." },
  { card_id:"C100",name:"Plague Bearer",faction:"Undead",north:4,east:5,south:4,west:3,passive_id:"plague",flavour_text:"It carries the end of all things." },
];

// Auto-assign rarity based on avg stats + ability strength
function assignRarity(card) {
  const avg = (card.north + card.east + card.south + card.west) / 4;
  const total = card.north + card.east + card.south + card.west;
  if (total >= 28 || avg >= 7.5) return "Legendary";
  if (total >= 22 || avg >= 6) return "Epic";
  if (total >= 17 || avg >= 4.75) return "Rare";
  if (total >= 12 || avg >= 3.5) return "Uncommon";
  return "Common";
}

// Add passive metadata from PASSIVES registry
import { PASSIVES } from './gameData';
import { CARD_ARTWORK } from './cardArtwork';

// Remove passives from normal (Common/Uncommon) cards and cards with enemy-debuff abilities
const _DEBUFF_PASSIVES = ['enemy_debuff', 'frost', 'plague'];
CARDS.forEach(c => {
  const total = c.north + c.east + c.south + c.west;
  const avg = total / 4;
  const isNormal = total < 17 && avg < 4.75; // Common or Uncommon rarity
  if (isNormal || _DEBUFF_PASSIVES.includes(c.passive_id)) {
    c.passive_id = 'none';
  }
});

export const ALL_CARDS = CARDS.map(c => {
  const passive = PASSIVES[c.passive_id];
  return {
    ...c,
    rarity: assignRarity(c),
    passive_name: passive ? passive.name : '',
    passive_description: passive ? passive.description : '',
    passive_icon: passive ? passive.icon : '',
    card_type: c.faction,
    artwork_url: CARD_ARTWORK[c.card_id] || "",
  };
});

export function getCardById(id) {
  return ALL_CARDS.find(c => c.card_id === id);
}

export function getCardsByRarity(rarity) {
  return ALL_CARDS.filter(c => c.rarity === rarity);
}

export function getCardsByFaction(faction) {
  return ALL_CARDS.filter(c => c.faction === faction);
}

export function applyCardOverrides(overrides) {
  if (!overrides) return;
  for (const card of ALL_CARDS) {
    const ov = overrides[card.card_id];
    if (ov) {
      if (ov.north !== undefined) card.north = ov.north;
      if (ov.east !== undefined) card.east = ov.east;
      if (ov.south !== undefined) card.south = ov.south;
      if (ov.west !== undefined) card.west = ov.west;
    }
  }
}