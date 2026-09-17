/**
 * DILICARDS — end-to-end P2P simulation (run: npm run test:p2p)
 *
 * Two real hook instances (two "phones") talk through the fake PeerJS
 * cloud: init/hello/tap/sync/timeout/rematch/bye — verifies the full
 * orchestration, not just the engine.
 *
 * The hook is bundled once by Vite (peerjs + react left external),
 * then loaded by plain Node with a loader hook that swaps 'peerjs'
 * for an in-memory fake network.
 */
import React from 'react';
import { create, act } from 'react-test-renderer';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

/* ---- browser polyfills ---- */
globalThis.localStorage = { getItem:()=>null, setItem:()=>{} };
globalThis.location = { search:'', origin:'http://test.local', pathname:'/' };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sleep = ms => new Promise(r=>setTimeout(r, ms));
async function pump(ms){ await act(async()=>{ await sleep(ms); }); }

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){ pass++; console.log('  ✓', m); } else { fail++; console.error('  ✗ FAIL:', m); } };

async function waitUntil(fn, what, ms=10000){
  const t0=Date.now();
  while(Date.now()-t0<ms){
    if(fn()) return;
    await pump(25);
  }
  throw new Error('TIMEOUT waiting for: '+what);
}

/* ---- build the hook bundle (once) ---- */
const outDir = fileURLToPath(new URL('./.tmp', import.meta.url));
await build({
  logLevel:'error',
  build:{
    emptyOutDir:true,
    outDir,
    minify:false,
    lib:{
      entry: fileURLToPath(new URL('./hook-entry.js', import.meta.url)),
      formats:['es'],
      fileName:()=>'hook-bundle.mjs',
    },
    rollupOptions:{
      external: ['peerjs', 'react', 'react/jsx-runtime', 'react-dom', /^react-dom\//],
    },
  },
});
const { useDiliGame, CFG } = await import(new URL('./.tmp/hook-bundle.mjs', import.meta.url));

/* ---- two "phones" ---- */
function Driver({ register }){
  const g = useDiliGame();
  React.useEffect(()=>{ register(g); });
  return null;
}

const hostG = {}; const guestG = {};
const hostRoot = create(React.createElement(Driver, { register:g=>{ Object.assign(hostG, g); hostG.g=g; } }));
const guestRoot = create(React.createElement(Driver, { register:g=>{ Object.assign(guestG, g); guestG.g=g; } }));
await pump(30);

const H = ()=>hostG.g, G = ()=>guestG.g;   // always read the latest hook object

try{
  /* ── 0. identity is mandatory, chosen (never random) ── */
  await act(async()=>{ H().createGame(); });
  ok(H().screen==='menu' && H().onboard.open===true, 'create without identity → onboarding popup');
  ok(H().avatar===null, 'no random avatar before the user chooses one');
  await act(async()=>{ H().submitOnboard('Host1', 0); });
  ok(H().onboard.open===false && H().name==='Host1' && H().avatar===0, 'onboard saves the chosen name + Dili');

  /* ── 1. host creates a room ── */
  await act(async()=>{ H().createGame(); });
  ok(H().screen==='host' && /^[A-Z2-9]{6}$/.test(H().roomCode), 'host on waiting screen with 6-char code');
  ok(H().roomLink().includes('?join='+H().roomCode), 'shareable join link built');

  /* ── 2. guest joins for the first time → popup, then straight in ── */
  const code = H().roomCode;
  await act(async()=>{ G().joinGame(code); });
  ok(G().screen==='menu' && G().onboard.open===true && G().onboard.joinCode===code,
     'first-time join → onboarding popup with the room code (not the home screen)');
  await act(async()=>{ G().submitOnboard('Guest1', 2); });
  ok(G().screen==='join', 'onboard submit → straight into the game (no home screen)');

  await waitUntil(()=>H().screen==='game' && G().screen==='game', 'both phones in the game');
  ok(true, 'connection established → both phones show the board');
  ok(H().connected && G().connected, 'connection dot green on both');
  ok(G().hostName===H().hostName && H().guestName==='Guest1', 'names exchanged both ways');
  ok(G().hostAvatar===0, 'guest received host avatar');
  ok(H().guestAvatar===2, 'host received guest avatar');
  ok(H().view.deck.join(',')===G().view.deck.join(','), 'guest got the same deck');
  ok(G().view.cards.every(c=>c.state==='down'), 'guest board starts face-down');
  ok(H().view.turn===1, 'host (Player 1) goes first');

  /* ── 3. host flips two non-matching cards ── */
  const downs = H().view.cards.filter(c=>c.state==='down');
  const a = downs[0].id;
  const b = downs.find(c=>c.art!==downs[0].art).id;
  await act(async()=>{ H().onCardTap(a); });
  await pump(20);
  ok(H().view.cards[a].state==='up', 'host: first card flipped');
  await waitUntil(()=>G().view.cards[a].state==='up', 'guest: first card mirrored');
  await act(async()=>{ H().onCardTap(b); });
  await waitUntil(()=>G().view.phase==='locked' && G().view.flipped.length===2, 'guest: pair shown, locked');
  ok(true, 'mismatch: both cards stay up for the lock pause');

  await waitUntil(()=>G().view.phase==='play' && G().view.turn===2, 'turn passes to guest after lock');
  ok(H().view.cards[a].state==='down' && H().view.cards[b].state==='down', 'mismatched cards flipped back');
  ok(true, 'turn passed to Player 2 on both phones');

  /* ── 4. guest flips a matching pair → scores & goes again ── */
  const art = [...new Set(G().view.cards.filter(c=>c.state==='down').map(c=>c.art))][0];
  const ids = G().view.cards.filter(c=>c.state==='down' && c.art===art).map(c=>c.id);
  await act(async()=>{ G().onCardTap(ids[0]); });
  await pump(20);
  await act(async()=>{ G().onCardTap(ids[1]); });
  await waitUntil(()=>H().view.scores[2]===1, 'host: guest score 1');
  await waitUntil(()=>G().view.scores[2]===1 && G().view.turn===2, 'guest mirrors score + goes again');
  ok(H().view.cards[ids[0]].state==='matched' && G().view.cards[ids[0]].state==='matched', 'matched cards stay open on both');

  /* ── 5. guest timeout → host auto-passes the turn ── */
  H().view.deadline = Date.now() - 10;   // force the clock (host is authoritative)
  await waitUntil(()=>H().view.turn===1 && G().view.turn===1, 'timeout passes turn back to host');
  ok(true, '10s timeout auto-passes the turn (host-enforced, mirrored)');

  /* ── 6. play to the end ── */
  for(let guard=0; guard<100 && H().view.phase!=='done'; guard++){
    const t = H().view.turn;
    const S = H().view;
    const down = S.cards.filter(c=>c.state==='down');
    if(!down.length) break;
    let p;
    if(t===1){
      // host always matches: pick a pair of the same art among downs
      const byArt = {};
      down.forEach(c=>{ (byArt[c.art]=byArt[c.art]||[]).push(c.id); });
      p = Object.values(byArt).find(v=>v.length===2);
    } else {
      p = down.slice(0,2).map(c=>c.id);   // guest flips whatever
    }
    if(!p) break;
    await act(async()=>{ (t===1?H():G()).onCardTap(p[0]); });
    await pump(15);
    await act(async()=>{ (t===1?H():G()).onCardTap(p[1]); });
    await pump(15);
    if(H().view.phase==='locked') await pump(CFG.LOCK_MS + 150);   // let the no-match resolve
    if(H().view.phase!=='done'){
      H().view.deadline = Date.now() - 10;   // skip the 10s wait
      await waitUntil(()=>H().view.phase==='done' || H().view.turn!==t, 'turn to pass from ' + t);
    }
  }
  await waitUntil(()=>H().view.phase==='done' && G().view.phase==='done', 'game ends on both phones');
  ok(true, 'board cleared → game ends on both phones');
  ok(H().view.winner===G().view.winner && [0,1,2].includes(H().view.winner), 'winner agrees on both: ' + H().view.winner);
  ok(H().view.scores[1]===G().view.scores[1] && H().view.scores[2]===G().view.scores[2], 'scores agree on both');
  ok(H().view.scores[1]+H().view.scores[2]===H().view.pairs, 'all pairs were found');

  /* ── 7. rematch (guest asks, host rebuilds) ── */
  await act(async()=>{ G().requestRematch(); });
  await waitUntil(()=>H().view.phase==='play' && G().view.phase==='play', 'rematch starts');
  ok(H().view.scores[1]===0 && H().view.scores[2]===0, 'rematch resets scores');
  ok(H().view.cards.every(c=>c.state==='down'), 'rematch board is fresh and face-down');
  ok(H().view.deck.join(',')===G().view.deck.join(','), 'guest received the new deck');

  /* ── 8. guest leaves → host sees connection lost ── */
  const before = {
    phase: H().view.phase,
    s1: H().view.scores[1], s2: H().view.scores[2],
    deck: H().view.deck.join(','),
  };
  await act(async()=>{ G().goHome(); });
  await waitUntil(()=>H().lost===true, 'host notified friend left');
  ok(G().screen==='menu', 'guest back at menu');
  ok(true, 'bye → host connection-lost overlay');

  /* ── 8b. a guest RE-JOINS the same room (reconnect, no new room) ── */
  const g2 = {};
  const g2Root = create(React.createElement(Driver, { register:g=>{ g2.g=g; } }));
  await pump(30);
  await act(async()=>{ g2.g.joinGame(code); });
  ok(g2.g.onboard.open===true && g2.g.onboard.joinCode===code, 'rejoining phone without identity → onboarding popup');
  await act(async()=>{ g2.g.submitOnboard('Guest1', 3); });
  await waitUntil(()=>g2.g.screen==='game' && H().connected, 'rejoined guest in the game');
  await waitUntil(()=>g2.g.view && g2.g.view.phase===before.phase && g2.g.view.deck.join(',')===before.deck,
    'rejoin sync applied');
  ok(H().lost===false, 'host: rejoin clears the lost overlay');
  ok(g2.g.view.scores[1]===before.s1 && g2.g.view.scores[2]===before.s2,
     'rejoin delivers the CURRENT state (not a reset board)');
  await act(async()=>{ g2.g.goHome(); });
  await waitUntil(()=>H().lost===true, 'host notified again on second leave');
  g2Root.unmount();

  /* ── 9. joining a room that does not exist ── */
  await act(async()=>{ G().joinGame('ZZZZ99'); });
  await waitUntil(()=>G().joinErr==='nohost', 'nohost error');
  ok(G().screen==='join', 'guest stuck on join screen with friendly error');

  guestRoot.unmount();
  hostRoot.unmount();
  await pump(30);
}finally{
  // bundle dir is gitignored scratch
}

console.log(`\n${fail===0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail===0 ? 0 : 1);
