import { useState } from 'react';
import { AVATARS } from '../game/avatar.js';

/**
 * First-launch / first-join popup: pick a name + your Dili.
 * If a join code is pending, submitting goes STRAIGHT into the game
 * (never back to the home screen).
 */
export default function OnboardModal({ joinCode, initialName, initialAvatar, onSubmit }){
  const [name, setName] = useState(initialName || '');
  const [avatar, setAvatar] = useState(initialAvatar!=null ? initialAvatar : null);
  const valid = name.trim().length>=2 && avatar!=null;

  return (
    <div className="overlay onboard-overlay">
      <div className="panel onboard-panel">
        <h2 className="onboard-title">First time here?</h2>
        <p className="onboard-sub">Pick a name and your Dili — saved on this phone, used in every match.</p>

        <div className="chip-label">YOUR NAME</div>
        <input
          className="field"
          value={name}
          onChange={e=>setName(e.target.value)}
          maxLength={14}
          placeholder="Type your name…"
          autoComplete="off"
          autoFocus
        />

        <div className="chip-label">CHOOSE YOUR DILI</div>
        <div className="pfp-grid">
          {AVATARS.map((src,i)=>(
            <button
              key={i}
              className={'pfp'+(avatar===i ? ' on' : '')}
              onClick={()=>setAvatar(i)}
              aria-label={'Dili avatar ' + (i+1)}
            >
              <img src={src} alt=""/>
              {avatar===i && <span className="pfp-check">✓</span>}
            </button>
          ))}
        </div>

        {joinCode && (
          <div className="pending-banner">
            Ready to join room <b>{joinCode}</b> — you'll go straight into the game.
          </div>
        )}

        <button className="btn" disabled={!valid} onClick={()=>onSubmit(name.trim().slice(0,14), avatar)}>
          {joinCode ? 'Join the game' : 'Done'}
        </button>
      </div>
    </div>
  );
}
