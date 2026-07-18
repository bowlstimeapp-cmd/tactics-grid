import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const PLAYER_COIN_URL = 'https://media.base44.com/images/public/6a515f98c3765b4ad9db2222/f17355ce5_generated_image.png';
const AI_COIN_URL = 'https://media.base44.com/images/public/6a515f98c3765b4ad9db2222/c133015f2_generated_image.png';

export default function CoinFlip({ onComplete, tossWinner, opponentName, opponentChoice }) {
  const [phase, setPhase] = useState('idle'); // idle, flipping, result
  const [result, setResult] = useState(null); // 'player' or 'opponent'
  const [aiChoice, setAiChoice] = useState(null);

  const isPvP = tossWinner !== undefined;
  const opponentLabel = opponentName || 'AI';

  const flip = () => {
    setPhase('flipping');
    setTimeout(() => {
      const r = tossWinner || (Math.random() < 0.5 ? 'player' : 'opponent');
      setResult(r);
      if (!isPvP && r === 'opponent') {
        setAiChoice(1); // AI always chooses to go first
      }
      setPhase('result');
    }, 2000);
  };

  // Auto-flip in PvP mode (result is server-determined)
  useEffect(() => {
    if (isPvP && phase === 'idle') {
      flip();
    }
  }, [isPvP, phase]);

  const playerWon = result === 'player';
  const finalRotation = playerWon ? 1440 : 1260;

  let statusText = '';
  if (phase === 'idle') statusText = 'Flip the coin to see who wins the toss';
  else if (phase === 'flipping') statusText = 'Flipping...';
  else if (playerWon) statusText = 'You win the toss!';
  else if (isPvP) {
    if (opponentChoice) {
      statusText = `${opponentLabel} wins the toss and chooses to go ${opponentChoice === 1 ? 'first' : 'second'}`;
    } else {
      statusText = `${opponentLabel} wins the toss, waiting for their choice...`;
    }
  } else {
    statusText = `${opponentLabel} wins the toss and chooses to go ${aiChoice === 1 ? 'first' : 'second'}`;
  }

  const continueValue = isPvP ? opponentChoice : (aiChoice === 1 ? 2 : 1);

  // Auto-proceed when opponent wins the toss (AI or PvP opponent who chose)
  useEffect(() => {
    if (phase === 'result' && !playerWon && (!isPvP || opponentChoice)) {
      const timer = setTimeout(() => onComplete(continueValue), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, playerWon, isPvP, opponentChoice, continueValue, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4" style={{ perspective: '1000px' }}>
      <h2 className="font-heading text-xl text-amber-200 text-center">Coin Toss</h2>
      <p className="text-sm text-muted-foreground text-center min-h-[20px]">{statusText}</p>

      <motion.div
        animate={
          phase === 'flipping'
            ? { rotateY: [0, finalRotation], scale: [1, 1.2, 1] }
            : phase === 'result'
              ? { rotateY: finalRotation, scale: 1 }
              : { rotateY: 0, scale: 1 }
        }
        transition={phase === 'flipping' ? { duration: 2, ease: 'easeOut' } : { duration: 0.3 }}
        className="w-24 h-24 rounded-full shadow-2xl shadow-amber-500/30"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face — player (crossed swords & shield) */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden border-2 border-amber-500/40"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img src={PLAYER_COIN_URL} alt="Player" className="w-full h-full object-cover" />
        </div>
        {/* Back face — opponent (dragon sigil) */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden border-2 border-amber-500/40"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <img src={AI_COIN_URL} alt="Opponent" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {phase === 'idle' && !isPvP && (
        <Button onClick={flip} className="bg-amber-600 hover:bg-amber-500 text-black font-heading">
          Flip Coin
        </Button>
      )}

      {phase === 'result' && playerWon && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Button onClick={() => onComplete(1)} className="bg-amber-600 hover:bg-amber-500 text-black font-heading">
            Go First
          </Button>
          <Button onClick={() => onComplete(2)} variant="outline" className="border-amber-900/30">
            Go Second
          </Button>
        </motion.div>
      )}


    </div>
  );
}