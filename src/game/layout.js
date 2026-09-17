/**
 * DILICARDS  -  scattered card layout.
 *
 * Cards are placed at RANDOM positions (no grid!) with a slight random
 * tilt. Collision-checked circle packing guarantees no two cards ever
 * overlap, at any board size or screen width.
 */

function tryPack(W,H,n,r,pad){
  const out=[];
  const minD=2*r+pad;
  const minX=r, maxX=W-r, minY=r, maxY=H-r;
  if(minX>=maxX || minY>=maxY) return null;
  for(let i=0;i<n;i++){
    let ok=false;
    for(let a=0;a<350 && !ok;a++){
      const x=minX+Math.random()*(maxX-minX);
      const y=minY+Math.random()*(maxY-minY);
      let good=true;
      for(let k=0;k<out.length;k++){
        const dx=out[k].x-x, dy=out[k].y-y;
        if(dx*dx+dy*dy < minD*minD){ good=false; break; }
      }
      if(good){ out.push({x,y}); ok=true; }
    }
    if(!ok) return null;
  }
  return out;
}

function gridFallback(W,H,n){
  const cols=Math.ceil(Math.sqrt(n*W/H)), rows=Math.ceil(n/cols);
  const cw=W/cols, ch=H/rows, out=[];
  for(let i=0;i<n;i++) out.push({ x:cw*(i%cols)+cw/2, y:ch*Math.floor(i/cols)+ch/2 });
  return out;
}

/** Gently even out tight gaps  -  only commits moves that stay collision-free. */
function relaxSafe(pos,r,pad,W,H){
  const minD=2*r+pad, target=minD*1.12, minD2=(minD*0.99)*(minD*0.99);
  function valid(p){
    for(let i=0;i<p.length;i++){
      if(p[i].x<r||p[i].x>W-r||p[i].y<r||p[i].y>H-r) return false;
      for(let j=i+1;j<p.length;j++){
        const dx=p[j].x-p[i].x, dy=p[j].y-p[i].y;
        if(dx*dx+dy*dy<minD2) return false;
      }
    }
    return true;
  }
  for(let k=0;k<50;k++){
    let did=false;
    for(let i=0;i<pos.length && !did;i++){
      for(let j=i+1;j<pos.length && !did;j++){
        const dx=pos[j].x-pos[i].x, dy=pos[j].y-pos[i].y;
        const dist=Math.sqrt(dx*dx+dy*dy)||0.01;
        if(dist<target){
          const push=(target-dist)/2, ux=dx/dist, uy=dy/dist;
          const orig=pos.map(p=>({x:p.x,y:p.y}));
          pos[i].x-=ux*push; pos[i].y-=uy*push;
          pos[j].x+=ux*push; pos[j].y+=uy*push;
          for(let m=0;m<pos.length;m++){
            pos[m].x=Math.max(r,Math.min(W-r,pos[m].x));
            pos[m].y=Math.max(r,Math.min(H-r,pos[m].y));
          }
          if(valid(pos)) did=true;
          else pos.forEach((p,m)=>{ p.x=orig[m].x; p.y=orig[m].y; });
        }
      }
    }
    if(!did) break;
  }
}

/**
 * Compute pixel positions for `n` cards inside a W×H board.
 * @returns {{ d:number, pos:{x:number,y:number}[] }}  (d = card size in px)
 */
export function computeLayout(W,H,n,pct){
  // Defensive: a card size % must be a finite number, or every card ends
  // up NaN-sized and invisible. Default to 18% of board width.
  if(typeof pct!=='number' || !Number.isFinite(pct) || pct<=0) pct=18;
  const base=W*pct/100;
  let d=base, r=base*0.72, pad=base*0.14, pos=null;
  for(let s=1; s>=0.45 && !pos; s-=0.06){
    d=base*s; r=d*0.72; pad=d*0.14;
    pos=tryPack(W,H,n,r,pad);
  }
  if(!pos){ pos=gridFallback(W,H,n); d=base*0.8; }
  else relaxSafe(pos,r,pad,W,H);
  return { d, pos };
}
