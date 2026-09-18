import { IconSun, IconMoon } from './Icons.jsx';

/**
 * Theme toggle switch for DiliCards.
 * Supports compact icon mode (for game HUD dock) and full pill mode (for menus and lobbies).
 */
export default function ThemeToggle({ theme = 'dark', onToggle = () => {}, compact = false }){
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  if(compact){
    return (
      <button
        type="button"
        className="icon-btn theme-btn-compact"
        onClick={onToggle}
        aria-label={label}
        title={label}
      >
        {isDark ? <IconSun size={17}/> : <IconMoon size={17}/>}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
    >
      <span className={'tt-segment' + (!isDark ? ' on' : '')}>
        <IconSun size={13}/>
        <span className="tt-text">Light</span>
      </span>
      <span className={'tt-segment' + (isDark ? ' on' : '')}>
        <IconMoon size={13}/>
        <span className="tt-text">Dark</span>
      </span>
    </button>
  );
}
