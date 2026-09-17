# DiliCards — Agent Handbook

Read this first. It is the single source of truth for picking up work in a new session.

## What this is

**DiliCards** — a 2-player, real-time, phone-vs-phone memory-match (concentration) game.
- **No backend, no accounts, 100% free.** P2P over the free [PeerJS](https://peerjs.com) cloud (broker only for the handshake). The **host is authoritative** (runs the engine, enforces the timer); the guest mirrors state and sends tap intents.
- Site (user-managed, static): **https://dilicard.badhon.online**
- GitHub: **`badhonai/DiliCards`** (remote `https://github.com/badhonai/DiliCards.git`)
- Brand/X: **@BadhonAI** → `https://x.com/BadhonAI`
- Stack: **React 18 + Vite** (plain JS, no framework, no Tailwind). ~274 kB JS / 83 kB gzip.

## Current state (2026-09-17)

- Latest commit: **`318ac8c`** — logo everywhere (no emoji), mobile-first board, avatar **picker**, first-join **onboarding popup**, softer follow button, 6 postcard variants (pending approval).
- Full suite green: **engine 40 + render 30 + p2p 34 = 104/104**. Build clean.
- **WINNER POSTCARDS ARE ON HOLD.** Round 1 (6 AI backgrounds in `src/assets/postcards/`) was rejected by the owner verbatim: *"No one looks good. Ok i will add it later."* The feature is gated OFF by `CFG.POSTCARDS_ENABLED = false` in `src/config.js` (winner screen shows a "coming soon" nudge instead). To ship later: owner provides/approves designs → update `POSTCARD_VARIANTS` in `src/game/postcard.js` → set flag `true` → re-run tests/build. All machinery (canvas renderer, `PostcardPicker`, share/download) is already written and tested.

## Standing owner rules (explicit — never violate)

1. **Mobile first.** The game screen is a locked `100dvh` flex column (opponent score card TOP, board fills the middle, own score card BOTTOM) — no page scroll, ever.
2. **No normal emoji anywhere in the UI.** Use `src/assets/logo.gif` (owner's animated logo — menu logo, card-back icon, favicon, og.png) and the inline SVG set in `src/components/Icons.jsx`.
3. **Avatars = user picks one of the 4 Dili stickers** (`src/assets/dili-{cool,funny,handsup,happy}.png`) — saved in `localStorage['dc-name-avatar']`. **Never random.** Picked in the onboarding popup; changeable by tapping the identity card in the menu.
4. **First-time join flow:** opening `?join=CODE` without saved name/avatar shows a bottom-sheet popup (name + Dili picker) with the room code — submit goes **straight into the game**, never the home screen.
5. **Rules (fixed):** 2 flips per turn; match = +1 and go again; mismatch or 10s timeout (host-enforced auto-pass) = flip back, other player's turn. Winner = most pairs.
6. **UI style:** claymorphism — no straight borders, no grid system; cards at random non-overlapping positions; the **10 Dili GIFs** (`src/assets/art/art-0..9.gif`) are the ONLY card faces.
7. **Credit:** no plain "@BadhonAI" text — follow button only (`MenuScreen` + `.tw-btn`), bigger + low-contrast (soft lavender, muted ink).
8. **Free hosting only** — zero cost, no credit card. Deployment = owner manually uploads `dist/*`.

## Architecture

```
dilicards/
├── AGENTS.md                  ← you are here
├── index.html
├── src/
│   ├── main.jsx               entry (createRoot)
│   ├── App.jsx                screen router: menu | host | join | game + OnboardModal + toast
│   ├── config.js              ★ ALL TUNABLES: names, links, TURN_SECONDS, LOCK_MS,
│   │                          BOARD_SIZES, LAYOUT, PREFIX (PeerJS room id),
│   │                          STORE_KEY, POSTCARDS_ENABLED
│   ├── index.css              full clay UI (mobile-first, no emoji)
│   ├── art.css                card-face backgrounds (the 10 GIFs)
│   ├── assets/
│   │   ├── logo.gif           owner logo (animated) — the game's icon
│   │   ├── art/art-0..9.gif   the ONLY card faces
│   │   ├── dili-*.png         4 3D Dili stickers = avatar pool + mascots
│   │   └── postcards/*.jpg    6 rejected round-1 postcard backgrounds (keep for now)
│   ├── game/                  pure logic (no React — unit-testable)
│   │   ├── engine.js          authoritative state machine: flip/lock/timeout/sync payloads
│   │   ├── net.js             PeerJS wrapper: createHost/createGuest/send, makeCode, wireOpen
│   │   ├── layout.js          scattered non-overlapping circle packing (computeLayout)
│   │   ├── audio.js           WebAudio sfx + buzz + setMuted
│   │   ├── avatar.js          AVATARS list, loadAvatar (null until chosen), saveAvatar
│   │   └── postcard.js        POSTCARD_VARIANTS + canvas renderPostcard (gated OFF)
│   ├── hooks/
│   │   └── useDiliGame.js     ★ the orchestrator: screens, role, conn, timers,
│   │                          onboarding (submitOnboard → pending join goes straight in),
│   │                          host/guest message handlers, rematch, wake lock
│   └── components/
│       ├── MenuScreen.jsx     identity card (tap → onboarding), board chips, Create/Join
│       ├── OnboardModal.jsx   bottom sheet: name + 4-sticker picker (+ join banner)
│       ├── HostScreen.jsx     code + copy/share link + waiting list
│       ├── JoinScreen.jsx     connecting… + real error texts (no endless spinner)
│       ├── GameScreen.jsx     TOP opp score card / Board / BOTTOM own score card + dock
│       ├── Board.jsx          viewport-fitting board; re-packs on resize/orientation
│       ├── EndOverlay.jsx     You win / X wins / tie (+ postcards when enabled)
│       ├── LostOverlay.jsx    opponent-left (host: room stays open; guest: reconnect)
│       ├── PostcardPicker.jsx renders all variants, Save/Share (native share + X intent)
│       └── Icons.jsx / XIcon.jsx   SVG icon set (no emoji)
├── test/
│   ├── engine.test.mjs        40 — pure engine rules (node, no deps)
│   ├── render.test.mjs        30 — SSR smoke of every screen (Vite ssrLoadModule)
│   ├── p2p.test.mjs           34 — two real hook instances ("two phones") through a
│   │                          fake PeerJS: join/flip/match/timeout/rematch/bye/rejoin
│   ├── fake-peer.mjs          in-memory PeerJS clone (must keep the wireOpen recipe)
│   ├── peer-loader.mjs        Node loader mapping 'peerjs' → fake (module.register)
│   ├── register.mjs / hook-entry.js   test plumbing
│   └── .tmp/                  build scratch (gitignored)
├── legacy/index.html          old single-file v3 (264K) — history only, don't touch
└── postcards/                 PREVIEW ARTIFACTS ONLY (not shipped):
    full/*.jpg (6 full-res mockups), thumb/*, x-post-mock.jpg, winner-screen.html
```

### Network protocol (both directions unless noted)

- `hello` (guest→host on open): `{name, avatar}` — host stores guest identity.
- `init` (host→guest, on connect **and** on rematch): `{pairs, deck, hostName, hostAvatar, tl}` — guest rebuilds view, enters game.
- `sync` (host→guest, after every mutation + 1 Hz `ev:'tick'`): `{cards:[states], flipped:[ids], s1, s2, phase, turn, winner, tl, ev}` — guest applies, plays fx.
- `tap` (guest→host): `{cardId}` — host validates (its turn, <2 flipped), resolves, syncs back.
- `rematch-req` (guest→host) → host `startRematch()` (fresh board + `init` + sync).
- `bye` (either) → opponent shows LostOverlay. **A NEW host connection always takes over** the old one (reconnect support).

### Engine state

`S = { pairs, deck:[artIds], cards:[{id,art,state:'down|up|matched'}], flipped:[ids],
scores:{1,2}, turn:1|2, phase:'play|locked|done', timeLeft, deadline, winner }`.
Mismatch → `phase:'locked'` for `CFG.LOCK_MS` (950 ms) → flip back + turn swap + fresh `TURN_SECONDS` (10 s). Timeout is checked by the **host only** (`checkTimeout`) and broadcast with `ev:'timeout'`.

## How to work

```bash
cd /home/user/dilicards
npm install        # node_modules does NOT persist between sessions — always run first
npm test           # all 3 suites (104 assertions)
npm run build      # → dist/
npm run dev        # Vite dev server (if you need live reload)
```

**Every change → `npm test` → `npm run build` → commit → push.** Then tell the owner: "redeploy by uploading `dist/*` to the root of dilicard.badhon.online" (they do it manually; no CI).

- Tweak game feel in `src/config.js` (timer, lock, board sizes, layout, links).
- The p2p suite is the safety net for network flow changes — if it fails, fix the app, not the assertions (unless the scenario itself is wrong, like the rejoin case below).
- `test/p2p.test.mjs` step 8b: a rejoin must match the host's **current** state snapshot (phase/scores/deck), not a fixed expectation — the scenario rejoins after a rematch.
- Fake PeerJS quirk: both peers must be `open=true` **before** either 'open' event fires, or `FakeConn.send()` drops messages.
- Avoid apostrophes/contractions in single-quoted UI strings (esbuild breaks, e.g. `they're`).
- React SSR renders escape `'` as `&#x27;` and insert `<!-- -->` between adjacent expressions — write test assertions accordingly.

## Environment gotchas

- **Sandbox ≠ phone.** The PeerJS broker (`0.peerjs.com`) returns Cloudflare 1020 from this datacenter — that's expected; the game works from real phones. Tests use the fake PeerJS.
- `node_modules` and background processes do **not** survive between sessions. To preview the built site: `python3 -m http.server 8000 --bind 0.0.0.0 -d dist` (user can open the port-8000 preview).
- PIL 12.3.0 + DejaVu fonts available for image mockups; `image_search`/`generate_image` available for new art.
- GitHub push: owner pasted a PAT into the chat (used for pushes `c6035b5`, `318ac8c`). **Owner was told to revoke it.** If a push 403s, ask the owner for a new token; push URL pattern: `https://x-access-token:<PAT>@github.com/badhonai/DiliCards.git`.

## Recent history (newest first)

- **`318ac8c`** — logo replaces all emoji (menu/card-back/favicon), mobile-first no-scroll board (flex 100dvh), avatar becomes a user **pick** (no auto-random), first-join onboarding popup (straight into game), follow button bigger + low-contrast, 6 postcard variants rendered — **then rejected by owner → gated OFF** (this is the current pending item).
- **`c6035b5`** — fixed guest "loading forever" (PeerJS open race → `wireOpen`; conn-aware loss; join timeouts; host conn takeover), mandatory saved name, create/join menu redesign.
- **`3981843`** and earlier — React+Vite rebuild from the single-file v3 (in `legacy/`), P2P over PeerJS, 10 s timer, clay UI.

## Open items / likely next prompts

1. **Winner postcards (owner will "add it later"):** when they send new designs (or pick from `postcards/full/`), swap the backgrounds in `POSTCARD_VARIANTS`, set `CFG.POSTCARDS_ENABLED = true`, re-test, re-build, push. Preview tooling that worked: PIL contact sheet of variants with logo + sticker + name + score.
2. Anything gameplay-related: edit `config.js` + engine, keep the 104-assertion suite green.
3. Deploy: always remind the owner to upload `dist/*` after a build.
