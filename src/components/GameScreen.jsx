import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import Board from './Board.jsx';

function ScorePill({ p, name, score, active, you, avatar }){
  return (
    <div className={`score s${p}${active ? ' active' : ''}`}>
      <div className="ball">
        {avatar!=null
          ? <img src={avatarUrl(avatar)} alt=""/>
          : String(name || p).slice(0,1).toUpperCase()}
      </div>
      <div className="meta">
        <div className="who">
          <span className="who-name">{name}</span>
          {you && <span className="you-tag">YOU</span>}
          {active && <span className="turn-dot"/>}
        </div>
        <div className="num">{score}</div>
      </div>
    </div>
  );
}

function TimerBadge({ tl, total, locked }){
  const cls = locked ? 'paused' : (tl>5 ? 'ok' : (tl>2 ? 'warn' : 'danger'));
  return (
    <div className={`timer ${cls}`} title="Seconds left this turn">
      <div className="ring" style={{ '--f': `${(Math.max(0,tl)/total)*100}%` }}/>
      <div className="tball">{locked ? '·' : tl}</div>
    </div>
  );
}

function turnText(view, me, oppName){
  if(view.phase==='done') return '🏁 Game over!';
  if(view.phase==='locked') return 'Checking the pair…';
  if(view.turn===me){
    const left = view.flipped.length===1 ? 'flip your last card' : 'flip 2 cards';
    return `Your turn — ${left} ⏱`;
  }
  return `${oppName}'s turn…`;
}

/**
 * In-game screen.
 * Opponent's score card is at the TOP, yours at the BOTTOM.
 */
export default function GameScreen({
  view, role, hostName, guestName,
  avatar, hostAvatar, guestAvatar,
  connected, muted, onCardTap, onHome, onMute,
}){
  const me = role==='host' ? 1 : 2;
  const opp = me===1 ? 2 : 1;
  const myName = me===1 ? (hostName || 'Player 1') : (guestName || 'Player 2');
  const oppName = me===1 ? (guestName || 'Player 2') : (hostName || 'Player 1');
  const oppAvatar = me===1 ? guestAvatar : hostAvatar;
  const matched = view.cards.filter(c=>c.state==='matched').length;

  return (
    <div className="game-screen">
      <div className="hud hud-top">
        <ScorePill p={opp} name={oppName} score={view.scores[opp]} avatar={oppAvatar}
          active={view.phase==='play' && view.turn===opp}/>
      </div>

      <div className="status-row">
        <TimerBadge tl={view.timeLeft} total={CFG.TURN_SECONDS} locked={view.phase==='locked'}/>
        <div className="turnbar">
          <span className={'conn ' + (connected ? 'on' : 'off')}/>
          <span>{turnText(view, me, oppName)}</span>
        </div>
      </div>

      <div className="prog">Pairs found <b>{matched}</b> / {view.pairs}</div>

      <Board S={view} onCardTap={onCardTap}/>

      <div className="hud hud-bottom">
        <ScorePill p={me} name={myName} score={view.scores[me]} avatar={avatar}
          active={view.phase==='play' && view.turn===me} you/>
        <div className="hud-btns">
          <button className="round-btn" onClick={onMute} aria-label="mute">{muted ? '🔇' : '🔊'}</button>
          <button className="round-btn" onClick={onHome} aria-label="home">🏠</button>
        </div>
      </div>
    </div>
  );
}
