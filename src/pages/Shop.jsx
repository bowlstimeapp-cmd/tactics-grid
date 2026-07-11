import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from '@/components/game/GameCard';
import { applyCardOverrides } from '@/lib/cardDatabase';
import { FACTION_CONFIG, RARITY_CONFIG } from '@/lib/gameData';
import { loadGameConfig } from '@/lib/gameConfig';
import { openPack, getPackCost, applyCardsToCollection, PACK_TYPES } from '@/lib/packLogic';

const FACTIONS = Object.keys(FACTION_CONFIG);

export default function Shop() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packCards, setPackCards] = useState(null);
  const [opening, setOpening] = useState(false);
  const [revealIndex, setRevealIndex] = useState(-1);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await loadGameConfig();
        setConfig(cfg);
        applyCardOverrides(cfg.card_overrides);
      } catch (e) { console.error(e); }
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        if (profiles[0]) setProfile(profiles[0]);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const buyPack = async (type, faction) => {
    if (!profile || !config || opening) return;
    const cost = getPackCost(type, config);
    if (profile.coins < cost) return;

    setOpening(true);
    setRevealIndex(-1);
    const cards = openPack(type, config, faction);
    setPackCards(cards);

    const { newCollection, essenceGained } = applyCardsToCollection(profile.collection, cards);
    const updated = await base44.entities.PlayerProfile.update(profile.id, {
      coins: profile.coins - cost,
      essence: (profile.essence || 0) + essenceGained,
      collection: newCollection,
    });
    setProfile(updated);

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

      <AnimatePresence>
        {packCards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-800/60 rounded-xl border border-amber-900/20 p-6 mb-6"
          >
            <h3 className="font-heading text-center text-amber-200 mb-4">Pack Opened!</h3>
            <div className="flex justify-center gap-4 flex-wrap">
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

      <div className="max-w-md mx-auto space-y-6">
        {/* Standard Pack */}
        <div>
          <h3 className="font-heading text-sm text-amber-400/70 uppercase tracking-widest mb-3">Standard Pack</h3>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-br from-amber-900/30 to-slate-800/60 rounded-xl border border-amber-500/20 p-6 ${opening ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onClick={() => buyPack('standard')}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl pulse-gold">
                <Package className="w-8 h-8 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-lg text-amber-100">Standard Pack</h3>
                <p className="text-xs text-muted-foreground">{config?.standard_pack_size || 3} random cards. Duplicates become Essence.</p>
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                  {config?.pack_odds?.map(o => (
                    <span key={o.rarity}>{o.weight}% {o.rarity[0]}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <span>🪙</span>
                  <span className="font-heading text-amber-300 text-lg">{config?.standard_pack_cost ?? 100}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Guaranteed Packs */}
        <div>
          <h3 className="font-heading text-sm text-amber-400/70 uppercase tracking-widest mb-3">Guaranteed Packs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['guaranteed_rare', 'guaranteed_epic'].map(packType => {
              const rarityName = PACK_TYPES[packType].guaranteedRarity;
              const rarityCfg = RARITY_CONFIG[rarityName];
              const cost = getPackCost(packType, config);
              return (
                <motion.div
                  key={packType}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-slate-800/40 rounded-xl border p-4 ${opening ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-amber-500/30'}`}
                  style={{ borderColor: rarityCfg?.color + '40' }}
                  onClick={() => buyPack(packType)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${rarityCfg?.color}33, hsl(230, 15%, 10%))` }}>
                      <Gem className="w-6 h-6" style={{ color: rarityCfg?.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-sm" style={{ color: rarityCfg?.color }}>Guaranteed {rarityName}</h3>
                      <p className="text-xs text-muted-foreground">1 card, always {rarityName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🪙</span>
                      <span className="text-sm font-heading text-amber-300">{cost}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Faction Packs */}
        <div>
          <h3 className="font-heading text-sm text-amber-400/70 uppercase tracking-widest mb-3">Faction Packs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FACTIONS.map(faction => {
              const fc = FACTION_CONFIG[faction];
              return (
                <motion.div
                  key={faction}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-slate-800/40 rounded-xl border border-slate-700/30 p-4 ${opening ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-amber-500/30'}`}
                  onClick={() => buyPack('faction', faction)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${fc.color}33, hsl(230, 15%, 10%))` }}>
                      {fc.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-sm text-amber-100">{faction} Pack</h3>
                      <p className="text-xs text-muted-foreground">1 {faction} card</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🪙</span>
                      <span className="text-sm font-heading text-amber-300">{config?.faction_pack_cost ?? 150}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {(profile?.coins || 0) < (config?.standard_pack_cost ?? 100) && (
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