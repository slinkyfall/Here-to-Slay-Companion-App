// ============================================================
//  SetupPage.tsx — Lobby: Crear o unirse a sala + configurar
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useSocket } from '../hooks/useSocket'
import PlayerSetup from '../components/game/PlayerSetup'

type Screen = 'home' | 'create' | 'join' | 'configure'

export default function SetupPage() {
  const navigate                      = useNavigate()
  const { connectionStatus, gameRoom, roomId, showToast } = useGameStore()
  const { createRoom, joinRoom, startGame }               = useSocket()

  const [screen,      setScreen]      = useState<Screen>('home')
  const [joinCode,    setJoinCode]    = useState('')
  const [playerName,  setPlayerName]  = useState('')
  const [loading,     setLoading]     = useState(false)

  // Condiciones de victoria configurables
  const [winSlayMonsters, setWinSlayMonsters] = useState(true)
  const [winFullParty,    setWinFullParty]    = useState(true)
  const [winBannerQuest,  setWinBannerQuest]  = useState(true)

  // Si ya estamos en una partida activa, ir directo al juego
  if (gameRoom?.phase === 'playing' && screen !== 'configure') {
    navigate('/game')
    return null
  }

  // ── Crear sala ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!playerName.trim()) {
      showToast('Escribe tu nombre primero', 'danger')
      return
    }
    setLoading(true)
    try {
      await createRoom({
        winConditions: {
          slayMonsters: winSlayMonsters,
          fullParty:    winFullParty,
          bannerQuest:  winBannerQuest,
        },
      }, playerName.trim())
      setScreen('configure')
    } catch (err: any) {
      showToast(err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  // ── Unirse a sala ───────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinCode.trim()) {
      showToast('Introduce el código de sala', 'danger')
      return
    }
    if (!playerName.trim()) {
      showToast('Escribe tu nombre primero', 'danger')
      return
    }
    setLoading(true)
    try {
      await joinRoom(joinCode.trim().toUpperCase(), playerName.trim())
      setScreen('configure')
    } catch (err: any) {
      showToast(err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  // ── Iniciar partida (solo admin) ────────────────────────────
  const handleStart = async () => {
    setLoading(true)
    try {
      await startGame()
      navigate('/game')
    } catch (err: any) {
      showToast(err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  // ── Ir al juego (jugador no-admin, espera que el admin inicie) ──
  const handleGoToGame = () => navigate('/game')

  const players  = gameRoom?.players ?? []
  const myPlayer = gameRoom?.players.find(p => p.id === useGameStore.getState().myPlayerId)
  const isAdmin  = myPlayer?.isAdmin ?? false

  // ── Pantallas ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 pb-8">

        {/* ── HOME ─────────────────────────────────────────── */}
        {screen === 'home' && (
          <div className="space-y-8 animate-fade-in">

            {/* Hero */}
            <div className="text-center pt-8 space-y-3">
              <div className="text-6xl">⚔️</div>
              <h1 className="font-display text-3xl font-black text-fantasy-gold"
                  style={{ textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
                Here to Slay
              </h1>
              <p className="text-fantasy-muted text-sm">App Companion — Edición Definitiva</p>

              {/* Estado de conexión */}
              <div className="flex items-center justify-center gap-2">
                <span className={`connection-dot ${connectionStatus}`} />
                <span className="text-xs text-fantasy-muted">
                  {connectionStatus === 'connected'    ? 'Servidor conectado' :
                   connectionStatus === 'connecting'   ? 'Conectando al servidor…' :
                                                         'Sin conexión — inicia el servidor'}
                </span>
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label className="section-title block" htmlFor="setup-name">
                👤 Tu nombre de jugador
              </label>
              <input
                id="setup-name"
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setScreen('create')}
                placeholder="Ej: Slinky, El Devastador…"
                maxLength={20}
                className="input-fantasy text-base"
                disabled={connectionStatus !== 'connected'}
              />
            </div>

            {/* Botones principales */}
            <div className="space-y-3">
              <button
                onClick={() => setScreen('create')}
                disabled={connectionStatus !== 'connected' || !playerName.trim()}
                className="btn-gold w-full py-4 text-base"
              >
                🏰 Crear Nueva Partida
              </button>
              <button
                onClick={() => setScreen('join')}
                disabled={connectionStatus !== 'connected' || !playerName.trim()}
                className="btn-primary w-full py-4 text-base"
              >
                🚪 Unirse a Sala Existente
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="btn-ghost w-full py-3 text-sm"
              >
                🛡️ Panel de Admin (PC)
              </button>
            </div>
          </div>
        )}

        {/* ── CREAR SALA ──────────────────────────────────── */}
        {screen === 'create' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <button onClick={() => setScreen('home')} className="text-fantasy-muted hover:text-white transition-colors">
                ← Volver
              </button>
              <h2 className="section-title">🏰 Nueva Partida</h2>
            </div>

            {/* Condiciones de victoria */}
            <div className="card-glass p-4 space-y-3">
              <p className="section-title text-sm">🏆 Condiciones de Victoria</p>
              <p className="text-xs text-fantasy-muted">
                La primera condición que se cumpla gana la partida.
              </p>

              {[
                { id: 'slay',   label: '⚔️ Derrotar 3 Monstruos',           value: winSlayMonsters, set: setWinSlayMonsters },
                { id: 'party',  label: '🧙 Party completo (6 clases distintas)', value: winFullParty,    set: setWinFullParty    },
                { id: 'banner', label: '🚩 Conseguir 3 o más Banners',       value: winBannerQuest,  set: setWinBannerQuest  },
              ].map(({ id, label, value, set }) => (
                <label key={id}
                       className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => set(!value)}
                    className={`w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0
                      ${value ? 'bg-fantasy-purple' : 'bg-fantasy-border'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow
                                      transition-all duration-200
                                      ${value ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <span className={`text-sm transition-colors ${value ? 'text-white' : 'text-fantasy-muted'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-gold w-full py-4 text-base"
            >
              {loading ? '⏳ Creando sala…' : '✅ Crear Sala'}
            </button>
          </div>
        )}

        {/* ── UNIRSE ──────────────────────────────────────── */}
        {screen === 'join' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <button onClick={() => setScreen('home')} className="text-fantasy-muted hover:text-white transition-colors">
                ← Volver
              </button>
              <h2 className="section-title">🚪 Unirse a Sala</h2>
            </div>

            <div className="space-y-2">
              <label className="section-title block text-sm" htmlFor="join-code">
                Código de Sala
              </label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Ej: ABC123"
                maxLength={6}
                className="input-fantasy text-center text-2xl tracking-widest font-display uppercase"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || !joinCode.trim()}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? '⏳ Uniéndose…' : '🚀 Unirse'}
            </button>
          </div>
        )}

        {/* ── CONFIGURAR JUGADOR (después de crear/unirse) ── */}
        {screen === 'configure' && (
          <div className="space-y-6 animate-fade-in">
            {/* Info de sala */}
            {roomId && (
              <div className="card-glass p-3 text-center">
                <p className="text-xs text-fantasy-muted uppercase tracking-wider">Código de Sala</p>
                <p className="font-display text-3xl font-black text-fantasy-gold tracking-widest">
                  {roomId}
                </p>
                <p className="text-xs text-fantasy-muted mt-1">
                  Comparte este código con los demás jugadores
                </p>
              </div>
            )}

            {/* Jugadores conectados */}
            {players.length > 0 && (
              <div className="card-glass p-3 space-y-2">
                <p className="text-xs text-fantasy-muted uppercase tracking-wider">
                  Jugadores ({players.length}/6)
                </p>
                <div className="flex flex-wrap gap-2">
                  {players.map(p => (
                    <div key={p.id}
                         className="flex items-center gap-1.5 px-2 py-1 rounded-full
                                    bg-fantasy-border/30 border border-fantasy-border">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.leaderId ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-xs text-white">{p.name}</span>
                      {p.isAdmin && <span className="text-xs text-fantasy-gold">👑</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuración del jugador */}
            <PlayerSetup onReady={() => {
              if (isAdmin) {
                // Admin espera a que todos estén listos
              } else {
                showToast('¡Listo! Espera a que el admin inicie.', 'info')
              }
            }} />

            {/* Botón de inicio — solo admin */}
            {isAdmin && (
              <div className="space-y-3 pt-2">
                <div className="h-px bg-fantasy-border/50" />
                <p className="text-xs text-fantasy-muted text-center">
                  Como Anfitrión, tú decides cuándo empezar.
                </p>
                <button
                  onClick={handleStart}
                  disabled={loading || players.length < 2}
                  className="btn-gold w-full py-4 text-base"
                >
                  {loading ? '⏳ Iniciando…' :
                   players.length < 2 ? `Esperando jugadores (${players.length}/2)` :
                   `▶️ ¡Iniciar Partida (${players.length} jugadores)!`}
                </button>
              </div>
            )}

            {/* No admin: esperar */}
            {!isAdmin && (
              <div className="space-y-3 pt-2">
                <div className="card-glass p-3 text-center text-sm text-fantasy-muted">
                  ⏳ Esperando que el Anfitrión inicie la partida…
                </div>
                {gameRoom?.phase === 'playing' && (
                  <button onClick={handleGoToGame} className="btn-primary w-full">
                    ⚔️ ¡La partida comenzó! Entrar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
