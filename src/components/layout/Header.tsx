// ============================================================
//  Header.tsx — Cabecera de la app
//  Muestra: título, código de sala, estado de conexión
// ============================================================

import { useGameStore } from '../../store/gameStore'

export default function Header() {
  const { connectionStatus, roomId, gameRoom } = useGameStore()

  const statusLabel = {
    connected:    'Conectado',
    disconnected: 'Sin conexión',
    connecting:   'Conectando…',
  }[connectionStatus]

  const playerCount = gameRoom?.players.length ?? 0

  return (
    <header className="sticky top-0 z-40 glass border-b border-fantasy-border/50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Título */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">⚔️</span>
          <h1 className="font-display text-fantasy-gold font-bold text-sm sm:text-base truncate"
              style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            Here to Slay
          </h1>
        </div>

        {/* Centro: código de sala + jugadores */}
        {roomId && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="card-glass px-3 py-1 flex items-center gap-2">
              <span className="text-fantasy-muted text-xs">Sala</span>
              <span className="font-display text-white font-bold text-sm tracking-widest">
                {roomId}
              </span>
              {playerCount > 0 && (
                <span className="text-fantasy-muted text-xs">· {playerCount}👤</span>
              )}
            </div>
          </div>
        )}

        {/* Estado de conexión */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`connection-dot ${connectionStatus}`} />
          <span className="text-fantasy-muted text-xs hidden sm:inline">{statusLabel}</span>
        </div>

      </div>
    </header>
  )
}
