import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === 'get') {
      const configs = await base44.asServiceRole.entities.GameConfig.list();
      if (configs.length > 0) {
        return Response.json({ config: configs[0] });
      }
      const defaultConfig = {
        standard_pack_cost: 100,
        standard_pack_size: 3,
        faction_pack_cost: 150,
        guaranteed_rare_cost: 300,
        guaranteed_epic_cost: 600,
        guaranteed_legendary_cost: 500,
        pack_odds: [
          { rarity: "Common", weight: 65 },
          { rarity: "Uncommon", weight: 23 },
          { rarity: "Rare", weight: 9 },
          { rarity: "Epic", weight: 2.5 },
          { rarity: "Legendary", weight: 0.5 },
        ],
        card_overrides: {},
        achievement_rewards: {
          first_win: "standard",
          wins_10: "standard",
          wins_50: "guaranteed_rare",
          wins_100: "guaranteed_rare",
          wins_500: "guaranteed_epic",
          streak_5: "standard",
          streak_10: "guaranteed_rare",
          collector_25: "standard",
          collector_50: "guaranteed_rare",
          collector_100: "guaranteed_epic",
          gold_rank: "guaranteed_rare",
          diamond_rank: "guaranteed_epic",
        },
      };
      const created = await base44.asServiceRole.entities.GameConfig.create(defaultConfig);
      return Response.json({ config: created });
    }

    if (action === 'save') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const { configId, data } = body;
      const updated = await base44.asServiceRole.entities.GameConfig.update(configId, data);
      return Response.json({ config: updated });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});