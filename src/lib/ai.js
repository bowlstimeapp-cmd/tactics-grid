import { placeCard, getValidMoves, evaluateBoard } from './gameEngine';

// ── Easy AI: random with some mistakes ──
export function easyAI(gameState) {
  const hand = gameState.currentPlayer === 1 ? gameState.player1Hand : gameState.player2Hand;
  const moves = getValidMoves(gameState);
  const cardIdx = Math.floor(Math.random() * hand.length);
  const [row, col] = moves[Math.floor(Math.random() * moves.length)];
  return { cardIndex: cardIdx, row, col };
}

// ── Medium AI: greedy one-step lookahead ──
export function mediumAI(gameState) {
  const player = gameState.currentPlayer;
  const hand = player === 1 ? gameState.player1Hand : gameState.player2Hand;
  const moves = getValidMoves(gameState);

  let bestScore = -Infinity;
  let bestMove = null;

  for (let ci = 0; ci < hand.length; ci++) {
    for (const [r, c] of moves) {
      const newState = placeCard(gameState, ci, r, c);
      const score = evaluateBoard(newState, player);
      // Prefer corners and center
      const gridSize = newState.board.length;
      const isCenter = gridSize === 4 ? (r >= 1 && r <= 2 && c >= 1 && c <= 2) : (r === 1 && c === 1);
      const posBonus = isCenter ? 3 : ((r + c) % 2 === 0 ? 1 : 0);
      const total = score + posBonus + (newState.animations?.length || 0) * 5;
      if (total > bestScore) {
        bestScore = total;
        bestMove = { cardIndex: ci, row: r, col: c };
      }
    }
  }
  return bestMove;
}

// ── Hard AI: minimax with alpha-beta pruning ──
export function hardAI(gameState) {
  const player = gameState.currentPlayer;
  const hand = player === 1 ? gameState.player1Hand : gameState.player2Hand;
  const moves = getValidMoves(gameState);

  let bestScore = -Infinity;
  let bestMove = null;

  for (let ci = 0; ci < hand.length; ci++) {
    for (const [r, c] of moves) {
      const newState = placeCard(gameState, ci, r, c);
      const score = minimax(newState, 2, -Infinity, Infinity, false, player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = { cardIndex: ci, row: r, col: c };
      }
    }
  }
  return bestMove;
}

function minimax(state, depth, alpha, beta, isMaximizing, player) {
  if (depth === 0 || state.gameOver) {
    return evaluateBoard(state, player);
  }

  const moves = getValidMoves(state);
  const hand = state.currentPlayer === 1 ? state.player1Hand : state.player2Hand;

  if (moves.length === 0 || hand.length === 0) {
    return evaluateBoard(state, player);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let ci = 0; ci < hand.length; ci++) {
      for (const [r, c] of moves) {
        const newState = placeCard(state, ci, r, c);
        const ev = minimax(newState, depth - 1, alpha, beta, false, player);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let ci = 0; ci < hand.length; ci++) {
      for (const [r, c] of moves) {
        const newState = placeCard(state, ci, r, c);
        const ev = minimax(newState, depth - 1, alpha, beta, true, player);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(gameState, difficulty = 'medium') {
  switch (difficulty) {
    case 'easy': return easyAI(gameState);
    case 'hard': return hardAI(gameState);
    default: return mediumAI(gameState);
  }
}