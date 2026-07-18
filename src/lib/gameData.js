import { generateBoardLayouts, generateBoardLayouts4x4 } from './boardLayouts';

// ── Passive Ability Registry ──
// Each passive is { id, name, icon, description, apply(ctx) }
// ctx = { card, position, board, turn, totalTurns, phase, allCards }
// apply returns { cardMods: {north,east,south,west}, boardMods: [...] }

export const PASSIVES = {
  // ── Timing ──
  played_last_boost: {
    id: "played_last_boost", name: "Final Stand", icon: "⏳",
    description: "+2 all sides if played as your last card",
    apply: (ctx) => {
      // "Last card" = the player won't get another turn after this placement.
      // After placing, if ≤1 empty spaces remain, the opponent takes the last
      // (or no) slot and this player is done.
      const empty = ctx.board.flat().filter(c => !c).length;
      if (empty <= 1) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  played_first_boost: {
    id: "played_first_boost", name: "First Strike", icon: "⚡",
    description: "+1 all sides if played first",
    apply: (ctx) => {
      const total = ctx.board.flat().filter(c => c).length;
      if (total === 0) return { cardMods: { north: 1, east: 1, south: 1, west: 1 } };
      return {};
    }
  },
  longevity: {
    id: "longevity", name: "Longevity", icon: "🕐",
    description: "+1 all sides per turn on board (max +4)",
    apply: (ctx) => {
      const turnsOnBoard = ctx.turn - (ctx.card.placedTurn || ctx.turn);
      const b = Math.min(4, Math.max(0, turnsOnBoard));
      return { cardMods: { north: b, east: b, south: b, west: b } };
    }
  },
  // ── Position ──
  corner_boost: {
    id: "corner_boost", name: "Fortification", icon: "🏰",
    description: "+2 all sides when placed in a corner",
    apply: (ctx) => {
      const max = ctx.board.length - 1;
      const corners = [[0,0],[0,max],[max,0],[max,max]];
      if (corners.some(([r,c]) => r === ctx.position[0] && c === ctx.position[1]))
        return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  centre_boost: {
    id: "centre_boost", name: "Nexus", icon: "🎯",
    description: "+2 all sides when placed in the centre",
    apply: (ctx) => {
      if (ctx.position[0] === 1 && ctx.position[1] === 1)
        return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  edge_boost: {
    id: "edge_boost", name: "Vanguard", icon: "🛡️",
    description: "+2 all sides when placed on an edge (not corner)",
    apply: (ctx) => {
      const [r, c] = ctx.position;
      const max = ctx.board.length - 1;
      const isEdge = (r === 0 || r === max || c === 0 || c === max);
      const isCorner = (r === 0 || r === max) && (c === 0 || c === max);
      if (isEdge && !isCorner) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  // ── Neighbour ──
  ally_aura: {
    id: "ally_aura", name: "Rally", icon: "📯",
    description: "Adjacent allies gain +1 all sides",
    apply: (ctx) => {
      return { aura: { target: "allies", mod: 1 } };
    }
  },
  ally_count_boost: {
    id: "ally_count_boost", name: "Brotherhood", icon: "🤝",
    description: "+1 all sides for each adjacent ally",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const allies = adj.filter(c => c && c.owner === ctx.card.owner).length;
      return { cardMods: { north: allies, east: allies, south: allies, west: allies } };
    }
  },
  dragon_synergy: {
    id: "dragon_synergy", name: "Dragon Bond", icon: "🐉",
    description: "+2 all sides when adjacent to a Dragon card",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      if (adj.some(c => c && c.faction === "Dragons"))
        return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  mage_synergy: {
    id: "mage_synergy", name: "Mage Bond", icon: "🔮",
    description: "+2 all sides when adjacent to a Mage card",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      if (adj.some(c => c && c.faction === "Mages"))
        return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  beast_synergy: {
    id: "beast_synergy", name: "Beast Bond", icon: "🐾",
    description: "+1 all sides when adjacent to a Beast card",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      if (adj.some(c => c && c.faction === "Beasts"))
        return { cardMods: { north: 1, east: 1, south: 1, west: 1 } };
      return {};
    }
  },
  // ── Combat ──
  attack_boost: {
    id: "attack_boost", name: "Aggression", icon: "⚔️",
    description: "+3 all sides while attacking (when placed)",
    apply: (ctx) => {
      if (ctx.phase === "attack") return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  defend_boost: {
    id: "defend_boost", name: "Bulwark", icon: "🛡️",
    description: "+3 all sides while defending",
    apply: (ctx) => {
      if (ctx.phase === "defend") return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  flip_immunity_low: {
    id: "flip_immunity_low", name: "Immovable", icon: "🪨",
    description: "Cannot be flipped by cards with total power under 22",
    apply: () => ({ flipImmunity: { minTotalPower: 22 } })
  },
  flip_reward: {
    id: "flip_reward", name: "Conqueror", icon: "👑",
    description: "+1 all sides per enemy flipped (max +4)",
    apply: (ctx) => {
      const flips = Math.min(4, ctx.card.flipsEarned || 0);
      return { cardMods: { north: flips, east: flips, south: flips, west: flips } };
    }
  },
  flip_revenge: {
    id: "flip_revenge", name: "Vengeance", icon: "💀",
    description: "+2 all sides after being flipped",
    apply: (ctx) => {
      if (ctx.card.wasFlipped) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  // ── Late Game ──
  endgame_boost: {
    id: "endgame_boost", name: "Endgame", icon: "🌅",
    description: "+2 all sides if fewer than 3 empty spaces remain",
    apply: (ctx) => {
      const empty = ctx.board.flat().filter(c => !c).length;
      if (empty < 3) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  final_card_boost: {
    id: "final_card_boost", name: "Crescendo", icon: "🎵",
    description: "+3 all sides if this is your final card placed",
    apply: (ctx) => {
      const lastTurn = ctx.totalTurns >= 16 ? ctx.totalTurns - 1 : ctx.totalTurns;
      if (ctx.turn >= lastTurn) return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  // ── Support ──
  enemy_debuff: {
    id: "enemy_debuff", name: "Intimidation", icon: "😈",
    description: "Adjacent enemy cards lose 1 from all sides",
    apply: () => ({ aura: { target: "enemies", mod: -1 } })
  },
  debuff_shield: {
    id: "debuff_shield", name: "Stalwart", icon: "🛡️",
    description: "Cannot be flipped by chain reactions",
    apply: () => ({ chainImmunity: true })
  },
  machine_shield: {
    id: "machine_shield", name: "Firewall", icon: "🔧",
    description: "Adjacent Machine cards gain +2 all sides",
    apply: () => ({ aura: { target: "allies", mod: 2, factionFilter: "Machines" } })
  },
  // ── Extra unique passives ──
  spirit_walk: {
    id: "spirit_walk", name: "Spirit Walk", icon: "👻",
    description: "+1 all sides for each Spirit card on the board",
    apply: (ctx) => {
      const spirits = ctx.board.flat().filter(c => c && c.faction === "Spirits").length;
      return { cardMods: { north: spirits, east: spirits, south: spirits, west: spirits } };
    }
  },
  undead_rising: {
    id: "undead_rising", name: "Undead Rising", icon: "💀",
    description: "+1 all sides for each Undead card on the board",
    apply: (ctx) => {
      const undead = ctx.board.flat().filter(c => c && c.faction === "Undead").length;
      return { cardMods: { north: undead, east: undead, south: undead, west: undead } };
    }
  },
  knight_honor: {
    id: "knight_honor", name: "Honor Guard", icon: "⚜️",
    description: "+1 all sides for each Knight card on the board",
    apply: (ctx) => {
      const knights = ctx.board.flat().filter(c => c && c.faction === "Knights").length;
      return { cardMods: { north: knights, east: knights, south: knights, west: knights } };
    }
  },
  assassin_strike: {
    id: "assassin_strike", name: "Shadow Strike", icon: "🗡️",
    description: "+4 north and east while attacking",
    apply: (ctx) => {
      if (ctx.phase === "attack") return { cardMods: { north: 4, east: 4, south: 0, west: 0 } };
      return {};
    }
  },
  empty_throne: {
    id: "empty_throne", name: "Empty Throne", icon: "👑",
    description: "+1 all sides per empty space (max +4)",
    apply: (ctx) => {
      const empty = ctx.board.flat().filter(c => !c).length;
      const b = Math.min(4, empty);
      return { cardMods: { north: b, east: b, south: b, west: b } };
    }
  },
  domination: {
    id: "domination", name: "Domination", icon: "🔥",
    description: "+1 all sides if you control more cards than your opponent",
    apply: (ctx) => {
      const mine = ctx.board.flat().filter(c => c && c.owner === ctx.card.owner).length;
      const theirs = ctx.board.flat().filter(c => c && c.owner !== ctx.card.owner).length;
      if (mine > theirs) return { cardMods: { north: 1, east: 1, south: 1, west: 1 } };
      return {};
    }
  },
  underdog: {
    id: "underdog", name: "Underdog", icon: "🌟",
    description: "+2 all sides if you control fewer cards than your opponent",
    apply: (ctx) => {
      const mine = ctx.board.flat().filter(c => c && c.owner === ctx.card.owner).length;
      const theirs = ctx.board.flat().filter(c => c && c.owner !== ctx.card.owner).length;
      if (mine < theirs) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  surrounded_fury: {
    id: "surrounded_fury", name: "Surrounded Fury", icon: "💢",
    description: "+1 all sides for each adjacent enemy card",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const enemies = adj.filter(c => c && c.owner !== ctx.card.owner).length;
      return { cardMods: { north: enemies, east: enemies, south: enemies, west: enemies } };
    }
  },
  anchor: {
    id: "anchor", name: "Anchor", icon: "⚓",
    description: "+2 all sides but cannot benefit from auras",
    apply: () => ({ cardMods: { north: 2, east: 2, south: 2, west: 2 }, noAuras: true })
  },
  mirror: {
    id: "mirror", name: "Mirror", icon: "🪞",
    description: "Copies passive of first adjacent enemy (not global auras)",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const enemy = adj.find(c => c && c.owner !== ctx.card.owner);
      if (enemy && PASSIVES[enemy.passive_id] && enemy.passive_id !== "mirror") {
        const result = PASSIVES[enemy.passive_id].apply({ ...ctx, card: { ...ctx.card, passive_id: enemy.passive_id } });
        if (result.globalAura) return {};
        return result;
      }
      return {};
    }
  },
  titan: {
    id: "titan", name: "Titan", icon: "🗿",
    description: "Cannot be flipped by cards with total power under 18",
    apply: () => ({ flipImmunity: { minTotalPower: 18 } })
  },
  berserker: {
    id: "berserker", name: "Berserker", icon: "🪓",
    description: "+1 to all sides for each card you've lost control of",
    apply: (ctx) => {
      const lost = ctx.card.owner === 1 ?
        ctx.board.flat().filter(c => c && c.originalOwner === 1 && c.owner === 2).length :
        ctx.board.flat().filter(c => c && c.originalOwner === 2 && c.owner === 1).length;
      return { cardMods: { north: lost, east: lost, south: lost, west: lost } };
    }
  },
  frost: {
    id: "frost", name: "Frost", icon: "❄️",
    description: "Adjacent enemies lose 2 from all sides",
    apply: () => ({ aura: { target: "enemies", mod: -2 } })
  },
  phoenix: {
    id: "phoenix", name: "Phoenix", icon: "🔥",
    description: "If flipped, gains +3 all sides permanently",
    apply: (ctx) => {
      if (ctx.card.wasFlipped) return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  tactician: {
    id: "tactician", name: "Tactician", icon: "📐",
    description: "+1 all sides for each different faction among adjacent cards",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const factions = new Set(adj.filter(c => c).map(c => c.faction));
      const b = factions.size;
      return { cardMods: { north: b, east: b, south: b, west: b } };
    }
  },
  sentinel: {
    id: "sentinel", name: "Sentinel", icon: "🗼",
    description: "+2 north and south sides",
    apply: () => ({ cardMods: { north: 2, east: 0, south: 2, west: 0 } })
  },
  flanker: {
    id: "flanker", name: "Flanker", icon: "💨",
    description: "+2 east and west sides",
    apply: () => ({ cardMods: { north: 0, east: 2, south: 0, west: 2 } })
  },
  commander: {
    id: "commander", name: "Commander", icon: "🎖️",
    description: "All friendly cards on the board gain +1 all sides",
    apply: () => ({ globalAura: { target: "allies", mod: 1 } })
  },
  plague: {
    id: "plague", name: "Plague", icon: "☠️",
    description: "All enemy cards on the board lose 1 from all sides",
    apply: () => ({ globalAura: { target: "enemies", mod: -1 } })
  },
  duelist: {
    id: "duelist", name: "Duelist", icon: "🤺",
    description: "+2 all sides in 1v1 combat (only one adjacent enemy)",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const enemies = adj.filter(c => c && c.owner !== ctx.card.owner).length;
      if (enemies === 1) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  colossus: {
    id: "colossus", name: "Colossus", icon: "🏔️",
    description: "+1 all sides, +1 more per turn (max +5)",
    apply: (ctx) => {
      const turns = Math.max(0, ctx.turn - (ctx.card.placedTurn || ctx.turn));
      const b = Math.min(5, 1 + turns);
      return { cardMods: { north: b, east: b, south: b, west: b } };
    }
  },
  harmony: {
    id: "harmony", name: "Harmony", icon: "☯️",
    description: "+1 all sides for each pair of matching factions on the board",
    apply: (ctx) => {
      const factionCounts = {};
      ctx.board.flat().filter(c => c).forEach(c => { factionCounts[c.faction] = (factionCounts[c.faction] || 0) + 1; });
      const pairs = Object.values(factionCounts).reduce((s, v) => s + Math.floor(v / 2), 0);
      return { cardMods: { north: pairs, east: pairs, south: pairs, west: pairs } };
    }
  },
  // ── Expansion passives (balanced, no global auras, no debuffs) ──
  lone_wolf: {
    id: "lone_wolf", name: "Lone Wolf", icon: "🐺",
    description: "+3 all sides if no adjacent allies",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const allies = adj.filter(c => c && c.owner === ctx.card.owner).length;
      if (allies === 0) return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  bloodlust: {
    id: "bloodlust", name: "Bloodlust", icon: "🩸",
    description: "+1 north and east for each adjacent enemy",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const enemies = adj.filter(c => c && c.owner !== ctx.card.owner).length;
      return { cardMods: { north: enemies, east: enemies, south: 0, west: 0 } };
    }
  },
  guardian: {
    id: "guardian", name: "Guardian", icon: "🤲",
    description: "+1 south and west for each adjacent ally",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const allies = adj.filter(c => c && c.owner === ctx.card.owner).length;
      return { cardMods: { north: 0, east: 0, south: allies, west: allies } };
    }
  },
  overwhelm: {
    id: "overwhelm", name: "Overwhelm", icon: "🌊",
    description: "+2 all sides if 2+ adjacent allies",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const allies = adj.filter(c => c && c.owner === ctx.card.owner).length;
      if (allies >= 2) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  pincer: {
    id: "pincer", name: "Pincer", icon: "🔱",
    description: "+2 all sides if 2+ adjacent enemies",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const enemies = adj.filter(c => c && c.owner !== ctx.card.owner).length;
      if (enemies >= 2) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  trapper: {
    id: "trapper", name: "Trapper", icon: "🪤",
    description: "+1 all sides for each empty adjacent space",
    apply: (ctx) => {
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const empty = adj.filter(c => !c).length;
      return { cardMods: { north: empty, east: empty, south: empty, west: empty } };
    }
  },
  synergy_bond: {
    id: "synergy_bond", name: "Synergy Bond", icon: "🔗",
    description: "+2 all sides for every other Synergy card on the board",
    apply: (ctx) => {
      const others = ctx.board.flat().filter(c => c && c.name === "Synergy" && c !== ctx.card).length;
      const bonus = others * 2;
      return { cardMods: { north: bonus, east: bonus, south: bonus, west: bonus } };
    }
  },
  card_synergy: {
    id: "card_synergy", name: "Bonded", icon: "🤝",
    description: "Bonus when paired card is on the board",
    apply: (ctx) => {
      const target = ctx.card.synergy_target;
      const bonus = ctx.card.synergy_bonus || 2;
      if (!target) return {};
      const found = ctx.board.flat().some(c => c && c.name === target && c !== ctx.card);
      if (!found) return {};
      return { cardMods: { north: bonus, east: bonus, south: bonus, west: bonus } };
    }
  },
  // ── New Archetype Passives ──
  blood_pact: {
    id: "blood_pact", name: "Blood Pact", icon: "🩹",
    description: "+1 all sides for each of your cards controlled by the enemy",
    apply: (ctx) => {
      const lost = ctx.board.flat().filter(c => c && c.originalOwner === ctx.card.owner && c.owner !== ctx.card.owner).length;
      return { cardMods: { north: lost, east: lost, south: lost, west: lost } };
    }
  },
  momentum: {
    id: "momentum", name: "Momentum", icon: "🚀",
    description: "+2 all sides if you control 2+ more cards than opponent",
    apply: (ctx) => {
      const mine = ctx.board.flat().filter(c => c && c.owner === ctx.card.owner).length;
      const theirs = ctx.board.flat().filter(c => c && c.owner !== ctx.card.owner).length;
      if (mine - theirs >= 2) return { cardMods: { north: 2, east: 2, south: 2, west: 2 } };
      return {};
    }
  },
  fortify: {
    id: "fortify", name: "Fortify", icon: "🧱",
    description: "+1 all sides for each adjacent enemy with higher total stats",
    apply: (ctx) => {
      const myTotal = ctx.card.north + ctx.card.east + ctx.card.south + ctx.card.west;
      const adj = getAdjacentCards(ctx.position, ctx.board);
      const stronger = adj.filter(c => c && c.owner !== ctx.card.owner && (c.north + c.east + c.south + c.west) > myTotal).length;
      return { cardMods: { north: stronger, east: stronger, south: stronger, west: stronger } };
    }
  },
  hunter: {
    id: "hunter", name: "Hunter", icon: "🏹",
    description: "+3 all sides when attacking a card with total under 16",
    apply: (ctx) => {
      if (ctx.phase === "attack") {
        const [r, c] = ctx.position;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ctx.board.length || nc < 0 || nc >= ctx.board.length) continue;
          const enemy = ctx.board[nr][nc];
          if (!enemy || enemy.owner === ctx.card.owner) continue;
          let enemyTotal;
          if (ctx.getEffectiveStats) {
            const es = ctx.getEffectiveStats(enemy, [nr, nc], ctx.board, ctx.turn, 'defend');
            enemyTotal = es.north + es.east + es.south + es.west;
          } else {
            enemyTotal = enemy.north + enemy.east + enemy.south + enemy.west;
          }
          if (enemyTotal < 16) return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
        }
      }
      return {};
    }
  },
  pioneer: {
    id: "pioneer", name: "Pioneer", icon: "🚩",
    description: "+3 all sides if placed in the first 2 turns",
    apply: (ctx) => {
      if (ctx.turn <= 2) return { cardMods: { north: 3, east: 3, south: 3, west: 3 } };
      return {};
    }
  },
  adaptable: {
    id: "adaptable", name: "Adaptable", icon: "🔄",
    description: "+2 to your two lowest base stats",
    apply: (ctx) => {
      const stats = [["north",ctx.card.north],["east",ctx.card.east],["south",ctx.card.south],["west",ctx.card.west]];
      stats.sort((a, b) => a[1] - b[1]);
      const mods = { north: 0, east: 0, south: 0, west: 0 };
      mods[stats[0][0]] += 2;
      mods[stats[1][0]] += 2;
      return { cardMods: mods };
    }
  },
};

// ── Support vs Self Ability Classification ──
// Support passives affect other cards (auras/debuffs). Self passives only modify the card itself.
// Only support passives linger after being flipped; self passives deactivate immediately.
export const SUPPORT_PASSIVES = [
  'ally_aura',      // Rally — adjacent allies +1
  'enemy_debuff',   // Intimidation — adjacent enemies -1
  'machine_shield', // Firewall — adjacent Machines +2
  'commander',      // Commander — all friendly +1 (global)
  'plague',         // Plague — all enemies -1 (global)
  'frost',          // Frost — adjacent enemies -2
];
export function isSupportPassive(passiveId) {
  return SUPPORT_PASSIVES.includes(passiveId);
}

// ── Passive Ability Directory (flat list for dropdowns) ──
export const PASSIVE_LIST = [
  { id: 'none', name: 'None', icon: '🚫', description: 'No passive ability' },
  ...Object.values(PASSIVES).map(p => ({ id: p.id, name: p.name, icon: p.icon, description: p.description })),
];

function getAdjacentCards(pos, board) {
  const [r, c] = pos;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  return dirs.map(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < board.length && nc >= 0 && nc < board.length) return board[nr][nc];
    return null;
  });
}

// ── Board Tile Layouts ──
export const BOARD_LAYOUTS = {
  standard: { name: "Standard", description: "No special tiles", tiles: Array(9).fill(null) },
  '4x4_standard': { name: "Standard 4×4", description: "No special tiles", tiles: Array(16).fill(null) },
  power_center: {
    name: "Power Center", description: "Centre tile: +1 all sides",
    tiles: [null,null,null,null,{ type: "power", label: "+1", icon: "⚡", mod: { north:1,east:1,south:1,west:1 } },null,null,null,null]
  },
  forest_corners: {
    name: "Wild Corners", description: "Corner tiles: Beasts gain +1",
    tiles: [
      { type: "forest", label: "Forest", icon: "🌲", factionBonus: { faction: "Beasts", mod: 1 } },null,
      { type: "forest", label: "Forest", icon: "🌲", factionBonus: { faction: "Beasts", mod: 1 } },null,null,null,
      { type: "forest", label: "Forest", icon: "🌲", factionBonus: { faction: "Beasts", mod: 1 } },null,
      { type: "forest", label: "Forest", icon: "🌲", factionBonus: { faction: "Beasts", mod: 1 } }
    ]
  },
  forge_line: {
    name: "Forge Line", description: "Middle row: Machines gain +2 attack",
    tiles: [null,null,null,
      { type: "forge", label: "Forge", icon: "🔨", factionBonus: { faction: "Machines", mod: 2, phase: "attack" } },
      { type: "forge", label: "Forge", icon: "🔨", factionBonus: { faction: "Machines", mod: 2, phase: "attack" } },
      { type: "forge", label: "Forge", icon: "🔨", factionBonus: { faction: "Machines", mod: 2, phase: "attack" } },
      null,null,null]
  },
  arcane_circle: {
    name: "Arcane Circle", description: "Edges: Mages gain +1",
    tiles: [null,
      { type: "arcane", label: "Arcane", icon: "✨", factionBonus: { faction: "Mages", mod: 1 } },null,
      { type: "arcane", label: "Arcane", icon: "✨", factionBonus: { faction: "Mages", mod: 1 } },null,
      { type: "arcane", label: "Arcane", icon: "✨", factionBonus: { faction: "Mages", mod: 1 } },null,
      { type: "arcane", label: "Arcane", icon: "✨", factionBonus: { faction: "Mages", mod: 1 } },null]
  },
  portal_cross: {
    name: "Portal Cross", description: "Centre + edges: Passive abilities activate twice",
    tiles: [null,
      { type: "portal", label: "Portal", icon: "🌀", doublePassive: true },null,
      { type: "portal", label: "Portal", icon: "🌀", doublePassive: true },
      { type: "portal", label: "Portal", icon: "🌀", doublePassive: true },
      { type: "portal", label: "Portal", icon: "🌀", doublePassive: true },null,
      { type: "portal", label: "Portal", icon: "🌀", doublePassive: true },null]
  },
  sanctuary_corners: {
    name: "Sanctuary", description: "Corners: Cards cannot receive buffs",
    tiles: [
      { type: "sanctuary", label: "Sanctuary", icon: "🕊️", noBuff: true },null,
      { type: "sanctuary", label: "Sanctuary", icon: "🕊️", noBuff: true },null,null,null,
      { type: "sanctuary", label: "Sanctuary", icon: "🕊️", noBuff: true },null,
      { type: "sanctuary", label: "Sanctuary", icon: "🕊️", noBuff: true }
    ]
  },
};

// Merge 100 generated board layout variations
Object.assign(BOARD_LAYOUTS, generateBoardLayouts());
Object.assign(BOARD_LAYOUTS, generateBoardLayouts4x4());

export function getRandomLayout(gridSize = 3) {
  const keys = Object.keys(BOARD_LAYOUTS).filter(k => {
    const layout = BOARD_LAYOUTS[k];
    return layout && layout.tiles.length === gridSize * gridSize;
  });
  return keys[Math.floor(Math.random() * keys.length)] || (gridSize === 4 ? '4x4_standard' : 'standard');
}

// ── Rarity colors & config ──
export const RARITY_CONFIG = {
  Common:    { color: "#9CA3AF", bg: "from-gray-700 to-gray-800", glow: "" },
  Uncommon:  { color: "#10B981", bg: "from-emerald-700 to-emerald-900", glow: "shadow-emerald-500/30" },
  Rare:      { color: "#3B82F6", bg: "from-blue-700 to-blue-900", glow: "shadow-blue-500/30" },
  Epic:      { color: "#8B5CF6", bg: "from-purple-700 to-purple-900", glow: "shadow-purple-500/40" },
  Legendary: { color: "#F59E0B", bg: "from-amber-600 to-amber-900", glow: "shadow-amber-500/50" },
};

export const FACTION_CONFIG = {
  Knights:   { icon: "⚔️", color: "#C0C0C0" },
  Dragons:   { icon: "🐉", color: "#EF4444" },
  Beasts:    { icon: "🐾", color: "#22C55E" },
  Mages:     { icon: "🔮", color: "#8B5CF6" },
  Machines:  { icon: "⚙️", color: "#6B7280" },
  Spirits:   { icon: "👻", color: "#06B6D4" },
  Assassins: { icon: "🗡️", color: "#EC4899" },
  Undead:    { icon: "💀", color: "#6D28D9" },
};

export const RANK_THRESHOLDS = [
  { name: "Bronze", min: 0, max: 1199, icon: "🥉", color: "#CD7F32" },
  { name: "Silver", min: 1200, max: 1399, icon: "🥈", color: "#C0C0C0" },
  { name: "Gold", min: 1400, max: 1599, icon: "🥇", color: "#FFD700" },
  { name: "Platinum", min: 1600, max: 1799, icon: "💎", color: "#E5E4E2" },
  { name: "Diamond", min: 1800, max: 1999, icon: "💠", color: "#B9F2FF" },
  { name: "Master", min: 2000, max: 2199, icon: "🏆", color: "#FF6B35" },
  { name: "Grandmaster", min: 2200, max: 9999, icon: "👑", color: "#FFD700" },
];

export function getRankForElo(elo) {
  return RANK_THRESHOLDS.find(r => elo >= r.min && elo <= r.max) || RANK_THRESHOLDS[0];
}

// ── Achievement definitions ──
export const ACHIEVEMENTS = [
  { id: "first_win", name: "First Victory", description: "Win your first match", icon: "🏆", check: (p) => p.wins >= 1 },
  { id: "wins_10", name: "Rising Star", description: "Win 10 matches", icon: "⭐", check: (p) => p.wins >= 10 },
  { id: "wins_50", name: "Veteran", description: "Win 50 matches", icon: "🎖️", check: (p) => p.wins >= 50 },
  { id: "wins_100", name: "Centurion", description: "Win 100 matches", icon: "💯", check: (p) => p.wins >= 100 },
  { id: "wins_500", name: "Legend", description: "Win 500 matches", icon: "🌟", check: (p) => p.wins >= 500 },
  { id: "streak_5", name: "Hot Streak", description: "Win 5 matches in a row", icon: "🔥", check: (p) => p.best_win_streak >= 5 },
  { id: "streak_10", name: "Unstoppable", description: "Win 10 in a row", icon: "💪", check: (p) => p.best_win_streak >= 10 },
  { id: "collector_25", name: "Collector", description: "Own 25 unique cards", icon: "📚", check: (p) => Object.keys(p.collection || {}).length >= 25 },
  { id: "collector_50", name: "Curator", description: "Own 50 unique cards", icon: "🏛️", check: (p) => Object.keys(p.collection || {}).length >= 50 },
  { id: "collector_100", name: "Complete Collection", description: "Own all 100 cards", icon: "👑", check: (p) => Object.keys(p.collection || {}).length >= 100 },
  { id: "gold_rank", name: "Gold Rank", description: "Reach Gold rank", icon: "🥇", check: (p) => p.elo >= 1400 },
  { id: "diamond_rank", name: "Diamond Rank", description: "Reach Diamond rank", icon: "💠", check: (p) => p.elo >= 1800 },
];

// ── Pack odds ──
export const PACK_COST = 100;
export const PACK_SIZE = 3;
export const DECK_SIZE = 7;
export const DECK_SIZE_ENLARGED = 12;
export const MAX_COPIES_PER_CARD = 3;
export function getDeckSize(gameMode) {
  return gameMode === 'enlarged' ? DECK_SIZE_ENLARGED : DECK_SIZE;
}
export const PACK_ODDS = [
  { rarity: "Common", weight: 65 },
  { rarity: "Uncommon", weight: 23 },
  { rarity: "Rare", weight: 9 },
  { rarity: "Epic", weight: 2.5 },
  { rarity: "Legendary", weight: 0.5 },
];

export const ESSENCE_VALUES = {
  Common: 5, Uncommon: 10, Rare: 25, Epic: 75, Legendary: 200,
};
export const CRAFT_COSTS = {
  Common: 50, Uncommon: 100, Rare: 250, Epic: 750, Legendary: 2000,
};
export const GEM_EXCHANGE_VALUES = {
  Common: 2, Uncommon: 5, Rare: 15, Epic: 40, Legendary: 100,
};