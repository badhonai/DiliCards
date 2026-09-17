import diliCool from '../assets/dili-cool.png';

/** The connection to the other player dropped. */
export default function LostOverlay({ role, roomLink, onCopyLink, onRejoin, onHome }){
  const isHost = role==='host';
  return (
    <div className="overlay">
      <div className="panel end-panel">
        <img className="end-sticker" src={diliCool} alt=""/>
        <h2 className="end-title">Connection lost 📡</h2>
        <p className="end-msg">
          {isHost
            ? 'Your friend dropped. The room is still open — if they open the same link they\'ll rejoin instantly.'
            : 'Lost contact with your friend. Tap retry to jump back into the room.'}
        </p>
        <div className="btnstack">
          <button className="btn" onClick={onRejoin}>
            {isHost ? '↻ Wait for them again' : '↻ Rejoin room'}
          </button>
          <button className="btn btn-soft" onClick={onCopyLink}>📋 Copy game link</button>
          <button className="btn btn-soft" onClick={onHome}>🏠 Home</button>
        </div>
      </div>
    </div>
  );
}
