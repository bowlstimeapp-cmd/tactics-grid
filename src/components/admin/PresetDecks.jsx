import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GameCard from '@/components/game/GameCard';
import { getCardById } from '@/lib/cardDatabase';
import { FACTION_CONFIG } from '@/lib/gameData';
import { PRESET_DECKS } from '@/lib/presetDecks';

function PowerBar({ power }) {
  const color = power >= 85 ? 'bg-emerald-500' : power >= 80 ? 'bg-amber-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${power}%` }} />
      </div>
      <span className="text-xs font-bold text-amber-200 tabular-nums">{power}/100</span>
    </div>
  );
}

export default function PresetDecks() {
  const [selectedDeck, setSelectedDeck] = useState(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Curated synergy decks — each contains 7 cards (duplicates allowed) identified through passive interactions, faction synergies, and positional combos. Click a deck to view its cards.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESET_DECKS.map((deck) => {
          const factionCfg = FACTION_CONFIG[deck.faction] || { icon: '⚔️', color: '#C0C0C0' };
          return (
            <button
              key={deck.name}
              onClick={() => setSelectedDeck(deck)}
              className="text-left bg-slate-800/40 rounded-xl border border-slate-700/30 p-4 hover:border-amber-700/40 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading text-amber-100 text-sm flex items-center gap-1.5">
                  <span>{factionCfg.icon}</span>
                  {deck.name}
                </h3>
                <PowerBar power={deck.power} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{deck.description}</p>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selectedDeck} onOpenChange={() => setSelectedDeck(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-amber-900/30 max-h-[90vh] overflow-y-auto">
          {selectedDeck && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-amber-200 flex items-center gap-2">
                  <span>{FACTION_CONFIG[selectedDeck.faction]?.icon || '⚔️'}</span>
                  {selectedDeck.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <PowerBar power={selectedDeck.power} />
                <span className="text-xs text-muted-foreground">
                  {selectedDeck.cards.length} cards
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {selectedDeck.description}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 justify-items-center">
                {selectedDeck.cards.map((cardId, idx) => {
                  const card = getCardById(cardId);
                  if (!card) return null;
                  return (
                    <GameCard key={`${cardId}-${idx}`} card={card} size="sm" />
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}