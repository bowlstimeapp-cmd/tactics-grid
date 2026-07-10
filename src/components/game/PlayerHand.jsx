import React from 'react';
import GameCard from './GameCard';

export default function PlayerHand({ cards, selectedIndex, onSelect, isActive, playerNum, playerName }) {
  return (
    <div className={`space-y-2 ${isActive ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${playerNum === 1 ? 'bg-blue-500' : 'bg-red-500'} ${isActive ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-medium text-muted-foreground">{playerName}</span>
        <span className="text-xs text-amber-400 ml-auto">{cards.length} cards</span>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {cards.map((card, idx) => (
          <GameCard
            key={card.card_id + idx}
            card={card}
            size="sm"
            selected={selectedIndex === idx}
            onClick={() => isActive && onSelect(idx)}
          />
        ))}
      </div>
    </div>
  );
}