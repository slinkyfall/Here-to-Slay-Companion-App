// ============================================================
//  LeaderCard.tsx — Carta de Líder de Party
// ============================================================

import { CLASS_LABELS, CLASS_COLORS } from '../../types'
import type { Leader } from '../../types'

interface Props {
  leader:     Leader
  selected?:  boolean
  onSelect?:  () => void
  onZoom?:    () => void
  compact?:   boolean   // Vista reducida para selección
}

export default function LeaderCard({ leader, selected, onSelect, onZoom, compact }: Props) {
  const classColor = CLASS_COLORS[leader.class] ?? '#7c3aed'
  const classLabel = CLASS_LABELS[leader.class] ?? leader.class

  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`relative rounded-xl overflow-hidden transition-all duration-200
                    active:scale-95 w-full aspect-[2/3]
                    ${selected
                      ? 'ring-2 ring-fantasy-gold shadow-glow-gold'
                      : 'ring-1 ring-fantasy-border hover:ring-fantasy-purple/50'
                    }`}
      >
        <img
          src={`/resources/images/partyleaders/${leader.image}`}
          alt={leader.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 image-overlay" />
        {/* Badge de clase */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-semibold leading-tight truncate">
            {leader.name.replace('The ', '')}
          </p>
          <span className="text-xs font-bold"
                style={{ color: classColor }}>
            {classLabel}
          </span>
        </div>
        {/* Check si seleccionado */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-fantasy-gold
                          flex items-center justify-center text-fantasy-bg text-xs font-bold">
            ✓
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={`card-glass overflow-hidden transition-all duration-200
                     ${selected ? 'border-fantasy-gold/50 shadow-glow-gold' : ''}`}>
      {/* Imagen con overlay */}
      <div className="relative">
        <img
          src={`/resources/images/partyleaders/${leader.image}`}
          alt={leader.name}
          className="w-full h-40 object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 image-overlay" />

        {/* Badge clase */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
             style={{ backgroundColor: `${classColor}30`, color: classColor, border: `1px solid ${classColor}50` }}>
          {classLabel}
        </div>

        {/* Botón zoom */}
        <button
          onClick={onZoom}
          className="absolute top-2 right-2 w-7 h-7 rounded-full glass
                     flex items-center justify-center text-sm
                     hover:bg-fantasy-purple/30 transition-all"
          title="Ver detalle"
        >
          🔍
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-display text-white text-sm font-semibold leading-tight">
          {leader.name}
        </h3>
        <p className="text-xs text-fantasy-muted leading-relaxed line-clamp-3">
          {leader.ability}
        </p>
      </div>
    </div>
  )
}
