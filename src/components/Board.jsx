import { useRef, useState, useEffect, useMemo } from 'react';
import { CFG } from '../config.js';
import { computeLayout } from '../game/layout.js';

/**
 * The scattered card board.
 * Cards sit at random positions (computed once per board) — no grid,
 * and the packing guarantees they never overlap.
 */
export default function Board({ S, onCardTap }){
  const ref = useRef(null);
  const [lay, setLay] = useState(null);
  const deckKey = S.deck.join(',');

  // stable random tilt per card, per board
  const rots = useMemo(
    ()=>S.cards.map(()=>(Math.random()*8 - 4).toFixed(1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deckKey]
  );

  useEffect(()=>{
    const el = ref.current;
    if(!el) return;
    const doPack = ()=>{
      const r = el.getBoundingClientRect();
      if(!r.width || !r.height) return;
      const L = CFG.LAYOUT[S.pairs] || CFG.LAYOUT[8];
      setLay(computeLayout(r.width, r.height, S.cards.length, L.pct));
    };
    doPack();
    let t;
    const onR = ()=>{ clearTimeout(t); t = setTimeout(doPack, 250); };
    window.addEventListener('resize', onR);
    return ()=>{ window.removeEventListener('resize', onR); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const H = (CFG.LAYOUT[S.pairs] || CFG.LAYOUT[8]).H;

  return (
    <div className="board-wrap">
      <div className="board" ref={ref} style={{ aspectRatio: '100 / ' + H }}>
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
                <div className="face face--back"><span className="back-mark">🎴</span></div>
                <div className={`face face--front art-${c.art}`}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
