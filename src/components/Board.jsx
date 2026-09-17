import { useRef, useState, useEffect, useMemo } from 'react';
import { computeLayout } from '../game/layout.js';
import { CFG } from '../config.js';
import logoMark from '../assets/logo-white.png';

/**
 * The scattered card board.
 * Mobile-first: the board fills whatever vertical space is left under
 * the HUD (never scrolls the page), and re-packs on resize / rotation /
 * mobile browser-bar changes. Cards sit at random positions (no grid)
 * and the packing guarantees they never overlap.
 */
export default function Board({ S, onCardTap }){
  const wrapRef = useRef(null);
  const boardRef = useRef(null);
  const [lay, setLay] = useState(null);
  const deckKey = S.deck.join(',');
  const n = S.cards.length;

  // Card size (as % of board width) for this board size — see CFG.LAYOUT.
  // Fall back to the first board size rather than ever laying out a NaN board.
  const pct = (CFG.LAYOUT[S.pairs] || CFG.LAYOUT[CFG.BOARD_SIZES[0].pairs] || { pct: 18 }).pct;

  // stable random tilt per card, per board
  const rots = useMemo(
    ()=>S.cards.map(()=>(Math.random()*8 - 4).toFixed(1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deckKey]
  );

  useEffect(()=>{
    const boardEl = boardRef.current;
    if(!boardEl) return;
    let cancelled = false;
    let debounce = null;
    let retry = null;

    const doPack = ()=>{
      const r = boardEl.getBoundingClientRect();
      if(!r.width || !r.height) return false;
      if(cancelled) return false;
      setLay(computeLayout(r.width, r.height, n, pct));
      return true;
    };
    const schedule = (ms=180)=>{
      clearTimeout(debounce);
      debounce = setTimeout(doPack, ms);
    };
    const onVp = ()=>{ if(window.visualViewport) schedule(120); };

    // double-rAF: first paint has committed layout (board may be hidden
    // by a screen transition on the very first frame)
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!doPack()) retry = setTimeout(doPack, 250);
    }));

    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', ()=>schedule(300));
    if(window.visualViewport) window.visualViewport.addEventListener('resize', onVp);
    return ()=>{
      cancelled = true;
      clearTimeout(debounce); clearTimeout(retry);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      if(window.visualViewport) window.visualViewport.removeEventListener('resize', onVp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey, n, pct]);

  return (
    <div className="board-wrap" ref={wrapRef}>
      <div className="board" ref={boardRef}>
        {S.cards.map((c,i)=>{
          const p = lay?.pos?.[i];
          const style = p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(lay.d) && lay.d > 0
            ? {
                width: lay.d,
                transform: `translate(${(p.x - lay.d/2).toFixed(1)}px, ${(p.y - lay.d/2).toFixed(1)}px) rotate(${rots[i]}deg)`,
              }
            : undefined;
          return (
            <div
              key={c.id}
              className={`card${c.state!=='down' ? ' flipped' : ''}${c.state==='matched' ? ' matched' : ''}`}
              style={style}
              onClick={()=>onCardTap(c.id)}
            >
              <div className="card-inner">
                <div className="face face--back"><img className="back-mark" src={logoMark} alt=""/></div>
                <div className={`face face--front${c.art!=null ? ` art-${c.art}` : ''}`}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
