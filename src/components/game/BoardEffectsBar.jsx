import React from 'react';
import { getActiveBoardEffects } from '@/lib/gameEngine';

export default function BoardEffectsBar({ gameState, myPlayerNum = 1 }) {
  if (!gameState) return null;
  const effects = getActiveBoardEffects(gameState);
  if (effects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
      {effects.map((eff, i) => {
        const isDebuff = eff.mod < 0;
        return (
          <div
            key={i}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
              isDebuff
                ? 'bg-red-950/40 border-red-500/30 text-red-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
            title={`${eff.sourceCard}: ${eff.description}`}
          >
            <span>{eff.icon}</span>
            <span className="font-medium">{eff.passiveName}</span>
            <span className="opacity-70">
              {eff.scope === 'global' ? 'All' : 'Adj'} {eff.target} {eff.mod > 0 ? '+' : ''}{eff.mod}
            </span>
          </div>
        );
      })}
    </div>
  );
}