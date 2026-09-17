/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — app state orchestrator (React hook)
 *
 *  Host  → runs the authoritative engine, broadcasts state syncs
 *  Guest → mirrors state from syncs, sends tap intents
 *  Both  → same UI, sounds, haptics, wake lock, reconnect
 *
 *  Onboarding: first launch (or a first-time join link) shows a
 *  popup to pick a name + Dili avatar. A join link never bounces
 *  to the home screen — submit goes straight into the game.
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
import { loadAvatar, saveAvatar } from '../game/avatar.js';

function loadName(){ try{ return localStorage.getItem(CFG.STORE_KEY)||''; }catch(e){ return ''; } }
function saveName(n){ try{ localStorage.setItem(CFG.STORE_KEY, n||''); }catch(e){} }
function validName(n){ return (n||'').trim().length>=2; }

const INIT_TIMEOUT = 10000;   // guest: max wait for the host's init after connecting

export function useDiliGame(){
  const [screen, setScreen] = useState('menu');
  const [role, setRole] = useState(null);
  const [sizePairs, setSizePairs] = useState(CFG.BOARD_SIZES[1].pairs);
  const [name, setName] = useState(loadName());
  const [avatar, setAvatar] = useState(()=>loadAvatar());   // null until the user picks
  const [onboard, setOnboard] = useState({ open:false, joinCode:null });
  const [hostName, setHostName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [hostAvatar, setHostAvatar] = useState(null);
  const [guestAvatar, setGuestAvatar] = useState(null);
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
  const screenRef = useRef(null);
  const hostNameRef = useRef('');
  const guestNameRef = useRef('');
  const nameRef = useRef('');
  const avatarRef = useRef(null);
  const initRef = useRef(false);
  const wakeRef = useRef(null);

  roleRef.current = role;
  screenRef.current = screen;
  hostNameRef.current = hostName;
  guestNameRef.current = guestName;
  nameRef.current = name;
  avatarRef.current = avatar;

  const showToast = useCallback((msg)=>{
    setToast(msg);
    clearTimeout(toastTo.current);
    toastTo.current = setTimeout(()=>setToast(null), 2400);
  }, []);

  const roomLink = useCallback(()=>{
    if(!roomCode) return '';
    return location.origin + location.pathname + '?join=' + roomCode;
  }, [roomCode]);

  const chooseAvatar = useCallback((i)=>{
    saveAvatar(i);
    setAvatar(i);
  }, []);

  /* open the name+PFP popup (change mode when identity exists) */
  const openOnboard = useCallback((joinCode=null)=>{
    setOnboard({ open:true, joinCode });
  }, []);

  /* popup submitted → save identity; a pending join goes straight in */
  const submitOnboard = useCallback((newName, newAvatar)=>{
    saveName(newName);
    saveAvatar(newAvatar);
    nameRef.current = newName;     // refs updated NOW (state is async) so the
    avatarRef.current = newAvatar; // pending join sees the fresh identity
    guestNameRef.current = newName;
    setName(newName);
    setAvatar(newAvatar);
    const code = onboard.joinCode;
    setOnboard({ open:false, joinCode:null });
    if(code) joinGameRef.current(code);
  }, [onboard.joinCode]);

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
        showToast("Time's up! Turn passed");
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
  const playEv = useCallback((ev)=>{
    if(ev==='flip'){ sfx('flip'); buzz(15); }
    else if(ev==='match'){ sfx('match'); buzz([30,40,30]); }
    else if(ev==='nomatch'){ sfx('nomatch'); buzz(50); }
    else if(ev==='timeout'){ sfx('timeout'); buzz(80); showToast("Time's up! Turn passed"); }
    else if(ev==='end'){ sfx('win'); buzz([60,50,60,50,100]); }
  }, [showToast]);

  /* ── host: tell the (re)connecting guest the current game state ── */
  const initPayload = useCallback(()=>{
    const S=SRef.current;
    return { t:'init', pairs:S.pairs, deck:S.deck, hostName:hostNameRef.current,
             hostAvatar:avatarRef.current, tl:S.timeLeft };
  }, []);

  /* ── rematch (host rebuilds a board; guest asks for one) ── */
  const startRematch = useCallback(()=>{
    if(roleRef.current!=='host') return;
    SRef.current = engineNewGame(SRef.current?.pairs || sizePairs);
    setLost(false);
    bump();
    if(connRef.current){
      send(connRef.current, initPayload());
      startTimerLoop();
      sendSync('');
    }
  }, [bump, sendSync, sizePairs, startTimerLoop, initPayload]);

  /* ── shared: message handler (host & guest) ── */
  const handleMsg = useCallback((m)=>{
    if(!m || !m.t) return;
    const r = roleRef.current;

    if(m.t==='init' && r==='guest'){
      SRef.current = freshView(m.pairs, m.deck, m.tl);
      setHostName((m.hostName||'Player 1').slice(0,14));
      setHostAvatar(m.hostAvatar!=null ? m.hostAvatar : null);
      initRef.current = true;
      clearTimeout(joinTo.current);
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
      else if(fx.ev==='timeout'){ sfx('timeout'); buzz(80); showToast("Time's up! Turn passed"); }
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
      if(m.avatar!=null) setGuestAvatar(m.avatar);
      bump();
    }
    else if(m.t==='rematch-req' && r==='host'){
      startRematch();
    }
    else if(m.t==='bye'){
      setLost(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump, playEv, sendSync, showToast, stopTimerLoop, startRematch]);

  /* ── host: friend connected (a NEW connection always takes over) ── */
  const onFriend = useCallback((conn)=>{
    const old = connRef.current;
    if(old && old!==conn){
      try{ old.close(); }catch(e){}   // stale/half-open conn or a new friend takes over
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
    // reconnect mid-game → keep the running clock; fresh game → reset it
    const inProgress = S.phase!=='play' ||
      S.cards.some(c=>c.state!=='down') || S.scores[1]>0 || S.scores[2]>0;
    if(!inProgress){
      S.timeLeft = CFG.TURN_SECONDS;
      S.deadline = Date.now() + CFG.TURN_SECONDS*1000;
    }
    startTimerLoop();
    send(conn, initPayload());
    sendSync('');
    bump();
  }, [bump, requestWake, sendSync, startTimerLoop, sizePairs, initPayload]);

  /* ── both: the current connection dropped ── */
  const onFriendLost = useCallback((conn)=>{
    if(connRef.current!==conn) return;   // stale conn — already replaced
    connRef.current = null;
    setConnected(false);
    stopTimerLoop();
    if(roleRef.current==='host'){
      // room stays alive — friend can rejoin; only nag after a moment
      clearTimeout(lostTo.current);
      lostTo.current = setTimeout(()=>{
        if(!connRef.current) setLost(true);
      }, 4000);
    } else if(!initRef.current && screenRef.current==='join'){
      // guest never got the game → surface a real error instead of spinning
      setJoinErr('hostgone');
    } else {
      setLost(true);
    }
  }, [stopTimerLoop]);

  /* ── host flow ── */
  const createGame = useCallback(()=>{
    ensureAudio();
    if(!validName(nameRef.current) || avatarRef.current==null){
      openOnboard(null);
      return;
    }
    const my=nameRef.current.trim().slice(0,14);
    saveName(my);
    setRole('host');
    setHostName(my);
    setGuestName('');
    setGuestAvatar(null);
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
  }, [name, avatar, sizePairs, onFriend, handleMsg, onFriendLost, showToast, openOnboard, bump]);

  /* ── guest flow ── */
  const tryJoin = useCallback((codeOverride)=>{
    netRef.current?.destroy();
    connRef.current = null;
    initRef.current = false;
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
        connRef.current=conn;
        setConnected(true);
        setLost(false);
        send(conn, { t:'hello', name:guestNameRef.current, avatar:avatarRef.current });
        // never spin forever: if the host's init doesn't arrive in 10s, say so
        clearTimeout(joinTo.current);
        joinTo.current = setTimeout(()=>{
          if(!initRef.current && connRef.current===conn) setJoinErr('init');
        }, INIT_TIMEOUT);
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
    if(!validName(nameRef.current) || avatarRef.current==null){
      // first-time join → popup, then STRAIGHT into the game
      openOnboard(code);
      return;
    }
    const my=nameRef.current.trim().slice(0,14);
    saveName(my);
    guestNameRef.current = my;
    setRole('guest');
    setGuestName(my);
    setHostName('');
    setHostAvatar(null);
    setRoomCode(code);
    setLost(false);
    setScreen('join');
    tryJoin(code);
  }, [tryJoin, showToast, openOnboard]);
  const joinGameRef = useRef(null);
  joinGameRef.current = joinGame;

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
    initRef.current=false;
    setRole(null);
    setConnected(false);
    setLost(false);
    setJoinErr(null);
    setRoomCode(null);
    setHostName('');
    setGuestName('');
    setHostAvatar(null);
    setGuestAvatar(null);
    setScreen('menu');
  }, [releaseWake, stopTimerLoop]);

  /* ── guest asks the host for a rematch ── */
  const requestRematch = useCallback(()=>{
    send(connRef.current, { t:'rematch-req' });
  }, []);

  /* ── mute  */
  const toggleMute = useCallback(()=>{
    setMutedState(m=>{
      setMuted(!m);
      return !m;
    });
  }, []);

  /* ── first launch / join-link onboarding ──
     • ?join=CODE with a saved identity  → join immediately
     • ?join=CODE without one            → popup, then straight into the game
     • no link, identity missing          → popup, then the menu  */
  useEffect(()=>{
    const p=new URLSearchParams(location.search);
    const j=(p.get('join')||'').toUpperCase();
    const hasIdentity = validName(loadName()) && loadAvatar()!=null;
    if(j.length>=4){
      if(hasIdentity) joinGame(j);
      else setOnboard({ open:true, joinCode:j });
    } else if(!hasIdentity){
      setOnboard({ open:true, joinCode:null });
    }
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
    avatar, chooseAvatar,
    onboard, openOnboard, submitOnboard,
    hostName, guestName, hostAvatar, guestAvatar,
    roomCode, roomLink,
    createGame, joinGame, tryJoin,
    onCardTap, goHome, startRematch, requestRematch, toggleMute,
    setLost, setJoinErr, showToast,
  };
}
