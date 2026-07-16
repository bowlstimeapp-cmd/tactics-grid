import { PASSIVES, BOARD_LAYOUTS } from './gameData';

// Directions: N, E, S, W
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };
const DIR_OFFSETS = {
  north: [-1, 0], south: [1, 0], east: [0, 1], west: [0, -1]
};

// Passives that explicitly grant bonuses AFTER the card has been flipped.
// All other passives are deactivated once the card is captured.
const POST_FLIP_PASSIVES = ['flip_revenge', 'phoenix'];

function isPassiveActive(card) {
  if (!card.wasFlipped) return true;
  return POST_FLIP_PASSIVES.includes(card.passive_id);
}

export function createGameState(player1Cards, player2Cards, layoutKey = 'standard', firstPlayer = 1, gameMode = 'standard') {
  const gridSize = gameMode === 'enlarged' ? 4 : 3;
  const fallbackKey = gridSize === 4 ? '4x4_standard' : 'standard';
  let layout = BOARD_LAYOUTS[layoutKey];
  if (!layout || !layout.tiles || layout.tiles.length !== gridSize * gridSize) {
    layout = BOARD_LAYOUTS[fallbackKey];
  }
  const board = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  return {
    board,
    tiles: layout.tiles,
    layoutKey,
    layoutName: layout.name,
    gameMode,
    gridSize,
    totalTurns: gridSize * gridSize,
    turn: 1,
    currentPlayer: firstPlayer,
    player1Hand: player1Cards.map(c => ({ ...c, owner: 1, originalOwner: 1 })),
    player2Hand: player2Cards.map(c => ({ ...c, owner: 2, originalOwner: 2 })),
    moves: [],
    gameOver: false,
    winner: null,
    scores: { 1: player1Cards.length, 2: player2Cards.length },
    animations: [],
    passiveActivations: [],
  };
}

export function getEffectiveStats(card, position, board, turn, phase = 'static') {
  if (!card) return null;
  let mods = { north: 0, east: 0, south: 0, west: 0 };
  let effects = [];

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  const tileIdx = position[0] * gridSize + position[1];
  const tile = board._tiles?.[tileIdx];

  // Card's own passive (deactivated if flipped, unless it explicitly works post-flip)
  const passive = PASSIVES[card.passive_id];
  if (passive && isPassiveActive(card)) {
    const ctx = { card, position, board, turn, phase, totalTurns };
    const result = passive.apply(ctx);

    const times = (tile && tile.doublePassive) ? 2 : 1;
    const onSanctuary = tile && tile.noBuff;

    if (result.cardMods && !onSanctuary) {
      for (let i = 0; i < times; i++) {
        mods.north += result.cardMods.north || 0;
        mods.east += result.cardMods.east || 0;
        mods.south += result.cardMods.south || 0;
        mods.west += result.cardMods.west || 0;
      }
      if (result.cardMods.north || result.cardMods.east || result.cardMods.south || result.cardMods.west) {
        effects.push({ type: 'self_passive', name: passive.name, icon: passive.icon });
      }
    }
    if (result.flipImmunity) {
      effects.push({ type: 'flip_immunity', ...result.flipImmunity });
    }
    if (result.chainImmunity) {
      effects.push({ type: 'chain_immunity' });
    }
    if (result.noAuras) {
      return { north: card.north + mods.north, east: card.east + mods.east, south: card.south + mods.south, west: card.west + mods.west, mods, effects };
    }
  }

  // Tile faction bonus
  if (tile) {
    if (tile.mod) {
      mods.north += tile.mod.north || 0;
      mods.east += tile.mod.east || 0;
      mods.south += tile.mod.south || 0;
      mods.west += tile.mod.west || 0;
      effects.push({ type: 'tile', label: tile.label });
    }
    if (tile.factionBonus && card.faction === tile.factionBonus.faction) {
      const m = tile.factionBonus.mod || 0;
      const tilePhase = tile.factionBonus.phase;
      if (!tilePhase || tilePhase === phase) {
        mods.north += m; mods.east += m; mods.south += m; mods.west += m;
        effects.push({ type: 'tile_faction', label: tile.label, faction: tile.factionBonus.faction });
      }
    }
  }

  // Auras from adjacent cards
  const [r, c] = position;
  let globalAuraCount = 0;
  for (const [dir, [dr, dc]] of Object.entries(DIR_OFFSETS)) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    const adj = board[nr]?.[nc];
    if (!adj) continue;
    const adjPassive = PASSIVES[adj.passive_id];
    if (!adjPassive || !isPassiveActive(adj)) continue;
    const adjCtx = { card: adj, position: [nr, nc], board, turn, phase, totalTurns };
    const adjResult = adjPassive.apply(adjCtx);
    if (adjResult.aura) {
      const aura = adjResult.aura;
      const isAlly = adj.owner === card.owner;
      const isEnemy = adj.owner !== card.owner;
      if ((aura.target === 'allies' && isAlly) || (aura.target === 'enemies' && isEnemy)) {
        if (aura.factionFilter && card.faction !== aura.factionFilter) continue;
        if (aura.mod && !tile?.noBuff) {
          const auraMod = aura.mod;
          mods.north += auraMod; mods.east += auraMod; mods.south += auraMod; mods.west += auraMod;
          effects.push({ type: 'aura', from: adj.name, mod: auraMod });
        }
      }
    }
    // Global auras (capped at 2 sources per card)
    if (adjResult.globalAura) {
      const ga = adjResult.globalAura;
      const isAlly = adj.owner === card.owner;
      const isEnemy = adj.owner !== card.owner;
      if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
        if (ga.mod && !tile?.noBuff && globalAuraCount < 2) {
          globalAuraCount++;
          mods.north += ga.mod; mods.east += ga.mod; mods.south += ga.mod; mods.west += ga.mod;
          effects.push({ type: 'global_aura', from: adj.name, mod: ga.mod });
        }
      }
    }
  }

  // Also global auras from non-adjacent cards
  for (let ri = 0; ri < gridSize; ri++) {
    for (let ci = 0; ci < gridSize; ci++) {
      if (ri === r && ci === c) continue;
      if (Math.abs(ri - r) <= 1 && Math.abs(ci - c) <= 1 && (ri === r || ci === c)) continue; // already handled adjacent
      const other = board[ri]?.[ci];
      if (!other) continue;
      const otherPassive = PASSIVES[other.passive_id];
      if (!otherPassive || !isPassiveActive(other)) continue;
      const otherResult = otherPassive.apply({ card: other, position: [ri, ci], board, turn, phase, totalTurns });
      if (otherResult.globalAura) {
        const ga = otherResult.globalAura;
        const isAlly = other.owner === card.owner;
        const isEnemy = other.owner !== card.owner;
        if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
          if (ga.mod && !tile?.noBuff && globalAuraCount < 2) {
            globalAuraCount++;
            mods.north += ga.mod; mods.east += ga.mod; mods.south += ga.mod; mods.west += ga.mod;
            effects.push({ type: 'global_aura', from: other.name, mod: ga.mod });
          }
        }
      }
    }
  }

  return {
    north: card.north + mods.north,
    east: card.east + mods.east,
    south: card.south + mods.south,
    west: card.west + mods.west,
    mods,
    effects,
  };
}

export function placeCard(gameState, cardIndex, row, col) {
  const gs = JSON.parse(JSON.stringify(gameState));
  // Attach tiles reference - use Object.defineProperty so it survives on the array
  Object.defineProperty(gs.board, '_tiles', { value: gs.tiles, writable: true, enumerable: false, configurable: true });

  if (gs.gameOver) return gs;
  if (gs.board[row][col]) return gs;

  const hand = gs.currentPlayer === 1 ? gs.player1Hand : gs.player2Hand;
  if (cardIndex < 0 || cardIndex >= hand.length) return gs;

  const card = { ...hand[cardIndex], placedTurn: gs.turn };
  gs.board[row][col] = card;
  hand.splice(cardIndex, 1);

  const animations = [];

  // Process captures with chaining
  processCaptures(gs, row, col, card, animations, 0);

  // Record move
  gs.moves.push({
    player: gs.currentPlayer,
    cardId: card.card_id,
    cardName: card.name,
    row, col,
    turn: gs.turn,
    flips: animations.map(a => ({ row: a.row, col: a.col })),
  });

  // Calculate scores
  let p1 = 0, p2 = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (gs.board[r][c]) {
        if (gs.board[r][c].owner === 1) p1++;
        else p2++;
      }
    }
  }
  // Add remaining hand cards
  p1 += gs.player1Hand.length;
  p2 += gs.player2Hand.length;
  gs.scores = { 1: p1, 2: p2 };

  // Switch turn
  gs.turn++;
  gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;

  // Check game over (all tiles filled)
  const gridSize = gs.gridSize || 3;
  const filled = gs.board.flat().filter(c => c).length;
  if (filled === gridSize * gridSize) {
    gs.gameOver = true;
    // Count board control
    let b1 = 0, b2 = 0;
    gs.board.flat().forEach(c => { if (c.owner === 1) b1++; else b2++; });
    gs.scores = { 1: b1, 2: b2 };
    if (b1 > b2) gs.winner = 1;
    else if (b2 > b1) gs.winner = 2;
    else gs.winner = 0; // draw
  }

  gs.animations = animations;
  gs.passiveActivations = [];

  return gs;
}

export function getValidMoves(gameState) {
  const moves = [];
  const gridSize = gameState.gridSize || (gameState.board ? gameState.board.length : 3);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!gameState.board[r][c]) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

export function evaluateBoard(gameState, player) {
  let score = 0;
  const gridSize = gameState.gridSize || (gameState.board ? gameState.board.length : 3);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const card = gameState.board[r][c];
      if (card) {
        if (card.owner === player) score += 10;
        else score -= 10;
      }
    }
  }
  return score;
}

function processCaptures(gs, row, col, card, animations, chainOrder) {
  const newlyFlipped = [];
  const gridSize = gs.gridSize || 3;

  for (const [dir, [dr, dc]] of Object.entries(DIR_OFFSETS)) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    const defender = gs.board[nr][nc];
    if (!defender || defender.owner === card.owner) continue;

    const attackStats = getEffectiveStats(card, [row, col], gs.board, gs.turn, 'attack');
    const defendStats = getEffectiveStats(defender, [nr, nc], gs.board, gs.turn, 'defend');

    const attackVal = attackStats[dir];
    const defendVal = defendStats[OPPOSITE[dir]];

    // Check flip immunity
    const defEffects = defendStats.effects || [];
    const immunity = defEffects.find(e => e.type === 'flip_immunity');
    if (immunity) {
      const attackTotal = card.north + card.east + card.south + card.west;
      if (attackTotal < immunity.minTotalPower) continue;
    }
    // Check chain immunity (prevents flips from chain reactions, not direct attacks)
    const hasChainImmunity = defEffects.some(e => e.type === 'chain_immunity');
    if (hasChainImmunity && chainOrder > 0) continue;

    if (attackVal > defendVal) {
      const oldOwner = defender.owner;
      gs.board[nr][nc].owner = card.owner;
      gs.board[nr][nc].wasFlipped = true;

      if (!gs.board[row][col].flipsEarned) gs.board[row][col].flipsEarned = 0;
      gs.board[row][col].flipsEarned++;

      animations.push({
        type: 'flip', row: nr, col: nc,
        from: oldOwner, to: card.owner,
        attackDir: dir, attackVal, defendVal,
        chainOrder,
      });

      newlyFlipped.push({ row: nr, col: nc });
    }
  }

  // Chain: newly flipped cards attempt to flip their adjacent enemies
  for (const { row: fr, col: fc } of newlyFlipped) {
    processCaptures(gs, fr, fc, gs.board[fr][fc], animations, chainOrder + 1);
  }
}

// Returns all active aura/debuff effects currently on the board
export function getActiveBoardEffects(gameState) {
  if (!gameState?.board) return [];
  const effects = [];
  const board = gameState.board;

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const card = board[r][c];
      if (!card) continue;
      const passive = PASSIVES[card.passive_id];
      if (!passive || !isPassiveActive(card)) continue;
      const result = passive.apply({ card, position: [r, c], board, turn: gameState.turn, phase: 'static', totalTurns });

      if (result.aura && result.aura.mod) {
        effects.push({
          sourceCard: card.name,
          passiveName: passive.name,
          icon: passive.icon,
          description: passive.description,
          target: result.aura.target,
          mod: result.aura.mod,
          scope: 'adjacent',
        });
      }
      if (result.globalAura && result.globalAura.mod) {
        effects.push({
          sourceCard: card.name,
          passiveName: passive.name,
          icon: passive.icon,
          description: passive.description,
          target: result.globalAura.target,
          mod: result.globalAura.mod,
          scope: 'global',
        });
      }
    }
  }

  return effects;
}

// Computes preview stats for a card still in hand — accounts for global auras
// that apply regardless of placement (e.g., Plague, Commander)
export function getHandCardPreview(card, gameState) {
  if (!card || !gameState?.board) return null;

  let mods = { north: 0, east: 0, south: 0, west: 0 };
  let effects = [];
  const board = gameState.board;

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const boardCard = board[r][c];
      if (!boardCard) continue;
      const passive = PASSIVES[boardCard.passive_id];
      if (!passive || !isPassiveActive(boardCard)) continue;
      const result = passive.apply({ card: boardCard, position: [r, c], board, turn: gameState.turn, phase: 'static', totalTurns });

      if (result.globalAura) {
        const ga = result.globalAura;
        const isAlly = boardCard.owner === card.owner;
        const isEnemy = boardCard.owner !== card.owner;
        if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
          if (ga.mod) {
            mods.north += ga.mod; mods.east += ga.mod; mods.south += ga.mod; mods.west += ga.mod;
            effects.push({ type: 'global_aura', from: boardCard.name, mod: ga.mod, icon: passive.icon });
          }
        }
      }
    }
  }

  return {
    north: card.north + mods.north,
    east: card.east + mods.east,
    south: card.south + mods.south,
    west: card.west + mods.west,
    mods,
    effects,
  };
}