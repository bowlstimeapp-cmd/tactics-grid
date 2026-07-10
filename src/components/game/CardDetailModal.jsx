import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';

export default function CardDetailModal({ card, onClose, owned }) {
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || {};
  const faction = FACTION_CONFIG[card.faction] || {};
  const passive = PASSIVES[card.passive_id];
  const total = card.north + card.east + card.south + card.west;

  return (
    <Dialog open={!!card} onOpenChange={() => onClose()}>
      <DialogContent className="bg-slate-900 border-amber-900/30 max-w-sm">
        <div className="text-center space-y-4">
          {/* Big faction icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center text-4xl border-2" style={{ borderColor: rarity.color }}>
            {faction.icon}
          </div>

          <div>
            <h2 className="font-heading text-xl" style={{ color: rarity.color }}>{card.name}</h2>
            <p className="text-sm text-muted-foreground">{card.faction} · {card.rarity}</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">N</div>
              <div className="text-lg font-bold text-amber-200">{card.north}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">E</div>
              <div className="text-lg font-bold text-amber-200">{card.east}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">S</div>
              <div className="text-lg font-bold text-amber-200">{card.south}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">W</div>
              <div className="text-lg font-bold text-amber-200">{card.west}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold text-amber-400">{total}</div>
            </div>
          </div>

          {/* Passive */}
          {passive && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span>{passive.icon}</span>
                <span className="font-heading text-sm text-amber-300">{passive.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{passive.description}</p>
            </div>
          )}

          {/* Flavour text */}
          {card.flavour_text && (
            <p className="text-xs italic text-muted-foreground px-4">"{card.flavour_text}"</p>
          )}

          {!owned && (
            <p className="text-xs text-red-400">Not in your collection</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}