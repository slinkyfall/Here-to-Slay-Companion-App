// ============================================================
//  PlayerSetup.tsx — Configuración de jugador antes de iniciar
//  Nombre + selección de líder + orden de asientos
// ============================================================

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useSocket } from '../../hooks/useSocket'
import LeaderCard from './LeaderCard'
import type { Leader } from '../../types'
import leadersJson from '../../data/leaders.json'

const LEADERS = leadersJson as Leader[]

interface Props {
  onReady?: () => void
}

export default function PlayerSetup({ onReady }: Props) {
  const { showToast, gameRoom, myPlayerId } = useGameStore()
  const { setLeader, setPlayerName }        = useSocket()

  const myPlayer = gameRoom?.players.find(p => p.id === myPlayerId)

  const [name,             setName]             = useState(myPlayer?.name ?? '')
  const [selectedLeaderId, setSelectedLeaderId] = useState(myPlayer?.leaderId ?? '')
  const [saving,           setSaving]           = useState(false)

  const selectedLeader = LEADERS.find(l => l.id === selectedLeaderId)

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Escribe tu nombre de jugador', 'danger')
      return
    }
    if (!selectedLeaderId) {
      showToast('Selecciona un Líder de Party', 'danger')
      return
    }
    setSaving(true)
    try {
      await setPlayerName(name.trim())
      await setLeader(selectedLeaderId, selectedLeader!.class)
      showToast('¡Configuración guardada!', 'success')
      onReady?.()
    } catch (err: any) {
      showToast(err.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  // Agrupar líderes por expansión
  const expansionGroups: Record<string, { label: string; leaders: Leader[] }> = {
    base: {
      label: 'Juego Base',
      leaders: LEADERS.filter(l => l.expansion === 'base')
    },
    warriors_druids: {
      label: 'Warriors & Druids',
      leaders: LEADERS.filter(l => l.expansion === 'warriors_druids')
    },
    berserkers_necromancers: {
      label: 'Berserkers & Necromancers',
      leaders: LEADERS.filter(l => l.expansion === 'berserkers_necromancers')
    },
  }

  return (
    <div className="space-y-6">

      {/* ── Nombre del jugador ─────────────────────────────── */}
      <div className="space-y-2">
        <label className="section-title block" htmlFor="player-name">
          👤 Tu Nombre
        </label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Slinky, El Devastador…"
          maxLength={20}
          className="input-fantasy"
        />
      </div>

      {/* ── Selección de Líder ──────────────────────────────── */}
      <div className="space-y-3">
        <p className="section-title">⚔️ Elige tu Líder de Party</p>

        {selectedLeader && (
          <div className="card-glass p-3 flex items-center gap-3 border-fantasy-gold/30">
            <img
              src={`/resources/images/partyleaders/${selectedLeader.image}`}
              alt={selectedLeader.name}
              className="w-12 h-12 rounded-lg object-cover object-top flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{selectedLeader.name}</p>
              <p className="text-xs text-fantasy-muted leading-tight line-clamp-2">
                {selectedLeader.ability}
              </p>
            </div>
            <span className="text-green-400 text-xl flex-shrink-0">✓</span>
          </div>
        )}

        {Object.entries(expansionGroups).map(([key, { label, leaders }]) => (
          leaders.length > 0 && (
            <div key={key} className="space-y-2">
              <p className="text-xs text-fantasy-muted uppercase tracking-wider">{label}</p>
              <div className="grid grid-cols-3 gap-2">
                {leaders.map(leader => (
                  <LeaderCard
                    key={leader.id}
                    leader={leader}
                    compact
                    selected={selectedLeaderId === leader.id}
                    onSelect={() => setSelectedLeaderId(leader.id)}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* ── Botón Guardar ───────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || !selectedLeaderId}
        className="btn-gold w-full py-3 text-base"
      >
        {saving ? '⏳ Guardando…' : '✅ Confirmar y Listo'}
      </button>
    </div>
  )
}
