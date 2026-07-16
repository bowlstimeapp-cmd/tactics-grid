// Faction tile templates for generated board layouts
const FACTION_TILES = {
  Knights:   { type: "battlement", label: "Battlement", icon: "🏰" },
  Dragons:   { type: "lair", label: "Lair", icon: "🌋" },
  Beasts:    { type: "wild", label: "Wilds", icon: "🌲" },
  Mages:     { type: "arcane", label: "Arcane", icon: "✨" },
  Machines:  { type: "forge", label: "Forge", icon: "🔨" },
  Spirits:   { type: "shrine", label: "Shrine", icon: "🌀" },
  Assassins: { type: "shadow", label: "Shadows", icon: "🌑" },
  Undead:    { type: "crypt", label: "Crypt", icon: "⚰️" },
};

function ftile(faction, mod = 1) {
  const t = FACTION_TILES[faction];
  return { type: t.type, label: t.label, icon: t.icon, factionBonus: { faction, mod } };
}

/**
 * Generates 100 board layout variations with faction bonus tiles.
 * Includes single-faction, dual-faction, quad-faction, checkerboard,
 * three-faction, and mixed power-centre layouts covering all 8 factions.
 */
export function generateBoardLayouts() {
  const layouts = {};
  const F = Object.keys(FACTION_TILES);
  let n = 1;

  function add(name, desc, tiles) {
    layouts[`var_${n}`] = { name, description: desc, tiles };
    n++;
  }

  function make(faction, positions) {
    const tiles = Array(9).fill(null);
    for (const p of positions) tiles[p] = ftile(faction);
    return tiles;
  }

  function makeMixed(assignments) {
    const tiles = Array(9).fill(null);
    for (const [positions, faction] of assignments) {
      for (const p of positions) tiles[p] = ftile(faction);
    }
    return tiles;
  }

  // Position patterns (3×3 grid, indices 0-8 row-major: 0 1 2 / 3 4 5 / 6 7 8)
  const corners = [0, 2, 6, 8];
  const edges = [1, 3, 5, 7];
  const center = [4];
  const cross = [1, 3, 4, 5, 7];
  const xDiag = [0, 2, 4, 6, 8];
  const topRow = [0, 1, 2];
  const midRow = [3, 4, 5];
  const botRow = [6, 7, 8];
  const leftCol = [0, 3, 6];
  const rightCol = [2, 5, 8];
  const tl2x2 = [0, 1, 3, 4];
  const tr2x2 = [1, 2, 4, 5];
  const bl2x2 = [3, 4, 6, 7];
  const br2x2 = [4, 5, 7, 8];
  const checker = [0, 2, 4, 6, 8];
  const invChecker = [1, 3, 5, 7];

  // ── 40 single-faction layouts (8 factions × 5 patterns) ──
  const singlePatterns = [
    ['Corners', corners], ['Edges', edges], ['Cross', cross], ['Centre', center], ['Diagonals', xDiag]
  ];
  for (const faction of F) {
    for (const [label, pos] of singlePatterns) {
      add(`${faction} ${label}`, `${faction} gain +1 on ${label.toLowerCase()}`, make(faction, pos));
    }
  }

  // ── 32 dual-faction layouts (16 pairs × 2 split patterns) ──
  const dualPatterns = [
    ['Top/Bottom', topRow, botRow],
    ['Left/Right', leftCol, rightCol],
  ];
  let pairCount = 0;
  for (let i = 0; i < F.length && pairCount < 16; i++) {
    for (let j = i + 1; j < F.length && pairCount < 16; j++) {
      for (const [label, p1, p2] of dualPatterns) {
        add(`${F[i]}/${F[j]} ${label}`, `${F[i]} and ${F[j]} split grid`, makeMixed([[p1, F[i]], [p2, F[j]]]));
      }
      pairCount++;
    }
  }

  // ── 4 quad-faction quadrant layouts (2 groups × 2 arrangements) ──
  const quads = [tl2x2, tr2x2, bl2x2, br2x2];
  for (let i = 0; i < F.length; i += 4) {
    const g = [F[i], F[i + 1], F[i + 2], F[i + 3]];
    add(`${g[0]}/${g[1]}/${g[2]}/${g[3]} Quads`, 'Four factions, four quadrants',
      makeMixed([[quads[0], g[0]], [quads[1], g[1]], [quads[2], g[2]], [quads[3], g[3]]]));
    add(`${g[0]}/${g[1]}/${g[2]}/${g[3]} Quads Rotated`, 'Four factions rotated across quadrants',
      makeMixed([[quads[0], g[1]], [quads[1], g[2]], [quads[2], g[3]], [quads[3], g[0]]]));
  }

  // ── 8 checkerboard dual-faction layouts ──
  for (let i = 0; i < F.length; i++) {
    const f1 = F[i];
    const f2 = F[(i + 1) % F.length];
    add(`${f1}/${f2} Checkerboard`, `${f1} and ${f2} alternating tiles`,
      makeMixed([[checker, f1], [invChecker, f2]]));
  }

  // ── 8 three-faction row-split layouts ──
  for (let i = 0; i < F.length; i++) {
    const f1 = F[i];
    const f2 = F[(i + 1) % F.length];
    const f3 = F[(i + 2) % F.length];
    add(`${f1}/${f2}/${f3} Rows`, 'Three factions split by rows',
      makeMixed([[topRow, f1], [midRow, f2], [botRow, f3]]));
  }

  // ── 8 mixed faction + power centre layouts ──
  const powerTile = { type: "power", label: "+1", icon: "⚡", mod: { north: 1, east: 1, south: 1, west: 1 } };
  for (let i = 0; i < F.length; i++) {
    const f1 = F[i];
    const f2 = F[(i + 3) % F.length];
    const tiles = Array(9).fill(null);
    tiles[0] = ftile(f1);
    tiles[2] = ftile(f1);
    tiles[4] = powerTile;
    tiles[6] = ftile(f2);
    tiles[8] = ftile(f2);
    add(`${f1}/${f2} + Power`, `${f1} and ${f2} with a power centre`, tiles);
  }

  return layouts;
}

export function generateBoardLayouts4x4() {
  const layouts = {};
  const F = Object.keys(FACTION_TILES);
  let n = 1;

  function add(name, desc, tiles) {
    layouts[`4x4_var_${n}`] = { name, description: desc, tiles };
    n++;
  }

  function make(faction, positions) {
    const tiles = Array(16).fill(null);
    for (const p of positions) tiles[p] = ftile(faction);
    return tiles;
  }

  function makeMixed(assignments) {
    const tiles = Array(16).fill(null);
    for (const [positions, faction] of assignments) {
      for (const p of positions) tiles[p] = ftile(faction);
    }
    return tiles;
  }

  // 4×4 grid positions (indices 0-15 row-major):
  // 0  1  2  3
  // 4  5  6  7
  // 8  9  10 11
  // 12 13 14 15
  const corners = [0, 3, 12, 15];
  const edges = [1, 2, 4, 7, 8, 11, 13, 14];
  const center = [5, 6, 9, 10];
  const topRow = [0, 1, 2, 3];
  const lowRow = [12, 13, 14, 15];
  const leftCol = [0, 4, 8, 12];
  const rightCol = [3, 7, 11, 15];

  const singlePatterns = [
    ['Corners', corners], ['Edges', edges], ['Centre', center]
  ];
  for (const faction of F) {
    for (const [label, pos] of singlePatterns) {
      add(`${faction} ${label}`, `${faction} gain +1 on ${label.toLowerCase()}`, make(faction, pos));
    }
  }

  for (let i = 0; i < F.length; i++) {
    const f1 = F[i];
    const f2 = F[(i + 1) % F.length];
    add(`${f1}/${f2} Top/Bottom`, `${f1} and ${f2} split grid`, makeMixed([[topRow, f1], [lowRow, f2]]));
    add(`${f1}/${f2} Left/Right`, `${f1} and ${f2} split grid`, makeMixed([[leftCol, f1], [rightCol, f2]]));
  }

  const powerTile = { type: "power", label: "+1", icon: "⚡", mod: { north: 1, east: 1, south: 1, west: 1 } };
  add('Power Center', 'Centre tiles: +1 all sides', (() => {
    const tiles = Array(16).fill(null);
    tiles[5] = powerTile; tiles[6] = powerTile; tiles[9] = powerTile; tiles[10] = powerTile;
    return tiles;
  })());

  const sanctuaryTile = { type: "sanctuary", label: "Sanctuary", icon: "🕊️", noBuff: true };
  add('Sanctuary', 'Corners: Cards cannot receive buffs', (() => {
    const tiles = Array(16).fill(null);
    tiles[0] = sanctuaryTile; tiles[3] = sanctuaryTile; tiles[12] = sanctuaryTile; tiles[15] = sanctuaryTile;
    return tiles;
  })());

  return layouts;
}