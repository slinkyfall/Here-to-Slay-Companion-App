// ============================================================
//  AdminConsole.tsx — Panel de control para el PC (admin)
//  Muestra todos los parties, permite correcciones y reset
// ============================================================

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGameLogic } from '../../hooks/useGameLogic'
import { useSocket } from '../../hooks/useSocket'
import PlayerBoard from '../game/PlayerBoard'
import { ALL_CLASSES, CLASS_LABELS } from '../../types'
import type { Player } from '../../types'

export default function AdminConsole() {
  const { gameRoom, showToast } = useGameStore()
  const { players } = useGameLogic()
  const { adminForceUpdate, resetGame, startGame } = useSocket()

  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  if (!gameRoom) return (
    <div className="flex items-center justify-center h-40 text-fantasy-muted text-sm">
      No hay partida activa
    </div>
  )

  // ── Forzar ajuste de clase ──────────────────────────────────
  const handleForceClass = async (playerId: string, className: string, value: number) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return
    const newCounts = { ...player.classCounts, [className]: Math.max(0, value) }
    try {
      await adminForceUpdate({ playerId, field: 'classCounts', value: newCounts })
      showToast(`Clase "${CLASS_LABELS[className as keyof typeof CLASS_LABELS]}" ajustada`, 'success')
    } catch (err: any) {
      showToast(err.message, 'danger')
    }
  }

  // ── Iniciar partida ─────────────────────────────────────────
  const handleStartGame = async () => {
    try {
      await startGame()
      showToast('¡Partida iniciada!', 'success')
    } catch (err: any) {
      showToast(err.message, 'danger')
    }
  }

  // ── Reset ───────────────────────────────────────────────────
  const handleReset = async () => {
    setResetting(true)
    try {
      await resetGame()
      showToast('Partida reiniciada', 'info')
      setShowResetConfirm(false)
    } catch (err: any) {
      showToast(err.message, 'danger')
    } finally {
      setResetting(false)
    }
  }

  const phase = gameRoom.phase

  return (
    <div className="space-y-6">

      {/* ── Estado de la partida ────────────────────────────── */}
      <div className="card-glass p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="section-title">🛠️ Panel de Admin</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border
              ${phase === 'setup' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30' :
                phase === 'playing' ? 'bg-green-900/30  text-green-300  border-green-500/30' :
                  'bg-purple-900/30 text-purple-300 border-purple-500/30'}`}>
              {phase === 'setup' ? '⚙️ Configuración' : phase === 'playing' ? '⚔️ En Juego' : '🏆 Finalizada'}
            </span>
          </div>
        </div>

        {/* Info sala */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-display font-bold text-white">{players.length}</p>
            <p className="text-xs text-fantasy-muted">Jugadores</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold text-white">{gameRoom.activeMonsters.length}</p>
            <p className="text-xs text-fantasy-muted">Monstruos activos</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold text-white">{gameRoom.monsterDeck.length}</p>
            <p className="text-xs text-fantasy-muted">En el mazo</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 flex-wrap">
          {phase === 'setup' && (
            <button onClick={handleStartGame} className="btn-gold flex-1">
              ▶️ Iniciar Partida
            </button>
          )}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-danger flex-1"
          >
            🔄 Reiniciar
          </button>
        </div>

        {/* Confirmación reset */}
        {showResetConfirm && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4 space-y-3 animate-fade-in">
            <p className="text-red-300 font-semibold text-sm">
              ⚠️ ¿Reiniciar la partida? Se perderá todo el progreso.
            </p>
            <div className="flex gap-2">
              <button onClick={handleReset} disabled={resetting}
                className="btn-danger flex-1">
                {resetting ? 'Reiniciando…' : 'Sí, reiniciar'}
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                className="btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Log de acciones ─────────────────────────────────── */}
      {gameRoom.actionLog.length > 0 && (
        <div className="card-glass p-4 space-y-2">
          <p className="section-title">📋 Registro de Acciones</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {gameRoom.actionLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-fantasy-muted flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-white/80">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ganador ─────────────────────────────────────────── */}
      {gameRoom.winner && (
        <div className="card-glass p-4 border-fantasy-gold/40 text-center space-y-2
                        bg-fantasy-gold/5 animate-banner-claim">
          <p className="text-3xl">🎉</p>
          <p className="font-display text-fantasy-gold text-xl font-bold">
            {players.find(p => p.id === gameRoom.winner!.playerId)?.name ?? 'Jugador'} ganó
          </p>
          <p className="text-sm text-fantasy-muted">
            Condición: {
              gameRoom.winner.condition === 'monsters' ? '3 Monstruos Derrotados' :
                gameRoom.winner.condition === 'fullParty' ? 'Party Completo' :
                  gameRoom.winner.condition === 'bannerQuest' ? '3+ Banners' : gameRoom.winner.condition
            }
          </p>
        </div>
      )}

      {/* ── Parties de todos los jugadores ──────────────────── */}
      <div className="space-y-3">
        <p className="section-title">👥 Parties de los Jugadores</p>
        {players.length === 0 && (
          <p className="text-fantasy-muted text-sm text-center">Sin jugadores aún</p>
        )}
        {players.map(player => (
          <div key={player.id}>
            <PlayerBoard player={player} readOnly />
          </div>
        ))}
      </div>

      {/* ── Corrección manual rápida ─────────────────────────── */}
      <div className="card-glass p-4 space-y-3">
        <p className="section-title">⚙️ Corrección Manual</p>
        <p className="text-xs text-fantasy-muted">
          Selecciona un jugador y ajusta sus clases directamente.
        </p>

        {/* Selector de jugador */}
        <div className="flex flex-wrap gap-2">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${selectedPlayer?.id === p.id
                  ? 'bg-fantasy-purple/30 border-fantasy-purple text-white'
                  : 'bg-fantasy-surface border-fantasy-border text-fantasy-muted hover:border-fantasy-purple/50'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Ajuste de clases para el jugador seleccionado */}
        {selectedPlayer && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-white font-semibold">{selectedPlayer.name}</p>
            {ALL_CLASSES.map(cls => (
              <div key={cls} className="flex items-center gap-3">
                <span className="text-xs text-fantasy-muted w-24 flex-shrink-0">
                  {CLASS_LABELS[cls]}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleForceClass(
                      selectedPlayer.id, cls,
                      (selectedPlayer.classCounts[cls] ?? 0) - 1
                    )}
                    className="counter-btn counter-btn-minus w-6 h-6 text-sm"
                  >−</button>
                  <span className="text-white text-sm font-bold w-4 text-center">
                    {selectedPlayer.classCounts[cls] ?? 0}
                  </span>
                  <button
                    onClick={() => handleForceClass(
                      selectedPlayer.id, cls,
                      (selectedPlayer.classCounts[cls] ?? 0) + 1
                    )}
                    className="counter-btn counter-btn-plus w-6 h-6 text-sm"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
