// Franchised Expansion Registry
// Each expansion groups a set of cards (identified by `expansion_id` on the
// card object) that an admin can enable or disable. Disabled expansions are
// excluded from booster packs and hidden from the collection browser.
// Core cards (no `expansion_id`) are always enabled.

import { ALL_CARDS } from './cardDatabase';

export const EXPANSIONS = [
  {
    id: 'ff8',
    name: 'Triple Triad',
    franchise: 'Final Fantasy VIII',
    description: 'A crossover expansion inspired by the heroes and villains of a legendary card-duelling saga.',
    accentColor: '#8B5CF6',
  },
  // Future franchised expansions go here.
  // { id: '...', name: '...', franchise: '...', description: '...' },
];

// Map each expansion id to its card list, derived from ALL_CARDS at runtime.
export function getExpansionCards(expansionId) {
  return ALL_CARDS.filter(c => c.expansion_id === expansionId);
}

export function getExpansionMeta(expansionId) {
  return EXPANSIONS.find(e => e.id === expansionId);
}

// Returns the list of expansion ids that are currently disabled.
export function getDisabledExpansionIds(expansionSettings) {
  return EXPANSIONS.filter(e => expansionSettings && expansionSettings[e.id] === false).map(e => e.id);
}

// All expansions default to enabled when no setting exists.
export function isExpansionEnabled(expansionId, expansionSettings) {
  return !(expansionSettings && expansionSettings[expansionId] === false);
}

// The card pool after removing disabled-expansion cards. Used by pack logic
// and the collection browser so toggles take effect everywhere at once.
export function getEnabledCards(expansionSettings) {
  const disabled = getDisabledExpansionIds(expansionSettings);
  if (disabled.length === 0) return ALL_CARDS;
  return ALL_CARDS.filter(c => !disabled.includes(c.expansion_id));
}

// Default settings object — every expansion enabled.
export function getDefaultExpansionSettings() {
  const settings = {};
  EXPANSIONS.forEach(e => { settings[e.id] = true; });
  return settings;
}