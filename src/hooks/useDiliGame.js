/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — app state orchestrator (React hook)
 *
 *  Host  → runs the authoritative engine, broadcasts state syncs
 *  Guest → mirrors state from syncs, sends tap intents
 *  Both  → same UI, sounds, haptics, wake lock, reconnect
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect, useReducer, useCallback } from 'react';
import { CFG } from '../config.js';
import {
  createGame as engineNewGame, freshView, hostFlip, guestFlip, resolveLock,
  tickTimer, checkTimeout, syncPayload, applySync,
} from '../game/engine.js';
import { createHost, createGuest, send, makeCode } from '../game/net.js';
import { ensureAudio, sfx, buzz, setMuted } from '../game/audio.js';

function loadName(){ try{ return localStorage.getItem(CFG.STORE_KEY)||''; }catch(e){ return ''; } }
function saveName(n){ try{ localStorage.setItem(CFG.STORE_KEY, n||''); }catch(e){} }

export function useDiliGame(){
  const [screen, setScreen] = useState('menu');
  const [role, setRole] = useState(null);
  const [sizePairs, setSizePairs] = useState(CFG.BOARD_SIZES[1].pairs);
  const [name, setName] = useState(loadName());
  const [hostName, setHostName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lost, setLost] = useState(false);
  const [joinErr, setJoinErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [muted, setMutedState] = useState(false);
  const [, bump] = useReducer(x=>x+1, 0);

  const SRef = useRef(null);
  const netRef = useRef(null);
  const connRef = useRef(null);
  const timerIv = useRef(null);
  const lockTo = useRef(null);
  const lostTo = useRef(null);
  const toastTo = useRef(null);
  const joinTo = useRef(null);
  const roleRef = useRef(null);
  const hostNameRef = useRef('');
  const guestNameRef = useRef('');
  const wakeRef = useRef(null);

  roleRef.current = role;
  hostNameRef.current = hostName;
  guestNameRef.current = guestName;

  const showToast = useCallback((msg)=>{
    setToast(msg);
    clearTimeout(toastTo.current);
    toastTo.current = setTimeout(()=>setToast(null), 2400);
  }, []);

  const roomLink = useCallback(()=>{
    if(!roomCode) return '';
    return location.origin + location.pathname + '?join=' + roomCode;
  }, [roomCode]);

  /* ── wake lock (keep screen on during the game) ── */
  const requestWake = useCallback(()=>{
    try{
      if(navigator.wakeLock && !wakeRef.current){
        navigator.wakeLock.request('screen').then(wl=>{ wakeRef.current=wl; }, ()=>{});
      }
    }catch(e){}
  }, []);
  const releaseWake = useCallback(()=>{
    try{ wakeRef.current?.release(); }catch(e){}
    wakeRef.current=null;
  }, []);

  /* ── host: broadcast a sync (optionally tagged with an event) ── */
  const sendSync = useCallback((ev='')=>{
    const S=SRef.current;
    if(S && roleRef.current==='host') send(connRef.current, { ...syncPayload(S), ev });
  }, []);

  /* ── host: the 10s turn timer (authoritative) ── */
  const startTimerLoop = useCallback(()=>{
    clearInterval(timerIv.current);
    timerIv.current = setInterval(()=>{
      const S=SRef.current;
      if(!S) return;
      const t = tickTimer(S);
      const to = checkTimeout(S);
      if(to){
        sfx('timeout'); buzz(80);
        showToast("⏰ Time's up! Turn passed");
        sendSync('timeout');
      } else if(t && t.ev==='tick'){
        sendSync('tick');
      }
      if(t || to) bump();
    }, 250);
  }, [sendSync, showToast]);

  const stopTimerLoop = useCallback(()=>{
    clearInterval(timerIv.current);
    timerIv.current=null;
  }, []);

  /* ── shared: apply fx for an engine event ── */
  const playEv = useCallback((ev, whoFlipped)=>{
    if(ev==='flip'){ sfx('flip'); buzz(15); }
    else if(ev==='match'){ sfx('match'); buzz([30,40,30]); }
    else if(ev==='nomatch'){ sfx('nomatch'); buzz(50); }
    else if(ev==='timeout'){ sfx('timeout'); buzz(80); showToast("⏰ Time's up! Turn passed"); }
    else if(ev==='end'){ sfx('win'); buzz([60,50,60,50,100]); }
  }, [showToast]);

  /* ── rematch (host rebuilds a board; guest asks for one) ── */
  const startRematch = useCallback(()=>{
    if(roleRef.current!=='host') return;
    SRef.current = engineNewGame(SRef.current?.pairs || sizePairs);
    setLost(false);
    bump();
    if(connRef.current){
      send(connRef.current, { t:'init', pairs:SRef.current.pairs, deck:SRef.current.deck, hostName:hostNameRef.current, tl:SRef.current.timeLeft });
      startTimerLoop();
      sendSync('');
    }
  }, [bump, sendSync, sizePairs, startTimerLoop]);

  /* ── shared: message handler (host & guest) ── */
  const handleMsg = useCallback((m)=>{
    if(!m || !m.t) return;
    const r = roleRef.current;

    if(m.t==='init' && r==='guest'){
      SRef.current = freshView(m.pairs, m.deck, m.tl);
      setHostName((m.hostName||'Player 1').slice(0,14));
      setLost(false);
      setScreen('game');
      setConnected(true);
      sfx('join');
      bump();
    }
    else if(m.t==='sync' && r==='guest'){
      const S=SRef.current;
      if(!S) return;
      const fx = applySync(S, m);
      if(fx.newUps.length) sfx('flip');
      if(fx.ev==='end'){ sfx('win'); buzz([60,50,60,50,100]); }
      else if(fx.ev==='match') { sfx('match'); buzz([30,40,30]); }
      else if(fx.ev==='nomatch'){ sfx('nomatch'); buzz(50); }
      else if(fx.ev==='timeout'){ sfx('timeout'); buzz(80); showToast("⏰ Time's up! Turn passed"); }
      bump();
    }
    else if(m.t==='tap' && r==='host'){
      const S=SRef.current;
      if(!S) return;
      const res = guestFlip(S, m.cardId);
      if(!res) return;
      playEv(res.ev);
      if(res.ev==='nomatch'){
        clearTimeout(lockTo.current);
        lockTo.current = setTimeout(()=>{
          resolveLock(SRef.current);
          bump();
          sendSync('');
        }, CFG.LOCK_MS);
      }
      if(res.ev==='end') stopTimerLoop();
      bump();
      sendSync(res.ev);
    }
    else if(m.t==='hello' && r==='host'){
      setGuestName((m.name||'Player 2').slice(0,14));
      bump();
    }
    else if(m.t==='rematch-req' && r==='host'){
      startRematch();
    }
    else if(m.t==='bye'){
      setLost(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump, playEv, sendSync, showToast, stopTimerLoop]);

  /* ── host: friend connected ── */
  const onFriend = useCallback((conn)=>{
    if(connRef.current && connRef.current.open){
      try{ conn.close(); }catch(e){}   // room full
      return;
    }
    clearTimeout(lostTo.current);
    connRef.current = conn;
    setConnected(true);
    setLost(false);
    setScreen('game');
    requestWake();
    let S=SRef.current;
    if(!S){                       // e.g. host reloaded mid-game → fresh board
      S = SRef.current = engineNewGame(sizePairs);
    }
    S.timeLeft = CFG.TURN_SECONDS;
    S.deadline = Date.now() + CFG.TURN_SECONDS*1000;
    startTimerLoop();
    send(conn, { t:'init', pairs:S.pairs, deck:S.deck, hostName:hostNameRef.current, tl:S.timeLeft });
    sendSync('');
    bump();
  }, [bump, requestWake, sendSync, startTimerLoop, sizePairs]);

  const onFriendLost = useCallback(()=>{
    if(!connRef.current) return;
    connRef.current=null;
    setConnected(false);
    if(roleRef.current==='host'){
      // room stays alive — friend can rejoin; only nag after a moment
      clearTimeout(lostTo.current);
      lostTo.current = setTimeout(()=>{
        if(!connRef.current) setLost(true);
      }, 4000);
    } else {
      setLost(true);
    }
  }, []);

  /* ── host flow ── */
  const createGame = useCallback(()=>{
    ensureAudio();
    const my=(name||'').trim().slice(0,14);
    saveName(my);
    setRole('host');
    setHostName(my||'Player 1');
    setGuestName('');
    setLost(false);
    const code=makeCode();
    setRoomCode(code);
    setScreen('host');
    SRef.current = engineNewGame(sizePairs);
    bump();

    const hostHandlers = {
      onFriend,
      onData: (_c, m)=>handleMsg(m),
      onFriendLost,
      onPeerError(err){
        if(err && err.type==='unavailable-ID'){
          const nc=makeCode();
          setRoomCode(nc);
          netRef.current?.destroy();
          setTimeout(()=>{
            SRef.current = engineNewGame(sizePairs);
            netRef.current = createHost(nc, hostHandlers);
            bump();
          }, 400);
        } else {
          showToast('Matchmaking hiccup — retrying…');
        }
      },
    };
    netRef.current?.destroy();
    netRef.current = createHost(code, hostHandlers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, sizePairs, onFriend, handleMsg, onFriendLost, showToast, bump]);

  /* ── guest flow ── */
  const tryJoin = useCallback((codeOverride)=>{
    netRef.current?.destroy();
    connRef.current=null;
    setJoinErr(null);
    let connectedNow=false;
    // codeOverride: fresh code from joinGame (state isn't committed yet).
    // Retries (no arg) use the current roomCode.
    const code=codeOverride || roomCode;
    clearTimeout(joinTo.current);
    joinTo.current = setTimeout(()=>{ if(!connectedNow) setJoinErr('timeout'); }, CFG.JOIN_TIMEOUT);

    netRef.current = createGuest(code, {
      onOpen(conn){
        connectedNow=true;
        clearTimeout(joinTo.current);
        connRef.current=conn;
        setConnected(true);
        setLost(false);
        send(conn, { t:'hello', name:guestNameRef.current });
      },
      onData: (_c, m)=>handleMsg(m),
      onLost: onFriendLost,
      onError(err){
        if(!connectedNow){
          if(err && err.type==='peer-unavailable') setJoinErr('nohost');
          else if(err && (err.type==='network'||err.type==='socket-error'||err.type==='server-error')) setJoinErr('network');
          else setJoinErr('timeout');
        }
      },
    });
  }, [roomCode, handleMsg, onFriendLost]);

  const joinGame = useCallback((codeRaw)=>{
    ensureAudio();
    const code=String(codeRaw||'').trim().toUpperCase();
    if(code.length<4){ showToast('Enter the 6-letter code'); return; }
    const my=(name||'').trim().slice(0,14);
    saveName(my);
    setRole('guest');
    setGuestName(my||'Player 2');
    setHostName('');
    setRoomCode(code);
    setLost(false);
    setScreen('join');
    tryJoin(code);
  }, [name, tryJoin, showToast]);

  /* ── card tap (both roles) ── */
  const onCardTap = useCallback((id)=>{
    ensureAudio();
    const S=SRef.current;
    if(!S || S.phase==='done' || S.phase==='locked') return;
    const card=S.cards[id];
    if(!card || card.state!=='down') return;

    if(roleRef.current==='guest'){
      if(S.turn!==2 || S.flipped.length>=2) return;
      card.state='up';                      // optimistic — host's sync confirms
      S.flipped.push(id);
      sfx('flip'); buzz(15);
      bump();
      send(connRef.current, { t:'tap', cardId:id });
    } else {
      if(S.turn!==1 || S.flipped.length>=2) return;
      const res=hostFlip(S, id);
      if(!res) return;
      playEv(res.ev);
      if(res.ev==='nomatch'){
        clearTimeout(lockTo.current);
        lockTo.current = setTimeout(()=>{
          resolveLock(SRef.current);
          bump();
          sendSync('');
        }, CFG.LOCK_MS);
      }
      if(res.ev==='end') stopTimerLoop();
      bump();
      sendSync(res.ev);
    }
  }, [bump, playEv, sendSync, stopTimerLoop]);

  /* ── leave / home ── */
  const goHome = useCallback(()=>{
    send(connRef.current, { t:'bye' });
    netRef.current?.destroy();
    netRef.current=null;
    connRef.current=null;
    SRef.current=null;
    stopTimerLoop();
    clearTimeout(lockTo.current); clearTimeout(lostTo.current); clearTimeout(joinTo.current);
    releaseWake();
    setRole(null);
    setConnected(false);
    setLost(false);
    setJoinErr(null);
    setRoomCode(null);
    setHostName('');
    setGuestName('');
    setScreen('menu');
  }, [releaseWake, stopTimerLoop]);

  /* ── guest asks the host for a rematch ── */
  const requestRematch = useCallback(()=>{
    send(connRef.current, { t:'rematch-req' });
  }, []);

  /* ── mute ─ */
  const toggleMute = useCallback(()=>{
    setMutedState(m=>{
      setMuted(!m);
      return !m;
    });
  }, []);

  /* ── auto-join from ?join=CODE link ── */
  useEffect(()=>{
    const p=new URLSearchParams(location.search);
    const j=(p.get('join')||'').toUpperCase();
    if(j.length>=4) joinGame(j);
    return ()=>{
      stopTimerLoop();
      netRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    screen, role, view: SRef.current, connected, lost, joinErr, toast, muted,
    sizePairs, setSizePairs,
    name, setName,
    hostName, guestName,
    roomCode, roomLink,
    createGame, joinGame, tryJoin,
    onCardTap, goHome, startRematch, requestRematch, toggleMute,
    setLost, setJoinErr, showToast,
  };
}
