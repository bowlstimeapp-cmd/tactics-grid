import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Flag } from 'lucide-react';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import PvpGameOverModal from '@/components/game/PvpGameOverModal';
import CardDetailModal from '@/components/game/CardDetailModal';
import { placeCard, getEffectiveStats } from '@/lib/gameEngine';
import { base44 } from '@/api/base44Client';

function reconstructGameState(gameStateObj) {
  if (!gameStateObj) return null;
  const gs = JSON.parse(JSON.stringify(gameStateObj));
  if (gs.board && gs.tiles) {
    try {
      Object.defineProperty(gs.board, '_tiles', {
        value: gs.tiles, writable: true, enumerable: false, configurable: true
      });
    } catch (e) { /* already defined */ }
  }
  return gs;
}

export default function PvpGameMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('match_id');

  const [match, setMatch] = useState(null);
  const [displayState, setDisplayState] = useState(null);
  const [myPlayerNum, setMyPlayerNum] = useState(1);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flippingCells, setFlippingCells] = useState(new Set());
  const [showChainText, setShowChainText] = useState(false);
  const [phase, setPhase] = useState('playing');
  const [eloResult, setEloResult] = useState(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectCard, setInspectCard] = useState(null);
  const [inspectStats, setInspectStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAnimatingRef = useRef(false);
  const displayTurnRef = useRef(0);
  const gameOverHandledRef = useRef(false);

  // Load match
  useEffect(() => {
    if (!matchId) { setLoading(false); return; }
    async function load() {
      try {
        const m = await base44.entities.PvpMatch.get(matchId);
        setMatch(m);
        const me = await base44.auth.me();
        const num = m.player1_id === me.id ? 1 : 2;
        setMyPlayerNum(num);

        if (m.game_state) {
          const gs = reconstructGameState(m.game_state);
          setDisplayState(gs);
          displayTurnRef.current = gs.turn;
        }

        if (m.status === 'completed') {
          setPhase('gameover');
          setEloResult({
            player1_elo_before: m.player1_elo_before,
            player2_elo_before: m.player2_elo_before,
            player1_elo_after: m.player1_elo_after,
            player2_elo_after: m.player2_elo_after,
          });
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [matchId]);

  // Subscribe to match updates
  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = base44.entities.PvpMatch.subscribe(async () => {
      try {
        const m = await base44.entities.PvpMatch.get(matchId);
        setMatch(m);

        if (m.status === 'completed') {
          setEloResult({
            player1_elo_before: m.player1_elo_before,
            player2_elo_before: m.player2_elo_before,
            player1_elo_after: m.player1_elo_after,
            player2_elo_after: m.player2_elo_after,
          });
          if (!gameOverHandledRef.current) {
            gameOverHandledRef.current = true;
            setTimeout(() => setPhase('gameover'), 2000);
          }
          return;
        }

        if (m.game_state) {
          const gs = reconstructGameState(m.game_state);
          if (gs.turn <= displayTurnRef.current) return;

          displayTurnRef.current = gs.turn;
          setDisplayState(gs);
          processAnimations(gs.animations);

          if (gs.gameOver && !gameOverHandledRef.current) {
            gameOverHandledRef.current = true;
            const animCount = gs.animations?.length || 0;
            const hasChain = gs.animations?.some(a => a.chainOrder > 0);
            const animTime = animCount * 650 + (hasChain ? 500 : 0);
            const delay = Math.max(5000, animTime + 1000);
            setTimeout(() => setPhase('gameover'), delay);
          }
        }
      } catch (e) { console.error(e); }
    });
    return unsubscribe;
  }, [matchId]);

  const processAnimations = useCallback(async (animations) => {
    if (!animations || animations.length === 0) return;
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setIsAnimating(true);

    const hasChain = animations.some(a => a.chainOrder > 0);
    if (hasChain) setShowChainText(true);

    for (const anim of animations) {
      const cellKey = `${anim.row}-${anim.col}`;
      setFlippingCells(prev => new Set([...prev, cellKey]));
      await new Promise(r => setTimeout(r, 500));
      setFlippingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
      await new Promise(r => setTimeout(r, 150));
    }

    if (hasChain) {
      await new Promise(r => setTimeout(r, 500));
      setShowChainText(false);
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (!displayState || displayState.gameOver || submitting) return;

    if (inspectMode) {
      const card = displayState.board[row][col];
      if (card) {
        const boardWithTiles = displayState.board;
        if (!boardWithTiles._tiles) {
          Object.defineProperty(boardWithTiles, '_tiles', {
            value: displayState.tiles, writable: true, enumerable: false, configurable: true
          });
        }
        setInspectCard(card);
        setInspectStats(getEffectiveStats(card, [row, col], boardWithTiles, displayState.turn));
      }
      return;
    }

    if (displayState.currentPlayer !== myPlayerNum || selectedCardIndex === null || isAnimating) return;
    if (displayState.board[row][col]) return;

    const newState = placeCard(displayState, selectedCardIndex, row, col);
    displayTurnRef.current = newState.turn;
    setDisplayState(newState);
    setSelectedCardIndex(null);
    processAnimations(newState.animations);

    // Submit to backend
    setSubmitting(true);
    base44.functions.invoke('pvpMatch', {
      action: 'submit_move',
      match_id: matchId,
      game_state: newState,
    }).then(() => {
      setSubmitting(false);
    }).catch(e => {
      console.error(e);
      setSubmitting(false);
    });

    if (newState.gameOver) {
      gameOverHandledRef.current = true;
      const animCount = newState.animations?.length || 0;
      const hasChain = newState.animations?.some(a => a.chainOrder > 0);
      const animTime = animCount * 650 + (hasChain ? 500 : 0);
      const delay = Math.max(5000, animTime + 1000);
      setTimeout(() => {
        base44.functions.invoke('pvpMatch', {
          action: 'end_match',
          match_id: matchId,
          winner: newState.winner,
        }).then(res => {
          setEloResult(res.data.elo);
          setPhase('gameover');
        }).catch(e => {
          console.error(e);
          setPhase('gameover');
        });
      }, delay);
    }
  }, [displayState, selectedCardIndex, isAnimating, inspectMode, myPlayerNum, matchId, processAnimations, submitting]);

  const handleHandInspect = useCallback((card) => {
    setInspectCard(card);
    setInspectStats(null);
  }, []);

  const toggleInspect = () => {
    setInspectMode(prev => !prev);
    setSelectedCardIndex(null);
  };

  const handleForfeit = () => {
    if (submitting || isAnimating || !matchId) return;
    gameOverHandledRef.current = true;
    base44.functions.invoke('pvpMatch', {
      action: 'end_match',
      match_id: matchId,
      winner: myPlayerNum === 1 ? 2 : 1,
    }).then(res => {
      setEloResult(res.data.elo);
      setPhase('gameover');
    }).catch(e => console.error(e));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (!match || !displayState) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950">
      <p className="text-muted-foreground">Match not found</p>
      <Button onClick={() => navigate('/')}>Back to Home</Button>
    </div>
  );

  const myHand = myPlayerNum === 1 ? displayState.player1Hand : displayState.player2Hand;
  const oppHand = myPlayerNum === 1 ? displayState.player2Hand : displayState.player1Hand;
  const myScore = displayState.scores[myPlayerNum] ?? 0;
  const oppScore = displayState.scores[myPlayerNum === 1 ? 2 : 1] ?? 0;
  const oppName = myPlayerNum === 1 ? match.player2_name : match.player1_name;
  const isMyTurn = displayState.currentPlayer === myPlayerNum && !displayState.gameOver;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-heading text-amber-200 text-sm">⚔️ Ranked Match</span>
        <div className="flex items-center gap-1">
          {phase === 'playing' && (
            <Button
              variant="ghost" size="sm"
              onClick={toggleInspect}
              className={inspectMode ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground'}
            >
              <Search className="w-4 h-4 mr-1" /> {inspectMode ? 'On' : 'Inspect'}
            </Button>
          )}
          {phase === 'playing' && !inspectMode && (
            <Button variant="ghost" size="sm" onClick={handleForfeit} disabled={submitting || isAnimating} className="text-red-400/60">
              <Flag className="w-4 h-4 mr-1" /> Forfeit
            </Button>
          )}
        </div>
      </div>

      {phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 gap-2">
          {/* Score bar */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="flex-1 text-center">
              <span className="text-blue-400 font-bold text-lg">{myScore}</span>
              <span className="text-xs text-muted-foreground ml-1">You</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800/60 text-xs text-amber-400 font-heading">
              Turn {displayState.turn}
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-muted-foreground mr-1">{oppName}</span>
              <span className="text-red-400 font-bold text-lg">{oppScore}</span>
            </div>
          </div>

          {/* Opponent hand (face down) */}
          <PlayerHand
            cards={oppHand}
            selectedIndex={null}
            onSelect={() => {}}
            isActive={displayState.currentPlayer !== myPlayerNum && !inspectMode && !displayState.gameOver}
            playerNum={2}
            myPlayerNum={myPlayerNum}
            playerName={oppName}
            faceDown
          />

          {/* Board */}
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <GameBoard
              gameState={displayState}
              onCellClick={handleCellClick}
              selectedCard={inspectMode ? null : selectedCardIndex}
              flippingCells={flippingCells}
              myPlayerNum={myPlayerNum}
            />
          </motion.div>

          {/* Chain text */}
          <AnimatePresence>
            {showChainText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                className="font-heading text-2xl text-amber-400 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(245,158,11,0.8)' }}
              >
                ⚡ Chain! ⚡
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting indicator */}
          <AnimatePresence>
            {!isMyTurn && !displayState.gameOver && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-amber-400 animate-pulse"
              >
                Waiting for opponent...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player hand */}
          <PlayerHand
            cards={myHand}
            selectedIndex={selectedCardIndex}
            onSelect={(idx) => setSelectedCardIndex(idx)}
            onInspect={inspectMode ? handleHandInspect : undefined}
            isActive={isMyTurn && !submitting && !inspectMode}
            playerNum={1}
            myPlayerNum={myPlayerNum}
            playerName="You"
          />
        </div>
      )}

      {/* Card Inspect Modal */}
      <CardDetailModal
        card={inspectCard}
        onClose={() => { setInspectCard(null); setInspectStats(null); }}
        effectiveStats={inspectStats}
      />

      {/* Game Over */}
      <PvpGameOverModal
        open={phase === 'gameover'}
        gameState={displayState}
        winner={match?.winner ?? displayState?.winner}
        myPlayerNum={myPlayerNum}
        eloResult={eloResult}
        onGoHome={() => navigate('/')}
      />
    </div>
  );
}