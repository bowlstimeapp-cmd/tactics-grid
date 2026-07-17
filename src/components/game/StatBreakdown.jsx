import React from 'react';

export default function StatBreakdown({ breakdown }) {
  if (!breakdown || breakdown.length <= 1) return null;

  const dirs = ['north', 'east', 'south', 'west'];
  const dirLabels = { north: '↑', east: '→', south: '↓', west: '←' };

  return (
    <div className="space-y-1 mt-2 pt-2 border-t border-amber-500/20">
      <p className="text-[10px] font-heading text-amber-400/70 uppercase tracking-wide">Stat Breakdown</p>
      {breakdown.map((entry, i) => {
        const hasMods = dirs.some(d => entry[d] !== 0);
        if (i === 0) {
          // Base stats — always show
          return (
            <div key={i} className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 flex-1 truncate">{entry.source}</span>
              {dirs.map(d => (
                <span key={d} className="text-slate-300 font-mono w-6 text-center">{entry[d]}</span>
              ))}
            </div>
          );
        }
        if (!hasMods) return null;
        return (
          <div key={i} className="flex items-center gap-1 text-[10px]">
            <span className="text-amber-200/70 flex-1 truncate">{entry.source}</span>
            {dirs.map(d => (
              <span key={d} className={`font-mono w-6 text-center ${entry[d] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {entry[d] > 0 ? '+' : ''}{entry[d]}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}