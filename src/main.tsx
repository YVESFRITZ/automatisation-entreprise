import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import App from './App'
import './index.css'

// Auto-mise à jour : quand un nouveau service worker prend le contrôle,
// on recharge la page pour servir la dernière version (fini le cache figé).
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  // Vérifie les mises à jour à chaque ouverture et périodiquement.
  navigator.serviceWorker.ready.then((reg) => {
    reg.update()
    setInterval(() => reg.update(), 60 * 1000)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
