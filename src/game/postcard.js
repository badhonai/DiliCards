/**
 * ─────────────────────────────────────────────────────────────
 *  DILICARDS — victory postcards
 *
 *  After a win, the winner's phone generates shareable 1080×1350
 *  cards (4:5 — perfect for Twitter/X posts) with their name,
 *  the final score, a Dili sticker and your links.
 *  Three style variants; download or share straight to X.
 * ─────────────────────────────────────────────────────────────
 */
import { CFG } from '../config.js';
import diliHands from '../assets/dili-handsup.png';
import diliFunny from '../assets/dili-funny.png';

export const POSTCARD_W = 1080;
export const POSTCARD_H = 1350;

export const VARIANTS = [
  {
    id: 'sunset', label: 'Sunset',
    bgTop: '#fff3e2', bgBot: '#ffd9c0',
    blobA: 'rgba(255,178,130,0.5)', blobB: 'rgba(196,178,242,0.5)',
    ink: '#46345a', sub: 'rgba(70,52,90,0.55)',
    accent: '#f0835a', accentInk: '#fff8f2',
    circle: 'rgba(255,255,255,0.75)', chip: '#fff6ec',
  },
  {
    id: 'night', label: 'Night',
    bgTop: '#251b42', bgBot: '#120d22',
    blobA: 'rgba(120,96,220,0.35)', blobB: 'rgba(64,150,190,0.3)',
    ink: '#f4efff', sub: 'rgba(244,239,255,0.55)',
    accent: '#8b78e6', accentInk: '#fff',
    circle: 'rgba(255,255,255,0.12)', chip: 'rgba(255,255,255,0.1)',
  },
  {
    id: 'mint', label: 'Mint',
    bgTop: '#eefaf1', bgBot: '#cfeadd',
    blobA: 'rgba(126,214,168,0.45)', blobB: 'rgba(196,178,242,0.45)',
    ink: '#2f4a3c', sub: 'rgba(47,74,60,0.55)',
    accent: '#3fa077', accentInk: '#fff',
    circle: 'rgba(255,255,255,0.75)', chip: '#f2fcf6',
  },
];

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

/** Fit text into maxWidth, shrinking from startSize. */
function fitFont(ctx, text, family, weight, startSize, maxWidth){
  let size=startSize;
  while(size>28){
    ctx.font=`${weight} ${size}px ${family}`;
    if(ctx.measureText(text).width<=maxWidth) break;
    size-=4;
  }
  return size;
}

/**
 * Geometry of the winner-name line (avatar circle + fitted name),
 * shared by the text pass (renderPostcard) and the avatar pass
 * (postcardToCanvas draws the image on top).
 */
function nameGeometry(ctx, disp, hasAv){
  const W=POSTCARD_W, H=POSTCARD_H, cx=W/2;
  const av = hasAv ? 120 : 0;
  const gap = hasAv ? 28 : 0;
  const ns = fitFont(ctx, disp, FONT, '900', 118, W-160 - (av?av+gap:0));
  ctx.font=`900 ${ns}px ${FONT}`;
  const nameW=ctx.measureText(disp).width;
  const startX=cx-(av+gap+nameW)/2;
  return {
    disp, ns, av, gap, startX,
    nameX: startX+av+gap,
    baseY: H*0.775,
    avCx: startX+av/2,
    avCy: H*0.775 - ns*0.34,
  };
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Draw a postcard onto `canvas`. */
export function renderPostcard(canvas, opts){
  const { names, scores, isTie, variant, winnerName } = opts;
  const W=POSTCARD_W, H=POSTCARD_H;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const v=variant;

  // ── background
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, v.bgTop); g.addColorStop(1, v.bgBot);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  ctx.fillStyle=v.blobA;
  ctx.beginPath(); ctx.arc(W*0.08, H*0.16, 300, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=v.blobB;
  ctx.beginPath(); ctx.arc(W*0.94, H*0.30, 340, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=v.blobA;
  ctx.beginPath(); ctx.arc(W*0.5, H*1.04, 460, 0, Math.PI*2); ctx.fill();

  // ── title
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillStyle=v.ink;
  ctx.font=`900 84px ${FONT}`;
  ctx.fillText('🎴 DILICARDS', W/2, 150);
  ctx.fillStyle=v.sub;
  ctx.font=`800 34px ${FONT}`;
  ctx.fillText('2 - P H O N E   M E M O R Y   D U E L', W/2, 205);

  // ── sticker circle
  const cx=W/2, cy=H*0.40, R=280;
  ctx.fillStyle=v.circle;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

  // ── sticker (drawn async by caller? no — we pre-load images before calling)
  // (artUrl is drawn via the Image cache in postcardToCanvas)

  // ── banner
  const banner=isTie ? "IT'S A TIE!" : '🏆 WINNER!';
  ctx.font=`900 84px ${FONT}`;
  const bw=ctx.measureText(banner).width+170, bh=136;
  const bx=cx-bw/2, by=H*0.615;
  ctx.fillStyle=v.accent;
  roundRect(ctx, bx, by, bw, bh, bh/2); ctx.fill();
  ctx.fillStyle=v.accentInk;
  ctx.fillText(banner, cx, by+bh/2+30);

  // ── winner name (avatar circle is drawn on top by postcardToCanvas)
  const disp=(isTie ? 'Tied Game' : (winnerName || 'Winner')).slice(0,20);
  const ng=nameGeometry(ctx, disp, !!opts.avatarUrl);
  ctx.fillStyle=v.ink;
  ctx.font=`900 ${ng.ns}px ${FONT}`;
  ctx.textAlign='left';
  ctx.fillText(disp, ng.nameX, ng.baseY);
  ctx.textAlign='center';

  // ── score line
  ctx.font=`900 104px ${FONT}`;
  const sTxt=`${scores[1]} : ${scores[2]}`;
  ctx.fillText(sTxt, cx, H*0.865);
  ctx.font=`800 42px ${FONT}`;
  ctx.fillStyle=v.sub;
  const n1=(names?.[1]||'Player 1').slice(0,14), n2=(names?.[2]||'Player 2').slice(0,14);
  ctx.fillText(`${n1}   vs   ${n2}`, cx, H*0.915);

  // ── footer
  ctx.font=`700 40px ${FONT}`;
  ctx.fillStyle=v.sub;
  ctx.fillText('Played live on two phones ⚡  ·  #DiliCards', cx, H*0.962);
  ctx.font=`800 40px ${FONT}`;
  ctx.fillStyle=v.ink;
  ctx.fillText(`${CFG.SITE.replace('https://','')}  ·  ${CFG.TWITTER_HANDLE} on X`, cx, H*0.998-14);
}

/**
 * Load sticker images, then draw. Returns the canvas.
 * Pre-loads once per session.
 */
const imgCache={};
function loadImage(src){
  if(imgCache[src]) return imgCache[src];
  imgCache[src]=new Promise((res,rej)=>{
    const im=new Image();
    im.onload=()=>res(im);
    im.onerror=rej;
    im.src=src;
  });
  return imgCache[src];
}

export async function postcardToCanvas(opts){
  const artUrl = opts.isTie ? diliFunny : diliHands;
  const [img, avImg] = await Promise.all([
    loadImage(artUrl),
    opts.avatarUrl ? loadImage(opts.avatarUrl) : Promise.resolve(null),
  ]);
  const canvas=document.createElement('canvas');
  renderPostcard(canvas, opts);
  const ctx=canvas.getContext('2d');

  // big sticker on top (after base render so it sits over the circle)
  const cx=POSTCARD_W/2, cy=POSTCARD_H*0.40;
  const s=430;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.30)';
  ctx.shadowBlur=40; ctx.shadowOffsetY=18;
  ctx.drawImage(img, cx-s/2, cy-s/2, s, s);
  ctx.restore();

  // winner's avatar circle, left of their name
  if(avImg && opts.avatarUrl){
    const disp=(opts.isTie ? 'Tied Game' : (opts.winnerName||'Winner')).slice(0,20);
    const ng=nameGeometry(ctx, disp, true);
    const r=ng.av/2;
    ctx.save();
    ctx.beginPath(); ctx.arc(ng.avCx, ng.avCy, r, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(avImg, ng.avCx-r*1.12, ng.avCy-r*1.12, r*2.24, r*2.24);
    ctx.restore();
    ctx.lineWidth=8;
    ctx.strokeStyle='rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(ng.avCx, ng.avCy, r+5, 0, Math.PI*2); ctx.stroke();
  }
  return canvas;
}

export async function postcardDataURL(opts, scale=0.36){
  const full=await postcardToCanvas(opts);
  const c=document.createElement('canvas');
  c.width=Math.round(POSTCARD_W*scale);
  c.height=Math.round(POSTCARD_H*scale);
  c.getContext('2d').drawImage(full, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

export async function postcardBlob(opts){
  const canvas=await postcardToCanvas(opts);
  return new Promise(res=>canvas.toBlob(res, 'image/png'));
}

export function postcardFileName(winnerName, isTie){
  const safe=String(winnerName||'winner').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,18)||'winner';
  return `dilicards-${isTie?'tie':safe}-winner.png`;
}
