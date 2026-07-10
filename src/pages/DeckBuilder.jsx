import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Copy, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import GameCard from '@/components/game/GameCard';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';

export default function DeckBuilder() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

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
  const ownedCards = ALL_CARDS.filter(c => owned[c.card_id]);

  const saveDeck = async () => {
    if (!deckName.trim() || deckCards.length !== 5) return;
    if (editingDeck) {
      await base44.entities.Deck.update(editingDeck.id, { name: deckName, card_ids: deckCards });
      setDecks(prev => prev.map(d => d.id === editingDeck.id ? { ...d, name: deckName, card_ids: deckCards } : d));
    } else {
      const newDeck = await base44.entities.Deck.create({ name: deckName, card_ids: deckCards });
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

  const toggleCard = (cardId) => {
    setDeckCards(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
      if (prev.length >= 5) return prev;
      return [...prev, cardId];
    });
  };

  const openEdit = (deck) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setDeckCards(deck.card_ids || []);
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
        <Button size="sm" onClick={() => { setEditingDeck(null); setDeckName(''); setDeckCards([]); setShowCreate(true); }} className="ml-auto bg-amber-600 hover:bg-amber-500 text-black">
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
                <p className="text-xs text-muted-foreground mt-2">{cards.length}/5 cards</p>
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
          <p className="text-sm text-muted-foreground">
            Select 5 cards ({deckCards.length}/5)
            {ownedCards.length === 0 && ' — You need to own cards first!'}
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-2">
            {(ownedCards.length > 0 ? ownedCards : ALL_CARDS).map(card => (
              <GameCard
                key={card.card_id}
                card={card}
                size="sm"
                selected={deckCards.includes(card.card_id)}
                onClick={() => toggleCard(card.card_id)}
              />
            ))}
          </div>
          <Button
            onClick={saveDeck}
            disabled={!deckName.trim() || deckCards.length !== 5}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-black font-heading"
          >
            Save Deck ({deckCards.length}/5)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}