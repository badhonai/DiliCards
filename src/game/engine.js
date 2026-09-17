/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — game engine (pure logic, no DOM, no network)
 *
 *  Rules:
 *   • 2 players, hot-seat over the network (host is authoritative)
 *   • Each turn: flip 2 cards
 *   • Match  → +1 point, cards stay open, same player goes again
 *   • No match (or 10s timeout) → cards flip back, turn passes
 *   • Board cleared → most pairs wins
 *
 *  The engine mutates the state object `S` and returns `{ S, ev }`
 *  where ev is one of: 'flip' | 'match' | 'nomatch' | 'timeout'
 *  | 'tick' | 'end' | ''  (for sounds/effects on the UI layer).
 * ─────────────────────────────────────────────────────────────
 */
import { CFG } from '../config.js';

export function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const t=arr[i]; arr[i]=arr[j]; arr[j]=t;
  }
  return arr;
}

/** Build a fresh game: pick `pairs` random sprites, each twice, shuffled. */
export function createGame(pairs, artCount=CFG.ART_COUNT){
  const pool=shuffle([...Array(artCount).keys()]).slice(0,pairs);
  const deck=[];
  pool.forEach(a=>deck.push(a,a));
  shuffle(deck);
  const now=Date.now();
  return {
    pairs,
    deck,
    cards: deck.map((a,i)=>({ id:i, art:a, state:'down' })),
    phase: 'play',              // 'play' | 'locked' | 'done'
    turn: 1,                    // 1 = host, 2 = guest
    flipped: [],                // card ids flipped this turn (0, 1 or 2)
    timeLeft: CFG.TURN_SECONDS,
    deadline: now + CFG.TURN_SECONDS*1000,
    scores: { 1:0, 2:0 },
    winner: 0,                  // 1 | 2 | 0 (tie) when phase==='done'
  };
}

export function freshView(pairs, deck, tl){
  // guest-side mirror of the host state (same shape, empty states)
  return {
    pairs,
    deck: [...deck],
    cards: deck.map((a,i)=>({ id:i, art:a, state:'down' })),
    phase:'play', turn:1, flipped:[],
    timeLeft:(tl!=null?tl:CFG.TURN_SECONDS),
    deadline: Date.now() + (tl!=null?tl:CFG.TURN_SECONDS)*1000,
    scores:{1:0,2:0}, winner:0,
  };
}

function resetTimer(S){
  S.timeLeft=CFG.TURN_SECONDS;
  S.deadline=Date.now()+CFG.TURN_SECONDS*1000;
}

/** Flip a card for the CURRENT player (caller must check it's that player's turn). */
function flip(S, cardId){
  const c=S.cards[cardId];
  if(!c || c.state!=='down') return null;
  c.state='up';
  S.flipped.push(cardId);
  if(S.flipped.length<2) return { S, ev:'flip' };

  const a=S.cards[S.flipped[0]], b=S.cards[S.flipped[1]];
  if(a.art===b.art){
    a.state='matched'; b.state='matched';
    S.scores[S.turn]++;
    S.flipped=[];
    resetTimer(S);                       // go again — fresh 10s
    if(S.cards.every(x=>x.state==='matched')){
      S.phase='done';
      S.winner=S.scores[1]>S.scores[2] ? 1 : (S.scores[2]>S.scores[1] ? 2 : 0);
      return { S, ev:'end' };
    }
    return { S, ev:'match' };
  }
  S.phase='locked';                       // UI flips back after LOCK_MS (resolveLock)
  return { S, ev:'nomatch' };
}

/** Host (player 1) taps a card. */
export function hostFlip(S, cardId){
  if(S.phase!=='play' || S.turn!==1 || S.flipped.length>=2) return null;
  return flip(S, cardId);
}
/** Guest (player 2) taps a card. */
export function guestFlip(S, cardId){
  if(S.phase!=='play' || S.turn!==2 || S.flipped.length>=2) return null;
  return flip(S, cardId);
}

/** Called after the LOCK_MS pause following a no-match. */
export function resolveLock(S){
  if(S.phase!=='locked') return null;
  S.flipped.forEach(id=>{ S.cards[id].state='down'; });
  S.flipped=[];
  S.turn=S.turn===1?2:1;
  S.phase='play';
  resetTimer(S);
  return { S, ev:'' };
}

/** Advance the countdown. Returns an event when the visible second changes. */
export function tickTimer(S, now=Date.now()){
  if(S.phase!=='play') return null;
  const left=Math.max(0, Math.ceil((S.deadline-now)/1000));
  if(left!==S.timeLeft){ S.timeLeft=left; return { S, ev:'tick' }; }
  return null;
}

/** Auto-pass the turn when the deadline passes (host calls every ~250ms). */
export function checkTimeout(S, now=Date.now()){
  if(S.phase!=='play' || now < S.deadline) return null;
  S.flipped.forEach(id=>{ S.cards[id].state='down'; });
  S.flipped=[];
  S.turn=S.turn===1?2:1;
  resetTimer(S);
  return { S, ev:'timeout' };
}

/** Plain JSON payload broadcast by the host to the guest. */
export function syncPayload(S){
  return {
    t:'sync',
    cards:S.cards.map(c=>c.state),
    flipped:S.flipped,
    s1:S.scores[1], s2:S.scores[2],
    phase:S.phase, turn:S.turn,
    winner:S.winner||0, tl:S.timeLeft,
    ev:'',
  };
}

/** Guest applies a host sync. Returns { newUps, ev } for sound effects. */
export function applySync(S, m){
  const prevUp={};
  S.cards.forEach(c=>{ if(c.state!=='down') prevUp[c.id]=true; });
  const newUps=[];
  m.cards.forEach((st,i)=>{
    const c=S.cards[i];
    if(!c) return;
    if(c.state!==st){
      c.state=st;
      if(st!=='down' && !prevUp[c.id]) newUps.push(c.id);
    }
  });
  S.scores={ 1:m.s1, 2:m.s2 };
  S.phase=m.phase;
  S.turn=m.turn;
  S.flipped=m.flipped||[];
  S.winner=m.winner||0;
  if(m.tl!=null) S.timeLeft=m.tl;
  return { newUps, ev:m.ev||'' };
}
