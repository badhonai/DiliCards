import { useCallback, useEffect, useRef, useState } from 'react';
import { SCORECARD_VARIANTS, renderScorecard, tweetText } from '../game/scorecard.js';
import XIcon from './XIcon.jsx';
import { IconDownload, IconEye, IconEyeOff, IconShare } from './Icons.jsx';

/**
 * Winner-only shareable score card.
 * Pick one of the approved backgrounds, optionally HIDE the opponent's
 * name (it becomes "???" on the card), then Save the image or share on X.
 */
export default function ScorecardPicker({
  winnerName, winnerAvatar, winnerScore, oppName, oppScore,
}){

  const [selected, setSelected] = useState(0);
  const [hideOpp, setHideOpp] = useState(false);
  const [url, setUrl] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const toastTo = useRef(null);
  const renderSeq = useRef(0);

  const say = (m)=>{
    setToast(m);
    clearTimeout(toastTo.current);
    toastTo.current = setTimeout(()=>setToast(''), 3000);
  };

  // recompute the preview whenever the background / hide toggle changes
  useEffect(()=>{
    const seq = ++renderSeq.current;
    let cancelled = false;
    setRendering(true);
    (async()=>{
      try{
        const data = {
          winnerName, winnerAvatar, winnerScore,
          oppName: hideOpp ? null : oppName, oppScore,
        };
        const canvas = await renderScorecard(SCORECARD_VARIANTS[selected], data);
        if(cancelled || seq !== renderSeq.current) return;
        setUrl(canvas.toDataURL('image/png'));
        setRendering(false);
      }catch(e){
        if(cancelled) return;
        console.error('scorecard render failed', e);
        setRendering(false);
      }
    })();
    return ()=>{ cancelled = true; };
  }, [selected, hideOpp, winnerName, winnerAvatar, winnerScore, oppName, oppScore]);

  const download = useCallback(()=>{
    if(!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dilicards-scorecard.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    say('Score card saved');
  }, [url]);

  const shareX = useCallback(async ()=>{
    if(busy) return;
    setBusy(true);
    try{
      const text = tweetText(winnerScore);
      if(navigator.share){
        try{
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], 'dilicards-scorecard.png', { type:'image/png' });
          if(navigator.canShare && navigator.canShare({ files:[file] })){
            await navigator.share({ files:[file], text });
            return;
          }
        }catch(e){ /* fall through to X intent */ }
      }
      window.open(
        'https://x.com/intent/tweet?text=' + encodeURIComponent(text),
        '_blank', 'noopener,noreferrer');
      say('X opened. Save the card and attach it to your post.');
    } finally {
      setBusy(false);
    }
  }, [busy, url, winnerScore]);

  return (
    <div className="scorecard">
      <div className="sc-head">
        <span className="postcards-title">Winner score card</span>
        <button
          className={'sc-eyebtn' + (hideOpp ? ' on' : '')}
          onClick={()=>setHideOpp(v=>!v)}
          aria-pressed={hideOpp}
        >
          {hideOpp ? <IconEyeOff size={15}/> : <IconEye size={15}/>}
          {hideOpp ? 'Opponent hidden' : 'Show opponent name'}
        </button>
      </div>

      {/* background picker */}
      <div className="sc-variants">
        {SCORECARD_VARIANTS.map((v,i)=>(
          <button
            key={v.id}
            className={'sc-variant' + (selected===i ? ' on' : '')}
            onClick={()=>setSelected(i)}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* preview */}
      <div className="sc-frame" style={{ aspectRatio:'16 / 9' }}>
        {url
          ? <img className="sc-img" src={url} alt="Your score card"/>
          : <div className="pc-loading">{rendering ? 'Rendering…' : 'Could not render'}</div>}
      </div>

      {/* actions */}
      <div className="sc-actions">
        <button className="pc-btn" onClick={download} disabled={!url}>
          <IconDownload size={15}/> Save image
        </button>
        <button className="pc-btn tw" onClick={shareX} disabled={!url}>
          <XIcon size={15}/> Share on X
        </button>
      </div>
      <div className="sc-hint">
        Share on X opens a ready post with your caption. Download the card and attach it to the post.
      </div>
      {toast && <div className="pc-toast">{toast}</div>}
    </div>
  );
}
