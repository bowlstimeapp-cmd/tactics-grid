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
import { createGameState, placeCard, getEffectiveStats } from '@/lib/gameEngine';
import { getRandomLayout, BOARD_LAYOUTS } from '@/lib/gameData';
import { getAIMove } from '@/lib/ai';
import { ALL_CARDS } from '@/lib/cardDatabase';

export default function GameMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'medium';

  const [phase, setPhase] = useState('deckselect'); // deckselect, coinflip, layout, playing, gameover
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [layoutKey, setLayoutKey] = useState('');
  const [history, setHistory] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiThinkingRef = useRef(false);
  const [rewards, setRewards] = useState(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectCard, setInspectCard] = useState(null);
  const [inspectStats, setInspectStats] = useState(null);

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
    const aiCards = shuffled.slice(0, 5);

    const lk = getRandomLayout();
    setLayoutKey(lk);
    setPhase('layout');

    setTimeout(() => {
      const gs = createGameState(playerCards, aiCards, lk, firstPlayer);
      setGameState(gs);
      setHistory([]);
      setPhase('playing');
    }, 2000);
  };

  // AI turn — handles both AI-first (from coin flip) and AI response after player move
  useEffect(() => {
    if (phase !== 'playing' || !gameState || gameState.gameOver) return;
    if (gameState.currentPlayer !== 2 || aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const aiMove = getAIMove(gameState, difficulty);
      if (aiMove) {
        const afterAI = placeCard(gameState, aiMove.cardIndex, aiMove.row, aiMove.col);
        setGameState(afterAI);
        if (afterAI.gameOver) {
          const won = afterAI.winner === 1;
          setRewards({ coins: won ? 50 : 10, xp: won ? 30 : 10 });
          setPhase('gameover');
        }
      }
      aiThinkingRef.current = false;
      setIsAIThinking(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, gameState, difficulty]);

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

    if (gameState.currentPlayer !== 1 || selectedCardIndex === null || isAIThinking) return;
    if (gameState.board[row][col]) return;

    setHistory(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
    const newState = placeCard(gameState, selectedCardIndex, row, col);
    setGameState(newState);
    setSelectedCardIndex(null);

    if (newState.gameOver) {
      const won = newState.winner === 1;
      setRewards({ coins: won ? 50 : 10, xp: won ? 30 : 10 });
      setPhase('gameover');
    }
  }, [gameState, selectedCardIndex, isAIThinking, inspectMode]);

  const handleHandInspect = useCallback((card) => {
    setInspectCard(card);
    setInspectStats(null);
  }, []);

  const handleUndo = () => {
    if (history.length === 0 || isAIThinking) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGameState(prev);
    setSelectedCardIndex(null);
  };

  const toggleInspect = () => {
    setInspectMode(prev => !prev);
    setSelectedCardIndex(null);
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
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI Match
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
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0 || isAIThinking} className="text-muted-foreground">
              <Undo2 className="w-4 h-4 mr-1" /> Undo
            </Button>
          )}
        </div>
      </div>

      {/* Deck Select Phase */}
      {phase === 'deckselect' && (
        <DeckSelectModal open={true} onConfirm={handleDeckSelect} />
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
            <div className="grid grid-cols-3 gap-2 mt-6">
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
          />

          {/* Board */}
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <GameBoard
              gameState={gameState}
              onCellClick={handleCellClick}
              selectedCard={inspectMode ? null : selectedCardIndex}
            />
          </motion.div>

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
            selectedIndex={selectedCardIndex}
            onSelect={(idx) => setSelectedCardIndex(idx)}
            onInspect={inspectMode ? handleHandInspect : undefined}
            isActive={gameState.currentPlayer === 1 && !isAIThinking && !inspectMode}
            playerNum={1}
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
      <GameOverModal
        open={phase === 'gameover'}
        gameState={gameState}
        rewards={rewards}
        onPlayAgain={() => {
          setPhase('deckselect');
          setGameState(null);
          setSelectedCardIndex(null);
          setPlayerCards([]);
          setInspectMode(false);
          setInspectCard(null);
        }}
        onGoHome={() => navigate('/')}
      />
    </div>
  );
}