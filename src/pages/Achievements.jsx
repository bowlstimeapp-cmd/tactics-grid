import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from '@/lib/gameData';
import { loadGameConfig } from '@/lib/gameConfig';
import { applyCardOverrides } from '@/lib/cardDatabase';
import { openPack, applyCardsToCollection, REWARD_LABELS } from '@/lib/packLogic';
import GameCard from '@/components/game/GameCard';

export default function Achievements() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealedCards, setRevealedCards] = useState(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [claiming, setClaiming] = useState(false);

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

  const claimReward = async (ach) => {
    if (!profile || !config || claiming) return;
    const reward = config.achievement_rewards?.[ach.id];
    if (!reward) return;
    const claimedRewards = profile.claimed_rewards || [];
    if (claimedRewards.includes(ach.id)) return;
    if (!ach.check(profile)) return;

    setClaiming(true);
    setRevealIndex(-1);

    const cards = openPack(reward, config);
    setRevealedCards(cards);

    const { newCollection, essenceGained } = applyCardsToCollection(profile.collection, cards);
    const updated = await base44.entities.PlayerProfile.update(profile.id, {
      collection: newCollection,
      essence: (profile.essence || 0) + essenceGained,
      claimed_rewards: [...claimedRewards, ach.id],
    });
    setProfile(updated);

    for (let i = 0; i < cards.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setRevealIndex(i);
    }
    setClaiming(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  const claimedRewards = profile?.claimed_rewards || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Star className="w-5 h-5 text-amber-400" />
        <h1 className="font-heading text-xl text-amber-200">Achievements</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          {claimedRewards.length}/{ACHIEVEMENTS.length} claimed
        </span>
      </div>

      <AnimatePresence>
        {revealedCards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-800/60 rounded-xl border border-amber-900/20 p-6 mb-6"
          >
            <h3 className="font-heading text-center text-amber-200 mb-4">Reward Earned!</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {revealedCards.map((card, i) => (
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
              onClick={() => { setRevealedCards(null); setClaiming(false); }}
              variant="outline"
              className="mx-auto block mt-4 border-amber-900/30"
            >
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto space-y-2">
        {ACHIEVEMENTS.map((ach, i) => {
          const unlocked = profile && ach.check(profile);
          const claimed = claimedRewards.includes(ach.id);
          const reward = config?.achievement_rewards?.[ach.id];

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                claimed
                  ? 'bg-emerald-900/10 border-emerald-500/20'
                  : unlocked
                    ? 'bg-amber-900/10 border-amber-500/20'
                    : 'bg-slate-800/30 border-slate-700/20 opacity-60'
              }`}
            >
              <span className="text-2xl">{ach.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${unlocked ? 'text-amber-200' : ''}`}>{ach.name}</p>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
                {reward && (
                  <p className="text-xs text-amber-400/80 mt-0.5">🎁 Reward: {REWARD_LABELS[reward] || reward}</p>
                )}
              </div>
              {claimed ? (
                <span className="text-emerald-400 text-xs whitespace-nowrap">✓ Claimed</span>
              ) : unlocked && reward ? (
                <Button
                  size="sm"
                  onClick={() => claimReward(ach)}
                  disabled={claiming}
                  className="bg-amber-600 hover:bg-amber-500 text-black"
                >
                  <Gift className="w-3 h-3 mr-1" /> Claim
                </Button>
              ) : unlocked ? (
                <span className="text-emerald-400 text-xs">✓ Unlocked</span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}