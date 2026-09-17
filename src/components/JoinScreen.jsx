import { avatarUrl } from '../game/avatar.js';
import logo from '../assets/logo.png';
import { IconCopy, IconRefresh } from './Icons.jsx';

const ERR_TEXT = {
  nohost:  "No live room found with that code — double-check it, or ask the host to copy a fresh link.",
  network: "Couldn't reach the matchmaking service. Check your connection and retry.",
  timeout: "The room isn't responding right now. Try again in a few seconds.",
  hostgone:"The host closed the game. Ask them to create a fresh room and send you the new link.",
  init:    "The host didn't respond in time. Check that your friend is still on the waiting screen, then retry.",
};

/**
 * The "joining a friend's room" screen (guest).
 * Shows what's being joined and gives real, readable errors —
 * never an endless spinner.
 */
export default function JoinScreen({ name, avatar, roomCode, connected, onGoHome, onRetry, onCopyLink, err }){
  const avSrc = avatarUrl(avatar);
  const errText = (err && ERR_TEXT[err]) || (err ? 'Something went wrong. Try again.' : null);

  return (
    <div className="join-wrap">
      <div className="join-panel">
        <div className="join-head">
          <img className="logo-img sm" src={logo} alt=""/>
          <div>
            <div className="join-title">Joining room</div>
            <div className="code-display sm">{roomCode}</div>
          </div>
        </div>

        <div className="wait-list">
          <div className="wait-you">
            <span className="w-avatar">
              {avSrc ? <img src={avSrc} alt=""/> : <span className="sp-init">{(name||'?')[0]}</span>}
            </span>
            <span className="w-name">{name || 'You'} <em>(you)</em></span>
            <span className="w-state blink">connecting…</span>
          </div>
          <div className="wait-you">
            <span className="w-avatar ghost"><span className="sp-init">H</span></span>
            <span className="w-name">Host</span>
            <span className="w-state">waiting</span>
          </div>
        </div>

        {errText ? (
          <div className="errbox">
            <div className="err-title">Couldn't join</div>
            <p>{errText}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={onRetry}><IconRefresh size={16}/> Try again</button>
              <button className="btn" onClick={onGoHome}>Back to home</button>
            </div>
          </div>
        ) : !connected ? (
          <div className="join-sub">
            Reaching the host… this takes a couple of seconds.
            <div className="dots">
              <i>.</i><i>.</i><i>.</i>
            </div>
          </div>
        ) : (
          <div className="join-sub ok">
            Connected! The game starts the moment the host's board loads.
          </div>
        )}

        <div className="hint">
          Tip: have the host send you the <b>link</b> instead of the code —
          it opens and joins automatically.
        </div>

        <button className="btn ghost" onClick={onGoHome}>Cancel</button>
        <button className="btn ghost" onClick={onCopyLink}><IconCopy size={15}/> Copy link</button>
      </div>
    </div>
  );
}
