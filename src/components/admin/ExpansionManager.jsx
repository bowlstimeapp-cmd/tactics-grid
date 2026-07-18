import React from 'react';
import { Switch } from '@/components/ui/switch';
import { EXPANSIONS, getExpansionCards, isExpansionEnabled } from '@/lib/expansions';
import { RARITY_CONFIG } from '@/lib/gameData';
import GameCard from '@/components/game/GameCard';

export default function ExpansionManager({ expansionSettings, setExpansionSettings }) {
  const toggle = (expansionId, enabled) => {
    setExpansionSettings(prev => ({ ...prev, [expansionId]: enabled }));
  };

  if (EXPANSIONS.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-6 text-center text-muted-foreground">
        No franchised expansions are registered yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4">
        <h3 className="font-heading text-amber-200 mb-1">Franchised Expansions</h3>
        <p className="text-xs text-muted-foreground">
          Toggle an expansion off to remove its cards from booster packs and hide them from the collection.
          Players who already own the cards keep them.
        </p>
      </div>

      {EXPANSIONS.map(exp => {
        const cards = getExpansionCards(exp.id);
        const enabled = isExpansionEnabled(exp.id, expansionSettings);
        return (
          <div key={exp.id} className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-heading text-amber-100">{exp.name}</h4>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                    style={{ color: exp.accentColor, borderColor: exp.accentColor + '60' }}
                  >
                    {exp.franchise}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                <p className="text-xs text-amber-400/70 mt-1">{cards.length} cards</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs ${enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch checked={enabled} onCheckedChange={v => toggle(exp.id, v)} />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap pt-1">
              {cards.map(card => (
                <div key={card.card_id} className={!enabled ? 'opacity-40' : ''}>
                  <GameCard card={card} size="sm" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}