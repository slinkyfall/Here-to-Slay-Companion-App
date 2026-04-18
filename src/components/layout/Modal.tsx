// ============================================================
//  Modal.tsx — Overlay fullscreen para zoom de cartas
//  Muestra imagen grande + texto completo de efecto/penalización
// ============================================================

import { useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Monster, Banner, Leader } from '../../types'
import { CLASS_LABELS } from '../../types'

// Datos estáticos
import monstersJson from '../../data/monsters.json'
import bannersJson  from '../../data/banners.json'
import leadersJson  from '../../data/leaders.json'

const MONSTERS = monstersJson as Monster[]
const BANNERS  = bannersJson  as Banner[]
const LEADERS  = leadersJson  as Leader[]

// Ruta base de imágenes servidas por Express
const IMG = {
  monster: (file: string) => `/resources/images/monsters/${file}`,
  banner:  (file: string) => `/resources/images/Banners/${file}`,
  leader:  (file: string) => `/resources/images/partyleaders/${file}`,
}

// -------------------------------------------------------------------
// Sub-componentes de contenido por tipo de carta
// -------------------------------------------------------------------

function MonsterContent({ id }: { id: string }) {
  const monster = MONSTERS.find(m => m.id === id)
  if (!monster) return null

  const expansionLabel: Record<string, string> = {
    base:                   'Juego Base',
    warriors_druids:        'Warriors & Druids',
    berserkers_necromancers:'Berserkers & Necromancers',
    extra:                  'Expansión',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Imagen */}
      <div className="relative flex-shrink-0">
        <img
          src={IMG.monster(monster.image)}
          alt={monster.name}
          className="w-full max-h-64 sm:max-h-80 object-cover rounded-t-2xl"
        />
        <div className="absolute inset-0 image-overlay rounded-t-2xl" />

        {/* Badge expansión */}
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold
                         bg-black/60 text-fantasy-gold border border-fantasy-gold/30">
          {expansionLabel[monster.expansion] ?? monster.expansion}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4 overflow-y-auto">
        <h2 className="font-display text-2xl font-bold text-white">
          {monster.name}
        </h2>

        {/* Requisitos */}
        <div className="card-glass p-3 space-y-2">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider font-semibold">
            Requisitos de Party
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="class-badge bg-fantasy-purple/20 text-purple-300 border border-purple-400/30">
              {monster.req_heroes} héroe{monster.req_heroes !== 1 ? 's' : ''}
            </span>
            {monster.req_classes.map(cls => (
              <span key={cls}
                    className="class-badge bg-fantasy-gold/10 text-yellow-300 border border-yellow-400/30">
                + 1 {CLASS_LABELS[cls as keyof typeof CLASS_LABELS] ?? cls}
              </span>
            ))}
          </div>
        </div>

        {/* Tiradas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-glass p-3 text-center">
            <p className="text-xs text-fantasy-muted uppercase tracking-wider">Matar con</p>
            <p className="text-3xl font-display font-bold text-green-400 mt-1">
              {monster.target_roll}+
            </p>
          </div>
          <div className="card-glass p-3 text-center">
            <p className="text-xs text-fantasy-muted uppercase tracking-wider">Penalización</p>
            <p className="text-3xl font-display font-bold text-red-400 mt-1">
              {monster.penalty_roll}-
            </p>
          </div>
        </div>

        {/* Efecto al matar */}
        <div className="card-glass p-3 space-y-1">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <span>✨</span> Efecto al derrotar
          </p>
          <p className="text-sm text-white leading-relaxed">{monster.effect}</p>
        </div>

        {/* Penalización */}
        <div className="card-glass p-3 space-y-1 border-red-500/20">
          <p className="text-xs text-red-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <span>💀</span> Penalización
          </p>
          <p className="text-sm text-red-200 leading-relaxed">{monster.penalty}</p>
        </div>
      </div>
    </div>
  )
}

function BannerContent({ id }: { id: string }) {
  const banner = BANNERS.find(b => b.id === id)
  if (!banner) return null

  return (
    <div className="flex flex-col h-full">
      {/* Imagen */}
      <div className="relative flex-shrink-0">
        <img
          src={IMG.banner(banner.image)}
          alt={banner.name}
          className="w-full max-h-72 sm:max-h-96 object-contain rounded-t-2xl bg-fantasy-surface p-4"
        />
      </div>

      {/* Info */}
      <div className="p-4 space-y-4 overflow-y-auto">
        <h2 className="font-display text-2xl font-bold text-fantasy-gold">
          {banner.name}
        </h2>

        {banner.type === 'class' && banner.class && (
          <span className="class-badge bg-fantasy-purple/20 text-purple-300 border border-purple-400/30">
            Clase: {CLASS_LABELS[banner.class as keyof typeof CLASS_LABELS] ?? banner.class}
          </span>
        )}

        {banner.type === 'class' && banner.claim_threshold && (
          <div className="card-glass p-3">
            <p className="text-xs text-fantasy-muted uppercase tracking-wider">Para reclamar</p>
            <p className="text-sm text-white mt-1">
              Sé el primero en tener <span className="text-fantasy-gold font-bold">{banner.claim_threshold}</span> o
              más héroes de esta clase (incluye tu líder).
            </p>
          </div>
        )}

        <div className="card-glass p-3 space-y-1">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <span>🏆</span> Efecto
          </p>
          <p className="text-sm text-white leading-relaxed">{banner.effect}</p>
        </div>
      </div>
    </div>
  )
}

function LeaderContent({ id }: { id: string }) {
  const leader = LEADERS.find(l => l.id === id)
  if (!leader) return null

  const expansionLabel: Record<string, string> = {
    base:                    'Juego Base',
    warriors_druids:         'Warriors & Druids',
    berserkers_necromancers: 'Berserkers & Necromancers',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Imagen */}
      <div className="relative flex-shrink-0">
        <img
          src={IMG.leader(leader.image)}
          alt={leader.name}
          className="w-full max-h-72 sm:max-h-96 object-cover rounded-t-2xl"
        />
        <div className="absolute inset-0 image-overlay rounded-t-2xl" />
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold
                         bg-black/60 text-fantasy-gold border border-fantasy-gold/30">
          {expansionLabel[leader.expansion] ?? leader.expansion}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4 overflow-y-auto">
        <h2 className="font-display text-xl font-bold text-white leading-tight">
          {leader.name}
        </h2>
        <span className="class-badge bg-fantasy-purple/20 text-purple-300 border border-purple-400/30">
          {CLASS_LABELS[leader.class as keyof typeof CLASS_LABELS] ?? leader.class}
        </span>
        <div className="card-glass p-3 space-y-1">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <span>⚡</span> Habilidad
          </p>
          <p className="text-sm text-white leading-relaxed">{leader.ability}</p>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------
// Modal principal
// -------------------------------------------------------------------

export default function Modal() {
  const { modalCard, closeModal } = useGameStore()

  // Cerrar con Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal()
  }, [closeModal])

  useEffect(() => {
    if (modalCard) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [modalCard, handleKeyDown])

  if (!modalCard) return null

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={closeModal}
      />

      {/* Panel deslizable desde abajo */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up max-h-[90vh]
                      max-w-lg mx-auto">
        <div className="card-glass rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh]"
             onClick={e => e.stopPropagation()}>

          {/* Handle de arrastre visual + botón cerrar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-fantasy-border rounded-full mx-auto" />
            <button
              onClick={closeModal}
              className="absolute right-4 top-3 w-8 h-8 rounded-full glass
                         flex items-center justify-center text-fantasy-muted
                         hover:text-white hover:bg-fantasy-purple/20 transition-all"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Contenido según tipo */}
          <div className="overflow-y-auto flex-1">
            {modalCard.type === 'monster' && <MonsterContent id={modalCard.id} />}
            {modalCard.type === 'banner'  && <BannerContent  id={modalCard.id} />}
            {modalCard.type === 'leader'  && <LeaderContent  id={modalCard.id} />}
          </div>

        </div>
      </div>
    </>
  )
}
