import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import Header  from './components/layout/Header'
import Modal   from './components/layout/Modal'
import Toast   from './components/layout/Toast'
import SetupPage from './pages/SetupPage'
import GamePage  from './pages/GamePage'
import AdminPage from './pages/AdminPage'

// Componente interno que activa la conexión socket al montar la app
function AppContent() {
  // Inicializar socket (conexión + listeners) una sola vez
  useSocket()

  return (
    <>
      {/* Layout global: siempre visible */}
      <Header />
      <Modal />
      <Toast />

      {/* Rutas */}
      <Routes>
        <Route path="/"      element={<SetupPage />} />
        <Route path="/game"  element={<GamePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
