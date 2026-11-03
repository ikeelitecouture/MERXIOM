import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import App from'./App';import'./styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);


// MERXIOM PWA service worker
// Never allow an old production service worker to cache Vite development modules.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('MERXIOM service worker registration failed:', error);
      });
    });
  } else {
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter(key => key.startsWith('merxiom-')).map(key => caches.delete(key))
        );
      }
    })().catch(error => {
      console.error('MERXIOM development cache cleanup failed:', error);
    });
  }
}
