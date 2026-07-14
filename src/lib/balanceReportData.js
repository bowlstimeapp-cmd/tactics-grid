import { ALL_CARDS } from './cardDatabase';
import { PASSIVES } from './gameData';

// ── Power Budget Targets ──
export const BUDGET_TARGETS = {
  Common: 90, Uncommon: 100, Rare: 120, Epic: 145, Legendary: 170,
};

export const BUDGET_EXPLANATION = `Power Budget = (Stat Total × 5.5) + (Passive Power Value × 1.5).
Passive Power Value estimates the average total stat contribution a passive provides per game,
accounting for activation rate, conditionality, and utility (immunity, global scope).
Targets: Normal=100, Rare=120, Epic=145, Legendary=170.`;

// ── Passive Power Values ──
// Estimated average total stat boost per game from each passive
const PASSIVE_POWER = {
  none: 0, played_first_boost: 2, played_last_boost: 4, final_card_boost: 6,
  attack_boost: 8, defend_boost: 6, corner_boost: 4, centre_boost: 3, edge_boost: 5,
  ally_aura: 6, ally_count_boost: 4, commander: 10, dragon_synergy: 3, mage_synergy: 3,
  beast_synergy: 1.5, flip_immunity_low: 12, titan: 14, flip_reward: 4, flip_revenge: 3,
  phoenix: 4, endgame_boost: 4, berserker: 5, empty_throne: 5, domination: 3, underdog: 4,
  surrounded_fury: 4, anchor: 6, mirror: 5, sentinel: 4, flanker: 4, duelist: 4,
  debuff_shield: 4, machine_shield: 3, spirit_walk: 3, undead_rising: 3, knight_honor: 3,
  assassin_strike: 7, tactician: 3, colossus: 7, harmony: 4, longevity: 6,
  lone_wolf: 5, bloodlust: 4, guardian: 3, overwhelm: 5, pincer: 5, trapper: 4,
};

// ── Passive Categories for Scoring ──
const CATEGORY = {
  none: 'none', played_first_boost: 'timing', played_last_boost: 'timing', final_card_boost: 'timing',
  attack_boost: 'combat', defend_boost: 'combat', assassin_strike: 'combat',
  corner_boost: 'positional', centre_boost: 'positional', edge_boost: 'positional',
  ally_aura: 'synergy', ally_count_boost: 'synergy', dragon_synergy: 'synergy',
  mage_synergy: 'synergy', beast_synergy: 'synergy', spirit_walk: 'synergy',
  undead_rising: 'synergy', knight_honor: 'synergy', harmony: 'synergy', tactician: 'conditional',
  commander: 'global', flip_immunity_low: 'immunity', titan: 'immunity',
  flip_reward: 'reactive', flip_revenge: 'reactive', phoenix: 'reactive', berserker: 'reactive',
  endgame_boost: 'conditional', empty_throne: 'conditional', domination: 'conditional',
  underdog: 'conditional', surrounded_fury: 'conditional', duelist: 'conditional',
  anchor: 'always', sentinel: 'always', flanker: 'always',
  mirror: 'special', debuff_shield: 'support', machine_shield: 'support',
  colossus: 'growing', longevity: 'growing',
  lone_wolf: 'conditional', bloodlust: 'combat', guardian: 'support',
  overwhelm: 'synergy', pincer: 'combat', trapper: 'conditional',
};

const CATEGORY_SCORES = {
  none:        { consistency: 7, flexibility: 8, synergy: 3, counterplay: 8, complexity: 2 },
  timing:      { consistency: 5, flexibility: 6, synergy: 4, counterplay: 7, complexity: 4 },
  combat:      { consistency: 5, flexibility: 6, synergy: 4, counterplay: 6, complexity: 4 },
  positional:  { consistency: 6, flexibility: 5, synergy: 5, counterplay: 7, complexity: 5 },
  synergy:     { consistency: 4, flexibility: 4, synergy: 7, counterplay: 5, complexity: 6 },
  global:      { consistency: 8, flexibility: 7, synergy: 10, counterplay: 4, complexity: 7 },
  immunity:    { consistency: 9, flexibility: 8, synergy: 4, counterplay: 3, complexity: 4 },
  reactive:    { consistency: 4, flexibility: 5, synergy: 6, counterplay: 5, complexity: 5 },
  conditional: { consistency: 5, flexibility: 5, synergy: 5, counterplay: 6, complexity: 6 },
  always:      { consistency: 9, flexibility: 8, synergy: 5, counterplay: 5, complexity: 3 },
  special:     { consistency: 3, flexibility: 5, synergy: 8, counterplay: 5, complexity: 9 },
  support:     { consistency: 3, flexibility: 7, synergy: 2, counterplay: 8, complexity: 3 },
  growing:     { consistency: 6, flexibility: 6, synergy: 5, counterplay: 4, complexity: 5 },
};

// ── Estimate rarity from power budget ──
function estimateRarity(pb) {
  if (pb > 155) return 'Legendary';
  if (pb > 125) return 'Epic';
  if (pb > 100) return 'Rare';
  if (pb > 80) return 'Uncommon';
  return 'Common';
}

// ── Analyze a single card ──
function analyzeCard(card) {
  const total = card.north + card.east + card.south + card.west;
  const passive = PASSIVES[card.passive_id];
  const passivePower = PASSIVE_POWER[card.passive_id] || 0;
  const cat = CATEGORY[card.passive_id] || 'none';
  const cs = CATEGORY_SCORES[cat] || CATEGORY_SCORES.none;

  // Power budget
  const powerBudget = Math.round(total * 5.5 + passivePower * 1.5);
  const target = BUDGET_TARGETS[card.rarity] || 100;
  const budgetRatio = Math.round((powerBudget / target) * 100);

  // Scores
  const rawPower = Math.min(10, Math.max(1, Math.round((total + passivePower) / 4)));
  let boardControl = Math.min(10, Math.max(1, Math.round(total / 3.2)));
  if (cat === 'immunity') boardControl = Math.min(10, boardControl + 2);
  if (cat === 'global') boardControl = Math.min(10, boardControl + 2);
  if (cat === 'synergy') boardControl = Math.min(10, boardControl + 1);
  if (cat === 'growing') boardControl = Math.min(10, boardControl + 1);

  const consistency = cs.consistency;
  const flexibility = cs.flexibility;
  const synergy = cs.synergy;
  const counterplay = cs.counterplay;
  const complexity = cs.complexity;

  const overall = Math.round(
    rawPower * 0.35 + boardControl * 0.20 + consistency * 0.15 +
    flexibility * 0.10 + synergy * 0.10 + counterplay * 0.05 + complexity * 0.05
  );

  const estRarity = estimateRarity(powerBudget);
  const rarityMismatch = estRarity !== card.rarity;

  // Notes for notable cards
  let notes = '';
  const strippedPassives = ['enemy_debuff', 'frost', 'plague'];
  if (strippedPassives.includes(card.passive_id)) {
    notes = 'Passive stripped (debuff ability removed). Now a vanilla stat stick — overcosted for rarity.';
  }
  if (card.passive_id === 'debuff_shield') {
    notes = 'Debuff Shield is useless — all enemy debuff passives were stripped. No debuffs exist to shield against.';
  }
  if (card.passive_id === 'anchor') {
    notes = 'Anchor\'s noAuras flag is NOT implemented in the engine. Card incorrectly benefits from auras.';
  }
  if (card.passive_id === 'assassin_strike') {
    notes = 'Description says "+3 attacking side only" but code gives +3 ALL sides (identical to attack_boost).';
  }
  if (card.passive_id === 'mirror') {
    notes = 'Can copy Commander\'s globalAura, creating a second global aura source. Very strong vs commander decks.';
  }
  if (rarityMismatch && !notes) {
    notes = `Estimated ${estRarity} but assigned ${card.rarity}. Power budget ${budgetRatio}% of target.`;
  }
  if (budgetRatio > 115 && !notes) {
    notes = `Over budget (${budgetRatio}% of target). Consider reducing a stat by 1.`;
  }
  if (budgetRatio < 75 && !notes) {
    notes = `Under budget (${budgetRatio}% of target). Consider increasing a stat by 1 or adding a minor passive.`;
  }

  return {
    card_id: card.card_id, name: card.name, faction: card.faction, rarity: card.rarity,
    north: card.north, east: card.east, south: card.south, west: card.west, total,
    passive_id: card.passive_id,
    passive_name: passive ? passive.name : '—',
    passive_desc: passive ? passive.description : 'No ability',
    scores: { rawPower, boardControl, consistency, flexibility, synergy, counterplay, complexity, overall },
    powerBudget, target, budgetRatio, estRarity, rarityMismatch, notes,
  };
}

export const CARD_ANALYSES = ALL_CARDS.map(analyzeCard);

// ── Combination Analysis ──
export const COMBINATIONS = [
  {
    name: 'Commander Stack',
    cards: ['War Marshal', 'Ancestor', 'Alpha Wolf', 'Necromancer'],
    size: 4,
    interaction: 'Each Commander gives +1 all sides to ALL friendly cards globally. With 4 on the board, each Commander receives +3 from the others (+12 total per card), plus every other friendly card also gets +4.',
    feedbackLoop: 'Positive — more Commanders = exponentially stronger board. No cap on aura stacking.',
    infinite: false,
    synergy: 9,
    rating: 'Potentially Overpowered',
    why: 'Global aura stacking has no cap. 4 Commanders generate +48 total stats across the board for a 4-card investment. This is the strongest combo in the game and trivializes stat-based confrontations.',
  },
  {
    name: 'Commander + Ally Aura',
    cards: ['War Marshal', 'Paladin'],
    size: 2,
    interaction: 'Commander gives +1 globally to all allies. Paladin gives +1 to adjacent allies. Cards adjacent to Paladin get +2 all sides total.',
    feedbackLoop: 'None — additive, no multiplication.',
    infinite: false,
    synergy: 7,
    rating: 'Strong',
    why: 'Reliable +2 to adjacent allies is strong but not game-breaking. Counterable by avoiding Paladin\'s adjacency.',
  },
  {
    name: 'Ally Aura Cluster',
    cards: ['Paladin', 'Enchantress', 'Arc Generator'],
    size: 3,
    interaction: 'Three ally_aura cards placed adjacent to each other. Each receives +2 from the other two (+8 total per card).',
    feedbackLoop: 'Positive — auras are mutual between allies.',
    infinite: false,
    synergy: 7,
    rating: 'Strong',
    why: 'Strong localized buff cluster, but requires all three to be adjacent and alive. Vulnerable to flipping breaking the chain.',
  },
  {
    name: 'Portal + Attack Boost',
    cards: ['Lance Captain / Pyromancer / Siege Engine / Silent Death'],
    size: 2,
    interaction: 'Portal tiles double cardMods. Attack Boost (+3 all sides) becomes +6 all sides when attacking from a portal tile (+24 total).',
    feedbackLoop: 'None.',
    infinite: false,
    synergy: 8,
    rating: 'Very Strong',
    why: 'Portal tiles are randomly assigned, but when an attack_boost card lands on one, it becomes a nuke. +24 total stats on attack is almost uncounterable.',
  },
  {
    name: 'Portal + Colossus',
    cards: ['Titan Mech'],
    size: 2,
    interaction: 'Colossus (+1 +1/turn) is doubled on a portal tile to +2 +2/turn. After 4 turns: +2+8 = +10 per side (+40 total).',
    feedbackLoop: 'Positive — grows over time with no cap.',
    infinite: false,
    synergy: 8,
    rating: 'Very Strong',
    why: 'A Titan Mech on a portal tile placed early becomes an insurmountable wall. Combined with its base 29 total, effective stats can exceed 69 by late game.',
  },
  {
    name: 'Immunity Wall',
    cards: ['Crusader', 'Mammoth', 'Bone Golem', 'Steam Tank'],
    size: 4,
    interaction: 'flip_immunity_low prevents flipping by cards with total <20. titan (Bone Golem) prevents flipping by cards with total <16. Together they form a near-unflippable defensive line.',
    feedbackLoop: 'None.',
    infinite: false,
    synergy: 5,
    rating: 'Strong',
    why: 'Only Epic/Legendary cards (total ≥22-28) can flip these. In a Normal/Rare heavy meta, this wall is nearly impregnable.',
  },
  {
    name: 'Flip Economy',
    cards: ['Death Knight', 'War Mech'],
    size: 2,
    interaction: 'Death Knight (flip_reward) gains +1 all sides per enemy flipped. War Mech (berserker) gains +1 all sides per friendly card lost. Whether you win or lose trades, one of them gets stronger.',
    feedbackLoop: 'Positive — losses fuel berserker, wins fuel flip_reward.',
    infinite: false,
    synergy: 7,
    rating: 'Strong',
    why: 'Covers both outcomes of combat. Hard to play against since both aggression and defense feed the engine.',
  },
  {
    name: 'Mirror + Enemy Commander',
    cards: ['Illusionist', '(enemy) War Marshal'],
    size: 2,
    interaction: 'Mirror copies the first adjacent enemy\'s passive. If adjacent to an enemy Commander, Illusionist becomes a second Commander for YOUR side, giving +1 globally to your allies.',
    feedbackLoop: 'None — one-time copy.',
    infinite: false,
    synergy: 8,
    rating: 'Very Strong',
    why: 'Turns the opponent\'s strongest synergy against them. The copied Commander benefits YOUR side, creating asymmetric advantage.',
  },
  {
    name: 'Harmony Multi-Faction',
    cards: ['Sage of Ages', 'Celestial', '+ diverse deck'],
    size: 3,
    interaction: 'Harmony gives +1 all sides per faction pair on the board. With 5 cards across 4 factions (2 pairs): +2 all sides (+8 total). Sage of Ages effective total: 29+8=37.',
    feedbackLoop: 'Mild positive — more pairs = more bonus.',
    infinite: false,
    synergy: 7,
    rating: 'Very Strong',
    why: 'Scales with deck diversity. In a multi-faction deck, both Sage and Celestial become significantly above budget. Requires specific deck building, which is a good design constraint.',
  },
  {
    name: 'Empty Throne Rush',
    cards: ['Ember Wyvern / Void Scholar'],
    size: 1,
    interaction: 'Empty Throne gives +1 all sides per empty space. When played as the first card (8 empty): +8 all sides (+32 total). Ember Wyvern effective: 17+32=49.',
    feedbackLoop: 'Negative — bonus decreases as board fills.',
    infinite: false,
    synergy: 5,
    rating: 'Strong',
    why: 'Massive early-game swing. If played first, Ember Wyvern has the highest effective total in the game. However, this only matters for the initial attack — the card becomes vulnerable afterward.',
  },
  {
    name: 'Growing Stack',
    cards: ['Titan Mech', 'World Turtle', 'Chronomancer'],
    size: 3,
    interaction: 'Colossus (+1+1/turn), Longevity (+1/turn). If all three are placed early, they snowball. After 4 turns: Titan Mech +5/side, World Turtle +4/side, Chronomancer +4/side.',
    feedbackLoop: 'Positive — grows every turn with no cap.',
    infinite: false,
    synergy: 7,
    rating: 'Very Strong',
    why: 'No cap on growth passives. If left unchecked, these cards become unflippable by mid-game. Strong counterplay exists (flip them early), but the snowball potential is concerning.',
  },
  {
    name: 'Domination Snowball',
    cards: ['Dragon Sovereign', 'Banshee Queen'],
    size: 2,
    interaction: 'Domination gives +1 all sides when you control more cards. Both are high-stat cards that can flip enemies, creating a self-reinforcing loop: flip enemies → control more → get stronger → flip more.',
    feedbackLoop: 'Positive — winning leads to more winning.',
    infinite: false,
    synergy: 6,
    rating: 'Strong',
    why: 'Classic win-more combo. Strong when ahead, useless when behind. Not broken, but can feel oppressive in winning positions.',
  },
  {
    name: 'Anchor + Commander (Bug)',
    cards: ['Fortress Knight / Ironback Rhino', 'War Marshal'],
    size: 2,
    interaction: 'Anchor gives +2 all sides but "cannot benefit from auras." However, noAuras is NOT implemented in the engine. Anchor cards incorrectly receive +1 from Commander, giving +3 total.',
    feedbackLoop: 'None (but unintended).',
    infinite: false,
    synergy: 7,
    rating: 'Very Strong',
    why: 'This is a BUG. Anchor cards are stronger than intended because they receive aura benefits they should be immune to. Fix the engine to check noAuras.',
  },
  {
    name: 'Debuff Shield (Dead)',
    cards: ['Ward Mage', 'Guardian Angel'],
    size: 2,
    interaction: 'Debuff Shield protects adjacent allies from debuffs. But ALL debuff passives (enemy_debuff, frost, plague) were stripped. There are NO debuffs in the game to shield against.',
    feedbackLoop: 'None.',
    infinite: false,
    synergy: 1,
    rating: 'Fair',
    why: 'These cards are effectively vanilla stat sticks. Their passive does nothing. Either reintroduce debuff mechanics or replace their passives.',
  },
  {
    name: 'Assassin Strike + Portal',
    cards: ['Phantom Blade'],
    size: 2,
    interaction: 'assassin_strike gives +3 all sides when attacking (identical to attack_boost in code). On a portal tile: doubled to +6 (+24 total). Phantom Blade effective: 23+24=47 when attacking from portal.',
    feedbackLoop: 'None.',
    infinite: false,
    synergy: 8,
    rating: 'Very Strong',
    why: 'Portal tile turns Phantom Blade into the hardest-hitting card in the game. The description says "attacking side only" but code applies +3 to ALL sides — this should be clarified.',
  },
];

// ── Meta Analysis ──
export const META = {
  autoIncludes: [
    { id: 'C025', name: 'Dragon Sovereign', reason: 'Highest base total (31). Always strong regardless of board or deck.' },
    { id: 'C061', name: 'Titan Mech', reason: 'Colossus grows every turn with no cap. Strong at placement, dominant if left alive.' },
    { id: 'C063', name: 'Omega Unit', reason: 'N=9 is the highest single stat in the game. final_card_boost makes it a devastating finisher.' },
    { id: 'C093', name: 'Bone Golem', reason: 'Titan immunity (can\'t flip <16) makes it nearly unflippable by Normal/Rare cards. S=8 is exceptional.' },
    { id: 'C018', name: 'Elder Dragon', reason: 'Total 29 with endgame_boost. Consistently strong in the late game.' },
  ],
  trapCards: [
    { id: 'C045', name: 'Ward Mage', reason: 'Debuff Shield is useless — no debuffs exist in the game. Effectively a 18-total vanilla card at Rare cost.' },
    { id: 'C070', name: 'Guardian Angel', reason: 'Same as Ward Mage — Debuff Shield does nothing. Overcosted for its effect.' },
    { id: 'C016', name: 'Frost Wyrm', reason: 'Was designed around frost (enemy debuff). Passive stripped, now just 21-total Rare with no ability.' },
    { id: 'C022', name: 'Void Dragon', reason: 'Epic stats (25) but passive stripped. Paying Epic cost for a vanilla card.' },
    { id: 'C091', name: 'Lich', reason: 'Epic stats (24) but passive stripped. Same issue as Void Dragon.' },
    { id: 'C074', name: 'Banshee', reason: 'Epic stats (22) but passive stripped. Underwhelming for Epic.' },
  ],
  comboPieces: [
    { id: 'C006', name: 'War Marshal', reason: 'Commander global aura. Core of the strongest combo in the game.' },
    { id: 'C073', name: 'Ancestor', reason: 'Second Commander. Enables the 4-Commander stack.' },
    { id: 'C037', name: 'Alpha Wolf', reason: 'Rare-tier Commander — most accessible global aura source.' },
    { id: 'C096', name: 'Necromancer', reason: 'Rare-tier Commander. Budget commander for non-Epic decks.' },
    { id: 'C042', name: 'Illusionist', reason: 'Mirror copies enemy passives. Combo enabler vs commander/aura decks.' },
    { id: 'C005', name: 'Paladin', reason: 'Ally aura — pairs with Commander for +2 adjacency buffs.' },
  ],
  winMore: [
    { id: 'C025', name: 'Dragon Sovereign', reason: 'Domination only activates when ahead. Useless when losing.' },
    { id: 'C099', name: 'Banshee Queen', reason: 'Same domination issue. Strong when winning, dead when losing.' },
    { id: 'C012', name: 'Grand Master', reason: 'played_last_boost only matters on the final card. If the game is already decided, the bonus is wasted.' },
    { id: 'C063', name: 'Omega Unit', reason: 'final_card_boost — same issue as Grand Master. Only strong as a finisher.' },
  ],
  metaDefining: [
    { id: 'C006', name: 'War Marshal (+ all Commanders)', reason: 'Global aura stacking defines the meta. Decks must either run Commanders or tech against them.' },
    { id: 'C093', name: 'Bone Golem', reason: 'Titan immunity forces opponents to include high-total cards. Shapes deck building toward Epic+ stats.' },
    { id: 'C061', name: 'Titan Mech', reason: 'Colossus creates a "remove it or lose" clock. Forces early aggression.' },
    { id: 'C042', name: 'Illusionist', reason: 'Mirror punishes passive-heavy decks. Keeps Commander/aura strategies in check.' },
    { name: 'Portal Tiles', reason: 'Double passive effects create high-value placement decisions. Shapes board positioning strategy.' },
  ],
};

// ── Suggested Adjustments ──
export const ADJUSTMENTS = [
  {
    priority: 'Critical',
    card: 'Engine: Anchor noAuras',
    issue: 'Anchor\'s noAuras flag is returned by the passive but never checked in getEffectiveStats(). Anchor cards incorrectly receive aura buffs.',
    fix: 'In gameEngine.js getEffectiveStats(), check if the card\'s own passive result includes noAuras, and if so, skip the aura processing section.',
  },
  {
    priority: 'Critical',
    card: 'Engine: Global Aura Stacking',
    issue: 'Multiple Commander cards stack their global auras with no cap. 4 Commanders = +3 all sides to every friendly card (+48 total across 4 cards).',
    fix: 'Cap global aura contributions at +2 total per card (max 2 Commander effects apply). Alternatively, make global auras non-stacking (only the strongest applies).',
  },
  {
    priority: 'High',
    card: 'C016 Frost Wyrm, C022 Void Dragon, C044 Storm Caller, C074 Banshee, C091 Lich',
    issue: 'These cards had their passives stripped (enemy debuffs removed). They are now vanilla stat sticks at Rare/Epic cost — significantly under budget for their rarity.',
    fix: 'Either reduce their stats to match the next lower rarity tier (e.g., Void Dragon 25→22), or assign new non-debuff passives that fit their theme.',
  },
  {
    priority: 'High',
    card: 'C045 Ward Mage, C070 Guardian Angel',
    issue: 'Debuff Shield is completely useless — all enemy debuff passives were stripped. These cards have no effective passive.',
    fix: 'Replace debuff_shield with a new defensive passive (e.g., "Adjacent allies gain +1 defend" or "Cannot be flipped by chain reactions"). Alternatively, reduce their stats to Common/Uncommon tier.',
  },
  {
    priority: 'Medium',
    card: 'C084 Phantom Blade',
    issue: 'assassin_strike description says "+3 to the attacking side only" but the code gives +3 to ALL sides — identical to attack_boost.',
    fix: 'Either fix the description to match the code (+3 all sides when attacking), or fix the code to only boost the attacking direction. The latter would make it a more interesting, differentiated passive.',
  },
  {
    priority: 'Medium',
    card: 'C061 Titan Mech',
    issue: 'Colossus grows +1/turn with no cap. On a portal tile, this doubles to +2/turn. After 5 turns on a portal: +12 per side (+48 total on top of base 29).',
    fix: 'Cap colossus bonus at +5 per side (max +20 total). This preserves the growing mechanic while preventing extreme late-game snowball.',
  },
  {
    priority: 'Medium',
    card: 'C025 Dragon Sovereign',
    issue: 'Total 31 is the highest in the game, 5 above the Legendary threshold. Combined with domination, it can reach effective 35.',
    fix: 'Reduce south from 8 to 7 (total 30). Still the strongest card but brings it closer to other Legendaries (28-29 range).',
  },
  {
    priority: 'Medium',
    card: 'C042 Illusionist (Mirror)',
    issue: 'Mirror copying Commander creates a second global aura for your side. This is an unintended amplification of the strongest combo.',
    fix: 'Add a restriction to Mirror: cannot copy globalAura-type passives (commander, plague). Mirror should copy cardMods and aura passives, not global ones.',
  },
  {
    priority: 'Low',
    card: 'Common cards (C001, C014, C019, C035, C039, C064, C071, C089)',
    issue: 'Total stats 8-11 are significantly under budget (55-61 vs 90 target). These cards are unplayable in competitive contexts.',
    fix: 'Increase 2-3 stats by 1 each to bring totals to 13-14. This keeps them below Rare tier (17+) but makes them viable filler in budget decks.',
  },
  {
    priority: 'Low',
    card: 'C093 Bone Golem',
    issue: 'Titan immunity (can\'t flip <16) is extremely strong. Only cards with total ≥16 can flip it, which excludes most Normal and many Rare cards.',
    fix: 'Raise the titan threshold from 16 to 18. This allows more Rare cards to contest it while keeping its defensive identity.',
  },
];

// ── Summary ──
const sortedByOverall = [...CARD_ANALYSES].sort((a, b) => b.scores.overall - a.scores.overall);
const sortedByBudget = [...CARD_ANALYSES].sort((a, b) => b.powerBudget - a.powerBudget);
const sortedByBudgetAsc = [...CARD_ANALYSES].sort((a, b) => a.powerBudget - b.powerBudget);

export const SUMMARY = {
  topStrongest: sortedByOverall.slice(0, 10).map(c => ({
    id: c.card_id, name: c.name, rarity: c.rarity, overall: c.scores.overall, budget: c.powerBudget,
  })),
  topWeakest: sortedByOverall.slice(-10).reverse().map(c => ({
    id: c.card_id, name: c.name, rarity: c.rarity, overall: c.scores.overall, budget: c.powerBudget,
  })),
  topCombos: COMBINATIONS.sort((a, b) => b.synergy - a.synergy).slice(0, 10).map(c => ({
    name: c.name, synergy: c.synergy, rating: c.rating,
  })),
  mostBalancedRarity: 'Rare',
  mostBalancedRarityReason: 'Rare cards cluster tightly around their 120 power budget target (105-118 range). Most have interesting conditional passives that reward good play without being overwhelming.',
  leastBalancedRarity: 'Epic',
  leastBalancedRarityReason: '6 Epic cards had their passives stripped (Void Dragon, Storm Caller, Banshee, Lich) or have useless passives (Ward Mage/Guardian Angel\'s debuff_shield). These are significantly under budget for Epic tier. Meanwhile, Commander Epics (War Marshal, Ancestor) are meta-defining when stacked.',
  biggestConcerns: [
    'Global aura stacking (4 Commanders) has no cap and is potentially game-breaking (+48 total stats).',
    'Anchor\'s noAuras is not implemented — Anchor cards are unintentionally stronger than designed.',
    '6 cards have useless or stripped passives, making them vanilla stat sticks at premium rarity cost.',
    'Colossus and Longevity have no growth cap, creating unbounded snowball potential.',
    'Mirror copying Commander creates asymmetric global aura advantage.',
  ],
  recommendations: [
    'Fix the noAuras engine bug before any playtesting.',
    'Cap global aura stacking at +2 per card before testing Commander decks.',
    'Replace or rebalance the 6 stripped/debuff_shield cards.',
    'Playtest with Commander-stack, Portal-synergy, and Imminity-wall decks as priority test cases.',
    'Monitor Colossus/Longevity growth in games lasting 5+ turns.',
    'Consider whether Mirror should exclude globalAura passives.',
  ],
};

// ── Rarity Aggregate Stats ──
export const RARITY_STATS = {};
for (const rarity of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']) {
  const cards = CARD_ANALYSES.filter(c => c.rarity === rarity);
  RARITY_STATS[rarity] = {
    count: cards.length,
    avgBudget: Math.round(cards.reduce((s, c) => s + c.powerBudget, 0) / cards.length),
    avgOverall: Math.round(cards.reduce((s, c) => s + c.scores.overall, 0) / cards.length),
    target: BUDGET_TARGETS[rarity],
    avgRatio: Math.round(cards.reduce((s, c) => s + c.budgetRatio, 0) / cards.length),
    overBudget: cards.filter(c => c.budgetRatio > 110).length,
    underBudget: cards.filter(c => c.budgetRatio < 80).length,
  };
}