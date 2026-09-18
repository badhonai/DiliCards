import { useDiliGame } from './hooks/useDiliGame.js';
import { useTheme } from './hooks/useTheme.js';
import ThemeToggle from './components/ThemeToggle.jsx';
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
    catch(e){ /* cancelled - fall through to copy */ }
  }
  try{ await navigator.clipboard.writeText(text + ' ' + url); }
  catch(e){ /* no clipboard */ }
  window.prompt('Copy this link:', text + ' ' + url);
}

export default function App(){
  const g = useDiliGame();
  const { theme, toggleTheme } = useTheme();

  const copyLink = async ()=>{
    try{
      await navigator.clipboard.writeText(g.roomLink());
      g.showToast('Link copied');
    }catch(e){
      window.prompt('Copy this link:', g.roomLink());
    }
  };

  return (
    <div className={`app ${theme}-theme`} data-theme={theme}>
      {g.screen !== 'game' && (
        <header className="app-header">
          <div className="header-inner">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
      )}

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
          theme={theme}
          onToggleTheme={toggleTheme}
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
          theme={theme}
          onToggleTheme={toggleTheme}
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
          theme={theme}
          onToggleTheme={toggleTheme}
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
          onRematch={g.role==='guest' ? g.requestRematch : g.acceptRematchReq}
          rematchReq={g.rematchReq}
          rematchSent={g.rematchSent}
          onAcceptRematch={g.acceptRematchReq}
          onDeclineRematch={g.declineRematchReq}
          onRetry={g.role==='guest' ? g.tryJoin : ()=>{}}
          onCopyLink={copyLink}
          onMute={g.toggleMute}
          theme={theme}
          onToggleTheme={toggleTheme}
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
