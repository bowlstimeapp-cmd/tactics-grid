import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from '@/components/game/GameCard';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';
import { PACK_COST, PACK_SIZE, PACK_ODDS, ESSENCE_VALUES } from '@/lib/gameData';

function rollRarity() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const { rarity, weight } of PACK_ODDS) {
    cumulative += weight;
    if (roll <= cumulative) return rarity;
  }
  return 'Common';
}

function openPack() {
  const cards = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    const rarity = rollRarity();
    const pool = ALL_CARDS.filter(c => c.rarity === rarity);
    const card = pool[Math.floor(Math.random() * pool.length)];
    cards.push(card);
  }
  return cards;
}

export default function Shop() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packCards, setPackCards] = useState(null);
  const [opening, setOpening] = useState(false);
  const [revealIndex, setRevealIndex] = useState(-1);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
      if (profiles[0]) setProfile(profiles[0]);
      setLoading(false);
    }
    load();
  }, []);

  const buyPack = async () => {
    if (!profile || profile.coins < PACK_COST) return;
    setOpening(true);
    setRevealIndex(-1);
    const cards = openPack();
    setPackCards(cards);

    // Update profile
    const newCollection = { ...(profile.collection || {}) };
    let essenceGained = 0;
    cards.forEach(card => {
      if (newCollection[card.card_id]) {
        essenceGained += ESSENCE_VALUES[card.rarity] || 5;
      } else {
        newCollection[card.card_id] = 1;
      }
    });

    const updated = await base44.entities.PlayerProfile.update(profile.id, {
      coins: profile.coins - PACK_COST,
      essence: (profile.essence || 0) + essenceGained,
      collection: newCollection,
    });
    setProfile(updated);

    // Reveal animation
    for (let i = 0; i < cards.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setRevealIndex(i);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200">Shop</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm">🪙</span>
          <span className="text-sm font-medium text-amber-300">{profile?.coins || 0}</span>
        </div>
      </div>

      {/* Pack reveal area */}
      <AnimatePresence>
        {packCards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-800/60 rounded-xl border border-amber-900/20 p-6 mb-6"
          >
            <h3 className="font-heading text-center text-amber-200 mb-4">Pack Opened!</h3>
            <div className="flex justify-center gap-4">
              {packCards.map((card, i) => (
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
            <Button
              onClick={() => { setPackCards(null); setOpening(false); }}
              variant="outline"
              className="mx-auto block mt-4 border-amber-900/30"
            >
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booster packs */}
      <div className="max-w-md mx-auto space-y-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-amber-900/30 to-slate-800/60 rounded-xl border border-amber-500/20 p-6 cursor-pointer"
          onClick={buyPack}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl pulse-gold">
              <Package className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg text-amber-100">Standard Pack</h3>
              <p className="text-xs text-muted-foreground">3 random cards. Duplicates become Essence.</p>
              <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>65% Common</span>
                <span>23% Uncommon</span>
                <span>9% Rare</span>
                <span>2.5% Epic</span>
                <span>0.5% Legendary</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <span>🪙</span>
                <span className="font-heading text-amber-300 text-lg">{PACK_COST}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {(profile?.coins || 0) < PACK_COST && (
          <p className="text-center text-xs text-muted-foreground">Not enough coins. Play matches to earn more!</p>
        )}

        {/* Essence info */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/20 p-4">
          <h3 className="font-heading text-sm text-purple-300 mb-2">💎 Essence: {profile?.essence || 0}</h3>
          <p className="text-xs text-muted-foreground">Duplicate cards are converted to Essence. Use Essence to craft specific cards you're missing.</p>
        </div>
      </div>
    </div>
  );
}