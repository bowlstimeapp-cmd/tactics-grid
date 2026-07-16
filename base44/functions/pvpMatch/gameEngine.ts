// ============================================================================
// SERVER-SIDE GAME ENGINE — DUPLICATED FROM src/lib/gameEngine.js
// Any future balance/engine change MUST be applied to BOTH this file and
// the client copy at src/lib/gameEngine.js. They must stay line-for-line in sync.
// ============================================================================

import { PASSIVES, BOARD_LAYOUTS, isSupportPassive, getRandomLayout } from './gameData.ts';

const OPPOSITE: Record<string, string> = { north: 'south', south: 'north', east: 'west', west: 'east' };
const DIR_OFFSETS: Record<string, number[]> = {
  north: [-1, 0], south: [1, 0], east: [0, 1], west: [0, -1]
};

const POST_FLIP_PASSIVES = ['flip_revenge', 'phoenix'];

function isPassiveActive(card: any, turn?: number) {
  if (!card.wasFlipped) return true;
  if (POST_FLIP_PASSIVES.includes(card.passive_id)) return true;
  if (isSupportPassive(card.passive_id)) {
    if (card.flippedTurn !== undefined && turn !== undefined) {
      return turn < card.flippedTurn + 2;
    }
    return false;
  }
  return false;
}

export function getCardPassiveStatus(card: any, turn?: number) {
  if (!card || !card.passive_id || card.passive_id === 'none') return 'none';
  if (!card.wasFlipped) return 'active';
  if (POST_FLIP_PASSIVES.includes(card.passive_id)) return 'active';
  if (isSupportPassive(card.passive_id)) {
    if (card.flippedTurn !== undefined && turn !== undefined && turn < card.flippedTurn + 2) {
      return 'lingering';
    }
    return 'expired';
  }
  return 'inactive';
}

function lockExpiringAuras(gs: any) {
  const turn = gs.turn;
  const gridSize = gs.gridSize || 3;
  const totalTurns = gridSize * gridSize;
  const tiles = gs.tiles;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const card = gs.board[r]?.[c];
      if (!card) continue;
      if (!isSupportPassive(card.passive_id)) continue;
      if (card.flippedTurn === undefined || turn !== card.flippedTurn + 1) continue;

      const passive = PASSIVES[card.passive_id];
      if (!passive) continue;
      const ctx = { card, position: [r, c], board: gs.board, turn, phase: 'static', totalTurns, getEffectiveStats };
      const result = passive.apply(ctx);

      // Lock adjacent aura (doubled if source on doublePassive tile)
      if (result.aura && result.aura.mod) {
        const aura = result.aura;
        const sourceTileIdx = r * gridSize + c;
        const sourceTile = tiles?.[sourceTileIdx];
        const effectiveMod = (sourceTile && sourceTile.doublePassive) ? aura.mod * 2 : aura.mod;
        for (const [dr, dc] of Object.values(DIR_OFFSETS)) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
          const recipient = gs.board[nr][nc];
          if (!recipient) continue;
          if (recipient.passive_id === 'anchor') continue;
          const tileIdx = nr * gridSize + nc;
          if (tiles?.[tileIdx]?.noBuff) continue;
          const isAlly = recipient.owner === card.originalOwner;
          const isEnemy = recipient.owner !== card.originalOwner;
          if ((aura.target === 'allies' && isAlly) || (aura.target === 'enemies' && isEnemy)) {
            if (aura.factionFilter && recipient.faction !== aura.factionFilter) continue;
            if (!recipient.lockedAuraMods) recipient.lockedAuraMods = { north: 0, east: 0, south: 0, west: 0 };
            recipient.lockedAuraMods.north += effectiveMod;
            recipient.lockedAuraMods.east += effectiveMod;
            recipient.lockedAuraMods.south += effectiveMod;
            recipient.lockedAuraMods.west += effectiveMod;
          }
        }
      }

      // Lock global aura (capped at 2 per recipient, doubled if source on doublePassive tile)
      if (result.globalAura && result.globalAura.mod) {
        const ga = result.globalAura;
        const sourceTileIdx = r * gridSize + c;
        const sourceTile = tiles?.[sourceTileIdx];
        const effectiveMod = (sourceTile && sourceTile.doublePassive) ? ga.mod * 2 : ga.mod;
        let count = 0;
        for (let ri = 0; ri < gridSize; ri++) {
          for (let ci = 0; ci < gridSize; ci++) {
            if (ri === r && ci === c) continue;
            const recipient = gs.board[ri][ci];
            if (!recipient) continue;
            if (recipient.passive_id === 'anchor') continue;
            const tileIdx = ri * gridSize + ci;
            if (tiles?.[tileIdx]?.noBuff) continue;
            const isAlly = recipient.owner === card.originalOwner;
            const isEnemy = recipient.owner !== card.originalOwner;
            if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
              if (count < 2) {
                count++;
                if (!recipient.lockedAuraMods) recipient.lockedAuraMods = { north: 0, east: 0, south: 0, west: 0 };
                recipient.lockedAuraMods.north += effectiveMod;
                recipient.lockedAuraMods.east += effectiveMod;
                recipient.lockedAuraMods.south += effectiveMod;
                recipient.lockedAuraMods.west += effectiveMod;
              }
            }
          }
        }
      }
    }
  }
}

export function createGameState(player1Cards: any[], player2Cards: any[], layoutKey = 'standard', firstPlayer = 1, gameMode = 'standard') {
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

export function getEffectiveStats(card: any, position: number[], board: any, turn?: number, phase = 'static') {
  if (!card) return null;
  let mods: any = { north: 0, east: 0, south: 0, west: 0 };
  let effects: any[] = [];

  if (card.lockedAuraMods) {
    mods.north += card.lockedAuraMods.north || 0;
    mods.east += card.lockedAuraMods.east || 0;
    mods.south += card.lockedAuraMods.south || 0;
    mods.west += card.lockedAuraMods.west || 0;
  }

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  const tileIdx = position[0] * gridSize + position[1];
  const tile = (board as any)._tiles?.[tileIdx];

  const passive = PASSIVES[card.passive_id];
  if (passive && isPassiveActive(card, turn)) {
    const ctx = { card, position, board, turn, phase, totalTurns, getEffectiveStats };
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

  const [r, c] = position;
  let globalAuraCount = 0;
  for (const [dir, [dr, dc]] of Object.entries(DIR_OFFSETS)) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    const adj = board[nr]?.[nc];
    if (!adj) continue;
    const adjPassive = PASSIVES[adj.passive_id];
    if (!adjPassive || !isPassiveActive(adj, turn)) continue;
    const adjCtx = { card: adj, position: [nr, nc], board, turn, phase, totalTurns, getEffectiveStats };
    const adjResult = adjPassive.apply(adjCtx);
    if (adjResult.aura) {
      const aura = adjResult.aura;
      const auraSourceOwner = adj.originalOwner ?? adj.owner;
      const isAlly = card.owner === auraSourceOwner;
      const isEnemy = card.owner !== auraSourceOwner;
      if ((aura.target === 'allies' && isAlly) || (aura.target === 'enemies' && isEnemy)) {
        if (aura.factionFilter && card.faction !== aura.factionFilter) continue;
        const adjTileIdx = nr * gridSize + nc;
        const adjTile = (board as any)._tiles?.[adjTileIdx];
        const auraMod = (adjTile && adjTile.doublePassive) ? aura.mod * 2 : aura.mod;
        if (auraMod && !tile?.noBuff) {
          mods.north += auraMod; mods.east += auraMod; mods.south += auraMod; mods.west += auraMod;
          effects.push({ type: 'aura', from: adj.name, mod: auraMod });
        }
      }
    }
    if (adjResult.globalAura) {
      const ga = adjResult.globalAura;
      const auraSourceOwner = adj.originalOwner ?? adj.owner;
      const isAlly = card.owner === auraSourceOwner;
      const isEnemy = card.owner !== auraSourceOwner;
      if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
        const adjTileIdx = nr * gridSize + nc;
        const adjTile = (board as any)._tiles?.[adjTileIdx];
        const gaMod = (adjTile && adjTile.doublePassive) ? ga.mod * 2 : ga.mod;
        if (gaMod && !tile?.noBuff && globalAuraCount < 2) {
          globalAuraCount++;
          mods.north += gaMod; mods.east += gaMod; mods.south += gaMod; mods.west += gaMod;
          effects.push({ type: 'global_aura', from: adj.name, mod: gaMod });
        }
      }
    }
  }

  for (let ri = 0; ri < gridSize; ri++) {
    for (let ci = 0; ci < gridSize; ci++) {
      if (ri === r && ci === c) continue;
      if (Math.abs(ri - r) <= 1 && Math.abs(ci - c) <= 1 && (ri === r || ci === c)) continue;
      const other = board[ri]?.[ci];
      if (!other) continue;
      const otherPassive = PASSIVES[other.passive_id];
      if (!otherPassive || !isPassiveActive(other, turn)) continue;
      const otherResult = otherPassive.apply({ card: other, position: [ri, ci], board, turn, phase, totalTurns, getEffectiveStats });
      if (otherResult.globalAura) {
        const ga = otherResult.globalAura;
        const auraSourceOwner = other.originalOwner ?? other.owner;
        const isAlly = card.owner === auraSourceOwner;
        const isEnemy = card.owner !== auraSourceOwner;
        if ((ga.target === 'allies' && isAlly) || (ga.target === 'enemies' && isEnemy)) {
          const otherTileIdx = ri * gridSize + ci;
          const otherTile = (board as any)._tiles?.[otherTileIdx];
          const gaMod = (otherTile && otherTile.doublePassive) ? ga.mod * 2 : ga.mod;
          if (gaMod && !tile?.noBuff && globalAuraCount < 2) {
            globalAuraCount++;
            mods.north += gaMod; mods.east += gaMod; mods.south += gaMod; mods.west += gaMod;
            effects.push({ type: 'global_aura', from: other.name, mod: gaMod });
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

export function placeCard(gameState: any, cardIndex: number, row: number, col: number) {
  const gs = JSON.parse(JSON.stringify(gameState));
  Object.defineProperty(gs.board, '_tiles', { value: gs.tiles, writable: true, enumerable: false, configurable: true });

  if (gs.gameOver) return gs;
  if (gs.board[row][col]) return gs;

  const hand = gs.currentPlayer === 1 ? gs.player1Hand : gs.player2Hand;
  if (cardIndex < 0 || cardIndex >= hand.length) return gs;

  const card = { ...hand[cardIndex], placedTurn: gs.turn, lockedAuraMods: { north: 0, east: 0, south: 0, west: 0 } };
  gs.board[row][col] = card;
  hand.splice(cardIndex, 1);

  const animations: any[] = [];

  processCaptures(gs, row, col, card, animations, 0);

  gs.moves.push({
    player: gs.currentPlayer,
    cardId: card.card_id,
    cardName: card.name,
    row, col,
    turn: gs.turn,
    flips: animations.map(a => ({ row: a.row, col: a.col })),
  });

  let p1 = 0, p2 = 0;
  const gridSize = gs.gridSize || 3;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (gs.board[r][c]) {
        if (gs.board[r][c].owner === 1) p1++;
        else p2++;
      }
    }
  }
  p1 += gs.player1Hand.length;
  p2 += gs.player2Hand.length;
  gs.scores = { 1: p1, 2: p2 };

  lockExpiringAuras(gs);

  gs.turn++;
  gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;

  const filled = gs.board.flat().filter((c: any) => c).length;
  if (filled === gridSize * gridSize) {
    gs.gameOver = true;
    let b1 = 0, b2 = 0;
    gs.board.flat().forEach((c: any) => { if (c.owner === 1) b1++; else b2++; });
    gs.scores = { 1: b1, 2: b2 };
    if (b1 > b2) gs.winner = 1;
    else if (b2 > b1) gs.winner = 2;
    else gs.winner = 0;
  }

  gs.animations = animations;
  gs.passiveActivations = [];

  return gs;
}

function processCaptures(gs: any, row: number, col: number, card: any, animations: any[], chainOrder: number) {
  const newlyFlipped: any[] = [];
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

    const defEffects = defendStats.effects || [];
    const immunity = defEffects.find((e: any) => e.type === 'flip_immunity');
    if (immunity) {
      const attackTotal = attackStats.north + attackStats.east + attackStats.south + attackStats.west;
      if (attackTotal < immunity.minTotalPower) continue;
    }
    const hasChainImmunity = defEffects.some((e: any) => e.type === 'chain_immunity');
    if (hasChainImmunity && chainOrder > 0) continue;

    if (attackVal > defendVal) {
      const oldOwner = defender.owner;
      gs.board[nr][nc].owner = card.owner;
      gs.board[nr][nc].wasFlipped = true;
      if (gs.board[nr][nc].flippedTurn === undefined) gs.board[nr][nc].flippedTurn = gs.turn;

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

  for (const { row: fr, col: fc } of newlyFlipped) {
    processCaptures(gs, fr, fc, gs.board[fr][fc], animations, chainOrder + 1);
  }
}

export function getActiveBoardEffects(gameState: any) {
  if (!gameState?.board) return [];
  const effects: any[] = [];
  const board = gameState.board;

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const card = board[r][c];
      if (!card) continue;
      const passive = PASSIVES[card.passive_id];
      if (!passive || !isPassiveActive(card, gameState.turn)) continue;
      const sourceTileIdx = r * gridSize + c;
      const sourceTile = (board as any)._tiles?.[sourceTileIdx];
      const sourceDouble = sourceTile && sourceTile.doublePassive;
      const result = passive.apply({ card, position: [r, c], board, turn: gameState.turn, phase: 'static', totalTurns, getEffectiveStats });

      if (result.aura && result.aura.mod) {
        const auraMod = sourceDouble ? result.aura.mod * 2 : result.aura.mod;
        effects.push({
          sourceCard: card.name,
          passiveName: passive.name,
          icon: passive.icon,
          description: passive.description,
          target: result.aura.target,
          mod: auraMod,
          scope: 'adjacent',
        });
      }
      if (result.globalAura && result.globalAura.mod) {
        const gaMod = sourceDouble ? result.globalAura.mod * 2 : result.globalAura.mod;
        effects.push({
          sourceCard: card.name,
          passiveName: passive.name,
          icon: passive.icon,
          description: passive.description,
          target: result.globalAura.target,
          mod: gaMod,
          scope: 'global',
        });
      }
    }
  }

  return effects;
}

export function getHandCardPreview(card: any, gameState: any) {
  if (!card || !gameState?.board) return null;

  let mods: any = { north: 0, east: 0, south: 0, west: 0 };
  let effects: any[] = [];
  const board = gameState.board;

  const gridSize = board.length;
  const totalTurns = gridSize * gridSize;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const boardCard = board[r][c];
      if (!boardCard) continue;
      const passive = PASSIVES[boardCard.passive_id];
      if (!passive || !isPassiveActive(boardCard, gameState.turn)) continue;
      const result = passive.apply({ card: boardCard, position: [r, c], board, turn: gameState.turn, phase: 'static', totalTurns, getEffectiveStats });

      if (result.globalAura) {
        const ga = result.globalAura;
        const auraSourceOwner = boardCard.originalOwner ?? boardCard.owner;
        const isAlly = card.owner === auraSourceOwner;
        const isEnemy = card.owner !== auraSourceOwner;
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

export { getRandomLayout };