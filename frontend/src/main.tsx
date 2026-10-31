import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import App from'./App';import'./styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);

// MERXIOM PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('MERXIOM service worker registration failed:', error);
    });
  });
}
