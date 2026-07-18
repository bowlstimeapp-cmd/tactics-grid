import { base44 } from '@/api/base44Client';
import { PACK_COST, PACK_SIZE, PACK_ODDS } from './gameData';
import { getDefaultExpansionSettings } from './expansions';

const DEFAULT_CONFIG = {
  standard_pack_cost: PACK_COST,
  standard_pack_size: PACK_SIZE,
  faction_pack_cost: 150,
  guaranteed_rare_cost: 300,
  guaranteed_epic_cost: 600,
  guaranteed_legendary_cost: 500,
  pack_odds: PACK_ODDS,
  card_overrides: {},
  expansion_settings: getDefaultExpansionSettings(),
  achievement_rewards: {
    first_win: 'standard',
    wins_10: 'standard',
    wins_50: 'guaranteed_rare',
    wins_100: 'guaranteed_rare',
    wins_500: 'guaranteed_epic',
    streak_5: 'standard',
    streak_10: 'guaranteed_rare',
    collector_25: 'standard',
    collector_50: 'guaranteed_rare',
    collector_100: 'guaranteed_epic',
    gold_rank: 'guaranteed_rare',
    diamond_rank: 'guaranteed_epic',
  },
};

export async function loadGameConfig() {
  try {
    const response = await base44.functions.invoke('gameConfig', { action: 'get' });
    return { ...DEFAULT_CONFIG, ...response.data.config };
  } catch (e) {
    console.error('Failed to load game config:', e);
    return DEFAULT_CONFIG;
  }
}

export async function saveGameConfig(configId, data) {
  const response = await base44.functions.invoke('gameConfig', { action: 'save', configId, data });
  return response.data.config;
}

export { DEFAULT_CONFIG };