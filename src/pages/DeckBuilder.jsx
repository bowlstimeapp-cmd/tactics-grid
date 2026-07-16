import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Copy, Pencil, X } from 'lucide-react';
import { motion } from 'framer-motion';
import GameCard from '@/components/game/GameCard';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';
import { RARITY_CONFIG, FACTION_CONFIG, getDeckSize, MAX_COPIES_PER_CARD } from '@/lib/gameData';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const FACTIONS = Object.keys(FACTION_CONFIG);

export default function DeckBuilder() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterRarities, setFilterRarities] = useState([]);
  const [filterFactions, setFilterFactions] = useState([]);
  const [gameMode, setGameMode] = useState('standard');

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const [profiles, userDecks] = await Promise.all([
        base44.entities.PlayerProfile.filter({ created_by_id: me.id }),
        base44.entities.Deck.filter({ created_by_id: me.id }),
      ]);
      if (profiles[0]) setProfile(profiles[0]);
      setDecks(userDecks);
      setLoading(false);
    }
    load();
  }, []);

  const owned = profile?.collection || {};
  const ownedCards = ALL_CARDS.filter(c => (owned[c.card_id] || 0) > 0);

  const filteredCards = ownedCards.filter(c => {
    if (filterRarities.length > 0 && !filterRarities.includes(c.rarity)) return false;
    if (filterFactions.length > 0 && !filterFactions.includes(c.faction)) return false;
    return true;
  });

  const countInDeck = (cardId) => deckCards.filter(id => id === cardId).length;

  const saveDeck = async () => {
    if (!deckName.trim() || deckCards.length !== getDeckSize(gameMode)) return;
    const counts = {};
    for (const id of deckCards) {
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > MAX_COPIES_PER_CARD) return;
    }
    if (editingDeck) {
      await base44.entities.Deck.update(editingDeck.id, { name: deckName, card_ids: deckCards, game_mode: gameMode });
      setDecks(prev => prev.map(d => d.id === editingDeck.id ? { ...d, name: deckName, card_ids: deckCards } : d));
    } else {
      const newDeck = await base44.entities.Deck.create({ name: deckName, card_ids: deckCards, game_mode: gameMode });
      setDecks(prev => [...prev, newDeck]);
    }
    setShowCreate(false);
    setEditingDeck(null);
    setDeckName('');
    setDeckCards([]);
  };

  const deleteDeck = async (id) => {
    await base44.entities.Deck.delete(id);
    setDecks(prev => prev.filter(d => d.id !== id));
  };

  const duplicateDeck = async (deck) => {
    const newDeck = await base44.entities.Deck.create({ name: deck.name + ' (Copy)', card_ids: deck.card_ids });
    setDecks(prev => [...prev, newDeck]);
  };

  const addCard = (cardId) => {
    const ownedCount = owned[cardId] || 0;
    const maxCopies = Math.min(ownedCount, MAX_COPIES_PER_CARD);
    setDeckCards(prev => {
      const inDeck = prev.filter(id => id === cardId).length;
      if (inDeck >= maxCopies || prev.length >= getDeckSize(gameMode)) return prev;
      return [...prev, cardId];
    });
  };

  const removeCard = (cardId) => {
    setDeckCards(prev => {
      const idx = prev.lastIndexOf(cardId);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  };

  const toggleRarity = (r) => setFilterRarities(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const toggleFaction = (f) => setFilterFactions(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const openEdit = (deck) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setDeckCards(deck.card_ids || []);
    setGameMode(deck.game_mode || 'standard');
    setShowCreate(true);
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
        <h1 className="font-heading text-xl text-amber-200">Deck Builder</h1>
        <Button size="sm" onClick={() => { setEditingDeck(null); setDeckName(''); setDeckCards([]); setGameMode('standard'); setShowCreate(true); }} className="ml-auto bg-amber-600 hover:bg-amber-500 text-black">
          <Plus className="w-4 h-4 mr-1" /> New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center text-muted-foreground mt-12">
          <p>No decks yet. Create one to start building!</p>
          {ownedCards.length === 0 ? (
            <p className="text-xs mt-1">You need to own cards first — open some packs in the Shop.</p>
          ) : (
            <p className="text-xs mt-1">You own {ownedCards.length} cards — tap "New Deck" to get started!</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map(deck => {
            const cards = (deck.card_ids || []).map(id => getCardById(id)).filter(Boolean);
            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-amber-100">{deck.name}</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(deck)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicateDeck(deck)}><Copy className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteDeck(deck.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {cards.slice(0, 10).map(c => (
                    <GameCard key={c.card_id} card={c} size="sm" />
                  ))}
                  {cards.length > 10 && <span className="self-center text-xs text-muted-foreground">+{cards.length - 10} more</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{cards.length}/{getDeckSize(deck.game_mode || 'standard')} cards · {(deck.game_mode || 'standard') === 'enlarged' ? '4×4' : '3×3'}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl bg-slate-900 border-amber-900/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-amber-200">
              {editingDeck ? 'Edit Deck' : 'Create Deck'}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Deck name..."
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            className="bg-slate-800/50 border-slate-700/40"
          />

          <div className="flex gap-2">
            {['standard', 'enlarged'].map(mode => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  gameMode === mode
                    ? 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800/50 border-slate-700/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'standard' ? 'Standard (3×3, 7 cards)' : 'Enlarged (4×4, 12 cards)'}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Select {getDeckSize(gameMode)} cards ({deckCards.length}/{getDeckSize(gameMode)}) — add up to the number of copies you own
            {ownedCards.length === 0 && ' — You need to own cards first!'}
          </p>

          {/* Filters */}
          <div className="space-y-2 mt-2">
            <div className="flex flex-wrap gap-1.5">
              {RARITIES.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRarity(r)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    filterRarities.includes(r)
                      ? 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                      : 'bg-slate-800/50 border-slate-700/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FACTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFaction(f)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    filterFactions.includes(f)
                      ? 'bg-purple-600/30 border-purple-500/50 text-purple-200'
                      : 'bg-slate-800/50 border-slate-700/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {FACTION_CONFIG[f].icon} {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-3">
            {filteredCards.map(card => {
              const ownedCount = owned[card.card_id] || 0;
              const inDeck = countInDeck(card.card_id);
              return (
                <div key={card.card_id} className="relative">
                  <GameCard
                    card={card}
                    size="sm"
                    selected={inDeck > 0}
                    onClick={() => addCard(card.card_id)}
                    className={inDeck >= Math.min(ownedCount, MAX_COPIES_PER_CARD) ? 'opacity-40 pointer-events-none' : ''}
                  />
                  <p className="text-center text-[9px] text-amber-300/60 mt-0.5">{inDeck}/{Math.min(ownedCount, MAX_COPIES_PER_CARD)}</p>
                  {inDeck > 0 && (
                    <button
                      onClick={() => removeCard(card.card_id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-black text-[10px] font-bold flex items-center justify-center shadow-lg hover:bg-amber-500"
                    >
                      {inDeck}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            onClick={saveDeck}
            disabled={!deckName.trim() || deckCards.length !== getDeckSize(gameMode)}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-black font-heading"
          >
            Save Deck ({deckCards.length}/{getDeckSize(gameMode)})
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}