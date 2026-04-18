// ============================================================
//  MonsterArena.tsx — Los 3 monstruos activos en carrusel
// ============================================================

import { useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGameLogic } from '../../hooks/useGameLogic'
import MonsterCard from './MonsterCard'

export default function MonsterArena() {
  const { openModal, setSelectedMonster, setActiveTab } = useGameStore()
  const { activeMonsters, monsterValidations } = useGameLogic()

  // ── Drag-to-scroll (mouse en PC) ──────────────────────────────
  const scrollRef  = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current     = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }
  const onMouseUp = () => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x    = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  if (activeMonsters.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 card-glass rounded-xl">
        <p className="text-fantasy-muted text-sm">No hay monstruos activos</p>
      </div>
    )
  }

  const handleAttack = (monsterId: string) => {
    setSelectedMonster(monsterId)
    setActiveTab('combate')
  }

  const handleZoom = (monsterId: string) => {
    openModal({ type: 'monster', id: monsterId })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">⚔️ Monstruos Activos</h2>
        <span className="text-xs text-fantasy-muted">
          {activeMonsters.length} / 3
        </span>
      </div>

      {/* Carrusel horizontal con scroll snap + drag en PC */}
      <div
        ref={scrollRef}
        className="scroll-smooth-x flex gap-3 pb-2 select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {activeMonsters.map(monster => (
          <div
            key={monster.id}
            className="scroll-snap-center flex-shrink-0 w-[75vw] max-w-xs"
          >
            <MonsterCard
              monster={monster}
              validation={monsterValidations[monster.id] ?? { canAttack: false, reason: 'Cargando…' }}
              onAttack={() => handleAttack(monster.id)}
              onZoom={()   => handleZoom(monster.id)}
            />
          </div>
        ))}

        {/* Slots vacíos si hay menos de 3 */}
        {Array.from({ length: Math.max(0, 3 - activeMonsters.length) }).map((_, i) => (
          <div key={`empty-${i}`}
               className="scroll-snap-center flex-shrink-0 w-[75vw] max-w-xs
                          card-glass flex items-center justify-center h-80 opacity-40">
            <div className="text-center text-fantasy-muted">
              <p className="text-3xl mb-2">🃏</p>
              <p className="text-xs">Slot vacío</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
