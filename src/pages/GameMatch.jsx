import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Undo2 } from 'lucide-react';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import CardSelectModal from '@/components/game/CardSelectModal';
import GameOverModal from '@/components/game/GameOverModal';
import { createGameState, placeCard } from '@/lib/gameEngine';
import { getRandomLayout } from '@/lib/gameData';
import { getAIMove } from '@/lib/ai';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';
import { BOARD_LAYOUTS } from '@/lib/gameData';

export default function GameMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'medium';
  const deckParam = searchParams.get('deck'); // comma-separated card_ids

  const [phase, setPhase] = useState('select'); // select, layout, playing, gameover
  const [deck, setDeck] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [layoutKey, setLayoutKey] = useState('');
  const [history, setHistory] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [rewards, setRewards] = useState(null);

  // Build deck from params or use starter cards
  useEffect(() => {
    let cards;
    if (deckParam) {
      cards = deckParam.split(',').map(id => getCardById(id)).filter(Boolean);
    }
    if (!cards || cards.length < 5) {
      // Give a starter deck of 20 random cards
      const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
      cards = shuffled.slice(0, 20);
    }
    setDeck(cards);
  }, [deckParam]);

  const handleCardSelect = useCallback((selectedIds) => {
    const playerCards = selectedIds.map(id => getCardById(id)).filter(Boolean);
    // AI picks 5 random cards weighted by difficulty
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
      const gs = createGameState(playerCards, aiCards, lk);
      setGameState(gs);
      setHistory([]);
      setPhase('playing');
    }, 2000);
  }, [difficulty]);

  const handleCellClick = useCallback((row, col) => {
    if (!gameState || gameState.gameOver || gameState.currentPlayer !== 1 || selectedCardIndex === null || isAIThinking) return;
    if (gameState.board[row][col]) return;

    setHistory(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
    const newState = placeCard(gameState, selectedCardIndex, row, col);
    setGameState(newState);
    setSelectedCardIndex(null);

    if (newState.gameOver) {
      const won = newState.winner === 1;
      setRewards({ coins: won ? 50 : 10, xp: won ? 30 : 10 });
      setPhase('gameover');
      return;
    }

    // AI turn
    setIsAIThinking(true);
    setTimeout(() => {
      const aiMove = getAIMove(newState, difficulty);
      if (aiMove) {
        const afterAI = placeCard(newState, aiMove.cardIndex, aiMove.row, aiMove.col);
        setGameState(afterAI);
        if (afterAI.gameOver) {
          const won = afterAI.winner === 1;
          setRewards({ coins: won ? 50 : 10, xp: won ? 30 : 10 });
          setPhase('gameover');
        }
      }
      setIsAIThinking(false);
    }, 800);
  }, [gameState, selectedCardIndex, isAIThinking, difficulty]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGameState(prev);
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
        {phase === 'playing' && (
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={history.length === 0} className="text-muted-foreground">
            <Undo2 className="w-4 h-4 mr-1" /> Undo
          </Button>
        )}
      </div>

      {/* Card Select Phase */}
      {phase === 'select' && deck.length > 0 && (
        <CardSelectModal open={true} deck={deck} onConfirm={handleCardSelect} />
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
            isActive={gameState.currentPlayer === 2}
            playerNum={2}
            playerName="AI Opponent"
          />

          {/* Board */}
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <GameBoard
              gameState={gameState}
              onCellClick={handleCellClick}
              selectedCard={selectedCardIndex}
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
            onSelect={setSelectedCardIndex}
            isActive={gameState.currentPlayer === 1 && !isAIThinking}
            playerNum={1}
            playerName="You"
          />
        </div>
      )}

      {/* Game Over */}
      <GameOverModal
        open={phase === 'gameover'}
        gameState={gameState}
        rewards={rewards}
        onPlayAgain={() => { setPhase('select'); setGameState(null); setSelectedCardIndex(null); }}
        onGoHome={() => navigate('/')}
      />
    </div>
  );
}