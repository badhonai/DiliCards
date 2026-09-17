import React from 'react';
import { useDiliGame } from '../src/hooks/useDiliGame.js';

/** One "phone". Registers its hook object outward after every render. */
export function Driver({ register }){
  const g = useDiliGame();
  React.useEffect(()=>{ register(g); });
  return null;
}
