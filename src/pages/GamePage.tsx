// ============================================================
//  GamePage.tsx — Vista principal del juego (móvil)
//  4 tabs: Tablero | Party | Banners | Combate
// ============================================================

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useGameLogic } from '../hooks/useGameLogic'
import NavBar             from '../components/layout/NavBar'
import MonsterArena       from '../components/game/MonsterArena'
import PlayerBoard        from '../components/game/PlayerBoard'
import BannerGrid         from '../components/game/BannerGrid'
import CombatCalculator   from '../components/game/CombatCalculator'

export default function GamePage() {
  const navigate   = useNavigate()
  const { activeTab, gameRoom, myPlayerId } = useGameStore()
  const { myPlayer, players }               = useGameLogic()

  // Si no hay partida activa, volver al setup
  useEffect(() => {
    if (!gameRoom) navigate('/')
  }, [gameRoom, navigate])

  if (!gameRoom) return null

  const winner     = gameRoom.winner
  const winnerName = players.find(p => p.id === winner?.playerId)?.name ?? ''

  return (
    <div className="flex flex-col min-h-screen pb-20">

      {/* ── Banner de victoria ───────────────────────────────── */}
      {winner && (
        <div className="bg-fantasy-gold/10 border-b border-fantasy-gold/30 px-4 py-3
                        flex items-center justify-center gap-2 animate-banner-claim">
          <span className="text-2xl">🎉</span>
          <p className="font-display text-fantasy-gold font-bold text-sm">
            ¡{winnerName} ganó la partida!
          </p>
          <span className="text-2xl">🎉</span>
        </div>
      )}

      {/* ── Contenido de cada tab ───────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4 overflow-y-auto">

        {/* TABLERO: Monstruos activos */}
        {activeTab === 'tablero' && (
          <div className="space-y-4 animate-fade-in">
            <MonsterArena />

            {/* Resumen rápido: banners activos */}
            {gameRoom.banners.some(b => b.ownedBy) && (
              <div className="card-glass p-3 space-y-2">
                <p className="text-xs text-fantasy-muted uppercase tracking-wider">Banners Reclamados</p>
                <div className="flex flex-wrap gap-2">
                  {gameRoom.banners
                    .filter(b => b.ownedBy)
                    .map(b => {
                      const owner = players.find(p => p.id === b.ownedBy)
                      const isMe  = b.ownedBy === myPlayerId
                      return (
                        <div key={b.id} className="flex items-center gap-1.5
                                                    px-2 py-1 rounded-full border
                                                    bg-fantasy-gold/10 border-fantasy-gold/30">
                          <img
                            src={`/resources/images/Banners/${b.image}`}
                            alt={b.name}
                            className="h-4 w-auto"
                          />
                          <span className={`text-xs font-semibold ${isMe ? 'text-green-300' : 'text-white'}`}>
                            {isMe ? 'Tú' : owner?.name}
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )}

            {/* Turno actual */}
            {players.length > 0 && (
              <div className="card-glass p-3 flex items-center justify-between">
                <p className="text-xs text-fantasy-muted uppercase tracking-wider">Turno</p>
                <p className="font-display text-white font-bold text-sm">
                  {players[gameRoom.turnIndex % players.length]?.name ?? '—'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PARTY: Mi party + todos los demás */}
        {activeTab === 'party' && (
          <div className="space-y-4 animate-fade-in">
            {/* Mi party */}
            {myPlayer && (
              <div className="space-y-2">
                <p className="section-title">⭐ Mi Party</p>
                <PlayerBoard player={myPlayer} isMe />
              </div>
            )}

            {/* Parties de los demás */}
            {players.filter(p => p.id !== myPlayerId).length > 0 && (
              <div className="space-y-2">
                <p className="section-title">👥 Otros Jugadores</p>
                <div className="space-y-3">
                  {players
                    .filter(p => p.id !== myPlayerId)
                    .map(p => (
                      <PlayerBoard key={p.id} player={p} readOnly />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BANNERS: Grid de banners */}
        {activeTab === 'banners' && (
          <div className="animate-fade-in">
            <BannerGrid />
          </div>
        )}

        {/* COMBATE: Calculadora */}
        {activeTab === 'combate' && (
          <div className="animate-fade-in">
            <CombatCalculator />
          </div>
        )}

      </main>

      {/* Barra de navegación inferior */}
      <NavBar />
    </div>
  )
}
