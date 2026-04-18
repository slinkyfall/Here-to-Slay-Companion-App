// ============================================================
//  BannerGrid.tsx — Grid de los 11 banners con ownership
// ============================================================

import { useGameStore } from '../../store/gameStore'
import { useGameLogic } from '../../hooks/useGameLogic'
import { CLASS_LABELS } from '../../types'
import type { Banner, Player } from '../../types'

function BannerTile({ banner, owner, isMe, onZoom }: {
  banner: Banner
  owner:  Player | null
  isMe:   boolean
  onZoom: () => void
}) {
  const owned  = !!owner
  const trophy = banner.type === 'trophy'

  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer
                  transition-all duration-300 active:scale-95
                  ${owned   ? 'ring-2 ring-fantasy-gold shadow-glow-gold animate-pulse-glow' : 'opacity-60'}
                  ${isMe    ? 'ring-2 ring-green-400 shadow-glow-green' : ''}
                  ${trophy  ? 'col-span-2 sm:col-span-1' : ''}`}
      onClick={onZoom}
    >
      {/* Imagen del banner */}
      <img
        src={`/resources/images/Banners/${banner.image}`}
        alt={banner.name}
        className="w-full aspect-[2/3] object-cover"
        loading="lazy"
      />

      {/* Overlay si no está reclamado */}
      {!owned && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Overlay del dueño */}
      {owner && (
        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/70">
          <p className={`text-xs font-bold text-center truncate
                         ${isMe ? 'text-green-300' : 'text-white'}`}>
            {isMe ? '⭐ Tú' : owner.name}
          </p>
        </div>
      )}

      {/* Badge tipo */}
      {trophy && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold
                        bg-fantasy-gold/20 text-yellow-300 border border-yellow-400/30">
          🏆
        </div>
      )}
    </div>
  )
}

export default function BannerGrid() {
  const { gameRoom, myPlayerId, openModal } = useGameStore()
  const { myBanners } = useGameLogic()

  const banners = gameRoom?.banners ?? []
  const players = gameRoom?.players ?? []

  const classBanners = banners.filter(b => b.type === 'class')
  const trophy       = banners.find(b => b.type === 'trophy')

  const getOwner = (b: Banner): Player | null =>
    b.ownedBy ? (players.find(p => p.id === b.ownedBy) ?? null) : null

  const myBannerCount = myBanners.length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">🚩 Banners</h2>
        {myBannerCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold
                           bg-fantasy-gold/20 text-yellow-300 border border-yellow-400/30">
            Tienes {myBannerCount} banner{myBannerCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Trofeo del Cazador — destacado */}
      {trophy && (
        <div className="space-y-2">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider">Trofeo del Cazador</p>
          <div className="w-32 mx-auto">
            <BannerTile
              banner={trophy}
              owner={getOwner(trophy)}
              isMe={trophy.ownedBy === myPlayerId}
              onZoom={() => openModal({ type: 'banner', id: trophy.id })}
            />
          </div>
          <p className="text-xs text-fantasy-muted text-center">
            {trophy.ownedBy
              ? `Dueño: ${getOwner(trophy)?.name}`
              : 'Derrota el primer monstruo para reclamarlo'}
          </p>
        </div>
      )}

      {/* Banners de clase */}
      <div>
        <p className="text-xs text-fantasy-muted uppercase tracking-wider mb-2">Banners de Clase</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {classBanners.map(banner => {
            const owner  = getOwner(banner)
            const isMe   = banner.ownedBy === myPlayerId
            return (
              <div key={banner.id} className="space-y-1">
                <BannerTile
                  banner={banner}
                  owner={owner}
                  isMe={isMe}
                  onZoom={() => openModal({ type: 'banner', id: banner.id })}
                />
                <p className="text-center text-xs text-fantasy-muted truncate">
                  {CLASS_LABELS[banner.class as keyof typeof CLASS_LABELS] ?? banner.class}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reglas de banners */}
      <div className="card-glass p-3 space-y-1.5 text-xs text-fantasy-muted">
        <p className="font-semibold text-white text-xs uppercase tracking-wider mb-1">
          📜 Reglas de Banners
        </p>
        <p>• Recláma cuando tengas ≥3 de una clase (líder incluido).</p>
        <p>• Si tienes <em>más</em> que el dueño, se lo arrebatas.</p>
        <p>• Empate con el dueño → el dueño lo conserva.</p>
        <p>• Empate sin dueño → se asigna en sentido horario desde el dueño anterior.</p>
      </div>
    </section>
  )
}
