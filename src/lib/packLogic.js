import { ALL_CARDS, getCardsByFaction, getCardById } from '@/lib/cardDatabase';
import { GEM_EXCHANGE_VALUES } from '@/lib/gameData';

export const PACK_TYPES = {
  standard: { id: 'standard', name: 'Standard Pack', costField: 'standard_pack_cost', currency: 'coins' },
  faction: { id: 'faction', name: 'Faction Pack', costField: 'faction_pack_cost', currency: 'coins' },
  guaranteed_rare: { id: 'guaranteed_rare', name: 'Guaranteed Rare Pack', costField: 'guaranteed_rare_cost', guaranteedRarity: 'Rare', currency: 'coins' },
  guaranteed_epic: { id: 'guaranteed_epic', name: 'Guaranteed Epic Pack', costField: 'guaranteed_epic_cost', guaranteedRarity: 'Epic', currency: 'coins' },
  guaranteed_legendary: { id: 'guaranteed_legendary', name: 'Guaranteed Legendary Pack', costField: 'guaranteed_legendary_cost', guaranteedRarity: 'Legendary', currency: 'gems' },
};

export { GEM_EXCHANGE_VALUES };

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

const ALT_ART_CHANCE = 0.02;

// 2% chance for Epic/Legendary cards pulled from packs to become alt arts.
// Alt arts are the same card (same card_id, stats, passive) but with a rainbow
// holographic treatment — a chase cosmetic for collectors.
function maybeAltArt(card) {
  if (!card) return card;
  if (card.rarity === 'Epic' || card.rarity === 'Legendary') {
    if (Math.random() < ALT_ART_CHANCE) {
      return { ...card, is_alt_art: true };
    }
  }
  return card;
}

function openStandardPack(size, odds) {
  const cards = [];
  for (let i = 0; i < size; i++) {
    const rarity = rollRarity(odds);
    const pool = ALL_CARDS.filter(c => c.rarity === rarity);
    const card = pool[Math.floor(Math.random() * pool.length)];
    cards.push(maybeAltArt(card));
  }
  return cards;
}

function openFactionPack(faction, odds) {
  const factionCards = getCardsByFaction(faction);
  const rarity = rollRarity(odds);
  let pool = factionCards.filter(c => c.rarity === rarity);
  if (pool.length === 0) pool = factionCards;
  return [maybeAltArt(pool[Math.floor(Math.random() * pool.length)])];
}

function openGuaranteedPack(rarity) {
  const pool = ALL_CARDS.filter(c => c.rarity === rarity);
  return [maybeAltArt(pool[Math.floor(Math.random() * pool.length)])];
}

export function openCustomPack(pack, config) {
  const pool = (pack.card_ids || []).map(getCardById).filter(Boolean);
  if (pool.length === 0) return [];
  const size = config.standard_pack_size || 3;
  const cards = [];
  for (let i = 0; i < size; i++) {
    const rarity = rollRarity(config.pack_odds);
    let matches = pool.filter(c => c.rarity === rarity);
    if (matches.length === 0) matches = pool;
    cards.push(maybeAltArt(matches[Math.floor(Math.random() * matches.length)]));
  }
  return cards;
}

export function getCustomPackCost(pack) {
  return pack?.cost ?? 0;
}

export function getCustomPackRarityAllocation(pack) {
  const counts = {};
  (pack.card_ids || []).forEach(id => {
    const card = getCardById(id);
    if (card) counts[card.rarity] = (counts[card.rarity] || 0) + 1;
  });
  return counts;
}

export function openPack(packType, config, faction, customPack) {
  switch (packType) {
    case 'standard':
      return openStandardPack(config.standard_pack_size || 3, config.pack_odds);
    case 'faction':
      return openFactionPack(faction, config.pack_odds);
    case 'guaranteed_rare':
      return openGuaranteedPack('Rare');
    case 'guaranteed_epic':
      return openGuaranteedPack('Epic');
    case 'guaranteed_legendary':
      return openGuaranteedPack('Legendary');
    case 'custom':
      return openCustomPack(customPack, config);
    default:
      return [];
  }
}

export function getPackCost(packType, config) {
  const packDef = PACK_TYPES[packType];
  if (!packDef) return 0;
  return config?.[packDef.costField] ?? 0;
}

export const MAX_COPIES_PER_CARD = 3;

export function applyCardsToCollection(collection, cards, altArts) {
  const newCollection = { ...(collection || {}) };
  const newAltArts = { ...(altArts || {}) };
  let essenceGained = 0;
  cards.forEach(card => {
    // Alt arts are tracked separately but still count as the original card
    if (card.is_alt_art) {
      newAltArts[card.card_id] = (newAltArts[card.card_id] || 0) + 1;
    }
    const currentCount = newCollection[card.card_id] || 0;
    if (currentCount >= MAX_COPIES_PER_CARD) {
      essenceGained += GEM_EXCHANGE_VALUES[card.rarity] || 0;
    } else {
      newCollection[card.card_id] = currentCount + 1;
    }
  });
  return { newCollection, essenceGained, newAltArts };
}

export function exchangeCards(collection, cardIds) {
  const newCollection = { ...(collection || {}) };
  let gemsGained = 0;
  cardIds.forEach(id => {
    const card = getCardById(id);
    if (!card || !newCollection[id]) return;
    gemsGained += GEM_EXCHANGE_VALUES[card.rarity] || 0;
    newCollection[id] = newCollection[id] - 1;
    if (newCollection[id] <= 0) delete newCollection[id];
  });
  return { newCollection, gemsGained };
}