# 🎴 DiliCards

**Flip 2 · Match them · Beat your friend** — a 2-phone memory duel that runs
directly between two phones. No server. No accounts. 100% free.

🌐 Live: **https://dilicard.badhon.online** · made by [@BadhonAI](https://x.com/BadhonAI)

- **P2P online** — one phone hosts a room, the other joins with the shared link
  (`?join=CODE`). The free PeerJS cloud only introduces the phones; all game
  data flows phone↔phone over WebRTC.
- **Turn-based** — 2 flips per turn, **10 seconds each**. Match = +1 and go
  again. No match (or time's up) = cards flip back, turn passes.
- **Winner postcards** — win a match and generate a shareable 1080×1350 card
  with your name, the score, and a Dili sticker (3 styles). Download, share,
  or post straight to X.

Built with **React + Vite** (claymorphism UI, canvas postcards, WebAudio
sound effects, haptics, screen wake-lock).

---

## Quick start

```bash
npm install
npm run dev        # local dev server (Vite)
```

## Tests

```bash
npm test           # runs all three suites:
#  test/engine.test.mjs   40 checks — pure game rules (flips, locks,
#                         matches, timer, timeout, end, sync mirror)
#  test/render.test.mjs   20 checks — every screen renders (SSR)
#  test/p2p.test.mjs      25 checks — two simulated "phones" play a full
#                         game over the fake PeerJS cloud (join → flips →
#                         timeout → end → rematch → leave)
```

## Build & deploy

```bash
npm run build      # outputs dist/
npm run preview    # serve the production build locally
```

**Deploy = upload the contents of `dist/`** to any static host:

- **dilicard.badhon.online** (this game's home) — upload `dist/*` to the site root.
- Netlify Drop / Vercel / GitHub Pages — build command `npm run build`,
  publish directory `dist`. The build uses `base: './'`, so it works from
  the domain root **or** a subfolder.

> Put `og.png` and `favicon.png` (already in `public/`, copied into `dist/`)
> at the site root so link previews work.

---

## Project layout

```
index.html               Vite entry (og meta → dilicard.badhon.online)
public/                  favicon.png, og.png (link-preview image)
src/
  config.js              ⭐ ALL knobs: rules, links, board sizes, room prefix
  main.jsx               app bootstrap
  App.jsx                screen router + share/copy helpers
  index.css              claymorphism theme
  art.css                the 10 Dili card faces (bundled GIFs)
  assets/                10 card GIFs + 4 3D Dili stickers (menu/end screens)
  game/
    engine.js            pure state machine (no DOM) — the game rules
    layout.js            scattered card packing (random, never overlapping)
    net.js               PeerJS host/guest wrappers
    audio.js             WebAudio SFX + haptics
    postcard.js          canvas victory postcards (3 variants)
  hooks/
    useDiliGame.js       orchestrator: screens, host-authoritative sync,
                         10s timer loop, rematch, reconnect
  components/
    MenuScreen.jsx       home screen (Happy Dili mascot, X follow button)
    HostScreen.jsx       waiting room (Funny Dili, code, share link)
    JoinScreen.jsx       joining (Cool Dili, spinner, errors)
    GameScreen.jsx       board + top-opponent/bottom-you score pills + timer
    Board.jsx            scattered cards
    EndOverlay.jsx       win/lose/tie + postcards
    LostOverlay.jsx      connection dropped
    PostcardPicker.jsx   3 postcard styles → download/share/X intent
test/                    engine + render + full P2P simulation
```

## Customizing

Everything user-facing lives in **`src/config.js`**:

| Key | What it does |
|---|---|
| `GAME_NAME` | title, share text, postcards |
| `SITE` / `TWITTER` / `TWITTER_HANDLE` | links in UI + postcards |
| `TURN_SECONDS` | per-turn time (default 10) |
| `LOCK_MS` | pause to show a no-match pair (default 950ms) |
| `BOARD_SIZES` | menu chips (pairs per board) |
| `PREFIX` | room id prefix — change if you fork the game |
| `STORE_KEY` | localStorage key for the saved name |

Want new card faces? Drop a GIF into `src/assets/art/`, update `ART_COUNT`
in `config.js` and add a class in `src/art.css`.

## How the network layer works

1. Host taps **Create** → gets a room id `dilicards-room-XXXXXX` on the free
   PeerJS cloud.
2. Guest opens the shared link (auto-join) or types the code.
3. PeerJS introduces the phones → a direct WebRTC data channel opens.
4. **Host is authoritative**: it runs `engine.js` and broadcasts a compact
   state sync after every event; the guest mirrors it and sends tap intents.
5. Reconnects just re-join the room — the host's room stays open.
