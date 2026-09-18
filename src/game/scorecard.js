/**
 * DILICARDS  -  winner score cards (shareable, winner-only)
 *
 * Four 16:9 backgrounds (Preset A to Preset D), each with its own
 * custom layout and aesthetic:
 *   • cobalt  (Preset A) -> esports cyber clash: angled laser slash,
 *                           top HUD broadcast bar, digital holographic score
 *                           tile + challenger report card
 *   • cyber   (Preset B) -> symmetrical cyber monolith: apex logo crest,
 *                           compass holo-portal, floating crown, centered
 *                           identity + twin digital score deck
 *   • ring    (Preset C) -> solar sunburst ring framing winner avatar +
 *                           stadium podium score cards
 *   • classic (Preset D) -> left avatar framed by classic wheel + grand
 *                           battle board on the right
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

import scCobalt  from '../assets/scorecards/sc-cobalt.jpg';
import scCyber   from '../assets/scorecards/sc-cyber.jpg';
import scRing    from '../assets/scorecards/sc-ring.jpg';
import scClassic from '../assets/scorecards/sc-classic.jpg';

export const SCORECARD_VARIANTS = [
  { id:'cobalt',  name:'Preset A', w:1920, h:1080, bg:scCobalt },
  { id:'cyber',   name:'Preset B', w:1920, h:1080, bg:scCyber },
  { id:'ring',    name:'Preset C', w:1920, h:1080, bg:scRing },
  { id:'classic', name:'Preset D', w:1920, h:1080, bg:scClassic },
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
  while(size > 26){
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

function drawCrown(ctx, cx, cy, w, h, color){
  ctx.save();
  ctx.fillStyle = color || '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(cx - w/2, cy + h/2);
  ctx.lineTo(cx - w/2, cy - h/4);
  ctx.lineTo(cx - w/4, cy);
  ctx.lineTo(cx, cy - h/2);
  ctx.lineTo(cx + w/4, cy);
  ctx.lineTo(cx + w/2, cy - h/4);
  ctx.lineTo(cx + w/2, cy + h/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  for(const jx of [cx - w/2, cx, cx + w/2]){
    ctx.beginPath();
    ctx.arc(jx, (jx===cx ? cy - h/2 - 4 : cy - h/4 - 4), 5, 0, Math.PI*2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
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

  const isDark = variant.id === 'cobalt' || variant.id === 'cyber';
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

  if(variant.id === 'ring'){
    // Preset C: solar stadium ring
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
    ctx.fillText(oppLabel.slice(0,8).toUpperCase(), px2 + 32, py2 + 46);
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
    // Preset D: classic arena duel
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
    ctx.fillText(oppLabel.slice(0,8).toUpperCase(), ox + 32, oy + 46);
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
    // Preset A: esports cyber clash (face-off)
    // 1. Top HUD broadcast bar
    roundRect(ctx, 80, 40, 1760, 68, 34);
    ctx.fillStyle = 'rgba(8, 16, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.drawImage(lgW || lg, 104, 52, 44, 44);
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DILICARDS DUEL', 162, 74);

    ctx.beginPath();
    ctx.arc(960 - 130, 74, 6, 0, Math.PI*2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE P2P DUEL REPORT', 960, 74);

    ctx.textAlign = 'right';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('OFFICIAL VICTORY SCREEN', 1800, 74);

    // 2. Background Stencil "VICTORY"
    ctx.save();
    ctx.font = '900 160px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('VICTORY', 80, 270);
    ctx.restore();

    // 3. Winner Zone (Left)
    const avX = 360, avY = 530, r = 195;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 4;
    for(let a = 0; a < 360; a += 90){
      const rad = a * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(avX, avY, r + 24, rad - 0.25, rad + 0.25);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 45;
    ctx.beginPath();
    ctx.arc(avX, avY, r, 0, Math.PI*2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, r, 0, Math.PI*2);
    ctx.clip();
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(avX - r, avY - r, r*2, r*2);
    const s = r * 1.95;
    ctx.drawImage(av, avX - s/2, avY - s/2 + 10, s, s);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avX, avY, r - 12, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    drawCrown(ctx, avX, avY - r - 30, 80, 48, '#fbbf24');

    const ribW = 320, ribH = 56, ribX = avX - ribW/2, ribY = avY + r - 28;
    const gRib = ctx.createLinearGradient(0, ribY, 0, ribY + ribH);
    gRib.addColorStop(0, '#00f0ff');
    gRib.addColorStop(1, '#1d4ed8');
    roundRect(ctx, ribX, ribY, ribW, ribH, ribH/2);
    ctx.fillStyle = gRib;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText('MATCH WINNER', avX, ribY + ribH/2 + 1);

    const wx = 620;
    ctx.font = '800 24px system-ui, sans-serif';
    const ctw = ctx.measureText('CHAMPION').width;
    roundRect(ctx, wx, 280, ctw + 56, 44, 22);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.fillText('CHAMPION', wx + (ctw + 56)/2, 302);

    const nameSize = fitSize(ctx, safe.winnerName, 115, 340);
    ctx.font = '900 ' + nameSize + 'px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(safe.winnerName, wx, 420);
    ctx.restore();

    const cardX = wx, cardY = 460, cardW = 330, cardH = 260;
    const gCard = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gCard.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    gCard.addColorStop(1, 'rgba(29, 78, 216, 0.55)');
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fillStyle = gCard;
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX + 16, cardY + 16, 12, 3);
    ctx.fillRect(cardX + 16, cardY + 16, 3, 12);
    ctx.fillRect(cardX + cardW - 28, cardY + 16, 12, 3);
    ctx.fillRect(cardX + cardW - 19, cardY + 16, 3, 12);

    ctx.textAlign = 'center';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('FINAL SCORE', cardX + cardW/2, cardY + 50);

    ctx.save();
    ctx.font = '900 145px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText(String(safe.winnerScore), cardX + cardW/2, cardY + cardH - 55);
    ctx.restore();

    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('PAIRS FOUND', cardX + cardW/2, cardY + cardH - 22);

    // 4. Center 3D Floating "VS" Diamond
    const vsX = 1010, vsY = 540;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.moveTo(vsX, vsY - 60);
    ctx.lineTo(vsX + 55, vsY);
    ctx.lineTo(vsX, vsY + 60);
    ctx.lineTo(vsX - 55, vsY);
    ctx.closePath();
    const gVs = ctx.createLinearGradient(vsX - 55, vsY - 60, vsX + 55, vsY + 60);
    gVs.addColorStop(0, '#00f0ff');
    gVs.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gVs;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#040d1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 32px system-ui, sans-serif';
    ctx.fillText('VS', vsX, vsY + 1);

    // 5. Right Zone: Challenger Panel
    const chX = 1140, chY = 320, chW = 700, chH = 430;
    roundRect(ctx, chX, chY, chW, chH, 32);
    ctx.fillStyle = 'rgba(10, 18, 36, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CHALLENGER BREAKDOWN', chX + 48, chY + 64);

    const oppSize = fitSize(ctx, oppLabel, 80, chW - 96);
    ctx.font = '900 ' + oppSize + 'px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(oppLabel, chX + 48, chY + 160);

    roundRect(ctx, chX + 48, chY + 210, 320, 160, 22);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('PAIRS MATCHED', chX + 76, chY + 252);

    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(String(safe.oppScore), chX + 76, chY + 342);

    const defX = chX + 410, defY = chY + 250, defW = 240, defH = 75;
    roundRect(ctx, defX, defY, defW, defH, 20);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText('DEFEATED', defX + defW/2, defY + defH/2 + 1);

    // 6. Bottom Telemetry Bar
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 940);
    ctx.lineTo(1840, 940);
    ctx.stroke();

    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('◈ DILICARDS DUEL   ·   dilicard.badhon.online   ·   @BadhonAI', 80, 1008);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('MEMORY MATCH PROTOCOL v1.0', 1840, 1008);
  } else {
    // Preset B (cyber): reimagined symmetrical cyber monolith (centered holo-portal)
    const cx = 960;

    // 1. Apex Brand Crest
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 35;
    ctx.drawImage(lgW || lg, cx - 42, 60, 84, 84);
    ctx.restore();

    ctx.font = '900 48px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DILICARDS', cx, 180);

    // 2. The Centerpiece Holo-Portal (Avatar)
    const avY = 440, r = 195;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 3;
    for(let deg = 0; deg < 360; deg += 30){
      const rad = deg * Math.PI / 180;
      const x1 = cx + (r + 20) * Math.cos(rad);
      const y1 = avY + (r + 20) * Math.sin(rad);
      const x2 = cx + (r + (deg % 90 === 0 ? 42 : 30)) * Math.cos(rad);
      const y2 = avY + (r + (deg % 90 === 0 ? 42 : 30)) * Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, avY, r + 15, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(cx, avY, r, 0, Math.PI*2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, avY, r, 0, Math.PI*2);
    ctx.clip();
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(cx - r, avY - r, r*2, r*2);
    const s = r * 1.95;
    ctx.drawImage(av, cx - s/2, avY - s/2 + 10, s, s);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, avY, r - 14, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    drawCrown(ctx, cx, avY - r - 32, 90, 52, '#fbbf24');

    // 3. Winner Identity directly under the portal
    const nameSize = fitSize(ctx, safe.winnerName, 100, 1000);
    ctx.font = '900 ' + nameSize + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 240, 255, 0.75)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(safe.winnerName, cx, 705);
    ctx.restore();

    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('UNDISPUTED MEMORY DUEL CHAMPION', cx, 750);

    // 4. Symmetrical Dual Score Matrix (Bottom)
    const tW = 390, tH = 155;
    const wX = cx - tW - 40, tY = 790;
    const gWin = ctx.createLinearGradient(wX, tY, wX, tY + tH);
    gWin.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
    gWin.addColorStop(1, 'rgba(29, 78, 216, 0.6)');
    roundRect(ctx, wX, tY, tW, tH, 26);
    ctx.fillStyle = gWin;
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('★ WINNER SCORE', wX + 36, tY + 44);

    ctx.font = '900 92px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(safe.winnerScore), wX + 36, tY + tH - 32);

    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('PAIRS FOUND', wX + 130, tY + tH - 38);

    const oX = cx + 40;
    roundRect(ctx, oX, tY, tW, tH, 26);
    ctx.fillStyle = 'rgba(10, 18, 36, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(oppLabel.toUpperCase(), oX + 36, tY + 44);

    ctx.font = '900 92px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(String(safe.oppScore), oX + 36, tY + tH - 32);

    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('PAIRS FOUND', oX + 130, tY + tH - 38);

    const vsDiaY = tY + tH/2;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(cx, vsDiaY - 40);
    ctx.lineTo(cx + 36, vsDiaY);
    ctx.lineTo(cx, vsDiaY + 40);
    ctx.lineTo(cx - 36, vsDiaY);
    ctx.closePath();
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#020617';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.fillText('VS', cx, vsDiaY + 1);

    // 5. Centered Footer
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('◈ dilicard.badhon.online   ·   @BadhonAI ◈', cx, 1025);
  }

  return canvas;
}
