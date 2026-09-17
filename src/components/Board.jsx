import { useRef, useState, useEffect, useMemo } from 'react';
import { computeLayout } from '../game/layout.js';
import logo from '../assets/logo.gif';

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
      setLay(computeLayout(r.width, r.height, n));
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
  }, [deckKey, n]);

  return (
    <div className="board-wrap" ref={wrapRef}>
      <div className="board" ref={boardRef}>
        {S.cards.map((c,i)=>{
          const p = lay?.pos?.[i];
          return (
            <div
              key={c.id}
              className={`card${c.state!=='down' ? ' flipped' : ''}${c.state==='matched' ? ' matched' : ''}`}
              style={p ? {
                width: lay.d,
                transform: `translate(${(p.x - lay.d/2).toFixed(1)}px, ${(p.y - lay.d/2).toFixed(1)}px) rotate(${rots[i]}deg)`,
              } : undefined}
              onClick={()=>onCardTap(c.id)}
            >
              <div className="card-inner">
                <div className="face face--back"><img className="back-mark" src={logo} alt=""/></div>
                <div className={`face face--front art-${c.art}`}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
