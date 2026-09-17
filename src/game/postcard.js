/**
 * DILICARDS — winner postcards (pending design approval)
 *
 * Six AI-generated backgrounds (3 square 1:1 + 3 wide 16:9, no text
 * baked in). The canvas composes, per variant:
 *   • the user's logo (top corner)
 *   • the winner's Dili sticker
 *   • "CHAMPION" + the winner's name + score
 *   • DiliCards + site footer
 *
 * 1:1  → text centered in the clean middle, sticker bottom-center
 * 16:9 → text block on the left, sticker in the clean right third
 */
import logo from '../assets/logo.png';
import { avatarUrl } from './avatar.js';

import pc11Sunset from '../assets/postcards/pc-1-1-sunset.jpg';
import pc11Night  from '../assets/postcards/pc-1-1-night.jpg';
import pc11Mint   from '../assets/postcards/pc-1-1-mint.jpg';
import pc169Sunset from '../assets/postcards/pc-16-9-sunset.jpg';
import pc169Night  from '../assets/postcards/pc-16-9-night.jpg';
import pc169Clay   from '../assets/postcards/pc-16-9-clay.jpg';

export const POSTCARD_VARIANTS = [
  { id:'sunset',  w:1080, h:1080, bg:pc11Sunset,  ink:'#3a2314', ink2:'#6b4325', accent:'#ff9a5c', layout:'center' },
  { id:'night',   w:1080, h:1080, bg:pc11Night,   ink:'#f3ecff', ink2:'#b9a8d8', accent:'#8f7bff', layout:'center' },
  { id:'mint',    w:1080, h:1080, bg:pc11Mint,    ink:'#1e3a31', ink2:'#4a7a68', accent:'#2fbf8f', layout:'center' },
  { id:'sunset16', w:1920, h:1080, bg:pc169Sunset, ink:'#3a2314', ink2:'#6b4325', accent:'#ff9a5c', layout:'side' },
  { id:'night16',  w:1920, h:1080, bg:pc169Night,  ink:'#f3ecff', ink2:'#b9a8d8', accent:'#8f7bff', layout:'side' },
  { id:'clay16',   w:1920, h:1080, bg:pc169Clay,   ink:'#33241a', ink2:'#6b5138', accent:'#d96f3f', layout:'side' },
];

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

function fitDrawImage(ctx, img, x, y, maxW, maxH){
  const ar = img.width/img.height;
  let w = maxW, h = w/ar;
  if(h > maxH){ h = maxH; w = h*ar; }
  ctx.drawImage(img, x + (maxW-w)/2, y + (maxH-h)/2, w, h);
}

function drawWord(ctx, text, cx, y, charGap, font, fill){
  ctx.font = font;
  ctx.textAlign = 'left';
  const widths=[...text].map(ch=>ctx.measureText(ch).width);
  const total = widths.reduce((a,b)=>a+b,0) + charGap*(text.length-1);
  let x = cx - total/2;
  const prevAlign = ctx.textAlign;
  [...text].forEach((ch,i)=>{
    ctx.fillText(ch, x, y);
    x += widths[i] + charGap;
  });
  ctx.textAlign = prevAlign;
}

/**
 * Render one postcard → canvas.
 * @param variant  one of POSTCARD_VARIANTS
 * @param {object} d  { name, avatar (index|null), score, pairs }
 */
export function renderPostcard(variant, d){
  const { w, h, ink, ink2, accent, layout } = variant;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // 1) background (cover)
  const img = new Image();
  img.src = variant.bg;
  if(!img.complete) throw new Error('bg not ready');
  const ar = img.width/img.height;
  const car = w/h;
  let dw, dh;
  if(ar > car){ dh = h; dw = h*ar; } else { dw = w; dh = w/ar; }
  ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);

  // subtle vignette to seat the text
  const vg = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.35, w/2, h/2, Math.max(w,h)*0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  const S = w/1080;                     // scale unit
  const center = layout==='center';

  // 2) logo top-center (or top-left on wide)
  const logoSize = 110*S;
  const logoImg = new Image();
  logoImg.src = logo;
  if(!logoImg.complete) throw new Error('logo not ready');
  if(center){
    ctx.drawImage(logoImg, w/2 - logoSize/2, 48*S, logoSize, logoSize);
  } else {
    ctx.drawImage(logoImg, 64*S, 48*S, logoSize, logoSize);
  }

  // 3) avatar sticker
  const avSize = center ? 300*S : 380*S;
  const avY = center ? h - avSize - 90*S : h/2 - avSize/2;
  const avX = center ? w/2 - avSize/2 : w - avSize - 100*S;
  const avImg = avatarUrl(d.avatar);
  if(avImg){
    const av = new Image();
    av.src = avImg;
    if(!av.complete) throw new Error('avatar not ready');
    // soft glow behind the sticker
    const glow = ctx.createRadialGradient(avX+avSize/2, avY+avSize/2, avSize*0.2,
                                          avX+avSize/2, avY+avSize/2, avSize*0.75);
    glow.addColorStop(0, 'rgba(255,255,255,0.35)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(avX-avSize, avY-avSize, avSize*3, avSize*3);
    ctx.drawImage(av, avX, avY, avSize, avSize);
  }

  // 4) text block
  const name = (d.name||'CHAMPION').slice(0, 14).toUpperCase();
  if(center){
    const topY = 48*S + logoSize + 120*S;
    // "CHAMPION"
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.font = `700 ${44*S}px system-ui, sans-serif`;
    drawWord(ctx, 'CHAMPION', w/2, topY, 14*S, `700 ${44*S}px system-ui, sans-serif`, accent);
    // name
    ctx.fillStyle = ink;
    let nameSize = 130*S;
    ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
    while(ctx.measureText(name).width > w - 160*S && nameSize > 56*S) nameSize -= 6*S;
    ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
    ctx.fillText(name, w/2, topY + nameSize*0.95);
    // score
    ctx.fillStyle = ink2;
    ctx.font = `600 ${46*S}px system-ui, sans-serif`;
    ctx.fillText(`${d.score} / ${d.pairs} pairs`, w/2, topY + nameSize*0.95 + 76*S);
  } else {
    const leftX = 120*S;
    const topY = h/2 - 150*S;
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.font = `700 ${48*S}px system-ui, sans-serif`;
    ctx.fillText('CHAMPION', leftX, topY);
    // name
    ctx.fillStyle = ink;
    let nameSize = 170*S;
    ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
    while(ctx.measureText(name).width > w - 1000 && nameSize > 70*S) nameSize -= 8*S;
    ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
    ctx.fillText(name, leftX, topY + nameSize);
    // score
    ctx.fillStyle = ink2;
    ctx.font = `600 ${52*S}px system-ui, sans-serif`;
    ctx.fillText(`${d.score} / ${d.pairs} pairs`, leftX, topY + nameSize + 84*S);
  }

  // 5) footer
  ctx.fillStyle = ink2;
  ctx.font = `600 ${30*S}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  const foot = 'DILICARDS  ·  dilicard.badhon.online  ·  @BadhonAI';
  ctx.fillText(foot, w/2, h - 44*S);

  return canvas;
}
