import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Configura StatusBar e SplashScreen para mobile
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Esconde a splash screen após carregar
window.addEventListener('load', async () => {
  try {
    await StatusBar.setBackgroundColor({ color: '#0a0a0f' })
    await StatusBar.setStyle({ style: 'DARK' })
    await SplashScreen.hide()
  } catch (e) {
    // Ignora erros se não estiver no mobile
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)