import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import diliFunny from '../assets/dili-funny.png';
import logo from '../assets/logo.png';
import logoWhite from '../assets/logo-white.png';
import { IconCopy, IconLink, IconRefresh, IconUsers } from './Icons.jsx';

/**
 * The "waiting for a friend" screen (host).
 * Big room code + shareable link + the board previewing behind.
 */
export default function HostScreen({
  name, avatar, roomCode, roomLink, sizePairs,
  onCopy, onGoHome, onShare,
  theme = 'dark', onToggleTheme = () => {},
}){
  const avSrc = avatarUrl(avatar);
  const logoSrc = theme === 'dark' ? logoWhite : logo;
  return (
    <div className="host-wrap">
      <div className="host-panel">
        <div className="host-head">
          <img className="logo-img sm" src={logoSrc} alt=""/>
          <div>
            <div className="host-title">Your room is live</div>
            <div className="host-sub">Share the code or the link. Play begins the moment they open it.</div>
          </div>
        </div>

        <div className="code-display">{roomCode}</div>

        <div className="share-row">
          <button className="btn primary" onClick={onCopy}>
            <IconCopy size={18}/> Copy link
          </button>
          <button className="btn" onClick={onShare}>
            <IconLink size={18}/> Share
          </button>
        </div>

        <div className="wait-list">
          <div className="wait-you">
            <span className="w-avatar">
              {avSrc ? <img src={avSrc} alt=""/> : <span className="sp-init">{(name||'?')[0]}</span>}
            </span>
            <span className="w-name">{name || 'Player 1'} <em>(you)</em></span>
            <span className="w-state">waiting</span>
          </div>
          <div className="wait-you pending">
            <span className="w-avatar ghost"><IconUsers size={18}/></span>
            <span className="w-name">Friend</span>
            <span className="w-state blink">joining…</span>
          </div>
        </div>

        <div className="mascot-row">
          <img src={diliFunny} alt="Dili waiting"/>
          <div className="mascot-text">
            <b>Pro tip:</b> {sizePairs*2} cards ({sizePairs} pairs) · 10s per turn ·
            share the link and your friend auto-joins, no typing needed.
          </div>
        </div>

        <div className="hint">
          They can also open <b>{CFG.SITE}</b> and enter code <b>{roomCode}</b> manually.
        </div>

        <button className="btn ghost" onClick={onGoHome}>
          <IconRefresh size={16}/> Cancel & back
        </button>
      </div>
    </div>
  );
}
