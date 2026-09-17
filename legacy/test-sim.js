/* Node test harness: simulates 2 phones (host + guest) playing the real game code.
   Rules: 2 flips per turn, 10s timer per turn (auto-pass on timeout),
   match -> go again, no match -> flip back + turn passes.
   Cards = Dili art sprites (art-N class). Scattered layout must not overlap. */
const fs = require('fs');
const vm = require('vm');
const gameSrc = fs.readFileSync('/tmp/game.js', 'utf8');

/* ---------------- fake PeerJS network ---------------- */
const FakeNet = { instances: new Map() };
function fire(target, ev, arg){ (target.h[ev]||[]).forEach(fn=>fn.call(target, arg)); }

class FakeConn {
  constructor(){ this.h={}; this.open=false; this.remote=null; }
  on(ev,fn){ (this.h[ev]=this.h[ev]||[]).push(fn); }
  send(d){
    if(!this.open||!this.remote||!this.remote.open) return;
    const copy = JSON.parse(JSON.stringify(d));
    setTimeout(()=>{ if(this.remote && this.remote.open) fire(this.remote,'data',copy); }, 0);
  }
  close(){
    if(!this.open) return;
    this.open=false; fire(this,'close');
    if(this.remote && this.remote.open){ this.remote.open=false; fire(this.remote,'close'); }
  }
}
function connectFlow(localPeer, id){
  const local = new FakeConn();
  localPeer._conns.push(local);
  setTimeout(()=>{
    const remotePeer = FakeNet.instances.get(id);
    if(!remotePeer){ fire(localPeer,'error',{type:'peer-unavailable'}); return; }
    const remoteConn = new FakeConn();
    local.remote = remoteConn; remoteConn.remote = local;
    fire(remotePeer,'connection',remoteConn);
    local.open = true;  fire(local,'open');
    remoteConn.open = true; fire(remoteConn,'open');
  }, 0);
  return local;
}
class FakePeer {
  constructor(id){
    this.id = id || ('g-'+Math.random().toString(36).slice(2,8));
    this.h={}; this._conns=[]; this.open=false;
    FakeNet.instances.set(this.id, this);
    setTimeout(()=>{ this.open=true; fire(this,'open',this.id); }, 0);
  }
  on(ev,fn){ (this.h[ev]=this.h[ev]||[]).push(fn); }
  destroy(){ this.open=false; FakeNet.instances.delete(this.id); this._conns.forEach(c=>c.close()); }
  reconnect(){}
  connect(id){ return connectFlow(this, id); }
}

/* ---------------- fake DOM page ---------------- */
  function makePage(search){
  const elements = {};
  function makeStyle(){ const s={}; s.setProperty=function(k,v){ this[k]=v; }; return s; }
  function makeEl(id){
    const classes = new Set();
    return {
      id, handlers:{}, children:[], style:makeStyle(), value:'', disabled:false, _text:'', _html:'',
      get textContent(){ return this._text; }, set textContent(v){ this._text = v==null ? '' : String(v); },
      get className(){ return [...classes].join(' '); },
      set className(v){ classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x=>classes.add(x)); },
      get innerHTML(){ return this._html||''; }, set innerHTML(v){ this._html=v; this._text=String(v).replace(/<[^>]*>/g,''); if(v==='') this.children.length=0; },
      getBoundingClientRect(){
        const ar=this.style&&this.style.aspectRatio;
        if(ar){ const m=String(ar).split(/\s*\/\s*/); if(m.length===2){ const w=360; return {width:w, height:w*parseFloat(m[1])/parseFloat(m[0])}; } }
        return {width:360, height:360};
      },
      classList:{
        add:(...c)=>c.forEach(x=>classes.add(x)),
        remove:(...c)=>c.forEach(x=>classes.delete(x)),
        toggle:(c,force)=>{ const want = force===undefined ? !classes.has(c) : force; want?classes.add(c):classes.delete(c); },
        contains:c=>classes.has(c)
      },
      addEventListener(t,fn){ (this.handlers[t]=this.handlers[t]||[]).push(fn); },
      appendChild(ch){ this.children.push(ch); return ch; },
      remove(){},
      click(){ (this.handlers['click']||[]).forEach(fn=>fn.call(this)); }
    };
  }
  const doc = {
    getElementById(id){ return elements[id] || (elements[id] = makeEl(id)); },
    createElement(){ return makeEl('anon-'+Math.random().toString(36).slice(2,8)); },
    querySelectorAll(){ return []; },
    body: makeEl('body')
  };
  const sandbox = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, JSON, Math,
    document: doc,
    addEventListener(){},
    location: { search, origin:'http://test.local', pathname:'/' },
    URLSearchParams: class {
      constructor(s){ this.m = new Map(); (s||'').slice(1).split('&').filter(Boolean).forEach(x=>{ const [k,v]=x.split('='); this.m.set(k, decodeURIComponent(v||'')); }); }
      get(k){ return this.m.has(k) ? this.m.get(k) : null; }
    },
    navigator: {},
    requestAnimationFrame: fn=>fn(),
    Peer: FakePeer
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(gameSrc, sandbox);
  return { elements, doc };
}

/* ---------------- helpers ---------------- */
const sleep = ms => new Promise(r=>setTimeout(r, ms));
async function waitUntil(fn, what, ms=30000){
  const t0 = Date.now();
  while(Date.now()-t0 < ms){
    if(fn()) return;
    await sleep(25);
  }
  throw new Error('TIMEOUT waiting for: '+what);
}
let passed = 0;
function assert(cond, msg){
  if(!cond) { console.error('  ❌ FAIL: '+msg); process.exitCode = 1; }
  else { console.log('  ✅ '+msg); passed++; }
}
const downCards = els => els.board.children.filter(c=>!c.classList.contains('flipped') && !c.classList.contains('matched'));
const upThisTurn = els => els.board.children.filter(c=>c.classList.contains('flipped') && !c.classList.contains('matched'));
function cardArt(els, i){ const m = els.board.children[i].innerHTML.match(/face--front art-(\d+)/); return m ? parseInt(m[1],10) : -1; }

async function main(){
  const host = makePage('');
  host.elements.btnHost.click();                       // default: 8 pairs = 16 cards
  await waitUntil(()=>host.elements.hostCode._text.length===6, 'host room code');
  const code = host.elements.hostCode._text;
  console.log('host room code =', code);

  const guest = makePage('?join='+code);
  await waitUntil(()=>guest.elements.turnText._text.includes('turn'), 'guest connected & in game');
  assert(guest.elements.connDot.classList.contains('on'), 'guest: connection dot is green');
  assert(host.elements.board.children.length===16, 'host: 16 cards on board');
  assert(guest.elements.board.children.length===16, 'guest: 16 cards on board');
  assert(host.elements.botName._text==='Player 1' && guest.elements.topName._text==='Player 1', 'HUD: opponent on top / you on bottom (names)');
  assert(host.elements.turnText._text.includes('flip 1 of 2'), 'host (P1) goes first — "flip 1 of 2"');
  assert(host.elements.timerNum._text==='10', 'timer starts at 10');

  /* art cards: every card face has an art-N class with a valid index */
  const arts = host.elements.board.children.map(c=>cardArt(host.elements, host.elements.board.children.indexOf(c)));
  assert(arts.every(a=>a>=0 && a<10), 'cards use Dili art sprites (art-0..9)');
  const uniq = new Set(arts);
  assert(uniq.size===8 && arts.length===16, '8 pairs, each sprite exactly twice');

  /* scattered layout: positioned + no overlaps */
  const positioned = els => els.board.children.every(c=>c.style.transform && c.style.width);
  assert(positioned(host.elements) && positioned(guest.elements), 'scattered layout: all cards positioned');
  function noOverlap(els, label){
    const cards=els.board.children;
    const d=parseFloat(cards[0].style.width);
    const minD=d*1.28;
    for(let i=0;i<cards.length;i++){
      const mi=cards[i].style.transform.match(/translate\(([\d.]+)px,\s*([\d.]+)px\)/);
      for(let j=i+1;j<cards.length;j++){
        const mj=cards[j].style.transform.match(/translate\(([\d.]+)px,\s*([\d.]+)px\)/);
        const dx=parseFloat(mi[1])-parseFloat(mj[1]), dy=parseFloat(mi[2])-parseFloat(mj[2]);
        if(Math.sqrt(dx*dx+dy*dy) < minD - 1e-6) { console.error('  overlap between', i, j, label); return false; }
      }
    }
    return true;
  }
  assert(noOverlap(host.elements,'host') && noOverlap(guest.elements,'guest'), 'scattered layout: no overlapping cards (host + guest)');

  /* guest must NOT tap before their turn */
  guest.elements.board.children[0].click();
  await sleep(60);
  assert(!guest.elements.board.children[0].classList.contains('flipped'), 'guest tap ignored when it is not their turn');

  /* deterministic NO-MATCH by host */
  const e0 = cardArt(host.elements, 0);
  let nonpartner = -1;
  for(let i=1;i<16;i++){ if(cardArt(host.elements, i)!==e0){ nonpartner=i; break; } }
  host.elements.board.children[0].click();
  await waitUntil(()=>host.elements.turnText._text.includes('flip 2 of 2'), 'host prompted for 2nd card');
  host.elements.board.children[nonpartner].click();
  await waitUntil(()=>host.elements.turnText._text.includes('checking'), 'host entered locked phase');
  await sleep(1400);
  assert(!host.elements.board.children[0].classList.contains('flipped'), 'no-match: card 0 flipped back (host view)');
  assert(!guest.elements.board.children[nonpartner].classList.contains('flipped'), 'no-match: card flipped back (guest view)');
  assert(host.elements.botPts._text==='0' && host.elements.topPts._text==='0', 'no-match: no points awarded');
  assert(guest.elements.botScore.classList.contains('active'), 'turn passed to guest (both phones agree)');

  /* TIMER TEST: guest idles >10s -> host auto-passes turn back to host, timer resets */
  console.log('  ⏳ waiting ~11s for the 10s turn timer…');
  await waitUntil(()=>host.elements.botScore.classList.contains('active') && host.elements.turnText._text.includes('flip 1 of 2'),
    'timer: host got the turn back after 10s timeout', 16000);
  assert(host.elements.timerNum._text==='10' && guest.elements.timerNum._text==='10', 'timer reset to 10 on both phones');

  /* deterministic MATCH by host (now host's turn): flip card 0 + its partner */
  let partner = -1;
  for(let i=1;i<16;i++){ if(cardArt(host.elements, i)===e0){ partner=i; break; } }
  host.elements.board.children[0].click();
  await waitUntil(()=>host.elements.turnText._text.includes('flip 2 of 2'), 'host prompted for 2nd card (again)');
  host.elements.board.children[partner].click();
  await waitUntil(()=>host.elements.botPts._text==='1' && guest.elements.topPts._text==='1', 'match scored for host (both views)');
  await sleep(150);
  assert(host.elements.turnText._text.includes('flip 1 of 2') && host.elements.botScore.classList.contains('active'), 'match: host keeps the turn ("go again")');

  /* bot play until game over */
  function startBot(page){
    return setInterval(()=>{
      const els = page.elements;
      if(els.turnText._text.includes('Game over')) return;
      if(!els.botScore.classList.contains('active')) return;   // your pill = you
      if(upThisTurn(els).length>=2) return;
      const down = downCards(els);
      if(down.length===0) return;
      down[Math.floor(Math.random()*down.length)].click();
    }, 100);
  }
  startBot(host); startBot(guest);
  await waitUntil(()=>host.elements.turnText._text.includes('Game over') && guest.elements.turnText._text.includes('Game over'), 'game over on both phones', 120000);

  const hEl = host.elements, gEl = guest.elements;
  assert(hEl.board.children.every(c=>c.classList.contains('matched')), 'host: all cards matched');
  assert(gEl.board.children.every(c=>c.classList.contains('matched')), 'guest: all cards matched');
  const hs = +hEl.botPts._text + +hEl.topPts._text, gs = +gEl.botPts._text + +gEl.topPts._text;
  assert(hs===8, 'host: total pairs = 8 (you '+hEl.botPts._text+' / opp '+hEl.topPts._text+')');
  assert(gs===8, 'guest: total pairs = 8 (you '+gEl.botPts._text+' / opp '+gEl.topPts._text+')');
  assert(hEl.botPts._text===gEl.topPts._text && hEl.topPts._text===gEl.botPts._text, 'scores mirror correctly across phones');
  assert(!hEl.ovEnd.classList.contains('hidden'), 'host: win/lose screen shown');
  assert(!gEl.ovEnd.classList.contains('hidden'), 'guest: win/lose screen shown');

  /* rematch (guest requests, host accepts) */
  gEl.btnRematchReq.click();
  await waitUntil(()=>downCards(hEl).length===16 && downCards(gEl).length===16, 'fresh board after rematch');
  assert(positioned(hEl) && positioned(gEl), 'rematch: cards re-scattered on both phones');
  assert(noOverlap(hEl,'host rematch') && noOverlap(gEl,'guest rematch'), 'rematch: no overlapping cards');
  console.log('\n🏁 SIMULATION FINISHED — '+passed+' checks passed'+(process.exitCode?', with FAILURES':' — ALL GOOD'));
  process.exit(process.exitCode||0);
}
main().catch(e=>{ console.error('HARNESS ERROR:', e.stack||e.message); process.exit(2); });
