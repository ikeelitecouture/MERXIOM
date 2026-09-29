
// MERXIOM PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("MERXIOM service worker registration failed:", error);
    });
  });
}

// Installed MERXIOM app:
// If the user launches the installed app without a valid
// local session, send them to authentication first.
(() => {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const token = localStorage.getItem("merxiom_token");

  const publicAuthPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password"
  ];

  if (
    standalone &&
    !token &&
    window.location.pathname === "/" &&
    !publicAuthPaths.includes(window.location.pathname)
  ) {
    window.history.replaceState({}, "", "/login");
  }
})();

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
