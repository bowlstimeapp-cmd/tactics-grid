import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Gift, Home, Swords, Layers, Library, Sparkles, Grid3x3, BookOpen, ChevronRight } from 'lucide-react';
import { loadGameConfig } from '@/lib/gameConfig';
import { applyCardOverrides } from '@/lib/cardDatabase';
import { openPack, applyCardsToCollection } from '@/lib/packLogic';

const SECTIONS = [
  {
    icon: Grid3x3, color: 'text-amber-400',
    title: 'How to Play',
    items: [
      'Place a card from your hand onto an empty board tile.',
      'Each card has four directional stats (N/E/S/W). When you place a card adjacent to an enemy, your attacking stat competes against their defending stat on that side.',
      'If your stat is higher, you capture (flip) the enemy card to your colour.',
      'Captures can chain — a newly flipped card can capture its own neighbours.',
      'Tap the Inspect button during a match to view any card\'s effective stats and active bonuses.',
    ],
  },
  {
    icon: Sparkles, color: 'text-purple-400',
    title: 'Bonuses & Card Synergies',
    items: [
      'Every card has a passive ability that activates based on board position, timing, or neighbours.',
      'Support abilities (Rally, Commander, Frost, etc.) buff or debuff other cards. When a support card is flipped, its ability lingers for one more turn before expiring.',
      'Self abilities only affect the card itself and deactivate immediately when flipped.',
      'Board tiles can grant bonuses: Portal tiles double passive effects, Forge tiles boost Machines, Sanctuaries block buffs, and more.',
      'Faction synergies: cards like Dragon Bond gain bonuses when adjacent to same-faction cards.',
    ],
  },
  {
    icon: Layers, color: 'text-blue-400',
    title: 'Game Modes',
    items: [
      'Standard (3×3): A 9-tile board with 7 cards per deck. Fast-paced matches.',
      'Enlarged (4×4): A 16-tile board with 12 cards per deck. More strategic depth.',
      'Play AI: Practice against the computer at different difficulty levels.',
      'Play Casual: Relaxed matches with no ELO at stake.',
      'Play Ranked: Live PvP matches that affect your ELO ranking.',
    ],
  },
  {
    icon: Library, color: 'text-emerald-400',
    title: 'Collection & Deck Building',
    items: [
      'Open booster packs in the Shop to collect new cards across 8 factions and 5 rarities.',
      'Duplicate cards are converted into Essence, which can be used to craft specific cards.',
      'Build decks in the Deck Builder — Standard decks need 7 cards, Enlarged decks need 12.',
      'You can include up to 3 copies of any single card in a deck (limited by how many you own).',
      'The Card Exchange lets you trade unwanted cards for Gems or Essence.',
    ],
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [openedCards, setOpenedCards] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          if (profiles[0].has_seen_welcome) {
            navigate('/', { replace: true });
            return;
          }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [navigate]);

  const claimPacks = async () => {
    if (!profile || claiming || claimed) return;
    setClaiming(true);
    try {
      const cfg = await loadGameConfig();
      applyCardOverrides(cfg.card_overrides);
      let allCards = [];
      for (let i = 0; i < 2; i++) {
        allCards.push(...openPack('standard', cfg));
      }
      const { newCollection, essenceGained } = applyCardsToCollection(profile.collection || {}, allCards);
      const updated = await base44.entities.PlayerProfile.update(profile.id, {
        collection: newCollection,
        essence: (profile.essence || 0) + essenceGained,
        has_seen_welcome: true,
      });
      setProfile(updated);
      setOpenedCards(allCards);
      setClaimed(true);
    } catch (e) {
      console.error(e);
    }
    setClaiming(false);
  };

  const goToHome = async () => {
    if (profile && !profile.has_seen_welcome) {
      await base44.entities.PlayerProfile.update(profile.id, { has_seen_welcome: true });
    }
    navigate('/', { replace: true });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl text-amber-200 tracking-wide"
        >
          Welcome to Gridfall
        </motion.h1>
        <p className="text-sm text-muted-foreground mt-2">A tactical card game of strategy and capture</p>
      </div>

      {/* Sections */}
      <div className="px-4 space-y-4 pb-32">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`w-5 h-5 ${section.color}`} />
              <h3 className="font-heading text-amber-200 text-sm">{section.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500/40 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Claim + Home buttons — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-amber-900/30 px-4 py-4 space-y-2">
        {claimed && openedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-xs text-emerald-400"
          >
            ✓ Claimed 2 Standard Packs — {openedCards.length} cards added to your collection!
          </motion.div>
        )}
        <div className="flex gap-2 max-w-md mx-auto">
          {!claimed ? (
            <>
              <Button
                onClick={claimPacks}
                disabled={claiming || !profile}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-heading"
              >
                <Gift className="w-4 h-4 mr-2" />
                {claiming ? 'Opening...' : 'Claim 2 Free Packs'}
              </Button>
              <Button
                onClick={goToHome}
                variant="outline"
                className="px-4"
              >
                <Home className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={goToHome}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-heading"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          )}
        </div>
        {!claimed && (
          <p className="text-center text-[10px] text-muted-foreground">
            Claim your free starter packs, or skip to Home
          </p>
        )}
      </div>
    </div>
  );
}