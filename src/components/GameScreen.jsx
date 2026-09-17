import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import Board from './Board.jsx';
import EndOverlay from './EndOverlay.jsx';
import LostOverlay from './LostOverlay.jsx';
import { IconHome, IconLink, IconMute, IconSound } from './Icons.jsx';

/**
 * In-game screen (mobile first, no scrolling):
 *   top    → opponent's score card (+ their timer bar)
 *   middle → the scattered board, filling all remaining space
 *   bottom → your score card + turn hint + quick actions
 */
export default function GameScreen({
  S, role, name, avatar, muted, hostName, guestName, hostAvatar, guestAvatar,
  connected, lost, roomCode, roomLink,
  onCardTap, onGoHome, onRematch, onRetry, onCopyLink, onMute,
}){
  const isHost = role==='host';
  const myName = (isHost ? name : guestName) || (isHost ? 'Player 1' : 'Player 2');
  const meAv = isHost ? avatar : guestAvatar;
  const themName = (isHost ? guestName : hostName) || (isHost ? 'Player 2' : 'Player 1');
  const themAv = isHost ? guestAvatar : hostAvatar;

  // notMyTurn → opponent is thinking (their timer bar runs)
  const notMyTurn = S.phase==='play' && (isHost ? S.turn===2 : S.turn===1);
  const turnTime = S.phase==='play' ? S.timeLeft : null;
  const tPct = turnTime!=null ? (turnTime/CFG.TURN_SECONDS)*100 : 0;
  const urgent = turnTime!=null && turnTime<=3;

  const oppBar = notMyTurn ? (
    <div className={'turnbar' + (urgent ? ' urgent' : '')}>
      <div className="turnbar-fill" style={{width: tPct + '%'}}/>
    </div>
  ) : null;
  const myBar = !notMyTurn && S.phase==='play' ? (
    <div className={'turnbar mine' + (urgent ? ' urgent' : '')}>
      <div className="turnbar-fill" style={{width: tPct + '%'}}/>
    </div>
  ) : null;

  return (
    <div className="game-screen">
      {/* ── opponent: TOP ── */}
      <div className="hud-top">
        <div className="score-card">
          <span className="sc-avatar">
            {themAv!=null && avatarUrl(themAv)
              ? <img src={avatarUrl(themAv)} alt=""/>
              : <span className="sc-init">{(themName||'?')[0]}</span>}
          </span>
          <div className="sc-main">
            <span className="sc-name">{themName}</span>
            <span className="sc-label">{notMyTurn ? 'their turn' : 'waiting'}</span>
          </div>
          <span className={'sc-score' + (notMyTurn ? ' live' : '')}>{S.scores[1]}</span>
        </div>
        {oppBar}
      </div>

      {/* ── the board  -  fills everything in between ── */}
      <Board S={S} onCardTap={onCardTap}/>

      {/* ── you: BOTTOM ── */}
      <div className="hud-bottom">
        <div className="score-card mine">
          <span className="sc-avatar">
            {meAv!=null && avatarUrl(meAv)
              ? <img src={avatarUrl(meAv)} alt=""/>
              : <span className="sc-init">{(myName||'?')[0]}</span>}
          </span>
          <div className="sc-main">
            <span className="sc-name">{myName} <em>(you)</em></span>
            <span className="sc-label">{!notMyTurn ? 'your turn, flip 2' : 'waiting'}</span>
          </div>
          <span className={'sc-score mine' + (!notMyTurn ? ' live' : '')}>{S.scores[2]}</span>
        </div>
        {myBar}
        <div className="dock-actions">
          {S.phase!=='done' && (
            <>
              <button className="icon-btn" onClick={onMute} aria-label="Toggle sound">
                {muted ? <IconMute size={17}/> : <IconSound size={17}/>}
              </button>
              <button className="icon-btn" onClick={onCopyLink} aria-label="Share room link">
                <IconLink size={17}/>
              </button>
              <button className="icon-btn" onClick={onGoHome} aria-label="Leave to home">
                <IconHome size={17}/>
              </button>
            </>
          )}
        </div>
      </div>

      {S.phase==='locked' && <div className="lock-note">No match. Cards flipping back…</div>}

      {!connected && !lost && S.phase!=='done' && (
        <div className="conn-banner">
          {isHost ? <>Waiting for a friend. Share the code <b>{roomCode}</b></> : 'Connecting to the host…'}
        </div>
      )}

      {lost && <LostOverlay isHost={isHost} roomCode={roomCode} roomLink={roomLink} onGoHome={onGoHome} onRetry={onRetry} onCopyLink={onCopyLink}/>}
      {S.phase==='done' && (
        <EndOverlay
          S={S} isHost={isHost}
          myName={myName} theirName={themName}
          myAvatar={meAv} theirAvatar={themAv}
          onRematch={onRematch} onGoHome={onGoHome}
          roomCode={roomCode} roomLink={roomLink} onCopyLink={onCopyLink}
        />
      )}
    </div>
  );
}
