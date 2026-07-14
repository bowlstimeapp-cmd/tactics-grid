import React from 'react';
import TileIcon, { getTileEffect } from './TileIcon';

export default function TileLegend({ tiles }) {
  const uniqueTiles = [];
  const seen = new Set();
  (tiles || []).forEach(t => {
    if (t && !seen.has(t.type)) {
      seen.add(t.type);
      uniqueTiles.push(t);
    }
  });

  if (uniqueTiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2 px-1">
      {uniqueTiles.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-secondary/40 border border-border/50 rounded-md px-2 py-1"
        >
          <TileIcon tile={t} size={12} />
          <span className="text-[10px] font-medium text-muted-foreground">{t.label}:</span>
          <span className="text-[10px] text-amber-300">{getTileEffect(t)}</span>
        </div>
      ))}
    </div>
  );
}