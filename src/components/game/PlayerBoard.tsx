// ============================================================
//  PlayerBoard.tsx — Party del jugador: líder + contadores de clase
// ============================================================

import { useGameStore } from '../../store/gameStore'
import { useGameLogic } from '../../hooks/useGameLogic'
import { useSocket } from '../../hooks/useSocket'
import { ALL_CLASSES, CLASS_LABELS, CLASS_COLORS } from '../../types'
import type { Player, Leader } from '../../types'
import leadersJson from '../../data/leaders.json'

const LEADERS = leadersJson as Leader[]

interface Props {
  player:    Player
  isMe?:     boolean
  readOnly?: boolean   // Vista de solo lectura (admin o party de otro jugador)
}

export default function PlayerBoard({ player, isMe, readOnly }: Props) {
  const { openModal, showToast } = useGameStore()
  const { gameRoom }             = useGameLogic()
  const { updateClassCount }     = useSocket()

  const handleDelta = async (className: string, delta: 1 | -1) => {
    if (readOnly) return
    try {
      await updateClassCount(className, delta, player.id)
    } catch (err: any) {
      showToast(err.message, 'danger')
    }
  }

  // Total de héroes en el party
  const totalHeroes = Object.values(player.classCounts).reduce((a, b) => a + b, 0)

  // Clases que tiene al menos 1 héroe o el líder
  const activeClasses = ALL_CLASSES.filter(cls =>
    (player.classCounts[cls] ?? 0) > 0 || player.leaderClass === cls
  )

  // Banners que posee
  const playerBanners = gameRoom?.banners.filter(b => b.ownedBy === player.id) ?? []

  return (
    <div className={`card-glass overflow-hidden
                     ${isMe ? 'border-fantasy-gold/30' : ''}`}>

      {/* ── Cabecera: Líder ─────────────────────────────────── */}
      <div className="relative">
        {player.leaderId ? (
        <>
            <img
              src={`/resources/images/partyleaders/${
                LEADERS.find(l => l.id === player.leaderId)?.image ?? 'TheCharismaticSong.png'
              }`}
              alt="Líder"
              className="w-full h-28 object-cover object-top cursor-pointer"
              onClick={() => player.leaderId && openModal({ type: 'leader', id: player.leaderId })}
            />
            <div className="absolute inset-0 image-overlay" />
          </>
        ) : (
          <div className="w-full h-16 bg-fantasy-border/20 flex items-center justify-center">
            <p className="text-fantasy-muted text-xs">Sin líder</p>
          </div>
        )}

        {/* Nombre del jugador */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center gap-2">
            <p className={`font-display font-bold text-sm truncate
                           ${isMe ? 'text-fantasy-gold' : 'text-white'}`}>
              {isMe ? '⭐ ' : ''}{player.name}
            </p>
            {player.isAdmin && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-fantasy-purple/30
                               text-purple-300 border border-purple-400/30 flex-shrink-0">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-fantasy-muted">
            {totalHeroes} héroe{totalHeroes !== 1 ? 's' : ''}
            {player.slainMonsters.length > 0 && ` · ${player.slainMonsters.length} 💀`}
          </p>
        </div>
      </div>

      {/* ── Banners del jugador ─────────────────────────────── */}
      {playerBanners.length > 0 && (
        <div className="px-3 py-2 border-b border-fantasy-border/50 flex gap-1.5 overflow-x-auto">
          {playerBanners.map(b => (
            <img
              key={b.id}
              src={`/resources/images/Banners/${b.image}`}
              alt={b.name}
              title={b.name}
              className="h-8 w-auto rounded cursor-pointer hover:scale-110 transition-transform"
              onClick={() => openModal({ type: 'banner', id: b.id })}
            />
          ))}
        </div>
      )}

      {/* ── Contadores de clase ──────────────────────────────── */}
      <div className="p-3 space-y-2">
        {ALL_CLASSES.map(cls => {
          const count      = player.classCounts[cls] ?? 0
          const isLeader   = player.leaderClass === cls
          const total      = count + (isLeader ? 1 : 0)
          const color      = CLASS_COLORS[cls]
          const hasAny     = total > 0

          return (
            <div key={cls}
                 className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all
                             ${hasAny ? 'bg-fantasy-border/20' : 'opacity-40'}`}>

              {/* Color dot */}
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }} />

              {/* Nombre de clase */}
              <span className={`text-xs font-semibold flex-1
                                ${hasAny ? 'text-white' : 'text-fantasy-muted'}`}>
                {CLASS_LABELS[cls]}
                {isLeader && (
                  <span className="ml-1 text-fantasy-gold text-xs">(Líder)</span>
                )}
              </span>

              {/* Contadores */}
              {!readOnly ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDelta(cls, -1)}
                    disabled={count <= 0}
                    className="counter-btn counter-btn-minus w-6 h-6 text-base disabled:opacity-30"
                  >−</button>

                  <span className={`font-display font-bold text-sm w-5 text-center
                                   ${total >= 3 ? 'text-fantasy-gold' : 'text-white'}`}>
                    {total}
                  </span>

                  <button
                    onClick={() => handleDelta(cls, +1)}
                    disabled={count >= 5}
                    className="counter-btn counter-btn-plus w-6 h-6 text-base disabled:opacity-30"
                  >+</button>
                </div>
              ) : (
                <span className={`font-display font-bold text-sm w-5 text-center
                                 ${total >= 3 ? 'text-fantasy-gold' : 'text-white'}`}>
                  {total}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
