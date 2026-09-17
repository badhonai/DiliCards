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
  ok(menu.includes('DiliCards'), 'App renders with game name');
  ok(menu.includes('Create game'), 'menu has create action card');
  ok(menu.includes('Join a game'), 'menu has join action card');
  ok(menu.includes('YOUR NAME'), 'menu shows name identity');
  ok(menu.includes('Follow'), 'menu has X follow button');
  ok(menu.includes('dilicard.badhon.online'), 'menu shows site link');
  ok(menu.includes('Easy · 12') && menu.includes('Hard · 20'), 'board size chips render');

  // onboarding popup (first launch / first join) renders
  const { default: OnboardModal } = await server.ssrLoadModule('/src/components/OnboardModal.jsx');
  const obNoCode = renderToString(React.createElement(OnboardModal, {
    joinCode:null, initialName:'', initialAvatar:null, onSubmit:()=>{},
  }));
  ok(obNoCode.includes('First time here?') && obNoCode.includes('CHOOSE YOUR DILI'),
     'onboarding popup asks for name + Dili pick');
  ok(obNoCode.includes('Done'), 'onboarding (no pending join) shows Done');

  const { default: MenuScreen } = await server.ssrLoadModule('/src/components/MenuScreen.jsx');
  const menuFull = renderToString(React.createElement(MenuScreen, {
    name:'Mina', avatar:1, hasIdentity:true,
    sizePairs:8, setSizePairs:()=>{},
    onCreate:()=>{}, onJoin:()=>{}, onEditIdentity:()=>{},
  }));
  ok(menuFull.includes('Mina'), 'menu shows saved name');
  ok(!menuFull.includes('disabled="disabled"'), 'actions enabled with identity');
  const menuEmpty = renderToString(React.createElement(MenuScreen, {
    name:'', avatar:null, hasIdentity:false,
    sizePairs:8, setSizePairs:()=>{},
    onCreate:()=>{}, onJoin:()=>{}, onEditIdentity:()=>{},
  }));
  ok(menuEmpty.includes('Tap to choose a name'), 'empty identity invites a pick');

  const obJoin = renderToString(React.createElement(OnboardModal, {
    joinCode:'ABC123', initialName:'', initialAvatar:null, onSubmit:()=>{},
  }));
  ok(obJoin.includes('ABC123') && obJoin.includes('Join the game'), 'join onboarding shows code + join CTA');

  const { default: HostScreen } = await server.ssrLoadModule('/src/components/HostScreen.jsx');
  const { default: JoinScreen } = await server.ssrLoadModule('/src/components/JoinScreen.jsx');
  const { default: GameScreen } = await server.ssrLoadModule('/src/components/GameScreen.jsx');
  const { default: EndOverlay } = await server.ssrLoadModule('/src/components/EndOverlay.jsx');
  const { default: LostOverlay } = await server.ssrLoadModule('/src/components/LostOverlay.jsx');

  const S = createGame(6);
  const g = renderToString(React.createElement(GameScreen, {
    S, role:'host', name:'Badhon', avatar:0, muted:false,
    hostName:'Badhon', guestName:'', hostAvatar:null, guestAvatar:null,
    connected:true, lost:false, roomCode:'ABC123', roomLink:'http://x/?join=ABC123',
    onCardTap:()=>{}, onGoHome:()=>{}, onRematch:()=>{}, onRetry:()=>{}, onCopyLink:()=>{}, onMute:()=>{},
  }));
  ok(g.includes('Badhon'), 'game screen shows host name');
  ok((g.match(/class="card"/g)||[]).length===12, 'board renders 12 cards');
  ok(g.includes('your turn'), 'host turn: your-turn label on own (bottom) card');

  const gGuest = renderToString(React.createElement(GameScreen, {
    S, role:'guest', name:'Mina', avatar:2, muted:false,
    hostName:'Rahim', guestName:'Mina', hostAvatar:0, guestAvatar:2,
    connected:true, lost:false, roomCode:'ABC123', roomLink:'http://x/?join=ABC123',
    onCardTap:()=>{}, onGoHome:()=>{}, onRematch:()=>{}, onRetry:()=>{}, onCopyLink:()=>{}, onMute:()=>{},
  }));
  ok(gGuest.includes('Rahim') && gGuest.includes('Mina'), 'guest view: opponent (Rahim) + own name (Mina)');
  ok(gGuest.includes('their turn'), 'guest view: their-turn label on opponent (top) card');

  const h = renderToString(React.createElement(HostScreen, {
    name:'Badhon', avatar:0,
    roomCode:'ABC123', roomLink:'http://x/?join=ABC123', sizePairs:8,
    onCopy:()=>{}, onShare:()=>{}, onGoHome:()=>{},
  }));
  ok(h.includes('ABC123') && h.includes('Share'), 'host screen shows code + share');
  ok(h.includes('Copy link'), 'host screen has copy link');

  const j = renderToString(React.createElement(JoinScreen, {
    name:'Mina', avatar:2, roomCode:'ABC123', connected:false, err:'nohost',
    onGoHome:()=>{}, onRetry:()=>{}, onCopyLink:()=>{},
  }));
  ok(j.includes('No live room found'), 'join error message renders');

  const jWait = renderToString(React.createElement(JoinScreen, {
    name:'Mina', avatar:2, roomCode:'ABC123', connected:false, err:null,
    onGoHome:()=>{}, onRetry:()=>{}, onCopyLink:()=>{},
  }));
  ok(jWait.includes('Reaching the host'), 'join waiting text renders');

  S.phase='done'; S.winner=1; S.scores={1:5,2:3};
  const e = renderToString(React.createElement(EndOverlay, {
    S, isHost:true, myName:'Badhon', theirName:'Rahim',
    myAvatar:0, theirAvatar:1,
    onRematch:()=>{}, onGoHome:()=>{}, roomCode:'ABC123', roomLink:'x', onCopyLink:()=>{},
  }));
  ok(e.includes('You win!'), 'win overlay title');
  ok(e.includes('Your champion postcards'), 'postcard picker shown for winner');

  S.phase='done'; S.winner=2;
  const eLose = renderToString(React.createElement(EndOverlay, {
    S, isHost:true, myName:'Badhon', theirName:'Rahim',
    myAvatar:0, theirAvatar:1,
    onRematch:()=>{}, onGoHome:()=>{}, roomCode:'ABC123', roomLink:'x', onCopyLink:()=>{},
  }));
  ok(eLose.includes('Rahim wins'), 'loss overlay title');
  ok(!eLose.includes('Your champion postcards'), 'no postcards for the loser');

  S.phase='done'; S.winner=0; S.scores={1:3,2:3};
  const eTie = renderToString(React.createElement(EndOverlay, {
    S, isHost:true, myName:'Badhon', theirName:'Rahim',
    myAvatar:0, theirAvatar:1,
    onRematch:()=>{}, onGoHome:()=>{}, roomCode:'ABC123', roomLink:'x', onCopyLink:()=>{},
  }));
  ok(eTie.includes('a tie!'), 'tie overlay title');

  const l = renderToString(React.createElement(LostOverlay, {
    isHost:false, roomCode:'ABC123', roomLink:'x', onGoHome:()=>{}, onRetry:()=>{}, onCopyLink:()=>{},
  }));
  ok(l.includes('Opponent left'), 'lost overlay renders');
  ok(l.includes('Reconnect'), 'guest lost overlay offers reconnect');

  const lHost = renderToString(React.createElement(LostOverlay, {
    isHost:true, roomCode:'ABC123', roomLink:'x', onGoHome:()=>{}, onRetry:()=>{}, onCopyLink:()=>{},
  }));
  ok(lHost.includes('still open'), 'host lost text explains room stays open');
}finally{
  await server.close();
}

console.log(`\n${fail===0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail===0 ? 0 : 1);
