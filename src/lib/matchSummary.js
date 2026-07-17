import { PASSIVES } from './gameData';

export function computeMatchSummary(moves) {
  if (!moves || moves.length === 0) return null;

  let biggestCapture = null;
  let keyChain = null;
  const cardCaptureCounts = {};

  for (const move of moves) {
    const captures = move.captures || move.flips || [];
    const captureCount = captures.length;
    const chainOrder = move.chain_order ?? 0;
    const cardName = move.card_name || move.cardName || 'Unknown';
    const cardId = move.card_id || move.cardId || '';

    if (!biggestCapture || captureCount > biggestCapture.count) {
      biggestCapture = { card_name: cardName, count: captureCount, turn: move.turn };
    }

    if (chainOrder > 0 && (!keyChain || chainOrder > keyChain.chain_order)) {
      keyChain = { card_name: cardName, chain_order: chainOrder, turn: move.turn };
    }

    if (cardId) {
      if (!cardCaptureCounts[cardId]) {
        cardCaptureCounts[cardId] = {
          card_name: cardName,
          passive_id: move.passive_id || '',
          totalCaptures: 0,
        };
      }
      cardCaptureCounts[cardId].totalCaptures += captureCount;
    }
  }

  let mvpCard = null;
  for (const cardId of Object.keys(cardCaptureCounts)) {
    const c = cardCaptureCounts[cardId];
    if (!mvpCard || c.totalCaptures > mvpCard.totalCaptures) {
      mvpCard = c;
    }
  }

  if (mvpCard && mvpCard.passive_id && PASSIVES[mvpCard.passive_id]) {
    mvpCard.passive_name = PASSIVES[mvpCard.passive_id].name;
    mvpCard.passive_icon = PASSIVES[mvpCard.passive_id].icon;
  }

  return { biggestCapture, keyChain, mvpCard };
}