import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dili_theme';

/**
 * Theme hook for DiliCards.
 * Supports 'dark' (default) and 'light' themes.
 * Persists selection in localStorage and synchronizes with html[data-theme].
 */
export function useTheme(){
  const [theme, setTheme] = useState(()=>{
    try{
      const saved = typeof window !== 'undefined' ? window.localStorage?.getItem(STORAGE_KEY) : null;
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    }catch(e){
      return 'dark';
    }
  });

  useEffect(()=>{
    try{
      if(typeof document !== 'undefined'){
        document.documentElement.setAttribute('data-theme', theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if(metaTheme){
          metaTheme.setAttribute('content', theme === 'dark' ? '#060b17' : '#f7e9d7');
        }
      }
      if(typeof window !== 'undefined' && window.localStorage){
        window.localStorage.setItem(STORAGE_KEY, theme);
      }
    }catch(e){}
  }, [theme]);

  const toggleTheme = ()=>{
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
}
