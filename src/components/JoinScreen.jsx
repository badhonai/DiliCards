import { avatarUrl } from '../game/avatar.js';
import diliCool from '../assets/dili-cool.png';

const ERR_TEXT = {
  nohost: 'No room with that code. Double-check the 6 letters, or ask your friend to share the link again.',
  network: 'Network hiccup (the matchmaking cloud is blocked?). Check your internet and retry.',
  timeout: 'Timed out before connecting. Ask your friend to keep their waiting screen open, then retry.',
  hostgone: 'The room closed before it was ready. Ask your friend to stay on the waiting screen, then retry.',
  init: "The host didn't respond in time. Check that your friend is still on the waiting screen, then retry.",
};

/** Guest is trying to connect to a room. */
export default function JoinScreen({
  roomCode, joinErr, guestName, avatar,
  onRetry, onCancel,
}){
  return (
    <div className="panel-clay wait-panel">
      <img className="wait-mascot" src={diliCool} alt="Dili"/>
      <div className="wait-title">Joining room {roomCode}</div>

      <div className="wait-you">
        <img src={avatarUrl(avatar)} alt=""/>
        <b>{guestName}</b>
        <span>· Player 2 (red)</span>
      </div>

      <div className="spinner" role="status" aria-label="connecting"/>
      <div className="hint">Make sure your friend's game screen is open and waiting.</div>
      {joinErr && <div className="errbox">⚠️ {ERR_TEXT[joinErr] || 'Connection problem. Retry.'}</div>}
      <div className="btn-row">
        <button className="btn" onClick={onRetry}>↻ Retry</button>
        <button className="btn btn-soft" onClick={onCancel}>← Menu</button>
      </div>
    </div>
  );
}
