import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext' // <-- Importamos

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider> {/* <-- Envolvemos */}
      <App />
    </LanguageProvider>
  </StrictMode>,
)