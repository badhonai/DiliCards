# 🎴 Flip Guess — Emoji Memory Duel (Online)

A 2-player **memory game** played live between **two phones**.
One player hosts, gets a link, shares it — the other opens it on their own phone and you play together in real time.

**100% free · no accounts · no server to run**

Soft clay theme 🍬 · scattered cards (no grid, no overlaps) · 3 board sizes

## ▶ Play it

**Option 1 — GitHub Pages (free, automatic):**
> When GitHub Pages is enabled (Settings → Pages → branch `main`, root), the game is live at:
> `https://badhonai.github.io/flip-guess/`

**Option 2 — Netlify Drop (instant):**
1. Go to https://app.netlify.com/drop
2. Drag in `index.html` (or the whole folder)
3. Share the link you get

##  How to play
- Cards are face-down; every emoji appears **exactly twice**.
- On your turn you flip **2 cards**.
- **Match** → +1 point, the pair stays open, and **you go again!**
- **No match** → cards flip back, and it's your friend's turn.
- Clear the board → **most pairs wins!** 🏆

## 🛠 Tech
- One self-contained `index.html` (HTML + CSS + JS, no build step).
- Phones connect **peer-to-peer via WebRTC** (game data never touches a server).
- A free public matchmaking service (PeerJS) only introduces the two phones.
- Cards are scattered at random (collision-checked) — never a grid, never overlapping.
- Host's room survives disconnects — a friend can rejoin and the game resumes.
- Wake Lock keeps the screen on; haptic buzz on Android; player names sync too.
