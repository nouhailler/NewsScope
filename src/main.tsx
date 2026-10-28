import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Inscription sécurisée du Service Worker PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Enregistrement réussi
        if (registration.installing) {
          console.info('[PWA] Service Worker en cours d\'installation.');
        } else if (registration.active) {
          console.info('[PWA] Service Worker actif et opérationnel.');
        }
      })
      .catch((err) => {
        // Ne bloque pas l'application si l'environnement iframe bloque les Service Workers
        console.warn('[PWA] Enregistrement Service Worker non disponible :', err.message);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
