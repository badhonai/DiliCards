/**
 * DILICARDS — SSR render smoke test (run: npm run test:render)
 * Loads the real components through Vite (JSX + assets) and renders
 * every screen to string — catches wiring/typo/crash bugs early.
 */
import React from 'react';
import { createServer } from 'vite';
import reactDomServer from 'react-dom/server';
import { createGame } from '../src/game/engine.js';

const { renderToString } = reactDomServer;

/* minimal browser globals for SSR */
globalThis.localStorage = { getItem:()=>null, setItem:()=>{} };
if(!globalThis.location) globalThis.location = { search:'', origin:'http://localhost', pathname:'/' };

const server = await createServer({ server:{ middlewareMode:true }, appType:'custom', logLevel:'error' });

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){ pass++; console.log('  ✓', m); } else { fail++; console.error('  ✗ FAIL:', m); } };

try{
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const menu = renderToString(React.createElement(App));
  ok(menu.includes('DiliCards'), 'App renders menu with logo');
  ok(menu.includes('Create a game'), 'menu has create button');
  ok(menu.includes('Follow'), 'menu has X follow button');
  ok(menu.includes('dilicard.badhon.online'), 'menu shows site link');
  ok(menu.includes('Easy') && menu.includes('Hard'), 'board size chips render');

  const { default: HostScreen } = await server.ssrLoadModule('/src/components/HostScreen.jsx');
  const { default: JoinScreen } = await server.ssrLoadModule('/src/components/JoinScreen.jsx');
  const { default: GameScreen } = await server.ssrLoadModule('/src/components/GameScreen.jsx');
  const { default: EndOverlay } = await server.ssrLoadModule('/src/components/EndOverlay.jsx');
  const { default: LostOverlay } = await server.ssrLoadModule('/src/components/LostOverlay.jsx');

  const S = createGame(6);
  const g = renderToString(React.createElement(GameScreen, {
    view:S, role:'host', hostName:'Badhon', guestName:'',
    connected:true, muted:false, onCardTap:()=>{}, onHome:()=>{}, onMute:()=>{},
  }));
  ok(g.includes('Badhon'), 'game screen shows host name');
  ok((g.match(/class="card"/g)||[]).length===12, 'board renders 12 cards');
  ok(g.includes('Your turn'), 'turn text renders');
  ok(g.includes('Pairs found'), 'progress row renders');

  const gGuest = renderToString(React.createElement(GameScreen, {
    view:S, role:'guest', hostName:'Rahim', guestName:'Mina',
    connected:true, muted:false, onCardTap:()=>{}, onHome:()=>{}, onMute:()=>{},
  }));
  ok(gGuest.includes('Rahim') && gGuest.includes('Mina'), 'guest view: opponent top (Rahim) + own name bottom (Mina)');

  const h = renderToString(React.createElement(HostScreen, {
    roomCode:'ABC123', roomLink:'http://x/?join=ABC123',
    onCopy:()=>{}, onShare:()=>{}, onCancel:()=>{},
  }));
  ok(h.includes('ABC123') && h.includes('Share'), 'host screen shows code + share');

  const j = renderToString(React.createElement(JoinScreen, {
    roomCode:'ABC123', joinErr:'nohost', onRetry:()=>{}, onCancel:()=>{},
  }));
  ok(j.includes('No room with that code'), 'join error message renders');

  S.phase='done'; S.winner=1; S.scores={1:5,2:3};
  const e = renderToString(React.createElement(EndOverlay, {
    view:S, role:'host', hostName:'Badhon', guestName:'Rahim',
    onRematch:()=>{}, onRematchReq:()=>{}, onHome:()=>{},
  }));
  ok(e.includes('You win!'), 'win overlay title');
  ok(e.includes('victory card'), 'postcard picker shown for winner');
  ok(e.includes('Sunset') && e.includes('Night') && e.includes('Mint'), '3 postcard variants listed');

  S.phase='done'; S.winner=2;
  const eLose = renderToString(React.createElement(EndOverlay, {
    view:S, role:'host', hostName:'Badhon', guestName:'Rahim',
    onRematch:()=>{}, onRematchReq:()=>{}, onHome:()=>{},
  }));
  ok(eLose.includes('Friend wins!'), 'loss overlay title');
  ok(!eLose.includes('victory card'), 'no postcards for the loser');

  S.phase='done'; S.winner=0; S.scores={1:3,2:3};
  const eTie = renderToString(React.createElement(EndOverlay, {
    view:S, role:'host', hostName:'Badhon', guestName:'Rahim',
    onRematch:()=>{}, onRematchReq:()=>{}, onHome:()=>{},
  }));
  ok(eTie.includes('tie'), 'tie overlay title');

  const l = renderToString(React.createElement(LostOverlay, {
    role:'guest', roomLink:'x', onCopyLink:()=>{}, onRejoin:()=>{}, onHome:()=>{},
  }));
  ok(l.includes('Connection lost'), 'lost overlay renders');

  const lHost = renderToString(React.createElement(LostOverlay, {
    role:'host', roomLink:'x', onCopyLink:()=>{}, onRejoin:()=>{}, onHome:()=>{},
  }));
  ok(lHost.includes('still open'), 'host lost text explains room stays open');
}finally{
  await server.close();
}

console.log(`\n${fail===0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail===0 ? 0 : 1);
