import { useDiliGame } from './hooks/useDiliGame.js';
import MenuScreen from './components/MenuScreen.jsx';
import HostScreen from './components/HostScreen.jsx';
import JoinScreen from './components/JoinScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import EndOverlay from './components/EndOverlay.jsx';
import LostOverlay from './components/LostOverlay.jsx';
import OnboardModal from './components/OnboardModal.jsx';
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
      g.showToast('Link copied');
    }catch(e){
      window.prompt('Copy this link:', g.roomLink());
    }
  };

  return (
    <div className="app">
      {g.screen==='menu' && (
        <MenuScreen
          name={g.name}
          avatar={g.avatar}
          hasIdentity={g.name.trim().length>=2 && g.avatar!=null}
          sizePairs={g.sizePairs}
          setSizePairs={g.setSizePairs}
          onCreate={g.createGame}
          onJoin={g.joinGame}
          onEditIdentity={()=>g.openOnboard(null)}
        />
      )}

      {g.screen==='host' && (
        <HostScreen
          name={g.name}
          avatar={g.avatar}
          roomCode={g.roomCode}
          roomLink={g.roomLink()}
          sizePairs={g.sizePairs}
          onCopy={copyLink}
          onShare={()=>shareText(`Play ${CFG.GAME_NAME} with me! Join code: ${g.roomCode}`, g.roomLink())}
          onGoHome={g.goHome}
        />
      )}

      {g.screen==='join' && (
        <JoinScreen
          name={g.name}
          avatar={g.avatar}
          roomCode={g.roomCode}
          connected={g.connected}
          err={g.joinErr}
          onGoHome={g.goHome}
          onRetry={g.tryJoin}
          onCopyLink={copyLink}
        />
      )}

      {g.screen==='game' && g.view && (
        <GameScreen
          S={g.view}
          role={g.role}
          name={g.name}
          avatar={g.avatar}
          muted={g.muted}
          hostName={g.hostName}
          guestName={g.guestName}
          hostAvatar={g.hostAvatar}
          guestAvatar={g.guestAvatar}
          connected={g.connected}
          lost={g.lost}
          roomCode={g.roomCode}
          roomLink={g.roomLink()}
          onCardTap={g.onCardTap}
          onGoHome={g.goHome}
          onRematch={g.role==='host' ? g.startRematch : g.requestRematch}
          onRetry={g.role==='guest' ? g.tryJoin : ()=>{}}
          onCopyLink={copyLink}
          onMute={g.toggleMute}
        />
      )}

      {g.onboard.open && (
        <OnboardModal
          joinCode={g.onboard.joinCode}
          initialName={g.name}
          initialAvatar={g.avatar}
          onSubmit={g.submitOnboard}
        />
      )}

      {g.toast && <div className="toast show">{g.toast}</div>}
    </div>
  );
}
