import { useDiliGame } from './hooks/useDiliGame.js';
import MenuScreen from './components/MenuScreen.jsx';
import HostScreen from './components/HostScreen.jsx';
import JoinScreen from './components/JoinScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import EndOverlay from './components/EndOverlay.jsx';
import LostOverlay from './components/LostOverlay.jsx';
import { CFG } from './config.js';

async function shareText(text, url){
  if(navigator.share){
    try{ await navigator.share({ title:CFG.GAME_NAME, text, url }); return; }
    catch(e){ /* cancelled — fall through to copy */ }
  }
  try{ await navigator.clipboard.writeText(text + ' ' + url); }
  catch(e){ /* no clipboard */ }
  window.prompt('Copy this link:', text + ' ' + url);
}

export default function App(){
  const g = useDiliGame();

  const copyLink = async ()=>{
    try{
      await navigator.clipboard.writeText(g.roomLink());
      g.showToast('📋 Link copied!');
    }catch(e){
      window.prompt('Copy this link:', g.roomLink());
    }
  };

  return (
    <div className="app">
      {g.screen==='menu' && (
        <MenuScreen
          name={g.name}
          setName={g.setName}
          sizePairs={g.sizePairs}
          setSizePairs={g.setSizePairs}
          avatar={g.avatar}
          onReroll={g.rerollAvatar}
          pendingJoin={g.pendingJoin}
          onCreate={g.createGame}
          onJoin={g.joinGame}
        />
      )}

      {g.screen==='host' && (
        <HostScreen
          roomCode={g.roomCode}
          roomLink={g.roomLink()}
          hostName={g.hostName}
          avatar={g.avatar}
          onCopy={copyLink}
          onShare={()=>shareText(`Play ${CFG.GAME_NAME} with me! Join code: ${g.roomCode}`, g.roomLink())}
          onCancel={g.goHome}
        />
      )}

      {g.screen==='join' && (
        <JoinScreen
          roomCode={g.roomCode}
          joinErr={g.joinErr}
          guestName={g.guestName}
          avatar={g.avatar}
          onRetry={g.tryJoin}
          onCancel={g.goHome}
        />
      )}

      {g.screen==='game' && g.view && (
        <>
          <GameScreen
            view={g.view}
            role={g.role}
            hostName={g.hostName}
            guestName={g.guestName}
            avatar={g.avatar}
            hostAvatar={g.hostAvatar}
            guestAvatar={g.guestAvatar}
            connected={g.connected}
            muted={g.muted}
            onCardTap={g.onCardTap}
            onHome={g.goHome}
            onMute={g.toggleMute}
          />
          {g.view.phase==='done' && !g.lost && (
            <EndOverlay
              view={g.view}
              role={g.role}
              hostName={g.hostName}
              guestName={g.guestName}
              avatar={g.avatar}
              hostAvatar={g.hostAvatar}
              guestAvatar={g.guestAvatar}
              onRematch={g.startRematch}
              onRematchReq={g.requestRematch}
              onHome={g.goHome}
            />
          )}
          {g.lost && (
            <LostOverlay
              role={g.role}
              roomLink={g.roomLink()}
              onCopyLink={copyLink}
              onRejoin={g.role==='guest' ? g.tryJoin : ()=>g.setLost(false)}
              onHome={g.goHome}
            />
          )}
        </>
      )}

      {g.toast && <div className="toast show">{g.toast}</div>}
    </div>
  );
}
