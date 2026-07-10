import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';

export default function CardDetailModal({ card, onClose, owned, effectiveStats }) {
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || {};
  const faction = FACTION_CONFIG[card.faction] || {};
  const passive = PASSIVES[card.passive_id];
  const total = card.north + card.east + card.south + card.west;

  const es = effectiveStats;
  const hasEff = !!es;
  const effects = es?.effects || [];

  const statValue = (dir) => (es ? es[dir] : card[dir]);
  const statMod = (dir) => (es?.mods?.[dir] || 0);
  const statColor = (dir) => {
    const m = statMod(dir);
    if (m > 0) return 'text-emerald-400';
    if (m < 0) return 'text-red-400';
    return 'text-amber-200';
  };

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
            {['north', 'east', 'south', 'west'].map(dir => (
              <div key={dir} className="text-center">
                <div className="text-xs text-muted-foreground">{dir[0].toUpperCase()}</div>
                <div className={`text-lg font-bold ${statColor(dir)}`}>
                  {statValue(dir)}
                  {hasEff && statMod(dir) !== 0 && (
                    <span className="text-[10px] ml-0.5">
                      ({card[dir]}{statMod(dir) > 0 ? '+' : ''}{statMod(dir)})
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold text-amber-400">
                {hasEff ? statValue('north') + statValue('east') + statValue('south') + statValue('west') : total}
              </div>
            </div>
          </div>

          {/* Active effects (only when inspecting board cards) */}
          {hasEff && effects.length > 0 && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-left space-y-1">
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

          {owned === false && (
            <p className="text-xs text-red-400">Not in your collection</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}