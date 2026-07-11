import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameCard from './GameCard';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';

export default function CardReveal({ card, effectiveStats, playerName, onComplete }) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!card) return;
    const timer = setTimeout(() => onCompleteRef.current(), 3000);
    return () => clearTimeout(timer);
  }, [card]);

  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.Common;
  const faction = FACTION_CONFIG[card.faction] || {};
  const passive = PASSIVES[card.passive_id];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4"
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
        <GameCard card={card} size="xl" effectiveStats={effectiveStats} showStats={true} displayMode="baseWithMods" />
      </motion.div>

      {/* Full card description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center max-w-sm space-y-2"
      >
        <h3 className="font-heading text-xl text-amber-200">{card.name}</h3>
        <p className="text-xs text-muted-foreground">
          {faction.icon} {card.faction} · <span style={{ color: rarity.color }}>{card.rarity}</span>
        </p>
        <p className="text-sm text-amber-100">
          ⬆ {card.north}　➡ {card.east}　⬇ {card.south}　⬅ {card.west}
        </p>
        {passive && (
          <div className="bg-slate-800/60 rounded-lg p-3 space-y-1">
            <p className="text-sm font-heading text-amber-300">{passive.icon} {passive.name}</p>
            <p className="text-xs text-muted-foreground">{passive.description}</p>
          </div>
        )}
        {card.flavour_text && (
          <p className="text-xs italic text-muted-foreground/70">{card.flavour_text}</p>
        )}
      </motion.div>

      {/* Countdown bar */}
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