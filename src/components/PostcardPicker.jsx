import { useEffect, useRef, useState } from 'react';
import { POSTCARD_VARIANTS, renderPostcard } from '../game/postcard.js';
import XIcon from './XIcon.jsx';
import { IconDownload, IconShare } from './Icons.jsx';

/**
 * Winner share-cards: every background variant, rendered with the
 * winner's name + avatar. Tap a card → download or share.
 */
export default function PostcardPicker({ winnerName, winnerAvatar, score, pairs }){
  const [dataUrls, setDataUrls] = useState(null);
  const [busy, setBusy] = useState(0);   // index currently sharing
  const [toast, setToast] = useState('');
  const toastTo = useRef(null);

  const say = (m)=>{
    setToast(m);
    clearTimeout(toastTo.current);
    toastTo.current = setTimeout(()=>setToast(''), 2200);
  };

  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      const urls = [];
      for(const v of POSTCARD_VARIANTS){
        try{ urls.push(renderPostcard(v, { name:winnerName, avatar:winnerAvatar, score, pairs }).toDataURL('image/png')); }
        catch(e){ urls.push(null); }
      }
      if(!cancelled) setDataUrls(urls);
    })();
    return ()=>{ cancelled = true; };
  }, [winnerName, winnerAvatar, score, pairs]);

  const doShare = async (url, i)=>{
    setBusy(i);
    try{
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], 'dilicards-champion.png', { type:'image/png' });
      if(navigator.share && navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], text:'I won DiliCards! Can you beat me? https://dilicard.badhon.online' });
      } else {
        // no native share → download + open compose in a new tab
        download(url);
        window.open('https://x.com/intent/tweet?text=' +
          encodeURIComponent(`I won DiliCards with ${score} pairs! Can you beat me? https://dilicard.badhon.online`),
          '_blank', 'noopener');
        say('Image saved — paste it into the tweet');
      }
    } catch(e){ /* user cancelled */ }
    setBusy(0);
  };

  const download = (url)=>{
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dilicards-champion.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="postcards">
      <div className="postcards-title">Your champion postcards</div>
      <div className="postcards-grid">
        {POSTCARD_VARIANTS.map((v,i)=>{
          const url = dataUrls && dataUrls[i];
          return (
            <div key={v.id} className="pc-item">
              <div className="pc-frame" style={{aspectRatio: v.w + ' / ' + v.h}}>
                {url
                  ? <img className="pc-img" src={url} alt="Postcard"/>
                  : <div className="pc-loading">Rendering…</div>}
              </div>
              {url && (
                <div className="pc-actions">
                  <button className="pc-btn" onClick={()=>download(url)}>
                    <IconDownload size={15}/> Save
                  </button>
                  <button className="pc-btn" onClick={()=>doShare(url, i)} disabled={busy===i}>
                    {busy===i ? <XIcon size={15}/> : <IconShare size={15}/>} {busy===i ? 'Sharing…' : 'Share'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && <div className="pc-toast">{toast}</div>}
    </div>
  );
}
