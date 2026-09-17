/**
 * DILICARDS — tiny WebAudio sound effects (no audio files needed).
 * All effects are synthesized, so the game stays a single deploy.
 */
let actx=null;
let muted=false;

export function setMuted(m){ muted=!!m; }
export function isMuted(){ return muted; }

/** Browsers require a user gesture before audio can start. Call from any tap. */
export function ensureAudio(){
  if(!actx){
    try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ actx=null; }
  }
  if(actx && actx.state==='suspended') actx.resume();
}

function tone(freq, dur, type='sine', vol=0.15, when=0){
  if(muted || !actx) return;
  try{
    const t=actx.currentTime+(when||0);
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type; o.frequency.value=freq;
    o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.start(t); o.stop(t+dur+0.03);
  }catch(e){ /* ignore */ }
}

export function sfx(kind){
  if(!actx) return;
  switch(kind){
    case 'flip':    tone(430,0.08,'triangle',0.12); break;
    case 'match':   tone(523,0.12,'sine',0.16); tone(784,0.16,'sine',0.16,0.09); break;
    case 'nomatch': tone(170,0.18,'sawtooth',0.12); break;
    case 'timeout': tone(300,0.12,'square',0.10); tone(210,0.2,'square',0.10,0.12); break;
    case 'win':     [523,659,784,1047].forEach((f,i)=>tone(f,0.2,'sine',0.16,i*0.12)); break;
    case 'join':    tone(660,0.1,'sine',0.14); tone(880,0.14,'sine',0.14,0.08); break;
  }
}

export function buzz(pattern){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){ /* no haptics */ }
}
