import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { createGameState, placeCard, getRandomLayout } from './gameEngine.ts';

// Move-timing guard: minimum ms between moves from the same player
const MIN_MOVE_INTERVAL_MS = 300;
const MAX_TURN_TIME_MS = 60000; // 60 seconds per turn before auto-forfeit

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── JOIN QUEUE / MATCHMAKE ──
    if (action === 'join') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { player_name, elo, cards, game_mode, challenged_id } = body;
      if (!cards || cards.length === 0) return Response.json({ error: 'No cards provided' }, { status: 400 });

      // Check for existing matched queue entry
      const matched = await base44.asServiceRole.entities.MatchQueue.filter({
        player_id: user.id, status: 'matched'
      });
      if (matched.length > 0 && matched[0].match_id) {
        const match = await base44.asServiceRole.entities.PvpMatch.get(matched[0].match_id);
        if (match) return Response.json({ status: 'matched', match });
      }

      // Clean up old searching entries for this player
      await base44.asServiceRole.entities.MatchQueue.deleteMany({
        player_id: user.id, status: 'searching'
      });

      // Challenge-based matchmaking: check for mutual challenge
      if (challenged_id) {
        const mutualEntries = await base44.asServiceRole.entities.MatchQueue.filter({
          player_id: challenged_id, status: 'searching'
        });
        const mutualEntry = mutualEntries.find(q => q.challenged_id === user.id);
        if (mutualEntry && mutualEntry.cards) {
          const player1First = Math.random() < 0.5;
          const p1 = player1First
            ? { id: user.id, name: player_name, elo, cards }
            : { id: mutualEntry.player_id, name: mutualEntry.player_name, elo: mutualEntry.elo, cards: mutualEntry.cards };
          const p2 = player1First
            ? { id: mutualEntry.player_id, name: mutualEntry.player_name, elo: mutualEntry.elo, cards: mutualEntry.cards }
            : { id: user.id, name: player_name, elo, cards };

          const mode = game_mode || 'standard';
          const gridSize = mode === 'enlarged' ? 4 : 3;
          const layoutKey = getRandomLayout(gridSize);
          const tossWinner = Math.random() < 0.5 ? 1 : 2;
          const gameState = createGameState(p1.cards, p2.cards, layoutKey, 0, mode);

          const match = await base44.asServiceRole.entities.PvpMatch.create({
            player1_id: p1.id, player2_id: p2.id,
            player1_name: p1.name, player2_name: p2.name,
            player1_cards: p1.cards, player2_cards: p2.cards,
            game_state: gameState, current_player: 0,
            status: 'active', winner: 0,
            player1_elo_before: p1.elo, player2_elo_before: p2.elo,
            player1_elo_after: 0, player2_elo_after: 0,
            layout_key: layoutKey, game_mode: mode,
            toss_winner: tossWinner,
            last_move_at: new Date().toISOString(),
          });

          await base44.asServiceRole.entities.MatchQueue.updateMany(
            { player_id: mutualEntry.player_id, status: 'searching' },
            { $set: { status: 'matched', match_id: match.id } }
          );
          await base44.asServiceRole.entities.MatchQueue.create({
            player_id: user.id, player_name, elo, cards,
            status: 'matched', match_id: match.id,
          });

          return Response.json({ status: 'matched', match });
        }
      }

      // Open matchmaking (skip if challenging a specific friend)
      let eligible: any[] = [];
      if (!challenged_id) {
        const allSearching = await base44.asServiceRole.entities.MatchQueue.filter({
          status: 'searching'
        });
        eligible = allSearching.filter(q =>
          q.player_id !== user.id && Math.abs(q.elo - elo) <= 200 &&
          (q.game_mode || 'standard') === (game_mode || 'standard') &&
          !q.challenged_id
        );
      }

      if (eligible.length > 0) {
        const opp = eligible[0];

        const player1First = Math.random() < 0.5;
        const p1 = player1First
          ? { id: user.id, name: player_name, elo, cards }
          : { id: opp.player_id, name: opp.player_name, elo: opp.elo, cards: opp.cards };
        const p2 = player1First
          ? { id: opp.player_id, name: opp.player_name, elo: opp.elo, cards: opp.cards }
          : { id: user.id, name: player_name, elo, cards };

        const mode = game_mode || 'standard';
        const gridSize = mode === 'enlarged' ? 4 : 3;
        const layoutKey = getRandomLayout(gridSize);
        const tossWinner = Math.random() < 0.5 ? 1 : 2;
        const gameState = createGameState(p1.cards, p2.cards, layoutKey, 0, mode);

        const match = await base44.asServiceRole.entities.PvpMatch.create({
          player1_id: p1.id,
          player2_id: p2.id,
          player1_name: p1.name,
          player2_name: p2.name,
          player1_cards: p1.cards,
          player2_cards: p2.cards,
          game_state: gameState,
          current_player: 0,
          status: 'active',
          winner: 0,
          player1_elo_before: p1.elo,
          player2_elo_before: p2.elo,
          player1_elo_after: 0,
          player2_elo_after: 0,
          layout_key: layoutKey,
          game_mode: game_mode || 'standard',
          toss_winner: tossWinner,
          last_move_at: new Date().toISOString(),
        });

        await base44.asServiceRole.entities.MatchQueue.updateMany(
          { player_id: opp.player_id, status: 'searching' },
          { $set: { status: 'matched', match_id: match.id } }
        );

        await base44.asServiceRole.entities.MatchQueue.create({
          player_id: user.id,
          player_name,
          elo,
          status: 'matched',
          match_id: match.id,
        });

        return Response.json({ status: 'matched', match });
      }

      await base44.asServiceRole.entities.MatchQueue.create({
        player_id: user.id,
        player_name,
        elo,
        cards,
        status: 'searching',
        match_id: '',
        game_mode: game_mode || 'standard',
        challenged_id: challenged_id || '',
      });

      return Response.json({ status: 'searching' });
    }

    // ── CANCEL QUEUE ──
    if (action === 'cancel') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      await base44.asServiceRole.entities.MatchQueue.updateMany(
        { player_id: user.id, status: 'searching' },
        { $set: { status: 'cancelled' } }
      );
      return Response.json({ status: 'cancelled' });
    }

    // ── SUBMIT TOSS CHOICE ──
    if (action === 'submit_toss_choice') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id, choice } = body;
      if (choice !== 1 && choice !== 2) {
        return Response.json({ error: 'Invalid choice' }, { status: 400 });
      }

      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }
      if (match.status !== 'active') {
        return Response.json({ error: 'Match not active' }, { status: 400 });
      }
      if (match.current_player !== 0) {
        return Response.json({ error: 'Toss already decided' }, { status: 400 });
      }

      const playerNum = match.player1_id === user.id ? 1 : 2;
      if (match.toss_winner !== playerNum) {
        return Response.json({ error: 'Not toss winner' }, { status: 403 });
      }

      const gs = match.game_state;
      if (!gs) return Response.json({ error: 'No game state' }, { status: 400 });

      gs.currentPlayer = choice;

      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        game_state: gs,
        current_player: choice,
        last_move_at: new Date().toISOString(),
      });

      return Response.json({ match: updated });
    }

    // ── SUBMIT MOVE (server-authoritative) ──
    if (action === 'submit_move') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id, card_index, row, col } = body;
      if (match_id === undefined || card_index === undefined || row === undefined || col === undefined) {
        return Response.json({ error: 'Missing move parameters' }, { status: 400 });
      }

      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }
      if (match.status !== 'active') {
        return Response.json({ error: 'Match not active' }, { status: 400 });
      }

      // Check for turn timeout before processing move
      const timeoutResult = await checkAndProcessTimeout(base44, match);
      if (timeoutResult) {
        return Response.json(timeoutResult);
      }

      const playerNum = match.player1_id === user.id ? 1 : 2;
      const gs = match.game_state;

      if (!gs) return Response.json({ error: 'No game state' }, { status: 400 });
      if (gs.currentPlayer !== playerNum) {
        return Response.json({ error: 'Not your turn' }, { status: 400 });
      }

      // Move-timing guard
      const now = Date.now();
      if (match.last_move_at) {
        const elapsed = now - new Date(match.last_move_at).getTime();
        if (elapsed < MIN_MOVE_INTERVAL_MS) {
          return Response.json({ error: 'Move too fast' }, { status: 429 });
        }
      }

      // Move replay guard: check turn hasn't already been processed
      const moveCount = (gs.moves || []).length;
      const expectedMoves = gs.turn - 1; // turn 1 = 0 moves, turn 2 = 1 move, etc.
      if (moveCount > expectedMoves) {
        return Response.json({ error: 'Turn already processed' }, { status: 409 });
      }

      // Validate move
      const gridSize = gs.gridSize || 3;
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
        return Response.json({ error: 'Invalid position' }, { status: 400 });
      }
      if (gs.board[row][col]) {
        return Response.json({ error: 'Cell occupied' }, { status: 400 });
      }
      const hand = gs.currentPlayer === 1 ? gs.player1Hand : gs.player2Hand;
      if (card_index < 0 || card_index >= hand.length) {
        return Response.json({ error: 'Invalid card index' }, { status: 400 });
      }

      // Run placeCard server-side to compute authoritative new state
      const newGameState = placeCard(gs, card_index, row, col);

      // If placeCard didn't change anything (invalid move), reject
      if (newGameState.turn === gs.turn) {
        return Response.json({ error: 'Invalid move' }, { status: 400 });
      }

      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        game_state: newGameState,
        current_player: newGameState.currentPlayer,
        last_move_at: new Date().toISOString(),
      });

      return Response.json({ match: updated });
    }

    // ── END MATCH (server-authoritative winner) ──
    if (action === 'end_match') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id } = body;
      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }

      // If already completed, return stored results
      if (match.status === 'completed') {
        return Response.json({
          match,
          elo: {
            player1_elo_before: match.player1_elo_before,
            player2_elo_before: match.player2_elo_before,
            player1_elo_after: match.player1_elo_after,
            player2_elo_after: match.player2_elo_after,
          }
        });
      }

      // Server-authoritative: read winner from game_state, reject if game not over
      const gs = match.game_state;
      if (!gs || !gs.gameOver) {
        return Response.json({ error: 'Game not finished' }, { status: 400 });
      }
      const winner = gs.winner ?? 0;

      // Calculate ELO
      const p1Elo = match.player1_elo_before;
      const p2Elo = match.player2_elo_before;
      const expected1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const expected2 = 1 - expected1;
      const K = 32;
      const s1 = winner === 1 ? 1 : winner === 2 ? 0 : 0.5;
      const s2 = 1 - s1;
      const newElo1 = Math.round(p1Elo + K * (s1 - expected1));
      const newElo2 = Math.round(p2Elo + K * (s2 - expected2));

      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        status: 'completed',
        winner,
        player1_elo_after: newElo1,
        player2_elo_after: newElo2,
      });

      await updatePlayerProfiles(base44, match, winner);
      const eloChangeEnd = winner === 1 ? newElo1 - p1Elo : newElo2 - p2Elo;
      await createMatchRecord(base44, match, winner, eloChangeEnd);

      return Response.json({
        match: updated,
        elo: {
          player1_elo_before: p1Elo,
          player2_elo_before: p2Elo,
          player1_elo_after: newElo1,
          player2_elo_after: newElo2,
        }
      });
    }

    // ── FORFEIT ──
    if (action === 'forfeit') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id } = body;
      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }
      if (match.status === 'completed') {
        return Response.json({
          match,
          elo: {
            player1_elo_before: match.player1_elo_before,
            player2_elo_before: match.player2_elo_before,
            player1_elo_after: match.player1_elo_after,
            player2_elo_after: match.player2_elo_after,
          }
        });
      }

      const playerNum = match.player1_id === user.id ? 1 : 2;
      const winner = playerNum === 1 ? 2 : 1;

      const p1Elo = match.player1_elo_before;
      const p2Elo = match.player2_elo_before;
      const expected1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const expected2 = 1 - expected1;
      const K = 32;
      const s1 = winner === 1 ? 1 : winner === 2 ? 0 : 0.5;
      const s2 = 1 - s1;
      const newElo1 = Math.round(p1Elo + K * (s1 - expected1));
      const newElo2 = Math.round(p2Elo + K * (s2 - expected2));

      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        status: 'completed',
        winner,
        player1_elo_after: newElo1,
        player2_elo_after: newElo2,
      });

      await updatePlayerProfiles(base44, match, winner);
      const eloChangeForfeit = winner === 1 ? newElo1 - p1Elo : newElo2 - p2Elo;
      await createMatchRecord(base44, match, winner, eloChangeForfeit);

      return Response.json({
        match: updated,
        elo: {
          player1_elo_before: p1Elo,
          player2_elo_before: p2Elo,
          player1_elo_after: newElo1,
          player2_elo_after: newElo2,
        }
      });
    }

    // ── CHECK TIMEOUT (polled by clients) ──
    if (action === 'check_timeout') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id } = body;
      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }

      const timeoutResult = await checkAndProcessTimeout(base44, match);
      if (timeoutResult) return Response.json(timeoutResult);

      return Response.json({ timeout: false });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function updatePlayerProfiles(base44: any, match: any, winner: number) {
  const p1Profiles = await base44.asServiceRole.entities.PlayerProfile.filter({ created_by_id: match.player1_id });
  const p2Profiles = await base44.asServiceRole.entities.PlayerProfile.filter({ created_by_id: match.player2_id });

  const newElo1 = match.player1_elo_after;
  const newElo2 = match.player2_elo_after;

  if (p1Profiles[0]) {
    const won = winner === 1;
    const streak = won ? (p1Profiles[0].win_streak || 0) + 1 : 0;
    await base44.asServiceRole.entities.PlayerProfile.update(p1Profiles[0].id, {
      elo: newElo1,
      games_played: (p1Profiles[0].games_played || 0) + 1,
      wins: (p1Profiles[0].wins || 0) + (won ? 1 : 0),
      losses: (p1Profiles[0].losses || 0) + (winner === 2 ? 1 : 0),
      draws: (p1Profiles[0].draws || 0) + (winner === 0 ? 1 : 0),
      win_streak: streak,
      best_win_streak: Math.max(p1Profiles[0].best_win_streak || 0, streak),
    });
  }
  if (p2Profiles[0]) {
    const won = winner === 2;
    const streak = won ? (p2Profiles[0].win_streak || 0) + 1 : 0;
    await base44.asServiceRole.entities.PlayerProfile.update(p2Profiles[0].id, {
      elo: newElo2,
      games_played: (p2Profiles[0].games_played || 0) + 1,
      wins: (p2Profiles[0].wins || 0) + (won ? 1 : 0),
      losses: (p2Profiles[0].losses || 0) + (winner === 1 ? 1 : 0),
      draws: (p2Profiles[0].draws || 0) + (winner === 0 ? 1 : 0),
      win_streak: streak,
      best_win_streak: Math.max(p2Profiles[0].best_win_streak || 0, streak),
    });
  }
}

async function createMatchRecord(base44: any, match: any, winner: number, eloChange: number) {
  try {
    const gs = match.game_state;
    const moves = gs?.moves || [];
    const durationSeconds = match.created_date ? Math.round((Date.now() - new Date(match.created_date).getTime()) / 1000) : 0;
    const winnerId = winner === 1 ? match.player1_id : winner === 2 ? match.player2_id : '';

    await base44.asServiceRole.entities.MatchRecord.create({
      match_type: 'ranked',
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      player1_name: match.player1_name || '',
      player2_name: match.player2_name || '',
      winner_id: winnerId,
      player1_score: gs?.scores?.[1] ?? 0,
      player2_score: gs?.scores?.[2] ?? 0,
      player1_cards: (match.player1_cards || []).map((c: any) => typeof c === 'string' ? c : c.card_id),
      player2_cards: (match.player2_cards || []).map((c: any) => typeof c === 'string' ? c : c.card_id),
      moves,
      board_layout: match.layout_key || 'standard',
      duration_seconds: durationSeconds,
      elo_change: eloChange,
    });
  } catch (e) {
    console.error('Failed to create MatchRecord:', e);
  }
}

async function checkAndProcessTimeout(base44: any, match: any) {
  if (match.status !== 'active') return null;
  if (!match.last_move_at) return null;

  const now = Date.now();
  const elapsed = now - new Date(match.last_move_at).getTime();
  if (elapsed < MAX_TURN_TIME_MS) return null;

  const gs = match.game_state;
  if (!gs) return null;
  const currentPlayer = gs.currentPlayer ?? match.current_player ?? 1;
  const winner = currentPlayer === 0
    ? (match.toss_winner === 1 ? 2 : 1)
    : (currentPlayer === 1 ? 2 : 1);

  const p1Elo = match.player1_elo_before;
  const p2Elo = match.player2_elo_before;
  const expected1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const expected2 = 1 - expected1;
  const K = 32;
  const s1 = winner === 1 ? 1 : winner === 2 ? 0 : 0.5;
  const s2 = 1 - s1;
  const newElo1 = Math.round(p1Elo + K * (s1 - expected1));
  const newElo2 = Math.round(p2Elo + K * (s2 - expected2));

  const updated = await base44.asServiceRole.entities.PvpMatch.update(match.id, {
    status: 'completed',
    winner,
    player1_elo_after: newElo1,
    player2_elo_after: newElo2,
  });

  await updatePlayerProfiles(base44, match, winner);
  const eloChangeTimeout = winner === 1 ? newElo1 - p1Elo : newElo2 - p2Elo;
  await createMatchRecord(base44, match, winner, eloChangeTimeout);

  return {
    match: updated,
    elo: {
      player1_elo_before: p1Elo,
      player2_elo_before: p2Elo,
      player1_elo_after: newElo1,
      player2_elo_after: newElo2,
    },
    timeout: true,
    forfeitedPlayer: currentPlayer,
  };
}