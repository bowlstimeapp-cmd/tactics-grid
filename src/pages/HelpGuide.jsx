import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3, Sparkles, Layers, Library, Swords, Trophy, Store, Repeat, Shield, BookOpen, Target } from 'lucide-react';

const HELP_SECTIONS = [
  {
    icon: Grid3x3, color: 'text-amber-400',
    title: 'How to Play',
    content: [
      { sub: 'Card Placement', text: 'Each turn, you place one card from your hand onto an empty board tile. In Standard mode the board is 3×3 (9 tiles, 7 cards per deck). In Enlarged mode it\'s 4×4 (16 tiles, 12 cards per deck).' },
      { sub: 'Combat & Capturing', text: 'Every card has four directional stats: North, East, South, and West. When you place a card next to an enemy card, the stat on your card\'s touching side is compared against the enemy\'s opposing stat. If yours is higher, you capture (flip) the enemy card to your colour.' },
      { sub: 'Chain Captures', text: 'When a card is flipped, it immediately attempts to capture its own adjacent enemies. This can cascade into multi-card chain captures — a key strategic element.' },
      { sub: 'Winning', text: 'When the board is full, the player with the most cards in their colour wins. A draw is possible if both players control the same number of tiles.' },
      { sub: 'Inspect Mode', text: 'During a match, tap the Inspect button to examine any card on the board. You\'ll see its effective stats (including all active bonuses), passive ability details, and tile effects.' },
      { sub: 'Effective Stats', text: 'A card\'s effective stats include its base values plus all active passive bonuses, aura effects, and tile bonuses. The numbers shown on the board are always the effective values — green for buffed, red for debuffed.' },
    ],
  },
  {
    icon: Sparkles, color: 'text-purple-400',
    title: 'Passive Abilities & Synergies',
    content: [
      { sub: 'Passive Types', text: 'Every card has a passive ability. Self passives (like Aggression, Fortification, Lone Wolf) only buff the card itself. Support passives (like Rally, Commander, Frost) buff or debuff OTHER cards on the board.' },
      { sub: 'Support Ability Lingering', text: 'When a support card is captured (flipped), its aura doesn\'t vanish instantly — it lingers until the end of the original owner\'s next turn. During this lingering period, the aura continues to affect cards. Any bonuses that were already applied are permanently locked in even after the ability expires.' },
      { sub: 'Self Ability Deactivation', text: 'Self passives deactivate immediately when the card is flipped. The card loses its bonus right away. Exception: some passives like Vengeance and Phoenix specifically activate AFTER being flipped.' },
      { sub: 'Faction Synergies', text: 'Some passives react to adjacent factions: Dragon Bond gives +2 when next to a Dragon card, Mage Bond gives +2 next to a Mage, etc. Building decks with faction clusters amplifies these bonuses.' },
      { sub: 'Board Tiles', text: 'Special tiles appear on certain board layouts: Portal tiles double all passive effects (cardMods, auras, and global auras). Forge tiles boost Machine faction cards. Arcane tiles boost Mages. Forest tiles boost Beasts. Sanctuary tiles prevent all buffs. Power tiles grant +1 to all stats.' },
      { sub: 'Global Auras', text: 'Commander gives +1 all sides to ALL friendly cards on the board. Plague does the same but to enemies. These stack from multiple sources, capped at 2 global aura sources per card.' },
      { sub: 'Flip Immunity', text: 'Cards with Immovable or Titan passives cannot be flipped by attackers whose effective total stats are below a threshold (22 for Immovable, 18 for Titan). This check uses the attacker\'s effective stats, not just printed values.' },
    ],
  },
  {
    icon: Layers, color: 'text-blue-400',
    title: 'Game Modes',
    content: [
      { sub: 'Standard (3×3)', text: 'The classic mode. 9-tile board, 7 cards per deck. Fast matches that reward quick thinking and efficient card placement.' },
      { sub: 'Enlarged (4×4)', text: 'A larger 16-tile board with 12 cards per deck. More room for synergy combos, longer matches, and deeper strategic planning.' },
      { sub: 'Play AI', text: 'Practice against the AI at Easy, Medium, or Hard difficulty. Great for learning the game and testing new decks without risking ELO.' },
      { sub: 'Play Casual', text: 'Relaxed matches against the AI. No pressure, just fun. Selectable from the Home screen.' },
      { sub: 'Play Ranked (PvP)', text: 'Live player-vs-player matches. Your ELO ranking goes up with wins and down with losses. Matchmaking pairs you with opponents of similar skill.' },
    ],
  },
  {
    icon: Library, color: 'text-emerald-400',
    title: 'Card Collection',
    content: [
      { sub: 'Opening Packs', text: 'Visit the Shop to buy booster packs with coins. Standard Packs contain 3 random cards. Faction Packs focus on a specific faction. Guaranteed Rare/Epic/Legendary packs ensure at least one card of that rarity.' },
      { sub: 'Rarities', text: 'Cards come in 5 rarities: Common (grey), Uncommon (green), Rare (blue), Epic (purple), and Legendary (gold). Higher rarity cards have better stats and more powerful passives.' },
      { sub: 'Factions', text: 'There are 8 factions: Knights, Dragons, Beasts, Mages, Machines, Spirits, Assassins, and Undead. Each faction has its own playstyle and synergy cards.' },
      { sub: 'Duplicates & Essence', text: 'When you open a pack and get a card you already own, it\'s converted into Essence. Essence can be used to craft specific cards you want.' },
      { sub: 'Card Exchange', text: 'The Card Exchange lets you trade unwanted cards for Gems or Essence. Use it to refine your collection toward the cards you need for your decks.' },
    ],
  },
  {
    icon: Swords, color: 'text-amber-400',
    title: 'Deck Building',
    content: [
      { sub: 'Creating a Deck', text: 'Go to the Deck Builder to create and manage decks. Choose Standard (7 cards) or Enlarged (12 cards) mode, then select cards from your collection.' },
      { sub: 'Copy Limit', text: 'You can include up to 3 copies of any single card in a deck, limited by how many copies you own. The deck builder shows your owned count and how many are currently in the deck.' },
      { sub: 'Removing Cards', text: 'To remove a card from your deck, click the red minus button on that card in the deck builder. Each click removes one copy. You can also click a card to add copies back.' },
      { sub: 'Strategy Tips', text: 'Balance your deck with high-stat cards for combat and synergy cards for bonuses. Consider faction pairings (e.g., Dragon Bond + Dragon cards). Include cards that counter flip immunity if you face defensive decks.' },
    ],
  },
  {
    icon: Trophy, color: 'text-yellow-400',
    title: 'Progression & Ranking',
    content: [
      { sub: 'ELO System', text: 'Your ELO starts at 1200. Ranked PvP wins increase it, losses decrease it. The amount of change depends on the ELO difference between you and your opponent.' },
      { sub: 'Ranks', text: 'Ranks are based on ELO: Bronze (0-1199), Silver (1200-1399), Gold (1400-1599), Platinum (1600-1799), Diamond (1800-1999), Master (2000-2199), Grandmaster (2200+).' },
      { sub: 'XP & Levels', text: 'Earn XP from matches and quests. Each level requires more XP than the last. Level up to show your experience.' },
      { sub: 'Achievements', text: 'Unlock achievements for milestones like first win, 10/50/100 wins, win streaks, collection milestones, and rank achievements. Some achievement rewards include free packs.' },
      { sub: 'Daily Quests', text: 'Complete daily quests for coins, XP, and essence. Quests refresh each day with new objectives.' },
    ],
  },
  {
    icon: Store, color: 'text-amber-400',
    title: 'Shop & Economy',
    content: [
      { sub: 'Coins', text: 'Earn coins from matches, quests, and achievements. Spend them on booster packs in the Shop.' },
      { sub: 'Essence', text: 'Earned from duplicate cards and quests. Used to craft specific cards you want.' },
      { sub: 'Gems', text: 'Earned from the Card Exchange. Used for premium purchases like Guaranteed Legendary Packs.' },
      { sub: 'Pack Types', text: 'Standard Pack (100 coins, 3 random cards), Faction Pack (150 coins, faction-focused), Guaranteed Rare (300 coins), Guaranteed Epic (600 coins), Guaranteed Legendary (500 gems).' },
    ],
  },
];

export default function HelpGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-amber-900/20 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Help Guide
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 pb-8 max-w-2xl mx-auto">
        {HELP_SECTIONS.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`w-5 h-5 ${section.color}`} />
              <h3 className="font-heading text-amber-200 text-base">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.content.map((item, j) => (
                <div key={j}>
                  <p className="text-xs font-semibold text-amber-400/80 mb-0.5">{item.sub}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <Button
          onClick={() => navigate('/')}
          className="w-full bg-amber-600 hover:bg-amber-500 text-black font-heading mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}