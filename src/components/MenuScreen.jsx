import { useState } from 'react';
import { CFG } from '../config.js';
import { avatarUrl } from '../game/avatar.js';
import XIcon from './XIcon.jsx';
import { IconGame, IconLink, IconPencil, IconUsers } from './Icons.jsx';
import diliHappy from '../assets/dili-happy.png';
import diliCool from '../assets/dili-cool.png';
import diliFunny from '../assets/dili-funny.png';
import logo from '../assets/logo.png';

/**
 * The home screen.
 * Identity (pick your Dili + name) → Create / Join action cards.
 */
export default function MenuScreen({
  name, avatar, hasIdentity,
  sizePairs, setSizePairs,
  onCreate, onJoin, onEditIdentity,
}){
  const [joinCode, setJoinCode] = useState('');
  const canPlay = hasIdentity;
  const joinTarget = (joinCode||'').trim().toUpperCase();
  const avSrc = avatarUrl(avatar);

  return (
    <div className="menu-wrap">
      <div className="menu-deco deco-cool"><img src={diliCool} alt=""/></div>
      <div className="menu-deco deco-funny"><img src={diliFunny} alt=""/></div>

      <div className="menu-head">
        <div className="logo-row">
          <img className="logo-img" src={logo} alt=""/>
          <h1 className="logo">DiliCards</h1>
        </div>
        <div className="tag">Flip 2 · Match them · Beat your friend</div>
        <div className="mascot"><img src={diliHappy} alt="Dili"/></div>
      </div>

      <div className="panel-clay menu-panel">
        {/* ── identity: your Dili + name ── */}
        <button className="identity" onClick={onEditIdentity} aria-label="Edit name and avatar">
          <div className="id-avatar">
            {avSrc
              ? <img src={avSrc} alt="Your avatar"/>
              : <span className="id-avatar-empty"><IconPencil/></span>}
            <span className="id-edit" aria-hidden="true"><IconPencil size={12}/></span>
          </div>
          <div className="id-main">
            <span className="chip-label">YOUR NAME</span>
            {name
              ? <span className="id-name">{name}</span>
              : <span className="id-name empty">Tap to choose a name & avatar</span>}
          </div>
          <span className="id-go">→</span>
        </button>

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
          <div className="ac-icon"><IconGame size={26}/></div>
          <div className="ac-body">
            <div className="ac-title">Create game</div>
            <div className="ac-sub">You are Player 1. Get a code and a link to share.</div>
          </div>
          <div className="ac-arrow">→</div>
        </button>

        {/* ── join ── */}
        <div className="action-card join">
          <div className="ac-icon"><IconLink size={24}/></div>
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

        {!canPlay && (
          <div className="pending-banner">
            <IconUsers size={15}/> Tap your name above to pick a name and a Dili. Then create or join.
          </div>
        )}

        <details className="howto">
          <summary>How to play</summary>
          <p>
            You have <b>10 seconds per turn</b>. Flip <b>2 cards</b>!
            Match → <b>+1 point</b> and go again. No match (or time's up) →
            the cards flip back and it's your friend's turn.
            Clear the board → <b>most pairs wins</b>.
          </p>
        </details>

        <a className="tw-btn" href={CFG.TWITTER} target="_blank" rel="noreferrer">
          <XIcon size={17}/> Follow <b>{CFG.TWITTER_HANDLE}</b> on X
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
