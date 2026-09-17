/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — central configuration
 *  Tweak the game (rules, names, links, board sizes) HERE.
 * ─────────────────────────────────────────────────────────────
 */
export const CFG = {
  GAME_NAME: 'DiliCards',

  // Your links (shown in the game + on victory postcards)
  SITE: 'https://dilicard.badhon.online',
  TWITTER: 'https://x.com/BadhonAI',
  TWITTER_HANDLE: '@BadhonAI',

  // Rules
  TURN_SECONDS: 10,          // seconds per turn
  LOCK_MS: 950,              // pause to show a no-match pair before flipping back
  ART_COUNT: 10,             // how many character sprites exist (src/assets/art)
  JOIN_TIMEOUT: 15000,       // guest join timeout

  // Room prefix for the free PeerJS matchmaking cloud (keep it unique to your game)
  PREFIX: 'dilicards-room-',

  // Board sizes offered in the menu
  BOARD_SIZES: [
    { pairs: 6,  label: 'Easy · 12' },
    { pairs: 8,  label: 'Medium · 16' },
    { pairs: 10, label: 'Hard · 20' },
  ],

  // Scattered-board layout per board size (H = board height as % of width)
  LAYOUT: { 6: { H: 112, pct: 19.5 }, 8: { H: 125, pct: 18 }, 10: { H: 140, pct: 17 } },

  // localStorage key for the saved player name
  STORE_KEY: 'dc-name',

  // Winner postcards: OFF until the owner approves a design.
  // (Round 1 — 6 AI backgrounds in src/assets/postcards/ — was rejected:
  //  "no one looks good. I will add it later." To ship: choose designs,
  //  update POSTCARD_VARIANTS in src/game/postcard.js, flip this to true.)
  POSTCARDS_ENABLED: false,

  // Winner score cards (shareable). Owner approved the "Hero" + "Banner"
  // backgrounds in src/assets/scorecards/ with the hide-opponent toggle.
  SCORECARD_ENABLED: true,
};
