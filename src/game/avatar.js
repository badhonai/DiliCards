/**
 * DILICARDS — player avatars
 * Every device gets a random Dili sticker as its PFP on first launch.
 * The choice is saved to localStorage so it stays the same every visit.
 */
import diliCool from '../assets/dili-cool.png';
import diliFunny from '../assets/dili-funny.png';
import diliHands from '../assets/dili-handsup.png';
import diliHappy from '../assets/dili-happy.png';
import { CFG } from '../config.js';

export const AVATARS = [diliCool, diliFunny, diliHands, diliHappy];
const KEY = CFG.STORE_KEY + '-avatar';

function randomIndex(){ return Math.floor(Math.random()*AVATARS.length); }

export function saveAvatar(i){
  try{ localStorage.setItem(KEY, String(i)); }catch(e){ /* private mode */ }
}

/** Current avatar index — creates (and saves) a random one on first run. */
export function loadAvatar(){
  try{
    const v = parseInt(localStorage.getItem(KEY) || '', 10);
    if(!Number.isNaN(v) && v>=0 && v<AVATARS.length) return v;
  }catch(e){ /* fall through */ }
  const i = randomIndex();
  saveAvatar(i);
  return i;
}

/** Pick a brand-new random avatar and save it. */
export function rerollAvatar(){
  const i = randomIndex();
  saveAvatar(i);
  return i;
}

export function avatarUrl(i){
  return (i!=null && AVATARS[i]) ? AVATARS[i] : AVATARS[0];
}
