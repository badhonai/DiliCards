# DiliCards - Agent Handbook

> Read this whole file once before touching anything. It describes the repo **as it is right now** (not a changelog). It is the single source of truth, so **update it whenever you change something and commit it with that change.**

---

## 1. What this is (5 seconds)

A **2-player, real-time memory-match (concentration) game played on two phones**.

- **P2P, no backend, free.** PeerJS cloud only brokers the handshake, then phones talk directly.
- **The host is authoritative**: runs the engine + turn timer. The guest mirrors state and sends tap intents.
- **Stack:** React 18 + Vite, plain JS/JSX, no Tailwind. Static hosting (owner uploads `dist/*` by hand).
- **Links:** main site `https://dilicard.badhon.online` · caption short-link `https://dilicard.vercel.app` (redirects to main) · X `@BadhonAI` · repo `badhonai/DiliCards`.

## 2. What is live right now

| Feature | State |
|---|---|
| Winner **score cards** | **ON** (`CFG.SCORECARD_ENABLED=true`). Winner-only, end screen. 2 backgrounds "Preset A"/"Preset B", hide/show opponent name, Save PNG, Share on X (prefilled tweet). |
| Old winner **postcards** | **OFF** (`CFG.POSTCARDS_ENABLED=false`). Round 1 rejected by owner. Do NOT enable without owner approval. |
| Rematch | **Host must approve.** Guest sends a request; nothing restarts until the host accepts. |
| Identity | User picks name + one of 4 Dili stickers (never random). Saved to localStorage. |
| Tests | **120/120 green** (engine 40, render 43, p2p 37). |

## 3. File map (where everything lives)

```
dilicards/
├── AGENTS.md                  ← this file (keep it current)
├── index.html                 title + meta/OG/Twitter card ("DiliCards by BadhonAI")
├── public/
│   ├── favicon.png            64×64 logo on cream square
│   └── og.png                 1200×630 link-preview image
├── src/
│   ├── main.jsx               React entry (createRoot)
│   ├── App.jsx                screen router: menu|host|join|game + onboarding popup + toast
│   ├── config.js              ★ EVERY tunable: names, links, TURN_SECONDS, LOCK_MS,
│   │                          BOARD_SIZES, LAYOUT, PREFIX, STORE_KEY, feature flags
│   ├── index.css              all UI styling (clay theme, mobile-first)
│   ├── art.css                card-face backgrounds (the 10 GIFs)
│   ├── assets/
│   │   ├── logo.png           owner logo, warm clay orange (used everywhere)
│   │   ├── logo-white.png     same logo in white (card-back mark)
│   │   ├── art/art-0..9.gif   the 10 Dili GIFs = THE ONLY card faces
│   │   ├── dili-*.png         4 stickers = avatar pool + mascots
│   │   ├── postcards/*.jpg    6 rejected postcard backgrounds (keep, unused)
│   │   └── scorecards/        sc-hero + sc-banner = THE score cards in use
│   │                          (sc-classic/ring/night = extras, not referenced yet)
│   ├── game/                  pure logic, no React, unit-testable
│   │   ├── engine.js          ★ state machine: flips, match/mismatch, timer, scores, sync payloads
│   │   ├── net.js             PeerJS wrapper: createHost/createGuest/send/makeCode
│   │   ├── layout.js          scattered non-overlapping card positions (computeLayout)
│   │   ├── audio.js           WebAudio sfx + buzz + mute
│   │   ├── avatar.js          AVATARS list + loadAvatar/saveAvatar (null until user picks)
│   │   ├── postcard.js        old postcards renderer (OFF, leave alone)
│   │   └── scorecard.js       ★ SCORECARD_VARIANTS + renderScorecard + tweetText (canvas)
│   ├── hooks/
│   │   └── useDiliGame.js     ★ the orchestrator: screens, role, conns, timers,
│   │                          onboarding, message handlers, rematch approval, wake lock
│   └── components/
│       ├── MenuScreen.jsx     home: identity card, board-size chips, Create/Join
│       ├── OnboardModal.jsx   bottom sheet: name + 4-sticker picker
│       ├── HostScreen.jsx     waiting room: code, copy/share link, waiting list
│       ├── JoinScreen.jsx     connecting screen + real error messages
│       ├── GameScreen.jsx     in-game HUD: opponent top, Board, own card bottom
│       ├── Board.jsx          renders the card field (passes CFG.LAYOUT[pairs].pct)
│       ├── EndOverlay.jsx     end screen: winner/loser/tie + ScorecardPicker + rematch buttons
│       ├── ScorecardPicker.jsx ★ winner share card: bg pick, hide-opponent, save, X share
│       ├── LostOverlay.jsx    "opponent left" (host keeps room; guest can reconnect)
│       ├── PostcardPicker.jsx old postcards UI (unused while OFF)
│       └── Icons.jsx / XIcon.jsx   inline SVG icons (replace all emoji)
├── test/
│   ├── engine.test.mjs        40 tests - pure rules
│   ├── render.test.mjs        43 tests - SSR smoke of every screen
│   ├── p2p.test.mjs           37 tests - two real hooks over a fake PeerJS ("two phones")
│   ├── fake-peer.mjs          in-memory PeerJS clone
│   ├── peer-loader.mjs        maps 'peerjs' → fake in Node
│   └── register.mjs / hook-entry.js   test plumbing
├── legacy/index.html          old single-file v3, history only, don't touch
└── postcards/                 preview mockups only, NOT shipped
```

**Where to make a common change** (fast lookup):

| You want to change... | Edit this |
|---|---|
| Timer seconds, lock pause, board sizes, room prefix, links | `src/config.js` |
| Game rules (flips, scoring, timeout) | `src/game/engine.js` + keep `engine.test.mjs` green |
| Card/board layout behavior | `src/game/layout.js`, `Board.jsx` |
| Look & feel / colors / spacing | `src/index.css` |
| A specific screen's text | the matching file in `src/components/` |
| Networking / join / reconnect / rematch | `src/game/net.js` + `src/hooks/useDiliGame.js` (p2p tests are the safety net) |
| Add a scorecard background | `src/assets/scorecards/`, add entry to `SCORECARD_VARIANTS` + a layout branch in `scorecard.js` |
| Link-preview image (og.png) | run `python3 /home/user/scripts/og_image.py` from the repo root |
| Tweet caption for the score card | `tweetText()` in `src/game/scorecard.js` |

## 4. Core conventions (know these before editing)

### Engine state `S`
```
S = { pairs, deck:[artIds], cards:[{id, art, state:'down'|'up'|'matched'}],
      flipped:[ids], scores:{1,2}, turn:1|2, phase:'play'|'locked'|'done',
      timeLeft, deadline, winner }
```
- `turn` / `winner` values: **1 = host, 2 = guest**, `winner 0 = tie`.
- **Scores are ABSOLUTE on both phones:** `scores[1]` = host, `scores[2]` = guest.
  When displaying, resolve by role: host shows own = `scores[1]`, guest shows own = `scores[2]`.
- In `EndOverlay`, winner/loser **names** are resolved by whether the *viewer* won (`iWon`), never by mapping `winner 1|2` onto my/their.
- Mismatch → `phase:'locked'` for 950 ms → cards flip back, turn swaps, fresh 10 s timer.
- Timeout is enforced by the **host only** and broadcast to the guest.

### Network messages (PeerJS)
| Message | Direction | Payload / meaning |
|---|---|---|
| `hello` | guest→host on connect | `{name, avatar}` |
| `init` | host→guest on connect & on rematch | `{pairs, deck, hostName, hostAvatar, tl}` - guest rebuilds view |
| `sync` | host→guest after every change + 1 Hz | `{cards, flipped, s1, s2, phase, turn, winner, tl, ev}` |
| `tap` | guest→host | `{cardId}` - host validates and resolves |
| `rematch-req` | guest→host | `{name}` - host shows "Accept / Not now", **never auto-starts** |
| `bye` | either | opponent shows LostOverlay |

- A **new host connection always takes over** the old one (reconnect support).
- Fake PeerJS quirk: both peers must be `open=true` before either 'open' event fires, or `FakeConn.send()` drops messages.

## 5. Hard rules (owner's, never violate)

1. **Mobile first** - game screen is a locked `100dvh` flex column, no page scroll.
2. **No emoji in the UI** - use the logo and `Icons.jsx` SVGs only.
3. **Avatars are a user choice** (4 Dili stickers), never random.
4. **First-join flow**: `?join=CODE` without a saved identity → popup → straight into the game.
5. **Fixed rules**: 2 flips/turn; match = +1 and go again; mismatch or timeout = flip back + other player.
6. **Claymorphism**, cards at random non-overlapping positions, 10 Dili GIFs are the ONLY faces.
7. **Credit**: no plain "@BadhonAI" text, follow button only.
8. **Free hosting only** - no paid services; owner uploads `dist/*` manually.
9. **Rematch requires host approval** (a `rematch-req` must never auto-restart).
10. **No em dash (U+2014) anywhere** - not in UI, captions, metadata, or comments. Use commas/periods.

## 6. Everyday workflow

```bash
cd /home/user/dilicards
npm install      # node_modules does NOT persist between sessions - always run first
npm test         # 3 suites, 120 assertions - must stay green
npm run build    # → dist/  (owner uploads this to dilicard.badhon.online)
```

**On every change:** edit → `npm test` → `npm run build` → commit → **update this AGENTS.md** → push → remind the owner to re-upload `dist/*`.

Push (PAT is not stored in git config; local remote is the clean URL):
```bash
git config user.name "badhonai"                                   # identity resets between sessions
git config user.email "badhonai@users.noreply.github.com"
git push "https://x-access-token:<PAT>@github.com/badhonai/DiliCards.git" main
```

## 7. Environment gotchas

- **Sandbox ≠ phone.** The PeerJS broker returns Cloudflare 1020 from this datacenter; the game works from real phones. Tests use the fake PeerJS.
- `node_modules` and running servers do **not** survive between sessions. If `npm test`/`build` says "Cannot find package" or "vite not found", run `npm install` and retry.
- Preview the built site: `python3 -m http.server 8000 --bind 0.0.0.0 -d dist`.
- PIL + DejaVu fonts available for image work. `image_search`/`generate_image` for new art.
- React SSR escapes `'` as `&#x27;` and inserts `<!-- -->` between adjacent expressions - write render-test assertions accordingly.
- If a push 403s, ask the owner for a fresh PAT and use the URL form above.
