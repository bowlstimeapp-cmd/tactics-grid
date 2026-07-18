// Franchised Expansion: Triple Triad
// A crossover card set inspired by the heroes and villains of a legendary
// card-duelling saga. Mapped onto Gridfall's existing factions so they work
// with the current game engine, passives, and board layouts.
//
// Each card carries an `expansion_id` so the admin can toggle the whole
// expansion on/off from booster packs and the collection view.

export const FF8_EXPANSION_ID = 'ff8';

export const FF8_CARDS = [
  // ── Legendary ──
  { card_id:"F001", name:"Lionheart", faction:"Knights", north:7, east:6, south:7, west:6, rarity:"Legendary", passive_id:"played_last_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"Whatever comes, I'll be ready. The final move is always his." },
  { card_id:"F002", name:"Time Sorceress", faction:"Undead", north:7, east:7, south:7, west:7, rarity:"Legendary", passive_id:"domination", expansion_id:FF8_EXPANSION_ID, flavour_text:"She compresses existence into a single, frozen moment." },

  // ── Epic ──
  { card_id:"F003", name:"Gunblade Rival", faction:"Knights", north:6, east:7, south:5, west:6, rarity:"Epic", passive_id:"duelist", expansion_id:FF8_EXPANSION_ID, flavour_text:"A dream of romance that curdled into rivalry." },
  { card_id:"F004", name:"Angel Wing", faction:"Spirits", north:5, east:6, south:6, west:6, rarity:"Epic", passive_id:"phoenix", expansion_id:FF8_EXPANSION_ID, flavour_text:"From the abyss, wings of light carry her back." },
  { card_id:"F005", name:"Frost Sorceress", faction:"Mages", north:6, east:6, south:5, west:6, rarity:"Epic", passive_id:"commander", expansion_id:FF8_EXPANSION_ID, flavour_text:"Her will commands every soldier on the field." },
  { card_id:"F006", name:"Sorceress Tyrant", faction:"Undead", north:6, east:5, south:7, west:5, rarity:"Epic", passive_id:"blood_pact", expansion_id:FF8_EXPANSION_ID, flavour_text:"Power stolen is power owed — and the debt always comes due." },

  // ── Rare ──
  { card_id:"F007", name:"Blue Instructor", faction:"Mages", north:5, east:5, south:4, west:5, rarity:"Rare", passive_id:"tactician", expansion_id:FF8_EXPANSION_ID, flavour_text:"Every creature she defeats teaches her a new lesson." },
  { card_id:"F008", name:"Duelist Fists", faction:"Assassins", north:6, east:6, south:4, west:4, rarity:"Rare", passive_id:"attack_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"Four seconds. That's all he needs." },
  { card_id:"F009", name:"Sharpshooter", faction:"Assassins", north:4, east:7, south:3, west:5, rarity:"Rare", passive_id:"hunter", expansion_id:FF8_EXPANSION_ID, flavour_text:"One breath in, one breath out, one shot." },
  { card_id:"F010", name:"Lucky Star", faction:"Mages", north:4, east:4, south:5, west:5, rarity:"Rare", passive_id:"harmony", expansion_id:FF8_EXPANSION_ID, flavour_text:"She rolls the dice of fate — and somehow always wins." },
  { card_id:"F011", name:"Wandering Hero", faction:"Knights", north:5, east:5, south:5, west:4, rarity:"Rare", passive_id:"momentum", expansion_id:FF8_EXPANSION_ID, flavour_text:"His luck rubs off on everyone beside him." },
  { card_id:"F012", name:"Time Gift", faction:"Spirits", north:4, east:5, south:4, west:6, rarity:"Rare", passive_id:"longevity", expansion_id:FF8_EXPANSION_ID, flavour_text:"She sends memories across the years like letters." },

  // ── Uncommon ──
  { card_id:"F013", name:"Shadow Blades", faction:"Assassins", north:4, east:6, south:3, west:4, rarity:"Uncommon", passive_id:"flanker", expansion_id:FF8_EXPANSION_ID, flavour_text:"Two blades, two shadows, one silent promise." },
  { card_id:"F014", name:"Harpoon Guardian", faction:"Knights", north:5, east:3, south:6, west:4, rarity:"Uncommon", passive_id:"anchor", expansion_id:FF8_EXPANSION_ID, flavour_text:"Few words. Fewer who can move him." },
  { card_id:"F015", name:"Storm Eye", faction:"Assassins", north:4, east:5, south:3, west:5, rarity:"Uncommon", passive_id:"edge_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"She speaks in single words. The wind does the rest." },
  { card_id:"F016", name:"Thunder Brute", faction:"Knights", north:5, east:4, south:5, west:3, rarity:"Uncommon", passive_id:"berserker", expansion_id:FF8_EXPANSION_ID, flavour_text:"Each scar he takes only sharpens the storm inside." },

  // ── Guardian Forces (summoned eidolons) ──
  { card_id:"F017", name:"Bahamut", faction:"Dragons", north:7, east:7, south:6, west:7, rarity:"Legendary", passive_id:"domination", expansion_id:FF8_EXPANSION_ID, flavour_text:"The king of dragons does not bow — he annihilates." },
  { card_id:"F018", name:"Eden", faction:"Spirits", north:7, east:7, south:7, west:6, rarity:"Legendary", passive_id:"played_last_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"Beyond the edge of memory, she unleashes the final breath of eternity." },
  { card_id:"F019", name:"Ifrit", faction:"Dragons", north:6, east:7, south:5, west:6, rarity:"Epic", passive_id:"berserker", expansion_id:FF8_EXPANSION_ID, flavour_text:"His fury burns hottest when the world tries to break him." },
  { card_id:"F020", name:"Shiva", faction:"Spirits", north:6, east:5, south:6, west:7, rarity:"Epic", passive_id:"defend_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"Crowned in frost, she turns the battlefield into her domain." },
  { card_id:"F021", name:"Quezacotl", faction:"Mages", north:5, east:7, south:6, west:6, rarity:"Epic", passive_id:"edge_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"The storm-serpent rides the thunder and never lands." },
  { card_id:"F022", name:"Diablos", faction:"Undead", north:7, east:5, south:7, west:5, rarity:"Epic", passive_id:"blood_pact", expansion_id:FF8_EXPANSION_ID, flavour_text:"Gravity bows to him — and so does everything caught in it." },
  { card_id:"F023", name:"Leviathan", faction:"Dragons", north:6, east:6, south:6, west:5, rarity:"Epic", passive_id:"momentum", expansion_id:FF8_EXPANSION_ID, flavour_text:"The tide does not strike once. It builds, and then it drowns." },
  { card_id:"F024", name:"Alexander", faction:"Machines", north:6, east:5, south:6, west:6, rarity:"Epic", passive_id:"anchor", expansion_id:FF8_EXPANSION_ID, flavour_text:"A fortress given wings and a will of sanctified iron." },
  { card_id:"F025", name:"Doomtrain", faction:"Undead", north:5, east:6, south:5, west:6, rarity:"Epic", passive_id:"hunter", expansion_id:FF8_EXPANSION_ID, flavour_text:"It arrives on poisoned rails, and no one walks away from the station." },
  { card_id:"F026", name:"Cerberus", faction:"Beasts", north:5, east:6, south:4, west:5, rarity:"Rare", passive_id:"attack_boost", expansion_id:FF8_EXPANSION_ID, flavour_text:"Three heads, one purpose: to guard the gate and howl down the dark." },
  { card_id:"F027", name:"Siren", faction:"Spirits", north:5, east:5, south:5, west:5, rarity:"Rare", passive_id:"harmony", expansion_id:FF8_EXPANSION_ID, flavour_text:"Her song mends what battle has torn asunder." },
  { card_id:"F028", name:"Brothers", faction:"Knights", north:6, east:4, south:6, west:4, rarity:"Rare", passive_id:"anchor", expansion_id:FF8_EXPANSION_ID, flavour_text:"Two souls, one unbreakable wall of living stone." },
];