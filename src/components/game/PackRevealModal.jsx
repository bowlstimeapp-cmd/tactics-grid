import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GameCard from './GameCard';

export default function PackRevealModal({ cards, onClose, onReopen, reopenLabel, reopenDisabled }) {
  const [revealIndex, setRevealIndex] = useState(-1);

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    setRevealIndex(-1);
    let cancelled = false;
    (async () => {
      for (let i = 0; i < cards.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        if (cancelled) return;
        setRevealIndex(i);
      }
    })();
    return () => { cancelled = true; };
  }, [cards]);

  if (!cards || cards.length === 0) return null;

  const allRevealed = revealIndex >= cards.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="bg-slate-800/60 rounded-xl border border-amber-900/20 p-6 mb-6"
    >
      <h3 className="font-heading text-center text-amber-200 mb-4">Pack Opened!</h3>
      <div className="flex justify-center gap-4 flex-wrap">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={revealIndex >= i ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0.3 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <GameCard card={card} size="lg" />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center gap-3 mt-4">
        <Button onClick={onClose} variant="outline" className="border-amber-900/30">
          Continue
        </Button>
        {onReopen && (
          <Button
            onClick={onReopen}
            disabled={reopenDisabled || !allRevealed}
            className="bg-gradient-to-r from-amber-600 to-amber-700 text-black font-heading"
          >
            {reopenLabel || 'Open Another'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}