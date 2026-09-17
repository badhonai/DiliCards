/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — P2P session (PeerJS over WebRTC)
 *
 *  The host registers a room id; the guest connects to it.
 *  After the (free) PeerJS cloud introduces the two phones,
 *  ALL game data flows directly between the phones — no server.
 * ─────────────────────────────────────────────────────────────
 */
import Peer from 'peerjs';
import { CFG } from '../config.js';

export function send(conn, obj){
  try{ if(conn && conn.open) conn.send(obj); }catch(e){ /* channel gone */ }
}

/**
 * Wire a one-shot 'open' callback.
 * PeerJS race: the connection can ALREADY be open by the time we attach
 * the listener — then 'open' would never fire and the peer would wait
 * forever. Check state first, always.
 */
function wireOpen(conn, fn){
  if(!conn) return;
  if(conn.open) fn();
  else conn.on('open', fn);
}

/**
 * Host a room.
 * handlers: { onOpen, onFriend(conn), onData(conn,msg), onFriendLost(conn), onPeerError(err) }
 */
export function createHost(code, h={}){
  const peer=new Peer(CFG.PREFIX+code);
  const api={
    destroy(){ try{ peer.destroy(); }catch(e){} },
  };
  peer.on('open', ()=>h.onOpen?.());
  peer.on('connection', conn=>{
    wireOpen(conn, ()=>h.onFriend?.(conn));
    conn.on('data', d=>h.onData?.(conn,d));
    const lost=()=>h.onFriendLost?.(conn);
    conn.on('close', lost);
    conn.on('error', lost);
  });
  peer.on('disconnected', ()=>{ try{ peer.reconnect(); }catch(e){} });
  peer.on('error', err=>h.onPeerError?.(err));
  return api;
}

/**
 * Join a room.
 * handlers: { onOpen(conn), onData(conn,msg), onLost(conn), onError(err) }
 */
export function createGuest(code, h={}){
  const peer=new Peer();
  const api={
    destroy(){ try{ peer.destroy(); }catch(e){} },
  };
  peer.on('open', ()=>{
    const conn=peer.connect(CFG.PREFIX+code, { reliable:true });
    wireOpen(conn, ()=>h.onOpen?.(conn));
    conn.on('data', d=>h.onData?.(conn,d));
    const lost=()=>h.onLost?.(conn);
    conn.on('close', lost);
    conn.on('error', lost);
  });
  peer.on('disconnected', ()=>{ try{ peer.reconnect(); }catch(e){} });
  peer.on('error', err=>h.onError?.(err));
  return api;
}

export function makeCode(){
  const CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s='';
  for(let i=0;i<6;i++) s+=CHARS[Math.floor(Math.random()*CHARS.length)];
  return s;
}
