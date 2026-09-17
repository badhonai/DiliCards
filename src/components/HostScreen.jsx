import diliFunny from '../assets/dili-funny.png';

/** Host is waiting for the guest. Shows room code + shareable link. */
export default function HostScreen({ roomCode, roomLink, onCopy, onShare, onCancel }){
  return (
    <div className="panel-clay wait-panel">
      <img className="wait-mascot" src={diliFunny} alt="Dili waiting"/>
      <div className="wait-title pulse">Waiting for your friend…</div>

      <div className="chip-label">ROOM CODE</div>
      <div className="code-tile">{roomCode}</div>
      <div className="link-pill">{roomLink}</div>

      <div className="btn-row">
        <button className="btn btn-soft" onClick={onCopy}>📋 Copy link</button>
        <button className="btn" onClick={onShare}>📤 Share</button>
      </div>

      <div className="hint">
        Send the link to your friend — they open it on their phone and
        you play right away. You are <b>Player 1 (blue)</b>.
        The room stays open until you cancel.
      </div>

      <button className="btn btn-soft cancel-btn" onClick={onCancel}>✕ Cancel</button>
    </div>
  );
}
