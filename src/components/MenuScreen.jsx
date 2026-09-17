import { useState } from 'react';
import { CFG } from '../config.js';
import XIcon from './XIcon.jsx';
import diliHappy from '../assets/dili-happy.png';
import diliCool from '../assets/dili-cool.png';
import diliFunny from '../assets/dili-funny.png';

/** The home screen. */
export default function MenuScreen({ name, setName, sizePairs, setSizePairs, onCreate, onJoin }){
  const [joinCode, setJoinCode] = useState('');
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
        <input
          className="field"
          value={name}
          onChange={e=>setName(e.target.value)}
          maxLength={14}
          placeholder="Your name (optional)"
          autoComplete="off"
        />
        <button className="btn" onClick={onCreate}>
          🎮 Create a game
          <small>You are Player 1 (blue)</small>
        </button>

        <div className="or"><span>JOIN WITH A CODE</span></div>

        <div className="join-row">
          <input
            className="field"
            value={joinCode}
            onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="CODE"
            autoComplete="off"
          />
          <button className="btn" onClick={()=>onJoin(joinCode)}>Join →</button>
        </div>

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
