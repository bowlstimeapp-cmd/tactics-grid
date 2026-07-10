import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function CoinFlip({ onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle, flipping, result
  const [result, setResult] = useState(null); // 'heads' or 'tails'

  const flip = () => {
    setPhase('flipping');
    setTimeout(() => {
      const r = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(r);
      setPhase('result');
    }, 2000);
  };

  const playerFirst = result === 'heads';

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
      <h2 className="font-heading text-xl text-amber-200 text-center">Coin Toss</h2>
      <p className="text-sm text-muted-foreground text-center min-h-[20px]">
        {phase === 'idle' && '🟡 Heads = You go first · 🔵 Tails = AI goes first'}
        {phase === 'flipping' && 'Flipping...'}
        {phase === 'result' && (playerFirst ? '🟡 Heads — You go first!' : '🔵 Tails — AI goes first!')}
      </p>

      <motion.div
        animate={
          phase === 'flipping'
            ? { rotateY: [0, 1440], scale: [1, 1.2, 1] }
            : { rotateY: 0, scale: 1 }
        }
        transition={phase === 'flipping' ? { duration: 2, ease: 'easeOut' } : { duration: 0.3 }}
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl"
        style={{
          background: phase === 'result' && !playerFirst
            ? 'linear-gradient(135deg, hsl(220, 80%, 55%), hsl(220, 80%, 35%))'
            : 'linear-gradient(135deg, hsl(43, 96%, 56%), hsl(43, 80%, 40%))',
        }}
      >
        {phase === 'result' ? (playerFirst ? '⚔️' : '🤖') : '🪙'}
      </motion.div>

      {phase === 'idle' && (
        <Button onClick={flip} className="bg-amber-600 hover:bg-amber-500 text-black font-heading">
          Flip Coin
        </Button>
      )}

      {phase === 'result' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => onComplete(playerFirst ? 1 : 2)}
            className="bg-amber-600 hover:bg-amber-500 text-black font-heading"
          >
            {playerFirst ? 'Start Match' : 'Let AI Start'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}