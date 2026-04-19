// ============================================================
//  MonsterCard.tsx — Carta de Monstruo
//  Muestra imagen, requisitos, tiradas y botón de ataque
// ============================================================

import { useGameStore } from '../../store/gameStore'
import { CLASS_LABELS } from '../../types'
import type { Monster, CombatValidation } from '../../types'

interface Props {
  monster:    Monster
  validation: CombatValidation
  onAttack:   () => void   // Abre la calculadora de combate
  onZoom:     () => void   // Abre el modal fullscreen
}

export default function MonsterCard({ monster, validation, onAttack, onZoom }: Props) {
  const { canAttack } = validation

  const expansionBadge: Record<string, { label: string; color: string }> = {
    base:                    { label: 'Base',      color: '#7c3aed' },
    warriors_druids:         { label: 'W&D',       color: '#16a34a' },
    berserkers_necromancers: { label: 'B&N',       color: '#dc2626' },
    extra:                   { label: 'Extra',     color: '#f59e0b' },
  }
  const badge = expansionBadge[monster.expansion] ?? { label: monster.expansion, color: '#6b7280' }

  return (
    <div className={`card-glass overflow-hidden flex flex-col h-full
                     transition-all duration-300
                     ${canAttack ? 'border-fantasy-purple/30 shadow-glow-purple' : ''}`}>

      {/* ── Imagen ─────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 cursor-pointer" onClick={onZoom}>
        <img
          src={`/resources/images/monsters/${monster.image}`}
          alt={monster.name}
          className="w-full h-44 object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 image-overlay" />

        {/* Badge expansión */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${badge.color}30`, color: badge.color, border: `1px solid ${badge.color}50` }}>
          {badge.label}
        </span>

        {/* Botón zoom */}
        <button
          onClick={(e) => { e.stopPropagation(); onZoom() }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full glass
                     flex items-center justify-center text-sm
                     hover:bg-white/10 transition-all"
        >
          🔍
        </button>

        {/* Indicador de acceso (si puede atacar) */}
        {canAttack && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full
                          bg-green-900/80 border border-green-500/50 text-green-300
                          text-xs font-semibold animate-pulse">
            ⚔️ Atacable
          </div>
        )}
      </div>

      {/* ── Info ───────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-3 flex-1">

        {/* Nombre */}
        <h3 className="font-display text-white font-bold text-sm leading-tight">
          {monster.name}
        </h3>

        {/* Requisitos */}
        <div className="space-y-1.5">
          <p className="text-xs text-fantasy-muted uppercase tracking-wider">Requisitos</p>
          <div className="flex flex-wrap gap-1.5">
            {/* Héroes totales */}
            <span className="class-badge bg-fantasy-purple/15 text-purple-300 border border-purple-400/25
                             text-xs px-2 py-0.5">
              {monster.req_heroes} {monster.req_heroes === 1 ? 'Héroe' : 'Héroes'}
            </span>
            {/* Clases específicas */}
            {monster.req_classes.map(cls => (
              <span key={cls}
                    className="class-badge bg-fantasy-gold/10 text-yellow-300 border border-yellow-400/25
                               text-xs px-2 py-0.5">
                + {CLASS_LABELS[cls as keyof typeof CLASS_LABELS] ?? cls}
              </span>
            ))}
          </div>

          {/* Razón por la que no puede atacar */}
          {!canAttack && (
            <p className="text-xs text-red-400/80 leading-tight">{validation.reason}</p>
          )}
        </div>

        {/* Tiradas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-green-900/20 border border-green-500/20 p-2 text-center">
            <p className="text-xs text-green-400/70">Matar</p>
            <p className="font-display font-bold text-green-400 text-lg">{monster.target_roll}+</p>
          </div>
          <div className="rounded-lg bg-red-900/20 border border-red-500/20 p-2 text-center">
            <p className="text-xs text-red-400/70">Penalización</p>
            <p className="font-display font-bold text-red-400 text-lg">{monster.penalty_roll}-</p>
          </div>
        </div>

        {/* Botón atacar — al fondo */}
        <div className="mt-auto">
          <button
            onClick={onAttack}
            disabled={!canAttack}
            className={canAttack ? 'btn-primary w-full' : 'btn-ghost w-full opacity-50 cursor-not-allowed'}
          >
            {canAttack ? '⚔️ Atacar' : '🔒 Sin requisitos'}
          </button>
        </div>
      </div>
    </div>
  )
}
