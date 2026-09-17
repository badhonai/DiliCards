/**
 * DILICARDS  -  winner score cards (shareable, winner-only)
 *
 * Two 16:9 backgrounds (approved by the owner: "Hero" and "Banner"),
 * each with its own layout. The canvas composes, per variant:
 *   • hero   → text + score tiles on the left, big pfp circle on the right
 *   • banner → text on the left, giant winner score across a diagonal band
 *
 * Both carry: logo + wordmark, CHAMPION pill, winner name + score,
 * opponent name + score (masked as "???" when the winner hides it), and
 * a footer with the site url + @BadhonAI.
 *
 * The card image footer uses the MAIN site (dilicard.badhon.online).
 * The tweet caption uses the short link (dilicard.vercel.app → redirects).
 */
import logo from '../assets/logo.png';
import { avatarUrl } from './avatar.js';

import scHero   from '../assets/scorecards/sc-hero.jpg';
import scBanner from '../assets/scorecards/sc-banner.jpg';

export const SCORECARD_VARIANTS = [
  { id:'hero',   name:'Preset A', w:1920, h:1080, bg:scHero },
  { id:'banner', name:'Preset B', w:1920, h:1080, bg:scBanner },
];

/** Default tweet caption (short link that redirects to the main site). */
export function tweetText(score){
  return `I just won a DiliCards memory duel, ${score} pairs found! Can you beat me? Challenge me live on two phones at https://dilicard.vercel.app`;
}

const INK   = '#4a2f1d';
const SOFT  = '#7a5a41';
const FAINT = '#a8876a';
const CLAY  = '#e9895b';
const DEEP  = '#cf6a31';
const LIGHT = '#ffb877';
const GOLD  = '#e8b04b';
const CREAM = '#fff7ec';
const WIN_TILE = '#fffbf4';
const FOOT = 'dilicard.badhon.online   ·   @BadhonAI';

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

function header(ctx, lg, { x, cx }){
  const logoSize = 84;
  ctx.font = `800 68px system-ui, sans-serif`;
  const tw = ctx.measureText('DiliCards').width;
  const total = logoSize + 18 + tw;
  const hx = cx!=null ? (1920 - total)/2 : x;
  const hy = (cx!=null ? 30 : 28);
  ctx.drawImage(lg, hx, 70 + hy - 28, logoSize, logoSize);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText('DiliCards', hx + logoSize + 18, 70 + hy + logoSize/2 - 24);
}

function pill(ctx, text, { x, y, cx, color, top }){
  ctx.font = `800 30px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + 84, h = 56;
  const px = cx!=null ? (1920 - w)/2 : x;
  const g = ctx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, top || CLAY); g.addColorStop(1, color || DEEP);
  roundRect(ctx, px, y, w, h, h/2);
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, px + w/2, y + h/2 + 1);
}

function nameText(ctx, name, { x, y, cx }, start, maxW, color){
  const size = fitSize(ctx, name, start, maxW);
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color || INK;
  ctx.fillText(name, cx!=null ? (1920 - ctx.measureText(name).width)/2 : x, y + size);
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

function vsBadge(ctx, cx, cy){
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI*2);
  ctx.fillStyle = GOLD; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 26px system-ui, sans-serif`;
  ctx.fillText('VS', cx, cy + 1);
}

function pfpCircle(ctx, av, cx, cy, r, ringColor){
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
  ctx.fillStyle = CREAM; ctx.fillRect(cx-r, cy-r, r*2, r*2);
  if(av){
    const s = r*1.9;
    ctx.drawImage(av, cx - s/2, cy - s/2 + 8, s, s);
  }else{
    ctx.fillStyle = FAINT; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font = `800 ${r}px system-ui, sans-serif`;
    ctx.fillText('?', cx, cy + 4);
  }
  ctx.strokeStyle = ringColor || CLAY; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, r-13, 0, Math.PI*2); ctx.stroke();
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
 * Render one score card → canvas (async: waits for the background, logo and
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

  const [bg, lg, av] = await Promise.all([
    loadImage(variant.bg),
    loadImage(logo),
    loadImage(avatarUrl(safe.winnerAvatar)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  coverImage(ctx, bg, w, h);

  const oppLabel = safe.oppName==null ? '???' : safe.oppName;

  if(variant.id === 'banner'){
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
  } else {
    // hero
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
