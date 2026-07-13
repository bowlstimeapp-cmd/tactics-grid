import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';
import GameCard from './GameCard';

export default function CardDetailModal({ card, onClose, owned, effectiveStats }) {
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || {};
  const passive = PASSIVES[card.passive_id];

  const es = effectiveStats;
  const hasEff = !!es;
  const effects = es?.effects || [];

  return (
    <Dialog open={!!card} onOpenChange={() => onClose()}>
      <DialogContent className="bg-slate-900 border-amber-900/30 max-w-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Large card — same appearance as collection but bigger */}
          <GameCard card={card} size="2xl" effectiveStats={effectiveStats} />

          {/* Active effects (only when inspecting board cards) */}
          {hasEff && effects.length > 0 && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-left space-y-1 w-full">
              <p className="text-xs font-heading text-amber-400 mb-1">Active Bonuses</p>
              {effects.map((eff, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  {eff.type === 'self_passive' && `${eff.icon} ${eff.name} (self passive)`}
                  {eff.type === 'tile' && `📍 ${eff.label} (tile effect)`}
                  {eff.type === 'tile_faction' && `📍 ${eff.label} (${eff.faction} faction bonus)`}
                  {eff.type === 'aura' && `✨ ${eff.from} aura (${eff.mod > 0 ? '+' : ''}${eff.mod})`}
                  {eff.type === 'global_aura' && `🌟 ${eff.from} global aura (${eff.mod > 0 ? '+' : ''}${eff.mod})`}
                  {eff.type === 'flip_immunity' && `🛡️ Flip immunity (blocks < ${eff.minTotalPower} total power)`}
                </div>
              ))}
            </div>
          )}

          {/* Flavour text */}
          {card.flavour_text && (
            <p className="text-xs italic text-muted-foreground px-4 text-center">"{card.flavour_text}"</p>
          )}

          {owned === false && (
            <p className="text-xs text-red-400">Not in your collection</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}