import { useState, useEffect } from 'react';
import { CFG } from '../config.js';
import XIcon from './XIcon.jsx';
import {
  VARIANTS, postcardDataURL, postcardBlob, postcardFileName,
} from '../game/postcard.js';

/**
 * Victory postcards: 3 style variants rendered on <canvas>.
 * Pick one → Download PNG, native Share, or post straight to X.
 */
export default function PostcardPicker({ names, scores, isTie, winnerName, avatarUrl }){
  const [thumbs, setThumbs] = useState({});
  const [sel, setSel] = useState(VARIANTS[0].id);
  const [busy, setBusy] = useState(false);

  const base = { names, scores, isTie, winnerName, avatarUrl };

  useEffect(()=>{
    let alive = true;
    VARIANTS.forEach(async v=>{
      try{
        const url = await postcardDataURL({ ...base, variant: v }, 0.3);
        if(alive) setThumbs(t=>({ ...t, [v.id]: url }));
      }catch(e){ /* variant failed — stays hidden */ }
    });
    return ()=>{ alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const variant = VARIANTS.find(v=>v.id===sel);

  async function download(){
    setBusy(true);
    try{
      const blob = await postcardBlob({ ...base, variant });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = postcardFileName(winnerName, isTie);
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    }catch(e){ /* ignore */ }
    setBusy(false);
  }

  async function shareFile(){
    try{
      const blob = await postcardBlob({ ...base, variant });
      const file = new File([blob], postcardFileName(winnerName, isTie), { type:'image/png' });
      if(navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], title:'DiliCards', text:`${isTie ? 'We tied' : `${winnerName} won`} DiliCards! #DiliCards` });
      } else {
        download();
        window.open(CFG.TWITTER, '_blank');
      }
    }catch(e){ /* user cancelled */ }
  }

  const tweetHref =
    'https://x.com/intent/tweet?text=' +
    encodeURIComponent(`${isTie ? 'We tied' : `${winnerName} won`} a DiliCards match! 🎴 #DiliCards`);

  return (
    <div className="postcard">
      <div className="postcard-title">🏆 Make your victory card!</div>
      <div className="pc-thumbs">
        {VARIANTS.map(v=>(
          <button
            key={v.id}
            className={'pc-thumb' + (sel===v.id ? ' on' : '')}
            onClick={()=>setSel(v.id)}
            disabled={!thumbs[v.id]}
          >
            {thumbs[v.id]
              ? <img src={thumbs[v.id]} alt={v.label}/>
              : <span className="pc-loading">…</span>}
            <span className="pc-name">{v.label}</span>
          </button>
        ))}
      </div>
      <div className="pc-actions">
        <button className="btn" onClick={download} disabled={busy}>
          {busy ? 'Making…' : '⬇ Download PNG'}
        </button>
        <div className="pc-row2">
          <button className="btn btn-soft" onClick={shareFile}>📤 Share</button>
          <a className="btn btn-soft" target="_blank" rel="noreferrer" href={tweetHref}>
            <XIcon size={14}/> Post on X
          </a>
        </div>
      </div>
    </div>
  );
}
