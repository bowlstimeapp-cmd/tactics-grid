import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Undo2, Search } from 'lucide-react';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import DeckSelectModal from '@/components/game/DeckSelectModal';
import CoinFlip from '@/components/game/CoinFlip';
import GameOverModal from '@/components/game/GameOverModal';
import CardDetailModal from '@/components/game/CardDetailModal';
import CardReveal from '@/components/game/CardReveal';
import BoardEffectsBar from '@/components/game/BoardEffectsBar';
import { createGameState, placeCard, getEffectiveStats } from '@/lib/gameEngine';
import { getRandomLayout, BOARD_LAYOUTS } from '@/lib/gameData';
import { getAIMove } from '@/lib/ai';
import { ALL_CARDS, applyCardOverrides } from '@/lib/cardDatabase';
import { base44 } from '@/api/base44Client';
import { loadGameConfig } from '@/lib/gameConfig';

export default function GameMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'medium';
  const gameMode = searchParams.get('mode') || 'standard';

  const [phase, setPhase] = useState('deckselect'); // deckselect, coinflip, layout, playing, gameover
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [layoutKey, setLayoutKey] = useState('');
  const [history, setHistory] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiThinkingRef = useRef(false);
  const [rewards, setRewards] = useState(null);
  const [profile, setProfile] = useState(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectCard, setInspectCard] = useState(null);
  const [inspectStats, setInspectStats] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flippingCells, setFlippingCells] = useState(new Set());
  const [showChainText, setShowChainText] = useState(false);
  const isAnimatingRef = useRef(false);
  const [revealedCard, setRevealedCard] = useState(null);
  const [revealedStats, setRevealedStats] = useState(null);
  const [revealedPlayerName, setRevealedPlayerName] = useState('');
  const isRevealingRef = useRef(false);
  const pendingAfterReveal = useRef(null);
  const [revealTick, setRevealTick] = useState(0);
  const [aiCards, setAiCards] = useState([]);
  const [matchStartTime, setMatchStartTime] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const cfg = await loadGameConfig();
        applyCardOverrides(cfg.card_overrides);
      } catch (e) { console.error(e); }
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        if (profiles[0]) setProfile(profiles[0]);
      } catch (e) { console.error(e); }
    }
    init();
  }, []);

  const persistRewards = async (won) => {
    if (!profile) return;
    const coins = won ? 50 : 10;
    const xp = won ? 30 : 10;
    const newWinStreak = won ? (profile.win_streak || 0) + 1 : 0;
    const updated = await base44.entities.PlayerProfile.update(profile.id, {
      coins: (profile.coins || 0) + coins,
      xp: (profile.xp || 0) + xp,
      games_played: (profile.games_played || 0) + 1,
      wins: (profile.wins || 0) + (won ? 1 : 0),
      losses: (profile.losses || 0) + (won ? 0 : 1),
      win_streak: newWinStreak,
      best_win_streak: Math.max(profile.best_win_streak || 0, newWinStreak),
    });
    setProfile(updated);
  };

  const createAiMatchRecord = async (finalState, won) => {
    try {
      const me = await base44.auth.me();
      await base44.entities.MatchRecord.create({
        match_type: 'ai',
        player1_id: me.id,
        player2_id: 'ai_opponent',
        player1_name: profile?.username || 'Player',
        player2_name: 'AI Opponent',
        winner_id: won ? me.id : 'ai_opponent',
        player1_score: finalState.scores?.[1] ?? 0,
        player2_score: finalState.scores?.[2] ?? 0,
        player1_cards: playerCards.map(c => c.card_id),
        player2_cards: aiCards.map(c => c.card_id),
        moves: finalState.moves || [],
        board_layout: layoutKey || 'standard',
        duration_seconds: matchStartTime ? Math.round((Date.now() - matchStartTime) / 1000) : 0,
        elo_change: 0,
      });
    } catch (e) { console.error(e); }
  };

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

  const handleDeckSelect = (cards) => {
    setPlayerCards(cards);
    setPhase('coinflip');
  };

  const handleCoinFlip = (firstPlayer) => {
    let aiPool = [...ALL_CARDS];
    if (difficulty === 'easy') {
      aiPool = aiPool.filter(c => c.rarity === 'Common' || c.rarity === 'Uncommon');
    } else if (difficulty === 'hard') {
      aiPool = aiPool.filter(c => c.rarity !== 'Common');
    }
    const shuffled = aiPool.sort(() => Math.random() - 0.5);
    const deckSize = gameMode === 'enlarged' ? 12 : 7;
    const aiDeckCards = shuffled.slice(0, deckSize);
    setAiCards(aiDeckCards);

    const lk = getRandomLayout(gameMode === 'enlarged' ? 4 : 3);
    setLayoutKey(lk);
    setPhase('layout');

    setTimeout(() => {
      const gs = createGameState(playerCards, aiDeckCards, lk, firstPlayer, gameMode);
      setGameState(gs);
      setHistory([]);
      setPhase('playing');
      setMatchStartTime(Date.now());
    }, 2000);
  };

  // AI turn — handles both AI-first (from coin flip) and AI response after player move
  useEffect(() => {
    if (phase !== 'playing' || !gameState || gameState.gameOver) return;
    if (gameState.currentPlayer !== 2 || aiThinkingRef.current) return;
    if (isAnimating || isRevealingRef.current) return;

    aiThinkingRef.current = true;
    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const aiMove = getAIMove(gameState, difficulty);
      if (aiMove) {
        const afterAI = placeCard(gameState, aiMove.cardIndex, aiMove.row, aiMove.col);
        setGameState(afterAI);
        startReveal(afterAI, aiMove.row, aiMove.col, 'AI Opponent');
      }
      aiThinkingRef.current = false;
      setIsAIThinking(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, gameState, difficulty, isAnimating, processAnimations, revealTick]);

  // Delay game over screen so player can see the final moves
  useEffect(() => {
    if (gameState?.gameOver && phase === 'playing') {
      const animCount = gameState.animations?.length || 0;
      const hasChain = gameState.animations?.some(a => a.chainOrder > 0);
      const animTime = animCount * 650 + (hasChain ? 500 : 0);
      const delay = Math.max(5000, animTime + 1000 + 3000);
      const timer = setTimeout(() => setPhase('gameover'), delay);
      return () => clearTimeout(timer);
    }
  }, [gameState?.gameOver, phase]);

  const handleRevealComplete = () => {
    setRevealedCard(null);
    setRevealedStats(null);
    setRevealedPlayerName('');
    isRevealingRef.current = false;

    const pending = pendingAfterReveal.current;
    pendingAfterReveal.current = null;
    if (!pending) return;

    processAnimations(pending.newState.animations);
    if (pending.newState.gameOver) {
      const won = pending.newState.winner === 1;
      setRewards({ coins: won ? 50 : 10, xp: won ? 30 : 10 });
      persistRewards(won);
      createAiMatchRecord(pending.newState, won);
    }
    setRevealTick(t => t + 1);
  };

  const startReveal = (newState, row, col, playerName) => {
    const placedCard = newState.board[row][col];
    const boardWithTiles = newState.board;
    if (!boardWithTiles._tiles) {
      Object.defineProperty(boardWithTiles, '_tiles', { value: newState.tiles, writable: true, enumerable: false, configurable: true });
    }
    const stats = getEffectiveStats(placedCard, [row, col], boardWithTiles, newState.turn, 'attack');

    pendingAfterReveal.current = { newState };
    isRevealingRef.current = true;
    setRevealedCard(placedCard);
    setRevealedStats(stats);
    setRevealedPlayerName(playerName);
  };

  const handleCellClick = useCallback((row, col) => {
    if (!gameState || gameState.gameOver) return;

    // Inspect mode: clicking a placed card shows its details
    if (inspectMode) {
      const card = gameState.board[row][col];
      if (card) {
        const boardWithTiles = gameState.board;
        if (!boardWithTiles._tiles) {
          Object.defineProperty(boardWithTiles, '_tiles', { value: gameState.tiles, writable: true, enumerable: false, configurable: true });
        }
        setInspectCard(card);
        setInspectStats(getEffectiveStats(card, [row, col], boardWithTiles, gameState.turn));
      }
      return;
    }

    if (gameState.currentPlayer !== 1 || isAIThinking) return;
    if (isAnimatingRef.current || isRevealingRef.current) return;
    if (gameState.board[row][col]) return;

    // Toggle tile selection
    setSelectedTile(prev => prev && prev.row === row && prev.col === col ? null : { row, col });
  }, [gameState, isAIThinking, inspectMode]);

  const handlePlaceCard = useCallback((cardIndex) => {
    if (!gameState || gameState.gameOver) return;
    if (!selectedTile || isAIThinking) return;
    if (isAnimatingRef.current || isRevealingRef.current) return;
    if (gameState.currentPlayer !== 1) return;
    if (gameState.board[selectedTile.row][selectedTile.col]) return;

    setHistory(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
    const newState = placeCard(gameState, cardIndex, selectedTile.row, selectedTile.col);
    setGameState(newState);
    setSelectedTile(null);
    startReveal(newState, selectedTile.row, selectedTile.col, 'You');
  }, [gameState, selectedTile, isAIThinking]);

  const handleHandInspect = useCallback((card) => {
    setInspectCard(card);
    setInspectStats(null);
  }, []);

  const handleUndo = () => {
    if (history.length === 0 || isAIThinking) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGameState(prev);
    setSelectedTile(null);
  };

  const toggleInspect = () => {
    setInspectMode(prev => !prev);
    setSelectedTile(null);
  };

  const layout = BOARD_LAYOUTS[layoutKey];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-heading text-amber-200 text-sm">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI Match · {gameMode === 'enlarged' ? '4×4' : '3×3'}
        </span>
        <div className="flex items-center gap-1">
          {phase === 'playing' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleInspect}
              className={inspectMode ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground'}
            >
              <Search className="w-4 h-4 mr-1" /> {inspectMode ? 'Inspect On' : 'Inspect'}
            </Button>
          )}
          {phase === 'playing' && !inspectMode && (
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0 || isAIThinking || isAnimating} className="text-muted-foreground">
              <Undo2 className="w-4 h-4 mr-1" /> Undo
            </Button>
          )}
        </div>
      </div>

      {/* Deck Select Phase */}
      {phase === 'deckselect' && (
        <DeckSelectModal open={true} onConfirm={handleDeckSelect} gameMode={gameMode} />
      )}

      {/* Coin Flip Phase */}
      {phase === 'coinflip' && (
        <CoinFlip onComplete={handleCoinFlip} />
      )}

      {/* Layout Preview */}
      {phase === 'layout' && layout && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-heading text-2xl text-amber-200 text-center">{layout.name}</h2>
            <p className="text-sm text-muted-foreground text-center mt-1">{layout.description}</p>
            <div className={`grid ${gameMode === 'enlarged' ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mt-6`}>
              {layout.tiles.map((tile, i) => (
                <div key={i} className="w-16 h-20 rounded-lg border border-slate-700/40 bg-slate-800/30 flex flex-col items-center justify-center">
                  {tile ? (
                    <>
                      <span className="text-lg">{tile.icon}</span>
                      <span className="text-[8px] text-amber-400/70">{tile.label}</span>
                    </>
                  ) : (
                    <span className="text-[8px] text-slate-600">Empty</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Game Phase */}
      {phase === 'playing' && gameState && (
        <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 gap-2">
          {/* Score bar */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="flex-1 text-center">
              <span className="text-blue-400 font-bold text-lg">{gameState.scores[1]}</span>
              <span className="text-xs text-muted-foreground ml-1">You</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800/60 text-xs text-amber-400 font-heading">
              Turn {gameState.turn}
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-muted-foreground mr-1">AI</span>
              <span className="text-red-400 font-bold text-lg">{gameState.scores[2]}</span>
            </div>
          </div>

          {/* Opponent hand */}
          <PlayerHand
            cards={gameState.player2Hand}
            selectedIndex={null}
            onSelect={() => {}}
            onInspect={inspectMode ? handleHandInspect : undefined}
            isActive={gameState.currentPlayer === 2 && !inspectMode}
            playerNum={2}
            playerName="AI Opponent"
            gameState={gameState}
          />

          {/* Board */}
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <GameBoard
              gameState={gameState}
              onCellClick={handleCellClick}
              selectedTile={inspectMode ? null : selectedTile}
              flippingCells={flippingCells}
            />
          </motion.div>

          {/* Active board effects */}
          <BoardEffectsBar gameState={gameState} />

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

          {/* Thinking indicator */}
          <AnimatePresence>
            {isAIThinking && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-amber-400 animate-pulse"
              >
                AI is thinking...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player hand */}
          <PlayerHand
            cards={gameState.player1Hand}
            selectedIndex={null}
            onSelect={() => {}}
            onPlaceCard={selectedTile && !inspectMode && gameState.currentPlayer === 1 && !isAIThinking ? handlePlaceCard : undefined}
            onInspect={inspectMode ? handleHandInspect : undefined}
            isActive={gameState.currentPlayer === 1 && !isAIThinking && !inspectMode}
            playerNum={1}
            playerName="You"
            gameState={gameState}
          />
        </div>
      )}

      {/* Card Reveal */}
      <CardReveal
        card={revealedCard}
        effectiveStats={revealedStats}
        playerName={revealedPlayerName}
        onComplete={handleRevealComplete}
      />

      {/* Card Inspect Modal */}
      <CardDetailModal
        card={inspectCard}
        onClose={() => { setInspectCard(null); setInspectStats(null); }}
        effectiveStats={inspectStats}
      />

      {/* Game Over */}
      <GameOverModal
        open={phase === 'gameover'}
        gameState={gameState}
        rewards={rewards}
        onPlayAgain={() => {
          setPhase('deckselect');
          setGameState(null);
          setSelectedTile(null);
          setPlayerCards([]);
          setInspectMode(false);
          setInspectCard(null);
          setRevealedCard(null);
          setRevealedStats(null);
          setRevealedPlayerName('');
          isRevealingRef.current = false;
          pendingAfterReveal.current = null;
        }}
        onGoHome={() => navigate('/')}
      />
    </div>
  );
}