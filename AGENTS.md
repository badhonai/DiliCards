# DiliCards - Agent Handbook

Read this first. It is the single source of truth for picking up work in a new session.
**Updated after EVERY change. If you change anything, update this file and commit it with the change.**

## What this is

**DiliCards** - a 2-player, real-time, phone-vs-phone memory-match (concentration) game.
- **No backend, no accounts, 100% free.** P2P over the free [PeerJS](https://peerjs.com) cloud (broker only for the handshake). The **host is authoritative** (runs the engine, enforces the timer); the guest mirrors state and sends tap intents.
- Site (user-managed, static): **https://dilicard.badhon.online**
- Short link (for tweet captions/share text only): **https://dilicard.vercel.app** (redirects to the main site above)
- GitHub: **`badhonai/DiliCards`** (remote: `https://github.com/badhonai/DiliCards.git`)
- Brand/X: **@BadhonAI** -> `https://x.com/BadhonAI`
- Stack: **React 18 + Vite** (plain JS/JSX, no framework, no Tailwind). ~277 kB JS / 84 kB gzip.

## Current state (2026-09-18)

- Latest commit: **`d57b003`** - "(you)" marker fixed on the host-win scoreboard, and **rematch now requires host approval** (no auto-restart, so the winner can download/share the score card first).
- Test counts: **engine 40 + render 43 + p2p 37 = 120/120 green.** Build clean.
- **Winner score cards are LIVE** (`CFG.SCORECARD_ENABLED = true`). Winner-only, on the end screen:
  - Two backgrounds (**`Preset A`** = hero layout, **`Preset B`** = banner layout) in `src/game/scorecard.js`.
  - **Hide/show opponent name** toggle, renders the opponent as `???` when hidden.
  - **Save image** (PNG download) and **Share on X** (opens `x.com/intent/tweet` with a canned caption).
  - Tweet caption uses the short link `https://dilicard.vercel.app`; the card footer shows `dilicard.badhon.online · @BadhonAI`.
  - Backgrounds: `src/assets/scorecards/` (hero + banner referenced; classic/ring/night are extra, unreferenced, owner may approve later).
- **Old winner postcards still OFF** (`CFG.POSTCARDS_ENABLED = false`). Rejected round 1 (6 AI backgrounds in `src/assets/postcards/`). Do not re-enable without owner approval.
- Branding: new citrus **logo** (`src/assets/logo.png` orange, `logo-white.png` for card backs), warm orange theme (blue accents removed), title/meta = **"DiliCards by BadhonAI"**.
- Link preview image rebuilt at **1200x630** (`public/og.png`): brand block LEFT, artwork RIGHT (vertically centered), verified no border collisions.

## Standing owner rules (explicit - never violate)

1. **Mobile first.** The game screen is a locked `100dvh` flex column (opponent score card TOP, board fills the middle, own score card BOTTOM) - no page scroll, ever.
2. **No normal emoji anywhere in the UI.** Use the logo and the inline SVG set in `src/components/Icons.jsx`.
3. **Avatars = user picks one of the 4 Dili stickers** (`src/assets/dili-{cool,funny,handsup,happy}.png`) - saved in `localStorage['dc-name-avatar']`. **Never random.** Picked in the onboarding popup; changeable by tapping the identity card in the menu.
4. **First-time join flow:** opening `?join=CODE` without saved name/avatar shows a bottom-sheet popup (name + Dili picker) with the room code - submit goes **straight into the game**, never the home screen.
5. **Rules (fixed):** 2 flips per turn; match = +1 and go again; mismatch or 10s timeout (host-enforced auto-pass) = flip back, other player's turn. Winner = most pairs.
6. **UI style:** claymorphism - no straight borders, no grid system; cards at random non-overlapping positions; the **10 Dili GIFs** (`src/assets/art/art-0..9.gif`) are the ONLY card faces.
7. **Credit:** no plain "@BadhonAI" text - follow button only (`MenuScreen` + `.tw-btn`), bigger + low-contrast (soft lavender, muted ink).
8. **Free hosting only** - zero cost, no credit card. Deployment = owner manually uploads `dist/*`.
9. **NO em dash (the "—" character) anywhere**, not in UI strings, captions, metadata, or comments. The owner dislikes it. Rewrite sentences with commas/periods instead. Also avoid en dash in UI copy.
10. **Rematch requires host approval.** A guest `rematch-req` must NEVER auto-restart the game.

## Architecture

```
dilicards/
├── AGENTS.md                  <- you are here (update it with every change)
├── index.html                 title/meta/OG/Twitter card ("DiliCards by BadhonAI"), og:image
├── public/
│   ├── favicon.png            64x64 logo on cream rounded square
│   └── og.png                 1200x630 link-preview image (brand left, art right)
├── src/
│   ├── main.jsx               entry (createRoot)
│   ├── App.jsx                screen router: menu | host | join | game + OnboardModal + toast
│   ├── config.js              ★ ALL TUNABLES: names, links, TURN_SECONDS, LOCK_MS,
│   │                          BOARD_SIZES, LAYOUT, PREFIX, STORE_KEY,
│   │                          POSTCARDS_ENABLED (false), SCORECARD_ENABLED (true)
│   ├── index.css              full clay UI (mobile-first, warnings about overflow/clipping)
│   ├── art.css                card-face backgrounds (the 10 GIFs)
│   ├── assets/
│   │   ├── logo.png           owner citrus logo (warm clay orange, all UI)
│   │   ├── logo-white.png     same logo white (card-back mark)
│   │   ├── art/art-0..9.gif   the ONLY card faces
│   │   ├── dili-*.png         4 3D Dili stickers = avatar pool + mascots
│   │   ├── postcards/*.jpg    6 rejected round-1 postcard backgrounds (keep for now)
│   │   └── scorecards/        sc-hero + sc-banner (APPROVED) + classic/ring/night (extra)
│   ├── game/                  pure logic (no React - unit-testable)
│   │   ├── engine.js          authoritative state machine: flip/lock/timeout/sync payloads
│   │   ├── net.js             PeerJS wrapper: createHost/createGuest/send, makeCode, wireOpen
│   │   ├── layout.js          scattered non-overlapping circle packing (computeLayout)
│   │   ├── audio.js           WebAudio sfx + buzz + setMuted
│   │   ├── avatar.js          AVATARS list, loadAvatar (null until chosen), saveAvatar
│   │   ├── postcard.js        POSTCARD_VARIANTS + canvas renderPostcard (gated OFF)
│   │   └── scorecard.js       ★ SCORECARD_VARIANTS + renderScorecard + tweetText (canvas)
│   ├── hooks/
│   │   └── useDiliGame.js     ★ the orchestrator: screens, role, conn, timers, onboarding,
│   │                          host/guest message handlers, rematch approval, wake lock
│   └── components/
│       ├── MenuScreen.jsx     identity card (tap -> onboarding), board chips, Create/Join
│       ├── OnboardModal.jsx   bottom sheet: name + 4-sticker picker (+ join banner)
│       ├── HostScreen.jsx     code + copy/share link + waiting list
│       ├── JoinScreen.jsx     connecting… + real error texts (no endless spinner)
│       ├── GameScreen.jsx     TOP opp score card / Board / BOTTOM own score card + dock
│       ├── Board.jsx          viewport-fitting board (passes CFG.LAYOUT[S.pairs].pct)
│       ├── EndOverlay.jsx     You win / X wins / tie + ScorecardPicker when winner
│       ├── ScorecardPicker.jsx winner-only: bg pick (Preset A/B), hide-opponent, save, X share
│       ├── LostOverlay.jsx    opponent-left (host: room stays open; guest: reconnect)
│       ├── PostcardPicker.jsx renders old postcards (unused while gated OFF)
│       └── Icons.jsx / XIcon.jsx   SVG icon set (no emoji)
├── test/
│   ├── engine.test.mjs        40 - pure engine rules (node, no deps)
│   ├── render.test.mjs        43 - SSR smoke of every screen (Vite ssrLoadModule)
│   ├── p2p.test.mjs           37 - two real hook instances ("two phones") through a
│   │                          fake PeerJS: join/flip/match/timeout/rematch/bye/rejoin
│   ├── fake-peer.mjs          in-memory PeerJS clone (must keep the wireOpen recipe)
│   ├── peer-loader.mjs        Node loader mapping 'peerjs' -> fake (module.register)
│   └── register.mjs / hook-entry.js   test plumbing
├── legacy/index.html          old single-file v3 (264K) - history only, don't touch
└── postcards/                 PREVIEW ARTIFACTS ONLY (not shipped): full/thumb mockups
```

Dev-only tooling (OUTSIDE the repo, lives in the workspace but NOT committed):
- `/home/user/scripts/og_image.py` regenerates `public/og.png` (the link-preview image). Run from `dilicards/` with `python3 /home/user/scripts/og_image.py`.
- `/home/user/scripts/scorecards5.py` generated the 5 scorecard backgrounds.
- `/home/user/preview/*.png` owner-review mockups (scorecard set, individual variants).

### Network protocol (both directions unless noted)

- `hello` (guest->host on open): `{name, avatar}` - host stores guest identity.
- `init` (host->guest, on connect AND on rematch approval): `{pairs, deck, hostName, hostAvatar, tl}` - guest rebuilds view, enters game.
- `sync` (host->guest, after every mutation + 1 Hz `ev:'tick'`): `{cards:[states], flipped:[ids], s1, s2, phase, turn, winner, tl, ev}` - guest applies, plays fx.
- `tap` (guest->host): `{cardId}` - host validates (its turn, <2 flipped), resolves, syncs back.
- `rematch-req` (guest->host): `{name}` - host shows Accept / Not now. **Never auto-starts.**
- `bye` (either) -> opponent shows LostOverlay. **A NEW host connection always takes over** the old one (reconnect support).

Rematch approval flow (important, was a bug):
- Guest `requestRematch()` sends `rematch-req` and sets `rematchSent=true` (button disabled, "Request sent...").
- Host sets `rematchReq` (EndOverlay shows "Accept rematch" / "Not now").
- Host `acceptRematchReq()` -> `startRematch()` (fresh board + `init` + sync) and clears `rematchReq`.
- Guest receives `init` -> `rematchSent=false`, fresh board shows.

### Engine state

`S = { pairs, deck:[artIds], cards:[{id,art,state:'down|up|matched'}], flipped:[ids],
scores:{1,2}, turn:1|2, phase:'play|locked|done', timeLeft, deadline, winner }`.
Scores are ABSOLUTE: `scores[1]` = host, `scores[2]` = guest, on both phones. Views resolve by role:
- Host: own score = `scores[1]`, opponent = `scores[2]`.
- Guest: own score = `scores[2]`, opponent = `scores[1]`.
EndOverlay resolves winner/loser names by `iWon` (whether the VIEWER won), never by mapping `winner 1|2` onto my/their (those are already role-relative).
Mismatch -> `phase:'locked'` for `CFG.LOCK_MS` (950 ms) -> flip back + turn swap + fresh `TURN_SECONDS` (10 s). Timeout is checked by the **host only** (`checkTimeout`) and broadcast with `ev:'timeout'`.

## How to work

```bash
cd /home/user/dilicards
npm install        # node_modules does NOT persist between sessions - always run first
npm test           # all 3 suites (120 assertions)
npm run build      # -> dist/
npm run dev        # Vite dev server (if you need live reload)
```

**Every change -> `npm test` -> `npm run build` -> commit -> push -> ALSO UPDATE THIS AGENTS.md.** Then tell the owner: "redeploy by uploading `dist/*` to the root of dilicard.badhon.online" (they do it manually; no CI).

- Tweak game feel in `src/config.js` (timer, lock, board sizes, layout, links).
- The p2p suite is the safety net for network flow changes. If it fails, fix the app, not the assertions (unless the scenario itself is wrong).
- `test/p2p.test.mjs` step 8b: a rejoin must match the host's **current** state snapshot (phase/scores/deck), not a fixed expectation - the scenario rejoins after a rematch.
- Fake PeerJS quirk: both peers must be `open=true` **before** either 'open' event fires, or `FakeConn.send()` drops messages.
- React SSR renders escape `'` as `&#x27;` and insert `<!-- -->` between adjacent expressions - write test assertions accordingly.
- **No em dash "—" anywhere** (owner rule). Use comma/period. Applies to UI strings, captions, metadata, and comments.

## Environment gotchas

- **Sandbox != phone.** The PeerJS broker (`0.peerjs.com`) returns Cloudflare 1020 from this datacenter - that's expected; the game works from real phones. Tests use the fake PeerJS.
- `node_modules` and background processes do **not** survive between sessions. Reinstall deps when the suite/build fails with `Cannot find package`/`vite not found`.
- To preview the built site: `python3 -m http.server 8000 --bind 0.0.0.0 -d dist` (user can open the port-8000 preview).
- PIL + DejaVu fonts available for image mockups; `image_search`/`generate_image` available for new art.
- GitHub push: owner pasted a PAT into the chat (used for pushes). **Owner was told to revoke it.** If a push 403s, ask the owner for a new token; push URL pattern: `https://x-access-token:<PAT>@github.com/badhonai/DiliCards.git`. The local git remote is set to the clean URL `https://github.com/badhonai/DiliCards.git` (no token in the config); push with the PAT-in-URL form: `git push "https://x-access-token:<PAT>@github.com/badhonai/DiliCards.git" main`.
- Git author identity resets between sessions; run `git config user.name "badhonai"` + `git config user.email "badhonai@users.noreply.github.com"` before committing if the commit fails with "Author identity unknown".

## Recent history (newest first)

- **`d57b003`** - Rematch requires host approval (no auto-restart, winner can download/share the score card first); "(you)" marker on end screen fixed to true identity (was wrong when host won).
- **`5f86ce8`** - EndOverlay winner/loser names fixed to resolve by role (`iWon`), locked-state label "flipping back...", +8 role-matrix render tests.
- **`b64c927`** - GameScreen/EndOverlay scores resolved by role (opponent card showed the viewer's own score on the host phone), data-who attr + tests.
- **`a570395`** - Pencil badge back on top of the avatar circle (inner clip wrapper for the sticker, badge outside the clip).
- **`de500fe`** - og.png blue card character content-fit (zoom-out, no clipped flames).
- **`1ec6b61` / `eb500be`** - og.png layout: brand block + site link LEFT, artwork RIGHT, vertically centered.
- **`2b344c6`** - pfp chooser overflow fix, scorecard options renamed "Preset A / Preset B", all em dashes removed from src + index.html, title "DiliCards by BadhonAI", polished 1200x630 og.png.
- **`1ccefb5`** - Winner score cards shipped (ScorecardPicker + scorecard.js, hide-opponent toggle, save + X share), pfp clip fix, richer metadata.
- **`58ce6cc`** - Removed white glass overlay from flipped card faces (GIFs now crisp at full contrast).
- **`7a4efae`** - Fixed invisible board (computeLayout was called without `pct` -> NaN positions), new citrus logo + warm orange theme.
- **`7a1e421`** and earlier - postcard gate-off + first AGENTS.md handoff; React+Vite rebuild; P2P over PeerJS.

## Open items / likely next prompts

1. **More scorecard backgrounds:** owner may approve the extra ones in `src/assets/scorecards/` (classic/ring/night). To add: append an entry to `SCORECARD_VARIANTS` in `src/game/scorecard.js` and add the layout branch in `renderScorecard`.
2. Anything gameplay-related: edit `config.js` + engine, keep the 120-assertion suite green.
3. Deploy: always remind the owner to upload `dist/*` after a build (and `og.png`/`favicon.png` to the site root for link previews).
