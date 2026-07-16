import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import GameCard from './GameCard';
import { getCardById } from '@/lib/cardDatabase';
import { getDeckSize } from '@/lib/gameData';
import { Loader2, Layers, Plus } from 'lucide-react';

export default function DeckSelectModal({ open, onConfirm, gameMode = 'standard' }) {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return;
    async function load() {
      try {
        const me = await base44.auth.me();
        const userDecks = await base44.entities.Deck.filter({ created_by_id: me.id });
        setDecks(userDecks.filter(d => (d.game_mode || 'standard') === gameMode));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [open]);

  const selectedDeck = decks.find(d => d.id === selectedId);
  const selectedCards = selectedDeck
    ? (selectedDeck.card_ids || []).map(id => getCardById(id)).filter(Boolean)
    : [];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl bg-slate-900 border-amber-900/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-amber-200">Choose Your Deck</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">You don't have any decks yet.</p>
            <Button onClick={() => navigate('/decks')} className="bg-amber-600 hover:bg-amber-500 text-black">
              <Plus className="w-4 h-4 mr-1" /> Build a Deck
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mt-2">
              {decks.map(deck => {
                const cards = (deck.card_ids || []).map(id => getCardById(id)).filter(Boolean);
                const isSelected = selectedId === deck.id;
                return (
                  <div
                    key={deck.id}
                    onClick={() => setSelectedId(deck.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700/40 bg-slate-800/30 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading text-amber-100 text-sm">{deck.name}</h3>
                      <span className="text-xs text-muted-foreground">{cards.length}/{getDeckSize(gameMode)}</span>
                    </div>
                    <div className="flex gap-1">
                      {cards.map((c, i) => (
                        <GameCard key={i} card={c} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => onConfirm(selectedCards)}
              disabled={!selectedDeck || selectedCards.length < getDeckSize(gameMode)}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-black font-heading"
            >
              Use This Deck
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}