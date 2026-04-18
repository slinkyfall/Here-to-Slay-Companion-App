// ============================================================
//  CombatCalculator.tsx — Calculadora de Combate
//  Dados 2d6 animados + modificadores + resultado en tiempo real
// ============================================================

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGameLogic } from '../../hooks/useGameLogic'
import { useSocket } from '../../hooks/useSocket'

const DIE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅']

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={`w-16 h-16 rounded-xl card-glass flex items-center justify-center
                     text-4xl select-none transition-all duration-300
                     ${rolling ? 'animate-dice-roll scale-110' : ''}`}>
      {value > 0 ? DIE_FACES[value - 1] : '🎲'}
    </div>
  )
}

export default function CombatCalculator() {
  const {
    diceRoll, modifiers, selectedMonsterId,
    setDiceRoll, addModifier, removeModifier, clearCombat,
    setCombatResult, setSelectedMonster, openModal, showToast,
  } = useGameStore()

  const { selectedMonster, liveResult, huntersTrophyBonus, finalRoll } = useGameLogic()
  const { slayMonster } = useSocket()

  const [rolling, setRolling]   = useState(false)
  const [die1, setDie1]         = useState(0)
  const [die2, setDie2]         = useState(0)

  // ── Tirar los dados ─────────────────────────────────────────
  const handleRoll = () => {
    if (rolling) return
    setRolling(true)
    clearCombat()

    // Animación: valores aleatorios durante 600ms
    const interval = setInterval(() => {
      setDie1(Math.ceil(Math.random() * 6))
      setDie2(Math.ceil(Math.random() * 6))
    }, 80)

    setTimeout(() => {
      clearInterval(interval)
      const d1 = Math.ceil(Math.random() * 6)
      const d2 = Math.ceil(Math.random() * 6)
      setDie1(d1)
      setDie2(d2)
      setDiceRoll(d1 + d2)
      setRolling(false)
    }, 600)
  }

  // ── Confirmar Slay ──────────────────────────────────────────
  const handleConfirmSlay = async () => {
    if (!selectedMonsterId) return
    try {
      const res = await slayMonster(selectedMonsterId)
      setCombatResult('SLAY')
      showToast(`¡${selectedMonster?.name} derrotado!`, 'success')
      if (res.victory?.isWinner) {
        showToast('🎉 ¡Victoria!', 'success')
      }
      clearCombat()
      setSelectedMonster(null)
    } catch (err: any) {
      showToast(err.message, 'danger')
    }
  }

  // ── Color del resultado ─────────────────────────────────────
  const resultConfig = {
    SLAY:    { color: 'text-green-400', bg: 'bg-green-900/30 border-green-500/30', label: '⚔️ ¡Monstruo Derrotado!',  icon: '🎉' },
    PENALTY: { color: 'text-red-400',   bg: 'bg-red-900/30   border-red-500/30',   label: '💀 Penalización',         icon: '😱' },
    NOTHING: { color: 'text-gray-400',  bg: 'bg-gray-900/30  border-gray-500/30',  label: 'Sin efecto — intento fallido', icon: '😐' },
  }

  const result = liveResult
  const cfg    = result ? resultConfig[result.result] : null

  return (
    <div className="space-y-4">

      {/* ── Monstruo objetivo ─────────────────────────────────── */}
      {selectedMonster ? (
        <div className="card-glass p-3 flex items-center gap-3">
          <img
            src={`/resources/images/monsters/${selectedMonster.image}`}
            alt={selectedMonster.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer"
            onClick={() => openModal({ type: 'monster', id: selectedMonster.id })}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-fantasy-muted uppercase tracking-wider">Atacando a</p>
            <p className="font-display text-white font-bold truncate">{selectedMonster.name}</p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-green-400">Matar: {selectedMonster.target_roll}+</span>
              <span className="text-xs text-red-400">Penal: {selectedMonster.penalty_roll}-</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedMonster(null)}
            className="text-fantasy-muted hover:text-white transition-colors p-1"
          >✕</button>
        </div>
      ) : (
        <div className="card-glass p-4 text-center text-fantasy-muted text-sm">
          <p>Selecciona un monstruo en el <strong className="text-white">Tablero</strong> para atacar</p>
        </div>
      )}

      {/* ── Bonus Trofeo del Cazador ──────────────────────────── */}
      {huntersTrophyBonus > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-fantasy-gold/10 border border-fantasy-gold/30">
          <span>🏆</span>
          <p className="text-xs text-yellow-300 font-semibold">
            Trofeo del Cazador: +1 a tiradas de ataque
          </p>
        </div>
      )}

      {/* ── Dados ─────────────────────────────────────────────── */}
      <div className="card-glass p-4">
        <p className="section-title text-center mb-4">🎲 Tirada de Dados</p>

        <div className="flex items-center justify-center gap-6 mb-4">
          <DiceFace value={die1} rolling={rolling} />
          <span className="text-2xl text-fantasy-muted font-bold">+</span>
          <DiceFace value={die2} rolling={rolling} />
        </div>

        {/* Total */}
        {diceRoll !== null && (
          <div className="text-center mb-4">
            <p className="text-xs text-fantasy-muted uppercase tracking-wider">Total base</p>
            <p className="font-display text-4xl font-bold text-white">{diceRoll}</p>
          </div>
        )}

        <button
          onClick={handleRoll}
          disabled={rolling}
          className="btn-gold w-full text-base py-3"
        >
          {rolling ? '🎲 Tirando…' : '🎲 Tirar Dados'}
        </button>
      </div>

      {/* ── Modificadores ─────────────────────────────────────── */}
      <div className="card-glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="section-title">Modificadores</p>
          {modifiers.length > 0 && (
            <button onClick={() => { modifiers.forEach((_, i) => removeModifier(0)) }}
                    className="text-xs text-fantasy-muted hover:text-red-400 transition-colors">
              Limpiar
            </button>
          )}
        </div>

        {/* Botones +1/-1 */}
        <div className="flex gap-3 justify-center">
          <button onClick={() => addModifier(-1)} className="counter-btn counter-btn-minus w-14 h-11 text-xl">−1</button>
          <div className="flex-1 flex items-center justify-center">
            <span className={`font-display text-2xl font-bold transition-colors
                              ${modifiers.reduce((a,b)=>a+b,0) > 0 ? 'text-green-400'
                                : modifiers.reduce((a,b)=>a+b,0) < 0 ? 'text-red-400'
                                : 'text-fantasy-muted'}`}>
              {modifiers.reduce((a,b)=>a+b,0) >= 0 ? '+' : ''}{modifiers.reduce((a,b)=>a+b,0)}
            </span>
          </div>
          <button onClick={() => addModifier(+1)} className="counter-btn counter-btn-plus  w-14 h-11 text-xl">+1</button>
        </div>

        {/* Pila de modificadores */}
        {modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {modifiers.map((mod, i) => (
              <button
                key={i}
                onClick={() => removeModifier(i)}
                className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-all
                            ${mod > 0
                              ? 'bg-green-900/30 text-green-400 border-green-500/30 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30'
                              : 'bg-red-900/30   text-red-400   border-red-500/30   hover:bg-red-900/50'}`}
                title="Clic para quitar"
              >
                {mod > 0 ? `+${mod}` : mod}
              </button>
            ))}
          </div>
        )}

        {/* Bonus Trofeo */}
        {huntersTrophyBonus > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-fantasy-muted">Bonus Trofeo del Cazador</span>
            <span className="text-yellow-400 font-bold">+{huntersTrophyBonus}</span>
          </div>
        )}
      </div>

      {/* ── Resultado Final ───────────────────────────────────── */}
      {diceRoll !== null && selectedMonster && (
        <div className={`card-glass p-4 border ${cfg?.bg ?? ''} space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-fantasy-muted uppercase tracking-wider">Tirada Final</p>
              <p className={`font-display text-5xl font-black ${cfg?.color}`}>
                {(finalRoll ?? 0) + huntersTrophyBonus}
              </p>
            </div>
            <p className={`text-4xl ${cfg?.color}`}>{cfg?.icon}</p>
          </div>

          <p className={`font-semibold text-sm ${cfg?.color}`}>{cfg?.label}</p>

          {/* Penalización */}
          {result?.result === 'PENALTY' && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/20 p-3">
              <p className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Penalización</p>
              <p className="text-sm text-red-200">{selectedMonster.penalty}</p>
            </div>
          )}

          {/* Efecto al matar */}
          {result?.result === 'SLAY' && (
            <>
              <div className="rounded-lg bg-green-900/20 border border-green-500/20 p-3">
                <p className="text-xs text-green-400/70 uppercase tracking-wider mb-1">Efecto obtenido</p>
                <p className="text-sm text-green-200">{selectedMonster.effect}</p>
              </div>
              <button onClick={handleConfirmSlay} className="btn-gold w-full">
                ✅ Confirmar Victoria contra {selectedMonster.name}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
