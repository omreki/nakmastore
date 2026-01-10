import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { StoreSettingsProvider } from './context/StoreSettingsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <StoreSettingsProvider>
          <App />
        </StoreSettingsProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
