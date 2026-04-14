import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* ToastProvider: 앱 어디서든 toast() 훅 사용 가능 */}
      <ToastProvider>
        {/* AuthProvider: 앱 어디서든 useAuth() 훅 사용 가능 */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
