/**
 * DILICARDS — engine unit tests (run: npm test)
 * Pure logic tests: flips, locks, matches, timeout, end, sync mirror.
 */
import {
  createGame, freshView, hostFlip, guestFlip, resolveLock,
  tickTimer, checkTimeout, syncPayload, applySync,
} from '../src/game/engine.js';
import { CFG } from '../src/config.js';

let pass = 0, fail = 0;
const ok = (cond, msg)=>{
  if(cond){ pass++; console.log('  ✓', msg); }
  else{ fail++; console.error('  ✗ FAIL:', msg); }
};

/* helpers: flip next two down-cards of `art` (a match) / two different arts */
function flipPair(S, art){
  const ids = S.cards.filter(c=>c.state==='down' && c.art===art).map(c=>c.id);
  const f1 = S.turn===1 ? hostFlip(S, ids[0]) : guestFlip(S, ids[0]);
  const f2 = S.turn===1 ? hostFlip(S, ids[1]) : guestFlip(S, ids[1]);
  return [f1, f2];
}
function flipMismatch(S){
  const downs = S.cards.filter(c=>c.state==='down');
  const a = downs[0].id;
  const b = downs.find(c=>c.art!==downs[0].art).id;
  const f1 = S.turn===1 ? hostFlip(S, a) : guestFlip(S, a);
  const f2 = S.turn===1 ? hostFlip(S, b) : guestFlip(S, b);
  return [f1, f2];
}
function artsLeft(S){
  return [...new Set(S.cards.filter(c=>c.state==='down').map(c=>c.art))];
}

/* ── 1. fresh game ── */
console.log('\n[createGame]');
{
  const S = createGame(6);
  ok(S.cards.length===12, '12 cards for 6 pairs');
  ok(S.cards.every(c=>c.state==='down'), 'all cards start face-down');
  ok(S.turn===1 && S.phase==='play', 'host goes first, phase play');
  ok(S.scores[1]===0 && S.scores[2]===0, 'scores start at 0');
  ok(S.timeLeft===CFG.TURN_SECONDS, 'timer starts at 10s');
  const counts={};
  S.deck.forEach(a=>counts[a]=(counts[a]||0)+1);
  ok(Object.values(counts).every(n=>n===2) && Object.keys(counts).length===6, 'exactly 6 distinct pairs');
}

/* ── 2. flips & mismatch ── */
console.log('\n[flips]');
{
  const S = createGame(6);
  const downs = S.cards.filter(c=>c.state==='down');
  const a = downs[0], b = downs.find(c=>c.art!==downs[0].art);

  const r1 = hostFlip(S, a.id);
  ok(r1 && r1.ev==='flip' && S.cards[a.id].state==='up' && S.flipped.length===1, 'first flip: card up, ev flip');

  const r2 = hostFlip(S, b.id);
  ok(r2 && r2.ev==='nomatch' && S.phase==='locked', 'mismatch: ev nomatch, phase locked');
  ok(hostFlip(S, a.id)===null, 'third tap during turn is rejected');
  ok(guestFlip(S, b.id)===null, 'guest cannot flip on host turn');
  ok(hostFlip(S, S.cards.find(c=>c.state==='down').id)===null, 'no taps while locked');

  const r3 = resolveLock(S);
  ok(r3 && S.phase==='play' && S.turn===2, 'after lock: unlocked, guest turn');
  ok(S.cards[a.id].state==='down' && S.cards[b.id].state==='down', 'non-matching cards flipped back');
  ok(Math.abs(S.timeLeft-CFG.TURN_SECONDS)<=1, 'fresh timer after turn pass');
}

/* ── 3. match ── */
console.log('\n[match]');
{
  const S = createGame(6);
  const art = artsLeft(S)[0];
  const [f1, f2] = flipPair(S, art);
  ok(f1.ev==='flip' && f2.ev==='match', 'pair → flip then match');
  ok(S.scores[1]===1, 'host scored');
  ok(S.turn===1, 'match = go again');
  ok(S.flipped.length===0 && S.phase==='play', 'flipped cleared, still playing');
  ok(S.cards.filter(c=>c.art===art).every(c=>c.state==='matched'), 'matched cards stay open');
}

/* ── 4. full clear → host wins ── */
console.log('\n[end (all matches)]');
{
  const S = createGame(6);
  let last = null, guard = 0;
  while(S.phase!=='done' && guard++<50){
    last = flipPair(S, artsLeft(S)[0])[1];
    if(S.phase==='locked') resolveLock(S);
  }
  ok(S.phase==='done', 'game ends when board cleared');
  ok(last.ev==='end', 'last flip emitted ev=end');
  ok(S.winner===1 && S.scores[1]===6, 'host (went first, matched all) wins 6-0');
}

/* ── 5. tie ── */
console.log('\n[end (tie)]');
{
  const S = createGame(4);
  // P1: A0, mismatch; P2: mismatch (loop back); P1: A1, mismatch; P2: A2, A3 → 2:2
  const A = artsLeft(S);
  flipPair(S, A[0]);
  flipMismatch(S); resolveLock(S);   // P1 → P2
  flipMismatch(S); resolveLock(S);   // P2 → P1
  flipPair(S, A[1]);
  flipMismatch(S); resolveLock(S);   // P1 → P2
  const end = flipPair(S, A[2])[1];
  const end2 = flipPair(S, A[3])[1]; // P2 takes the last pair
  ok(end.ev!=='end' && end2.ev==='end', 'end event on final pair');
  ok(S.winner===0 && S.scores[1]===2 && S.scores[2]===2, '2:2 → tie (winner 0)');
}

/* ── 6. tick ── */
console.log('\n[tickTimer]');
{
  const S = createGame(6);
  const now = Date.now();
  S.deadline = now + 3500;
  const t1 = tickTimer(S, now+1200);           // 2300ms left → shows 3
  ok(t1 && t1.ev==='tick' && S.timeLeft===3, 'tick when displayed second changes (10→3)');
  const t2 = tickTimer(S, now+1400);           // 2100ms left → still 3
  ok(t2===null, 'no event within the same displayed second');
  const t3 = tickTimer(S, now+1700);           // 1800ms left → shows 2
  ok(t3 && t3.ev==='tick' && S.timeLeft===2, 'next second → tick');
}

/* ── 7. timeout ── */
console.log('\n[timeout]');
{
  const S = createGame(6);
  hostFlip(S, S.cards[0].id);                    // one card left up
  S.deadline = Date.now() - 5;
  const r = checkTimeout(S, Date.now());
  ok(r && r.ev==='timeout', 'timeout event fired');
  ok(S.turn===2, 'turn passed to guest');
  ok(S.cards[0].state==='down', 'loose card flipped back');
  ok(S.timeLeft===CFG.TURN_SECONDS, 'timer reset');
  const r2 = checkTimeout(S, Date.now());
  ok(r2===null, 'no double timeout');
  // timeout must NOT fire while locked
  const S2 = createGame(6);
  S2.phase='locked'; S2.deadline=Date.now()-5;
  ok(checkTimeout(S2, Date.now())===null, 'timeout skipped while locked');
}

/* ── 8. sync / mirror invariants ── */
console.log('\n[sync mirror]');
{
  const S = createGame(8);
  const G = freshView(S.pairs, S.deck, S.timeLeft);

  function mirrorCheck(tag){
    ok(
      S.cards.every((c,i)=>c.state===G.cards[i].state) &&
      S.scores[1]===G.scores[1] && S.scores[2]===G.scores[2] &&
      S.turn===G.turn && S.phase===G.phase &&
      S.flipped.length===G.flipped.length,
      tag
    );
  }

  const art = artsLeft(S)[0];
  flipPair(S, art);                              // match on host side
  const m1 = syncPayload(S);
  m1.ev = 'match';
  const fx1 = applySync(G, m1);
  mirrorCheck('guest mirrors a match (scores, states, turn)');
  ok(fx1.newUps.length===2, 'guest heard two new flips');

  const [fa, fb] = flipMismatch(S);
  const m2 = syncPayload(S);
  applySync(G, m2);
  mirrorCheck('guest mirrors a mismatch (phase locked)');
  ok(m2.phase==='locked' && m2.flipped.length===2, 'sync carries lock + flipped ids');

  resolveLock(S);
  const m3 = syncPayload(S);
  applySync(G, m3);
  mirrorCheck('guest mirrors turn pass after lock');

  const m4 = applySync(G, syncPayload(S));
  ok(m4.newUps.length===0, 'duplicate sync adds no new flips');
  ok(typeof m3.s1==='number' && typeof m3.tl==='number' && Array.isArray(m3.cards), 'sync payload shape (cards[], s1, tl)');
}

/* ── summary ── */
console.log(`\n${fail===0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail===0 ? 0 : 1);
