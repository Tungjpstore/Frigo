import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { api } from './services/api';
import { initSync } from './lib/sync';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// S3: replay queued offline writes automatically when connectivity returns.
initSync(() => api.retryPendingWrites());

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
