// ============================================================
//  AdminPage.tsx — Vista de administración para el PC anfitrión
// ============================================================

import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useSocket }    from '../hooks/useSocket'
import AdminConsole     from '../components/admin/AdminConsole'

export default function AdminPage() {
  const navigate               = useNavigate()
  const { gameRoom, showToast, myPlayerId } = useGameStore()
  const { createRoom }         = useSocket()

  const [creating, setCreating] = [false, (_: boolean) => {}]  // Placeholder local

  // Crear sala desde el panel admin (sin nombre de jugador — el admin es solo observador)
  const handleCreateAsAdmin = async () => {
    try {
      await createRoom()
    } catch (err: any) {
      showToast(err.message, 'danger')
    }
  }

  return (
    <div className="min-h-screen pb-8">
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Cabecera */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Panel de Admin</h1>
            <p className="text-xs text-fantasy-muted">Vista del PC anfitrión</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-ghost text-sm px-3 py-1.5">
            ← Volver al Lobby
          </button>
        </div>

        {/* Sin sala activa */}
        {!gameRoom ? (
          <div className="card-glass p-8 text-center space-y-4">
            <p className="text-4xl">🏰</p>
            <p className="font-display text-fantasy-gold text-xl font-bold">Sin partida activa</p>
            <p className="text-fantasy-muted text-sm">
              Crea una sala desde el Lobby o espera que los jugadores se conecten.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => navigate('/')} className="btn-gold">
                🎮 Ir al Lobby
              </button>
              <button onClick={handleCreateAsAdmin} className="btn-primary">
                🏰 Crear Sala Rápida
              </button>
            </div>
          </div>
        ) : (
          <AdminConsole />
        )}

        {/* Enlace al juego */}
        {gameRoom?.phase === 'playing' && (
          <button onClick={() => navigate('/game')} className="btn-primary w-full">
            ⚔️ Ver Vista del Jugador
          </button>
        )}

      </main>
    </div>
  )
}
