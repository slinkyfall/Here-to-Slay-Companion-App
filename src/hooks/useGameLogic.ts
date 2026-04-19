// ============================================================
//  useGameLogic.ts — Lógica del juego en el cliente
//  Feedback instantáneo sin esperar respuesta del servidor.
// ============================================================

import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import type {
  Player, Monster, HeroClass,
  CombatValidation, AttackResult
} from '../types'

// -------------------------------------------------------------------
// Lógica de combate (espejo del servidor, para feedback inmediato)
// -------------------------------------------------------------------

/**
 * Verifica si un jugador puede atacar un monstruo.
 * Replica la lógica del servidor para feedback instantáneo en UI.
 */
export function validateAttack(player: Player, monster: Monster): CombatValidation {
  // Total = héroes del party + 1 si tiene líder asignado
  const heroesFromParty = Object.values(player.classCounts).reduce((a, b) => a + b, 0)
  const leaderBonus     = player.leaderClass ? 1 : 0
  const totalHeroes     = heroesFromParty + leaderBonus

  if (totalHeroes < monster.req_heroes) {
    return {
      canAttack: false,
      reason: `Necesitas ${monster.req_heroes} héroe(s) — tienes ${totalHeroes}.`
    }
  }

  for (const requiredClass of monster.req_classes) {
    const heroCount   = player.classCounts[requiredClass as HeroClass] ?? 0
    const leaderBonus = player.leaderClass === requiredClass ? 1 : 0
    const total       = heroCount + leaderBonus

    if (total < 1) {
      return {
        canAttack: false,
        reason: `Necesitas al menos 1 ${requiredClass} en tu party.`
      }
    }
  }

  return { canAttack: true, reason: '' }
}

/**
 * Resuelve el resultado de una tirada.
 */
export function resolveRoll(
  baseRoll: number,
  modifiers: number[],
  monster: Monster
): { result: AttackResult; finalRoll: number } {
  const finalRoll = baseRoll + modifiers.reduce((a, b) => a + b, 0)

  if      (finalRoll >= monster.target_roll)  return { result: 'SLAY',    finalRoll }
  else if (finalRoll <= monster.penalty_roll) return { result: 'PENALTY', finalRoll }
  else                                         return { result: 'NOTHING', finalRoll }
}

// -------------------------------------------------------------------
// Hook principal
// -------------------------------------------------------------------

export function useGameLogic() {
  const {
    gameRoom,
    myPlayerId,
    diceRoll,
    modifiers,
    selectedMonsterId,
    getMyPlayer,
    getActiveMonsters,
    getModifierTotal,
    getFinalRoll,
  } = useGameStore()

  const myPlayer       = getMyPlayer()
  const activeMonsters = getActiveMonsters()
  const modifierTotal  = getModifierTotal()
  const finalRoll      = getFinalRoll()

  /**
   * Validaciones de combate para cada monstruo activo.
   * Se recalcula solo cuando cambia el player o los monstruos.
   */
  const monsterValidations = useMemo(() => {
    if (!myPlayer) return {}
    const result: Record<string, CombatValidation> = {}
    for (const monster of activeMonsters) {
      result[monster.id] = validateAttack(myPlayer, monster)
    }
    return result
  }, [myPlayer, activeMonsters])

  /**
   * Monstruo seleccionado actualmente para combate.
   */
  const selectedMonster = useMemo(() =>
    activeMonsters.find(m => m.id === selectedMonsterId) ?? null,
    [activeMonsters, selectedMonsterId]
  )

  /**
   * Resultado del combate calculado en tiempo real al mover modificadores.
   */
  const liveResult = useMemo(() => {
    if (diceRoll === null || !selectedMonster) return null
    return resolveRoll(diceRoll, modifiers, selectedMonster)
  }, [diceRoll, modifiers, selectedMonster])

  /**
   * Cuenta cuántas clases distintas tiene el jugador (para win condition).
   */
  const distinctClassCount = useMemo(() => {
    if (!myPlayer) return 0
    const fromHeroes = Object.entries(myPlayer.classCounts)
      .filter(([, count]) => count > 0)
      .map(([cls]) => cls)
    const fromLeader = myPlayer.leaderClass ? [myPlayer.leaderClass] : []
    return new Set([...fromHeroes, ...fromLeader]).size
  }, [myPlayer])

  /**
   * Devuelve el jugador que posee el Trofeo del Cazador (o null).
   */
  const huntersTrophyOwner = useMemo(() => {
    const trophy = gameRoom?.banners.find(b => b.type === 'trophy')
    if (!trophy?.ownedBy) return null
    return gameRoom?.players.find(p => p.id === trophy.ownedBy) ?? null
  }, [gameRoom])

  /**
   * Si el jugador activo tiene el Trofeo, su tirada de ataque tiene +1.
   */
  const huntersTrophyBonus = useMemo(() => {
    if (!myPlayer || !gameRoom) return 0
    const trophy = gameRoom.banners.find(b => b.type === 'trophy')
    return trophy?.ownedBy === myPlayerId ? 1 : 0
  }, [myPlayer, myPlayerId, gameRoom])

  /**
   * ¿Es el jugador actual el admin de la sala?
   */
  const isAdmin = myPlayer?.isAdmin ?? false

  /**
   * Banners del jugador actual.
   */
  const myBanners = useMemo(() => {
    if (!gameRoom || !myPlayer) return []
    return gameRoom.banners.filter(b => b.ownedBy === myPlayerId)
  }, [gameRoom, myPlayer, myPlayerId])

  return {
    // Jugador
    myPlayer,
    isAdmin,
    myBanners,
    distinctClassCount,
    // Monstruos
    activeMonsters,
    monsterValidations,
    selectedMonster,
    // Combate
    diceRoll,
    modifiers,
    modifierTotal,
    finalRoll,
    liveResult,
    huntersTrophyBonus,
    huntersTrophyOwner,
    // Sala
    gameRoom,
    players: gameRoom?.players ?? [],
  }
}
