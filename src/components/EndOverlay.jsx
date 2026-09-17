import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import ScorecardPicker from './ScorecardPicker.jsx';
import { IconClose, IconCopy, IconHome, IconRefresh, IconTrophy } from './Icons.jsx';
import logo from '../assets/logo.png';
import diliHappy from '../assets/dili-happy.png';
import diliFunny from '../assets/dili-funny.png';
import diliCool from '../assets/dili-cool.png';

/**
 * Game-over screen.
 * Winner → trophy, big Dili, and "shareable postcards" with their name.
 * Loser  → rematch nudge. Tie → friendly draw.
 */
export default function EndOverlay({
  S, isHost, myName, theirName, myAvatar, theirAvatar,
  onRematch, onGoHome, roomCode, roomLink, onCopyLink,
  rematchReq, rematchSent, onAcceptRematch, onDeclineRematch,
}){
  if(!S) return null;
  const w = S.winner;
  const hostScore = S.scores[1];
  const guestScore = S.scores[2];
  const myScore = isHost ? hostScore : guestScore;
  const theirScore = isHost ? guestScore : hostScore;

  const iWon = (w===1 && isHost) || (w===2 && !isHost);
  const isDraw = w===0;

  // winner/loser are resolved by ROLE (myName/theirName is already relative to
  // the viewer), never by blindly mapping winner 1/2 onto my/their.
  const winnerName = iWon ? myName : theirName;
  const winnerAvatar = iWon ? myAvatar : theirAvatar;
  const loserName = iWon ? theirName : myName;
  const loserAvatar = iWon ? theirAvatar : myAvatar;
  // scores stay absolute (host = scores[1], guest = scores[2]) regardless of who views
  const hostWon = w===1;
  const winScore = hostWon ? hostScore : guestScore;
  const loseScore = hostWon ? guestScore : hostScore;

  const mascot = isDraw ? diliFunny : (iWon ? diliHappy : diliCool);

  return (
    <div className="overlay">
      <div className="panel end-panel">
        <div className="end-mascot"><img src={mascot} alt="Dili"/></div>

        <h2 className={'end-title' + (isDraw ? '' : iWon ? ' win' : ' lose')}>
          {isDraw ? "It's a tie!" : iWon ? 'You win!' : winnerName + ' wins'}
        </h2>

        <div className="score-chips">
          <div className="fchip">
            <span className="fchip-av">
              {myAvatar!=null && avatarUrl(myAvatar)
                ? <img src={avatarUrl(myAvatar)} alt=""/>
                : <span className="sp-init">{(myName||'?')[0]}</span>}
            </span>
            <div className="fchip-main">
              <span className="fchip-name">{myName} <em>(you)</em></span>
              {iWon && <span className="fchip-crown"><IconTrophy size={13}/></span>}
            </div>
            <span className="fchip-score">{myScore}</span>
          </div>
          <div className="fchip">
            <span className="fchip-av">
              {theirAvatar!=null && avatarUrl(theirAvatar)
                ? <img src={avatarUrl(theirAvatar)} alt=""/>
                : <span className="sp-init">{(theirName||'?')[0]}</span>}
            </span>
            <div className="fchip-main">
              <span className="fchip-name">{theirName}</span>
              {!iWon && <span className="fchip-crown"><IconTrophy size={13}/></span>}
            </div>
            <span className="fchip-score">{theirScore}</span>
          </div>
        </div>

        {isDraw ? null : iWon ? (
          CFG.SCORECARD_ENABLED ? (
            <ScorecardPicker
              winnerName={winnerName}
              winnerAvatar={winnerAvatar}
              winnerScore={winScore}
              oppName={loserName}
              oppScore={loseScore}
            />
          ) : CFG.POSTCARDS_ENABLED ? (
            <div className="rematch-nudge">
              <div className="rn-title">Champion postcards</div>
              <div className="rn-sub">Shareable win cards are coming soon. For now, rematch and defend your crown.</div>
            </div>
          ) : (
            <div className="rematch-nudge">
              <div className="rn-title">Champion postcards</div>
              <div className="rn-sub">Shareable win cards are coming soon. For now, rematch and defend your crown.</div>
            </div>
          )
        ) : (
          <div className="rematch-nudge">
            <div className="rn-title">{rematchSent ? 'Rematch requested' : 'Rematch?'}</div>
            <div className="rn-sub">
              {rematchSent
                ? <>Waiting for <b>{winnerName}</b> to accept…</>
                : <>Ask <b>{winnerName}</b> to rematch, or start your own room.</>}
            </div>
          </div>
        )}

        <div className="btn-row spread">
          {isHost && rematchReq ? (
            <>
              <button className="btn primary" onClick={onAcceptRematch}><IconRefresh size={17}/> Accept rematch</button>
              <button className="btn" onClick={onDeclineRematch}><IconClose size={17}/> Not now</button>
            </>
          ) : !isHost && rematchSent ? (
            <button className="btn primary" disabled><IconRefresh size={17}/> Request sent…</button>
          ) : isHost ? (
            <button className="btn primary" onClick={onAcceptRematch}><IconRefresh size={17}/> Rematch</button>
          ) : (
            <button className="btn primary" onClick={onRematch}><IconRefresh size={17}/> Ask for rematch</button>
          )}
          <button className="btn" onClick={onGoHome}><IconHome size={17}/> Home</button>
        </div>

        <div className="end-foot">
          <button className="mini-link" onClick={onCopyLink}><IconCopy size={13}/> copy room link</button>
          <span className="mini-logo"><img src={logo} alt=""/></span>
        </div>
      </div>
    </div>
  );
}
