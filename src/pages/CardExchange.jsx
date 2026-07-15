import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import GameCard from '@/components/game/GameCard';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';
import { RARITY_CONFIG } from '@/lib/gameData';
import { GEM_EXCHANGE_VALUES, exchangeCards } from '@/lib/packLogic';

const RARITY_ORDER = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export default function CardExchange() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchangePile, setExchangePile] = useState({});
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        if (profiles[0]) setProfile(profiles[0]);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const owned = profile?.collection || {};

  const ownedCards = ALL_CARDS
    .filter(c => (owned[c.card_id] || 0) > 0)
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

  const addCard = (cardId) => {
    const ownedCount = owned[cardId] || 0;
    const current = exchangePile[cardId] || 0;
    if (current >= ownedCount) return;
    setExchangePile({ ...exchangePile, [cardId]: current + 1 });
  };

  const removeCard = (cardId) => {
    const current = exchangePile[cardId] || 0;
    if (current <= 0) return;
    const next = { ...exchangePile };
    if (current <= 1) delete next[cardId];
    else next[cardId] = current - 1;
    setExchangePile(next);
  };

  const selectedIds = Object.entries(exchangePile).flatMap(([id, count]) =>
    Array(count).fill(id)
  );
  const totalGems = selectedIds.reduce((sum, id) => {
    const card = getCardById(id);
    return sum + (card ? (GEM_EXCHANGE_VALUES[card.rarity] || 0) : 0);
  }, 0);
  const selectedCount = selectedIds.length;

  const doExchange = async () => {
    if (selectedCount === 0 || !profile || exchanging) return;
    setExchanging(true);
    try {
      const { newCollection, gemsGained } = exchangeCards(profile.collection, selectedIds);
      const updated = await base44.entities.PlayerProfile.update(profile.id, {
        collection: newCollection,
        essence: (profile.essence || 0) + gemsGained,
      });
      setProfile(updated);
      setExchangePile({});
    } catch (e) {
      console.error(e);
    }
    setExchanging(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-purple-200">Card Exchange</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <Gem className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium text-purple-300">{profile?.essence || 0}</span>
        </div>
      </div>

      {/* Exchange rates */}
      <div className="bg-slate-800/40 rounded-xl border border-purple-500/20 p-3 mb-4">
        <h3 className="font-heading text-xs text-purple-300/70 uppercase tracking-widest mb-2">Exchange Rates</h3>
        <div className="flex flex-wrap gap-3">
          {RARITY_ORDER.map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RARITY_CONFIG[r]?.color }} />
              <span className="text-xs" style={{ color: RARITY_CONFIG[r]?.color }}>{r}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs font-heading text-purple-300">{GEM_EXCHANGE_VALUES[r]} 💎</span>
            </div>
          ))}
        </div>
      </div>

      {ownedCards.length === 0 ? (
        <div className="text-center text-muted-foreground mt-12">
          <Repeat className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>You don't have any cards to exchange yet.</p>
          <p className="text-xs mt-1">Open packs in the Shop to collect cards.</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">Tap a card to add it to the exchange pile. Tap again to add more copies.</p>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {ownedCards.map(card => {
          const ownedCount = owned[card.card_id] || 0;
          const pileCount = exchangePile[card.card_id] || 0;
          const remaining = ownedCount - pileCount;
          const isSelected = pileCount > 0;
          return (
            <div key={card.card_id} className="relative">
              <div
                onClick={() => addCard(card.card_id)}
                className={`cursor-pointer rounded-lg transition-all ${isSelected ? 'ring-2 ring-purple-400 scale-95' : 'hover:scale-105'} ${remaining === 0 ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <GameCard card={card} size="md" />
              </div>
              <p className="text-center text-[10px] font-heading text-amber-300/70 mt-0.5"># {ownedCount} owned</p>
              {isSelected && (
                <button
                  onClick={() => removeCard(card.card_id)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shadow-lg hover:bg-purple-400"
                >
                  {pileCount}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Exchange bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-purple-500/30 p-4"
          >
            <div className="max-w-md mx-auto flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Exchanging {selectedCount} card{selectedCount > 1 ? 's' : ''}</p>
                <p className="font-heading text-lg text-purple-300">+{totalGems} 💎</p>
              </div>
              <Button
                onClick={doExchange}
                disabled={exchanging}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-heading"
              >
                {exchanging ? 'Exchanging...' : 'Exchange'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}