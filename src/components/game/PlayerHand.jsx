import React from 'react';
import GameCard from './GameCard';
import { getHandCardPreview, getPlacementPreview } from '@/lib/gameEngine';

export default function PlayerHand({ cards, selectedIndex, onSelect, isActive, playerNum, playerName, onInspect, onPlaceCard, myPlayerNum = 1, faceDown = false, gameState = null, selectedTile = null }) {
  return (
    <div className={`space-y-2 ${isActive ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${playerNum === 1 ? 'bg-blue-500' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-medium text-muted-foreground">{playerName}</span>
        <span className="text-xs text-amber-400 ml-auto">{cards.length} cards</span>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {cards.map((card, idx) => {
          // When a tile is selected, compute full effective stats for that placement
          // (tile bonus, adjacency auras, passive — everything). Otherwise fall back
          // to the partial hand preview (global auras only).
          const previewStats = gameState && !faceDown
            ? (selectedTile ? getPlacementPreview(card, gameState, selectedTile.row, selectedTile.col) : getHandCardPreview(card, gameState))
            : null;
          return (
            <GameCard
              key={card.card_id + idx}
              card={card}
              size="sm"
              myPlayerNum={myPlayerNum}
              faceDown={faceDown}
              selected={selectedIndex === idx}
              effectiveStats={previewStats}
              displayMode={selectedTile ? 'effective' : 'baseWithMods'}
              onClick={() => {
                if (onPlaceCard) onPlaceCard(idx);
                else if (onInspect) onInspect(card);
                else if (isActive) onSelect(idx);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}