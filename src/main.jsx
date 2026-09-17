import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './art.css';

// NOTE: no StrictMode  -  its dev double-mount would double-create P2P sessions.
createRoot(document.getElementById('root')).render(<App/>);
