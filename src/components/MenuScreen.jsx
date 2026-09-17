import { useState } from 'react';
import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import XIcon from './XIcon.jsx';
import diliHappy from '../assets/dili-happy.png';
import diliCool from '../assets/dili-cool.png';
import diliFunny from '../assets/dili-funny.png';

/**
 * The home screen.
 * Identity (random Dili avatar + mandatory, saved name) →
 * Create / Join action cards → board size → how-to.
 */
export default function MenuScreen({
  name, setName, sizePairs, setSizePairs,
  avatar, onReroll, pendingJoin,
  onCreate, onJoin,
}){
  const [joinCode, setJoinCode] = useState(pendingJoin || '');
  const canPlay = (name||'').trim().length>=2;
  const joinTarget = (joinCode||'').trim().toUpperCase() || pendingJoin || '';

  return (
    <div className="menu-wrap">
      <div className="menu-deco deco-cool"><img src={diliCool} alt=""/></div>
      <div className="menu-deco deco-funny"><img src={diliFunny} alt=""/></div>

      <div className="menu-head">
        <h1 className="logo">🎴 DiliCards</h1>
        <div className="tag">Flip 2 · Match them · Beat your friend</div>
        <div className="mascot"><img src={diliHappy} alt="Dili"/></div>
      </div>

      <div className="panel-clay menu-panel">
        {/* ── identity: your random Dili + name ── */}
        <div className="identity">
          <div className="id-avatar">
            <img src={avatarUrl(avatar)} alt="Your avatar"/>
            <button className="reroll" onClick={onReroll} title="New random avatar" aria-label="New random avatar">🎲</button>
          </div>
          <div className="id-main">
            <label className="chip-label" htmlFor="dc-name">YOUR NAME</label>
            <input
              id="dc-name"
              className="field"
              value={name}
              onChange={e=>setName(e.target.value)}
              maxLength={14}
              placeholder="Type your name…"
              autoComplete="off"
            />
          </div>
        </div>
        {!canPlay && (
          <div className="need-name">✍️ A name is required (2+ letters) — it's saved on this phone, so only once.</div>
        )}

        {/* ── board size ── */}
        <div className="chip-label">BOARD SIZE</div>
        <div className="chips">
          {CFG.BOARD_SIZES.map(b=>(
            <button
              key={b.pairs}
              className={'chip' + (sizePairs===b.pairs ? ' on' : '')}
              onClick={()=>setSizePairs(b.pairs)}
            >{b.label}</button>
          ))}
        </div>

        {/* ── create ── */}
        <button
          className={'action-card create' + (canPlay ? '' : ' disabled')}
          disabled={!canPlay}
          onClick={onCreate}
        >
          <div className="ac-icon">🎮</div>
          <div className="ac-body">
            <div className="ac-title">Create game</div>
            <div className="ac-sub">You're Player 1 (blue) — get a code & link to share</div>
          </div>
          <div className="ac-arrow">→</div>
        </button>

        {/* ── join ── */}
        <div className="action-card join">
          <div className="ac-icon">🚪</div>
          <div className="ac-body">
            <div className="ac-title">Join a game</div>
            <input
              className="code-input"
              value={joinCode}
              onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ROOM CODE"
              autoComplete="off"
              inputMode="text"
            />
          </div>
          <button
            className="ac-go"
            disabled={!canPlay || joinTarget.length<6}
            onClick={()=>onJoin(joinTarget)}
          >Join</button>
        </div>

        {pendingJoin && (
          <div className="pending-banner">
            🚪 You're joining room <b>{pendingJoin}</b> — enter your name, then tap <b>Join</b>.
          </div>
        )}

        <details className="howto">
          <summary>❓ How to play</summary>
          <p>
            You have <b>10 seconds per turn</b>. Flip <b>2 cards</b>!
            Match → <b>+1 point</b> and go again. No match (or time's up) →
            the cards flip back and it's your friend's turn.
            Clear the board → <b>most pairs wins</b> 🏆
          </p>
        </details>

        <a className="tw-btn" href={CFG.TWITTER} target="_blank" rel="noreferrer">
          <XIcon/> Follow <b>{CFG.TWITTER_HANDLE}</b> on X
        </a>

        <div className="hint">
          Create → share the link → your friend opens it on their phone →
          you play <b>live</b> together. 100% free, no accounts.
        </div>
      </div>

      <div className="site-link"><a href={CFG.SITE} target="_blank" rel="noreferrer">dilicard.badhon.online</a></div>
    </div>
  );
}
