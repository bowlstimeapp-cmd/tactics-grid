import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GameCard from './GameCard';

export default function CardSelectModal({ open, deck, onConfirm, title = "Choose 5 Cards" }) {
  const [selected, setSelected] = useState([]);

  const toggle = (cardId) => {
    setSelected(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
      if (prev.length >= 5) return prev;
      return [...prev, cardId];
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl bg-slate-900 border-amber-900/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-amber-200">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">Select exactly 5 cards for this match ({selected.length}/5)</p>
        </DialogHeader>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-4">
          {deck.map(card => (
            <GameCard
              key={card.card_id}
              card={card}
              size="md"
              selected={selected.includes(card.card_id)}
              onClick={() => toggle(card.card_id)}
            />
          ))}
        </div>
        <Button
          onClick={() => onConfirm(selected)}
          disabled={selected.length !== 5}
          className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-black font-heading"
        >
          Confirm Selection ({selected.length}/5)
        </Button>
      </DialogContent>
    </Dialog>
  );
}