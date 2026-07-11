import { ALL_CARDS, getCardsByFaction } from '@/lib/cardDatabase';
import { ESSENCE_VALUES } from '@/lib/gameData';

export const PACK_TYPES = {
  standard: { id: 'standard', name: 'Standard Pack', costField: 'standard_pack_cost' },
  faction: { id: 'faction', name: 'Faction Pack', costField: 'faction_pack_cost' },
  guaranteed_rare: { id: 'guaranteed_rare', name: 'Guaranteed Rare Pack', costField: 'guaranteed_rare_cost', guaranteedRarity: 'Rare' },
  guaranteed_epic: { id: 'guaranteed_epic', name: 'Guaranteed Epic Pack', costField: 'guaranteed_epic_cost', guaranteedRarity: 'Epic' },
};

export const REWARD_PACK_OPTIONS = [
  { value: '', label: 'No Reward' },
  { value: 'standard', label: 'Standard Pack' },
  { value: 'guaranteed_rare', label: 'Guaranteed Rare Pack' },
  { value: 'guaranteed_epic', label: 'Guaranteed Epic Pack' },
];

export const REWARD_LABELS = {
  standard: 'Standard Pack',
  guaranteed_rare: 'Guaranteed Rare Pack',
  guaranteed_epic: 'Guaranteed Epic Pack',
};

function rollRarity(odds) {
  const total = odds.reduce((s, o) => s + o.weight, 0);
  const roll = Math.random() * total;
  let cumulative = 0;
  for (const { rarity, weight } of odds) {
    cumulative += weight;
    if (roll <= cumulative) return rarity;
  }
  return 'Common';
}

function openStandardPack(size, odds) {
  const cards = [];
  for (let i = 0; i < size; i++) {
    const rarity = rollRarity(odds);
    const pool = ALL_CARDS.filter(c => c.rarity === rarity);
    const card = pool[Math.floor(Math.random() * pool.length)];
    cards.push(card);
  }
  return cards;
}

function openFactionPack(faction, odds) {
  const factionCards = getCardsByFaction(faction);
  const rarity = rollRarity(odds);
  let pool = factionCards.filter(c => c.rarity === rarity);
  if (pool.length === 0) pool = factionCards;
  return [pool[Math.floor(Math.random() * pool.length)]];
}

function openGuaranteedPack(rarity) {
  const pool = ALL_CARDS.filter(c => c.rarity === rarity);
  return [pool[Math.floor(Math.random() * pool.length)]];
}

export function openPack(packType, config, faction) {
  switch (packType) {
    case 'standard':
      return openStandardPack(config.standard_pack_size || 3, config.pack_odds);
    case 'faction':
      return openFactionPack(faction, config.pack_odds);
    case 'guaranteed_rare':
      return openGuaranteedPack('Rare');
    case 'guaranteed_epic':
      return openGuaranteedPack('Epic');
    default:
      return [];
  }
}

export function getPackCost(packType, config) {
  const packDef = PACK_TYPES[packType];
  if (!packDef) return 0;
  return config?.[packDef.costField] ?? 0;
}

export function applyCardsToCollection(collection, cards) {
  const newCollection = { ...(collection || {}) };
  let essenceGained = 0;
  cards.forEach(card => {
    if (newCollection[card.card_id]) {
      essenceGained += ESSENCE_VALUES[card.rarity] || 5;
    } else {
      newCollection[card.card_id] = 1;
    }
  });
  return { newCollection, essenceGained };
}