import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOARD_LAYOUTS = {
  standard: { name: "Standard", tiles: [null,null,null,null,null,null,null,null,null] },
  power_center: { name: "Power Center", tiles: [null,null,null,null,{type:"power",label:"+1",icon:"⚡",mod:{north:1,east:1,south:1,west:1}},null,null,null,null] },
  forest_corners: { name: "Wild Corners", tiles: [{type:"forest",label:"Forest",icon:"🌲",factionBonus:{faction:"Beasts",mod:1}},null,{type:"forest",label:"Forest",icon:"🌲",factionBonus:{faction:"Beasts",mod:1}},null,null,null,{type:"forest",label:"Forest",icon:"🌲",factionBonus:{faction:"Beasts",mod:1}},null,{type:"forest",label:"Forest",icon:"🌲",factionBonus:{faction:"Beasts",mod:1}}] },
  forge_line: { name: "Forge Line", tiles: [null,null,null,{type:"forge",label:"Forge",icon:"🔨",factionBonus:{faction:"Machines",mod:2,phase:"attack"}},{type:"forge",label:"Forge",icon:"🔨",factionBonus:{faction:"Machines",mod:2,phase:"attack"}},{type:"forge",label:"Forge",icon:"🔨",factionBonus:{faction:"Machines",mod:2,phase:"attack"}},null,null,null] },
  arcane_circle: { name: "Arcane Circle", tiles: [null,{type:"arcane",label:"Arcane",icon:"✨",factionBonus:{faction:"Mages",mod:1}},null,{type:"arcane",label:"Arcane",icon:"✨",factionBonus:{faction:"Mages",mod:1}},null,{type:"arcane",label:"Arcane",icon:"✨",factionBonus:{faction:"Mages",mod:1}},null,{type:"arcane",label:"Arcane",icon:"✨",factionBonus:{faction:"Mages",mod:1}},null] },
  portal_cross: { name: "Portal Cross", tiles: [null,{type:"portal",label:"Portal",icon:"🌀",doublePassive:true},null,{type:"portal",label:"Portal",icon:"🌀",doublePassive:true},{type:"portal",label:"Portal",icon:"🌀",doublePassive:true},{type:"portal",label:"Portal",icon:"🌀",doublePassive:true},null,{type:"portal",label:"Portal",icon:"🌀",doublePassive:true},null] },
  sanctuary_corners: { name: "Sanctuary", tiles: [{type:"sanctuary",label:"Sanctuary",icon:"🕊️",noBuff:true},null,{type:"sanctuary",label:"Sanctuary",icon:"🕊️",noBuff:true},null,null,null,{type:"sanctuary",label:"Sanctuary",icon:"🕊️",noBuff:true},null,{type:"sanctuary",label:"Sanctuary",icon:"🕊️",noBuff:true}] },
};

function getRandomLayout() {
  const keys = Object.keys(BOARD_LAYOUTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

function createGameState(player1Cards, player2Cards, layoutKey, firstPlayer) {
  const layout = BOARD_LAYOUTS[layoutKey] || BOARD_LAYOUTS.standard;
  return {
    board: [[null,null,null],[null,null,null],[null,null,null]],
    tiles: layout.tiles,
    layoutKey,
    layoutName: layout.name,
    turn: 1,
    currentPlayer: firstPlayer,
    player1Hand: player1Cards.map(c => ({ ...c, owner: 1, originalOwner: 1 })),
    player2Hand: player2Cards.map(c => ({ ...c, owner: 2, originalOwner: 2 })),
    moves: [],
    gameOver: false,
    winner: null,
    scores: { 1: 5, 2: 5 },
    animations: [],
    passiveActivations: [],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── JOIN QUEUE / MATCHMAKE ──
    if (action === 'join') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { player_name, elo, cards } = body;
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

      // Search for opponents within ELO range
      const allSearching = await base44.asServiceRole.entities.MatchQueue.filter({
        status: 'searching'
      });
      const eligible = allSearching.filter(q =>
        q.player_id !== user.id && Math.abs(q.elo - elo) <= 200
      );

      if (eligible.length > 0) {
        const opp = eligible[0];

        // Randomly assign player1/player2
        const player1First = Math.random() < 0.5;
        const p1 = player1First
          ? { id: user.id, name: player_name, elo, cards }
          : { id: opp.player_id, name: opp.player_name, elo: opp.elo, cards: opp.cards };
        const p2 = player1First
          ? { id: opp.player_id, name: opp.player_name, elo: opp.elo, cards: opp.cards }
          : { id: user.id, name: player_name, elo, cards };

        const layoutKey = getRandomLayout();
        const firstPlayer = Math.random() < 0.5 ? 1 : 2;
        const gameState = createGameState(p1.cards, p2.cards, layoutKey, firstPlayer);

        const match = await base44.asServiceRole.entities.PvpMatch.create({
          player1_id: p1.id,
          player2_id: p2.id,
          player1_name: p1.name,
          player2_name: p2.name,
          player1_cards: p1.cards,
          player2_cards: p2.cards,
          game_state: gameState,
          current_player: firstPlayer,
          status: 'active',
          winner: 0,
          player1_elo_before: p1.elo,
          player2_elo_before: p2.elo,
          player1_elo_after: 0,
          player2_elo_after: 0,
          layout_key: layoutKey,
          last_move_at: new Date().toISOString(),
        });

        // Update opponent's queue entry
        await base44.asServiceRole.entities.MatchQueue.updateMany(
          { player_id: opp.player_id, status: 'searching' },
          { $set: { status: 'matched', match_id: match.id } }
        );

        // Create my queue entry as matched
        await base44.asServiceRole.entities.MatchQueue.create({
          player_id: user.id,
          player_name,
          elo,
          status: 'matched',
          match_id: match.id,
        });

        return Response.json({ status: 'matched', match });
      }

      // No match found - create searching entry
      await base44.asServiceRole.entities.MatchQueue.create({
        player_id: user.id,
        player_name,
        elo,
        status: 'searching',
        match_id: '',
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

    // ── SUBMIT MOVE ──
    if (action === 'submit_move') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id, game_state } = body;
      const match = await base44.asServiceRole.entities.PvpMatch.get(match_id);
      if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });
      if (match.player1_id !== user.id && match.player2_id !== user.id) {
        return Response.json({ error: 'Not in match' }, { status: 403 });
      }
      if (match.status !== 'active') {
        return Response.json({ error: 'Match not active' }, { status: 400 });
      }

      const playerNum = match.player1_id === user.id ? 1 : 2;
      if (match.game_state && match.game_state.currentPlayer !== playerNum) {
        return Response.json({ error: 'Not your turn' }, { status: 400 });
      }

      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        game_state,
        current_player: game_state.currentPlayer,
        last_move_at: new Date().toISOString(),
      });

      return Response.json({ match: updated });
    }

    // ── END MATCH (update ELO) ──
    if (action === 'end_match') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { match_id, winner } = body;
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

      // Update match
      const updated = await base44.asServiceRole.entities.PvpMatch.update(match_id, {
        status: 'completed',
        winner,
        player1_elo_after: newElo1,
        player2_elo_after: newElo2,
      });

      // Update both player profiles
      const p1Profiles = await base44.asServiceRole.entities.PlayerProfile.filter({ created_by_id: match.player1_id });
      const p2Profiles = await base44.asServiceRole.entities.PlayerProfile.filter({ created_by_id: match.player2_id });

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

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});