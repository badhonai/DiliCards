import { CFG } from '../config.js';
import XIcon from './XIcon.jsx';
import PostcardPicker from './PostcardPicker.jsx';
import diliHands from '../assets/dili-handsup.png';
import diliFunny from '../assets/dili-funny.png';
import diliCool from '../assets/dili-cool.png';

/** Shown over the board when the game ends. */
export default function EndOverlay({
  view, role, hostName, guestName,
  onRematch, onRematchReq, onHome,
}){
  const me = role==='host' ? 1 : 2;
  const isTie = view.winner===0;
  const iWon = view.winner===me;
  const sticker = iWon ? diliHands : (isTie ? diliFunny : diliCool);
  const title = isTie ? "It's a tie! 🤝" : (iWon ? 'You win! 🎉' : 'Friend wins! 👏');
  const n1 = hostName || 'Player 1';
  const n2 = guestName || 'Player 2';
  const winnerName = isTie ? '' : (view.winner===1 ? n1 : n2);

  return (
    <div className="overlay">
      <div className="panel end-panel">
        <img className="end-sticker" src={sticker} alt=""/>
        <h2 className="end-title">{title}</h2>

        <div className="finalrow">
          <div className={'fchip c1' + (view.winner===1 ? ' win' : '')}>{n1} · {view.scores[1]}</div>
          <div className={'fchip c2' + (view.winner===2 ? ' win' : '')}>{n2} · {view.scores[2]}</div>
        </div>

        {(iWon || isTie) && (
          <PostcardPicker
            names={{ 1: n1, 2: n2 }}
            scores={view.scores}
            isTie={isTie}
            winnerName={winnerName}
          />
        )}

        <div className="btnstack">
          {role==='host'
            ? <button className="btn" onClick={onRematch}>↻ Rematch — new board</button>
            : <button className="btn" onClick={onRematchReq}>🔁 Ask for a rematch</button>}
          <button className="btn btn-soft" onClick={onHome}>🏠 Home</button>
        </div>

        <a className="tw-btn" href={CFG.TWITTER} target="_blank" rel="noreferrer">
          <XIcon/> Follow <b>{CFG.TWITTER_HANDLE}</b> on X
        </a>
      </div>
    </div>
  );
}
