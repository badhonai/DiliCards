import { IconCopy, IconHome, IconRefresh } from './Icons.jsx';

/**
 * "Opponent disconnected" overlay.
 * Host: the room stays alive — friend can rejoin, or you can go home.
 * Guest: the room lives on the host's phone — retry or go home.
 */
export default function LostOverlay({ isHost, roomCode, roomLink, onGoHome, onRetry, onCopyLink }){
  return (
    <div className="overlay lost-overlay">
      <div className="panel lost-panel">
        <h2 className="lost-title">Opponent left</h2>
        <p className="lost-sub">
          {isHost
            ? <>Your room is still open for <b>2 minutes</b> — if they reopen the link they'll rejoin this game. You can also start fresh.</>
            : <>The host's game ended. You can <b>reconnect</b> right away, or head back home.</>}
        </p>
        {isHost && (
          <div className="code-display sm">
            {roomCode}
            <div className="code-sub">their link still works</div>
          </div>
        )}
        <div className="btn-row">
          {isHost
            ? <button className="btn primary" onClick={onGoHome}><IconHome size={17}/> Start fresh / home</button>
            : <button className="btn primary" onClick={onRetry}><IconRefresh size={17}/> Reconnect</button>}
          {!isHost && <button className="btn" onClick={onGoHome}><IconHome size={17}/> Home</button>}
          <button className="btn" onClick={onCopyLink}><IconCopy size={16}/> Copy link</button>
        </div>
      </div>
    </div>
  );
}
