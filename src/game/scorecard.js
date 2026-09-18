/**
 * DILICARDS  -  winner score cards (shareable, winner-only)
 *
 * Seven 16:9 backgrounds (Preset A to Preset G), each with its own
 * custom layout and aesthetic:
 *   • hero    (Preset A) -> classic clay duel, side score tiles + big avatar
 *   • banner  (Preset B) -> diagonal orange power slice + giant 360px score
 *   • night   (Preset C) -> dark obsidian night, glowing ember warmth,
 *                           frosted glass duel cards + white brand crest
 *   • ring    (Preset D) -> solar sunburst ring framing winner avatar +
 *                           stadium podium score cards
 *   • classic (Preset E) -> left avatar framed by classic wheel + grand
 *                           battle board on the right
 *   • cobalt  (Preset F) -> dark midnight sapphire, electric blue neon
 *                           glow duel cards + cyan-rimmed champion avatar
 *   • cyber   (Preset G) -> futuristic deep blue arena with cyber ring,
 *                           cyan solar halo + electric blue stadium podiums
 *
 * All presets carry: logo + wordmark, champion pill, winner name + score,
 * opponent name + score (masked as "???" when the winner hides it), and
 * a footer with the site url + @BadhonAI.
 *
 * The card image footer uses the MAIN site (dilicard.badhon.online).
 * The tweet caption uses the short link (dilicard.vercel.app -> redirects).
 */
import logo from '../assets/logo.png';
import logoWhite from '../assets/logo-white.png';
import { avatarUrl } from './avatar.js';

import scHero    from '../assets/scorecards/sc-hero.jpg';
import scBanner  from '../assets/scorecards/sc-banner.jpg';
import scNight   from '../assets/scorecards/sc-night.jpg';
import scRing    from '../assets/scorecards/sc-ring.jpg';
import scClassic from '../assets/scorecards/sc-classic.jpg';
import scCobalt  from '../assets/scorecards/sc-cobalt.jpg';
import scCyber   from '../assets/scorecards/sc-cyber.jpg';

export const SCORECARD_VARIANTS = [
  { id:'hero',    name:'Preset A', w:1920, h:1080, bg:scHero },
  { id:'banner',  name:'Preset B', w:1920, h:1080, bg:scBanner },
  { id:'night',   name:'Preset C', w:1920, h:1080, bg:scNight },
  { id:'ring',    name:'Preset D', w:1920, h:1080, bg:scRing },
  { id:'classic', name:'Preset E', w:1920, h:1080, bg:scClassic },
  { id:'cobalt',  name:'Preset F', w:1920, h:1080, bg:scCobalt },
  { id:'cyber',   name:'Preset G', w:1920, h:1080, bg:scCyber },
];

/** Default tweet caption (short link that redirects to the main site). */
export function tweetText(score){
  return `I just won a DiliCards memory duel, ${score} pairs found! Can you beat me? Challenge me live on two phones at https://dilicard.vercel.app`;
}

const INK      = '#4a2f1d';
const SOFT     = '#7a5a41';
const FAINT    = '#a8876a';
const CLAY     = '#e9895b';
const DEEP     = '#cf6a31';
const LIGHT    = '#ffb877';
const GOLD     = '#e8b04b';
const CREAM    = '#fff7ec';
const WIN_TILE = '#fffbf4';
const FOOT     = 'dilicard.badhon.online   ·   @BadhonAI';

function loadImage(src){
  return new Promise((resolve, reject)=>{
    if(!src){ resolve(null); return; }
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('image failed: ' + String(src).slice(-24)));
    img.src = src;
  });
}

function coverImage(ctx, img, w, h){
  const ar = img.width/img.height, car = w/h;
  let dw, dh;
  if(ar > car){ dh = h; dw = h*ar; } else { dw = w; dh = w/ar; }
  ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);
}

/** Fit a bold text size down to `maxW`. */
function fitSize(ctx, text, start, maxW){
  let size = start;
  while(size > 30){
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    if(ctx.measureText(text).width <= maxW) break;
    size -= 2;
  }
  return size;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

function header(ctx, lg, { x, cx }, color){
  const logoSize = 84;
  ctx.font = `800 68px system-ui, sans-serif`;
  const tw = ctx.measureText('DiliCards').width;
  const total = logoSize + 18 + tw;
  const hx = cx!=null ? (1920 - total)/2 : x;
  const hy = (cx!=null ? 30 : 28);
  ctx.drawImage(lg, hx, 70 + hy - 28, logoSize, logoSize);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color || INK;
  ctx.fillText('DiliCards', hx + logoSize + 18, 70 + hy + logoSize/2 - 24);
}

function pill(ctx, text, { x, y, cx, color, top, textColor, strokeColor }){
  ctx.font = `800 30px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + 84, h = 56;
  const px = cx!=null ? (1920 - w)/2 : x;
  const g = ctx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, top || CLAY); g.addColorStop(1, color || DEEP);
  roundRect(ctx, px, y, w, h, h/2);
  ctx.fillStyle = g; ctx.fill();
  if(strokeColor){
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = textColor || '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, px + w/2, y + h/2 + 1);
}

function nameText(ctx, name, { x, y, cx }, start, maxW, color, glowColor){
  const size = fitSize(ctx, name, start, maxW);
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.save();
  if(glowColor){
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
  }
  ctx.fillStyle = color || INK;
  ctx.fillText(name, cx!=null ? (1920 - ctx.measureText(name).width)/2 : x, y + size);
  ctx.restore();
  return size;
}

function tile(ctx, x, y, w, h, label, score, dark){
  if(dark){
    const g = ctx.createLinearGradient(0, y, 0, y+h);
    g.addColorStop(0, CLAY); g.addColorStop(1, DEEP);
    roundRect(ctx, x, y, w, h, 26);
    ctx.fillStyle = g; ctx.fill();
  } else {
    roundRect(ctx, x, y, w, h, 26);
    ctx.fillStyle = WIN_TILE; ctx.fill();
    roundRect(ctx, x, y, w, h, 26);
    ctx.strokeStyle = 'rgba(122,90,65,.5)'; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `800 24px system-ui, sans-serif`;
  ctx.fillStyle = dark ? LIGHT : '#d07a4a';
  ctx.fillText(label, x + w/2, y + 30);
  ctx.font = `800 88px system-ui, sans-serif`;
  ctx.fillStyle = dark ? '#fff' : INK;
  ctx.fillText(String(score), x + w/2, y + h - 34);
}

function vsBadge(ctx, cx, cy, options = {}){
  const r = options.r || 34;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = options.bg || GOLD; ctx.fill();
  ctx.strokeStyle = options.stroke || '#fff'; ctx.lineWidth = options.lineWidth || 5; ctx.stroke();
  ctx.fillStyle = options.color || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(r * 0.76)}px system-ui, sans-serif`;
  ctx.fillText('VS', cx, cy + 1);
}

function pfpCircle(ctx, av, cx, cy, r, ringColor, glowColor, bgFill){
  ctx.save();
  if(glowColor){
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 45;
  }
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = ringColor || CLAY; ctx.lineWidth = 12; ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
  ctx.fillStyle = bgFill || CREAM; ctx.fillRect(cx-r, cy-r, r*2, r*2);
  if(av){
    const s = r*1.92;
    ctx.drawImage(av, cx - s/2, cy - s/2 + 8, s, s);
  }else{
    ctx.fillStyle = FAINT; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font = `800 ${r}px system-ui, sans-serif`;
    ctx.fillText('?', cx, cy + 4);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(cx, cy, r-14, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

function footer(ctx, text, { x, y, cx, color }){
  ctx.font = `800 30px system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color || SOFT;
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, cx!=null ? (1920 - tw)/2 : x, y);
}

/**
 * Render one score card -> canvas (async: waits for the background, logo and
 * avatar images to decode).
 * @param variant  one of SCORECARD_VARIANTS
 * @param d        { winnerName, winnerAvatar, winnerScore, oppName|null, oppScore }
 */
export async function renderScorecard(variant, d){
  const { w, h } = variant;
  const safe = {
    winnerName: (d.winnerName || 'CHAMPION').slice(0, 14),
    winnerAvatar: d.winnerAvatar,
    winnerScore: d.winnerScore ?? 0,
    oppName: d.oppName ? String(d.oppName).slice(0, 14) : null,
    oppScore: d.oppScore ?? 0,
  };

  const isDark = variant.id === 'night' || variant.id === 'cobalt' || variant.id === 'cyber';
  const [bg, lg, lgW, av] = await Promise.all([
    loadImage(variant.bg),
    loadImage(logo),
    isDark ? loadImage(logoWhite) : Promise.resolve(null),
    loadImage(avatarUrl(safe.winnerAvatar)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  coverImage(ctx, bg, w, h);

  const oppLabel = safe.oppName==null ? '???' : safe.oppName;

  if(variant.id === 'banner'){
    // Preset B: diagonal banner
    header(ctx, lg, { x:96 });
    pill(ctx, 'CHAMPION', { x:104, y:224 });
    nameText(ctx, safe.winnerName, { x:100, y:322 }, 140, 1000);
    pfpCircle(ctx, av, 270, 640, 118);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = SOFT; ctx.font = `800 44px system-ui, sans-serif`;
    ctx.fillText('vs ' + oppLabel, 470, 668);
    ctx.fillStyle = FAINT; ctx.font = `800 30px system-ui, sans-serif`;
    ctx.fillText(safe.oppScore + ' pairs', 470, 714);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff'; ctx.font = `800 360px system-ui, sans-serif`;
    ctx.fillText(String(safe.winnerScore), 1560, 660);
    ctx.font = `800 44px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,240,220,.92)';
    ctx.fillText('SCORE', 1560, 742);
    footer(ctx, FOOT, { x:100, y:1008 });
  } else if(variant.id === 'night'){
    // Preset C: midnight dark mode
    header(ctx, lgW || lg, { x:96 }, '#ffffff');
    pill(ctx, 'CHAMPION', { x:104, y:230, top:'#f8bc54', color:'#cf6a31', strokeColor:'rgba(255,255,255,0.3)' });
    nameText(ctx, safe.winnerName, { x:100, y:336 }, 145, 950, '#fffdfa', 'rgba(248, 188, 84, 0.45)');

    // Glowing duel battle cards
    const tx1 = 100, ty1 = 540, tw1 = 360, th1 = 175;
    const gTile = ctx.createLinearGradient(tx1, ty1, tx1, ty1 + th1);
    gTile.addColorStop(0, 'rgba(233, 137, 91, 0.28)');
    gTile.addColorStop(1, 'rgba(207, 106, 49, 0.45)');
    roundRect(ctx, tx1, ty1, tw1, th1, 26);
    ctx.fillStyle = gTile; ctx.fill();
    ctx.strokeStyle = 'rgba(248, 188, 84, 0.75)'; ctx.lineWidth = 3.5; ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#ffcf99';
    ctx.fillText(safe.winnerName.slice(0,8).toUpperCase(), tx1 + tw1/2, ty1 + 42);
    ctx.font = `800 96px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), tx1 + tw1/2, ty1 + th1 - 32);

    const tx2 = 490, ty2 = 540, tw2 = 330, th2 = 175;
    roundRect(ctx, tx2, ty2, tw2, th2, 26);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'; ctx.fill();
    ctx.strokeStyle = 'rgba(168, 135, 106, 0.4)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#b89880';
    ctx.fillText(oppLabel.slice(0,8).toUpperCase(), tx2 + tw2/2, ty2 + 42);
    ctx.font = `800 96px system-ui, sans-serif`;
    ctx.fillStyle = '#d0b49f';
    ctx.fillText(String(safe.oppScore), tx2 + tw2/2, ty2 + th2 - 32);

    vsBadge(ctx, 475, ty1 + th1/2, { bg:'#e8b04b', stroke:'#fffdfa', color:'#301a0e', r:35, lineWidth:4 });

    ctx.textAlign = 'left'; ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = '#ffcf99';
    ctx.fillText('MATCH VICTOR   ·   ' + safe.winnerScore + ' PAIRS CONQUERED', 104, 780);

    pfpCircle(ctx, av, 1520, 545, 245, '#f8bc54', 'rgba(233, 137, 91, 0.65)');

    ctx.strokeStyle = 'rgba(248, 188, 84, 0.2)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, 940); ctx.lineTo(840, 940); ctx.stroke();

    footer(ctx, FOOT, { x:100, y:1008, color:'#d0b49f' });
  } else if(variant.id === 'ring'){
    // Preset D: solar stadium ring
    header(ctx, lg, { x:96 });
    pill(ctx, 'SOLAR DUEL', { x:104, y:224, top:'#ffa861', color:DEEP });
    nameText(ctx, safe.winnerName, { x:100, y:326 }, 135, 960);

    ctx.font = `800 34px system-ui, sans-serif`;
    ctx.fillStyle = SOFT;
    ctx.fillText('Crown Match   ·   Undefeated Memory Duel', 104, 510);

    // Podium cards
    const px1 = 100, py1 = 565, pw1 = 380, ph1 = 195;
    const gWin = ctx.createLinearGradient(px1, py1, px1, py1 + ph1);
    gWin.addColorStop(0, '#ff9c63'); gWin.addColorStop(1, '#cf6a31');
    roundRect(ctx, px1, py1, pw1, ph1, 30);
    ctx.fillStyle = gWin; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#ffe0c2';
    ctx.fillText('WINNER', px1 + 36, py1 + 48);
    ctx.font = `800 108px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), px1 + 36, py1 + ph1 - 36);
    ctx.font = `800 32px system-ui, sans-serif`;
    ctx.fillStyle = '#ffe0c2';
    ctx.fillText('PAIRS', px1 + 130, py1 + ph1 - 42);

    const px2 = 520, py2 = 595, pw2 = 320, ph2 = 165;
    roundRect(ctx, px2, py2, pw2, ph2, 26);
    ctx.fillStyle = '#fffdf9'; ctx.fill();
    ctx.strokeStyle = 'rgba(122,90,65,.35)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 22px system-ui, sans-serif`;
    ctx.fillStyle = '#9b7355';
    ctx.fillText('vs ' + oppLabel.slice(0,8).toUpperCase(), px2 + 32, py2 + 46);
    ctx.font = `800 84px system-ui, sans-serif`;
    ctx.fillStyle = INK;
    ctx.fillText(String(safe.oppScore), px2 + 32, py2 + ph2 - 32);
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = FAINT;
    ctx.fillText('PAIRS', px2 + 105, py2 + ph2 - 36);

    vsBadge(ctx, 505, 675, { r:34 });

    // Solar avatar framed inside background ring at (1510, 560)
    const cx = 1510, cy = 560, r = 265;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 24, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(233, 137, 91, 0.4)';
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 14]);
    ctx.stroke();
    ctx.setLineDash([]);

    pfpCircle(ctx, av, cx, cy, r, '#e9895b');

    // Ribbon under avatar
    const ribW = 340, ribH = 64, ribX = cx - ribW/2, ribY = cy + r - 36;
    const gRib = ctx.createLinearGradient(0, ribY, 0, ribY + ribH);
    gRib.addColorStop(0, '#e8b04b'); gRib.addColorStop(1, '#c88a22');
    roundRect(ctx, ribX, ribY, ribW, ribH, ribH/2);
    ctx.fillStyle = gRib; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillText('MATCH CHAMPION', cx, ribY + ribH/2 + 1);

    footer(ctx, FOOT, { x:100, y:1008 });
  } else if(variant.id === 'classic'){
    // Preset E: classic arena duel
    const cx = 420, cy = 520, r = 245;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(233, 137, 91, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    pfpCircle(ctx, av, cx, cy, r, CLAY);

    const bW = 320, bH = 58, bX = cx - bW/2, bY = cy + r - 32;
    const gB = ctx.createLinearGradient(0, bY, 0, bY + bH);
    gB.addColorStop(0, '#ffa463'); gB.addColorStop(1, DEEP);
    roundRect(ctx, bX, bY, bW, bH, bH/2);
    ctx.fillStyle = gB; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 26px system-ui, sans-serif`;
    ctx.fillText('MEMORY DUEL', cx, bY + bH/2 + 1);

    // Right battle board
    const rx = 800;
    header(ctx, lg, { x:rx });
    pill(ctx, 'GRAND CHAMPION', { x:rx + 4, y:224, top:'#ffa861', color:DEEP });
    nameText(ctx, safe.winnerName, { x:rx, y:326 }, 135, 960);

    const sx = rx, sy = 540, sw = 420, sh = 190;
    const gWin = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    gWin.addColorStop(0, '#ff9e66'); gWin.addColorStop(1, '#cf6a31');
    roundRect(ctx, sx, sy, sw, sh, 28);
    ctx.fillStyle = gWin; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#ffe0c2';
    ctx.fillText('VICTORY SCORE', sx + 36, sy + 48);
    ctx.font = `800 106px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), sx + 36, sy + sh - 34);
    ctx.font = `800 30px system-ui, sans-serif`;
    ctx.fillStyle = '#ffe0c2';
    ctx.fillText('PAIRS FOUND', sx + 130, sy + sh - 42);

    const ox = sx + sw + 40, oy = sy + 15, ow = 360, oh = 160;
    roundRect(ctx, ox, oy, ow, oh, 26);
    ctx.fillStyle = '#fffdf9'; ctx.fill();
    ctx.strokeStyle = 'rgba(122,90,65,.35)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#9b7355';
    ctx.fillText('vs ' + oppLabel.slice(0,8).toUpperCase(), ox + 32, oy + 46);
    ctx.font = `800 84px system-ui, sans-serif`;
    ctx.fillStyle = INK;
    ctx.fillText(String(safe.oppScore), ox + 32, oy + oh - 30);
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = FAINT;
    ctx.fillText('PAIRS', ox + 105, oy + oh - 34);

    vsBadge(ctx, sx + sw + 20, sy + sh/2, { r:34 });

    ctx.textAlign = 'left';
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = SOFT;
    ctx.fillText('Flawless memory duel on two phones', rx, 810);

    footer(ctx, FOOT, { x:rx, y:1008 });
  } else if(variant.id === 'cobalt'){
    // Preset F: dark cobalt & electric blue duel
    header(ctx, lgW || lg, { x:96 }, '#ffffff');
    pill(ctx, 'COBALT DUEL', { x:104, y:228, top:'#38bdf8', color:'#1d4ed8', strokeColor:'rgba(255,255,255,0.4)' });
    nameText(ctx, safe.winnerName, { x:100, y:336 }, 145, 950, '#f0f9ff', 'rgba(56, 189, 248, 0.55)');

    // Glowing duel battle cards
    const tx1 = 100, ty1 = 540, tw1 = 360, th1 = 175;
    const gTile = ctx.createLinearGradient(tx1, ty1, tx1, ty1 + th1);
    gTile.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
    gTile.addColorStop(1, 'rgba(29, 78, 216, 0.55)');
    roundRect(ctx, tx1, ty1, tw1, th1, 26);
    ctx.fillStyle = gTile; ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'; ctx.lineWidth = 3.5; ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(safe.winnerName.slice(0,8).toUpperCase(), tx1 + tw1/2, ty1 + 42);
    ctx.font = `800 96px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), tx1 + tw1/2, ty1 + th1 - 32);

    const tx2 = 490, ty2 = 540, tw2 = 330, th2 = 175;
    roundRect(ctx, tx2, ty2, tw2, th2, 26);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'; ctx.fill();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(oppLabel.slice(0,8).toUpperCase(), tx2 + tw2/2, ty2 + 42);
    ctx.font = `800 96px system-ui, sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(String(safe.oppScore), tx2 + tw2/2, ty2 + th2 - 32);

    vsBadge(ctx, 475, ty1 + th1/2, { bg:'#38bdf8', stroke:'#ffffff', color:'#0f172a', r:35, lineWidth:4 });

    ctx.textAlign = 'left'; ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('COBALT VICTOR   ·   ' + safe.winnerScore + ' PAIRS CONQUERED', 104, 780);

    pfpCircle(ctx, av, 1520, 545, 245, '#38bdf8', 'rgba(56, 189, 248, 0.7)', '#f0f9ff');

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, 940); ctx.lineTo(840, 940); ctx.stroke();

    footer(ctx, FOOT, { x:100, y:1008, color:'#93c5fd' });
  } else if(variant.id === 'cyber'){
    // Preset G: cyber arena dark blue & cyan
    header(ctx, lgW || lg, { x:96 }, '#ffffff');
    pill(ctx, 'CYBER DUEL', { x:104, y:224, top:'#06b6d4', color:'#2563eb', strokeColor:'rgba(255,255,255,0.5)' });
    nameText(ctx, safe.winnerName, { x:100, y:326 }, 135, 960, '#f0fdf4', 'rgba(6, 182, 212, 0.5)');

    ctx.font = `800 34px system-ui, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Crown Match   ·   Undefeated Cyber Duel', 104, 510);

    // Stadium podiums
    const px1 = 100, py1 = 565, pw1 = 380, ph1 = 195;
    const gWin = ctx.createLinearGradient(px1, py1, px1, py1 + ph1);
    gWin.addColorStop(0, '#0284c7'); gWin.addColorStop(1, '#1d4ed8');
    roundRect(ctx, px1, py1, pw1, ph1, 30);
    ctx.fillStyle = gWin; ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 24px system-ui, sans-serif`;
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('WINNER', px1 + 36, py1 + 48);
    ctx.font = `800 108px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), px1 + 36, py1 + ph1 - 36);
    ctx.font = `800 32px system-ui, sans-serif`;
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('PAIRS', px1 + 130, py1 + ph1 - 42);

    const px2 = 520, py2 = 595, pw2 = 320, ph2 = 165;
    roundRect(ctx, px2, py2, pw2, ph2, 26);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'; ctx.lineWidth = 3; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `800 22px system-ui, sans-serif`;
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('vs ' + oppLabel.slice(0,8).toUpperCase(), px2 + 32, py2 + 46);
    ctx.font = `800 84px system-ui, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(String(safe.oppScore), px2 + 32, py2 + ph2 - 32);
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PAIRS', px2 + 105, py2 + ph2 - 36);

    vsBadge(ctx, 505, 675, { r:34, bg:'#06b6d4', stroke:'#ffffff', color:'#042f2e' });

    // Cyber Avatar on right (aligned with cyber ring watermark at 1510, 560)
    const cx = 1510, cy = 560, r = 265;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 24, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    pfpCircle(ctx, av, cx, cy, r, '#2563eb', 'rgba(37, 99, 235, 0.6)', '#f0f9ff');

    // Ribbon under avatar
    const ribW = 340, ribH = 64, ribX = cx - ribW/2, ribY = cy + r - 36;
    const gRib = ctx.createLinearGradient(0, ribY, 0, ribY + ribH);
    gRib.addColorStop(0, '#06b6d4'); gRib.addColorStop(1, '#1e40af');
    roundRect(ctx, ribX, ribY, ribW, ribH, ribH/2);
    ctx.fillStyle = gRib; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 28px system-ui, sans-serif`;
    ctx.fillText('CYBER CHAMPION', cx, ribY + ribH/2 + 1);

    footer(ctx, FOOT, { x:100, y:1008, color:'#7dd3fc' });
  } else {
    // Preset A: hero
    header(ctx, lg, { x:96 });
    pill(ctx, 'CHAMPION', { x:104, y:236 });
    nameText(ctx, safe.winnerName, { x:100, y:340 }, 150, 980);
    tile(ctx, 100, 545, 340, 150, safe.winnerName.slice(0,8).toUpperCase(), safe.winnerScore, false);
    tile(ctx, 460, 545, 340, 150, oppLabel.slice(0,8).toUpperCase(), safe.oppScore, true);
    vsBadge(ctx, 450, 620);
    pfpCircle(ctx, av, 1520, 545, 250);
    footer(ctx, FOOT, { x:100, y:1008 });
  }

  return canvas;
}
