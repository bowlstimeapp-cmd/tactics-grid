import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameCard from './GameCard';

export default function CardReveal({ card, effectiveStats, playerName, onComplete }) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!card) return;
    const timer = setTimeout(() => onCompleteRef.current(), 3000);
    return () => clearTimeout(timer);
  }, [card]);

  if (!card) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85"
    >
      {playerName && (
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-amber-300 font-heading text-sm mb-6"
        >
          {playerName} plays...
        </motion.p>
      )}
      <motion.div
        initial={{ scale: 0.3, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <GameCard card={card} size="xl" effectiveStats={effectiveStats} showStats={true} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
            className="h-full bg-amber-500"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}