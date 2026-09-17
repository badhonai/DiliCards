/**
 * DILICARDS — player avatars
 * The player picks one of the Dili stickers (first-launch popup, or
 * tap the avatar later). The choice is saved to localStorage.
 * No auto-random — the choice is always the user's.
 */
import diliCool from '../assets/dili-cool.png';
import diliFunny from '../assets/dili-funny.png';
import diliHands from '../assets/dili-handsup.png';
import diliHappy from '../assets/dili-happy.png';
import { CFG } from '../config.js';

export const AVATARS = [diliCool, diliFunny, diliHands, diliHappy];
const KEY = CFG.STORE_KEY + '-avatar';

export function saveAvatar(i){
  try{ localStorage.setItem(KEY, String(i)); }catch(e){ /* private mode */ }
}

/** Saved avatar index, or null if the user hasn't chosen yet. */
export function loadAvatar(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw==null) return null;
    const v = parseInt(raw, 10);
    if(v>=0 && v<AVATARS.length) return v;
  }catch(e){ /* ignore */ }
  return null;
}

export function avatarUrl(i){
  return (i!=null && AVATARS[i]) ? AVATARS[i] : null;
}
