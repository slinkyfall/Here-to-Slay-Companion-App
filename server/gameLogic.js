// ============================================================
//  gameLogic.js — Lógica pura del juego (sin estado)
//  Se ejecuta en el servidor cada vez que hay un cambio.
// ============================================================

/**
 * Mapeo de clases disponibles en el juego.
 */
const ALL_CLASSES = [
  'bard', 'fighter', 'guardian', 'ranger', 'thief', 'wizard',
  'warrior', 'druid', 'berserker', 'necromancer'
]

/**
 * Cuenta cuántas unidades de una clase tiene un jugador.
 * El líder cuenta +1 si su clase coincide.
 */
function countClassForPlayer(player, className) {
  const heroCount   = player.classCounts?.[className] ?? 0
  const leaderBonus = player.leaderClass === className ? 1 : 0
  return heroCount + leaderBonus
}

/**
 * Recalcula la propiedad de todos los banners de clase.
 * Implementa las 3 reglas:
 *   1. Mayoría clara     → ese jugador obtiene el banner
 *   2. Empate con dueño  → el dueño lo conserva (Regla Defensa)
 *   3. Empate sin dueño  → se camina en sentido horario desde el dueño anterior
 *
 * @param {Object[]} players    - Array de jugadores con su estado actual
 * @param {string[]} seatOrder  - Array de playerIDs en orden de asientos (horario)
 * @param {Object[]} banners    - Array de banners con { id, type, class, ownedBy }
 * @returns {Object[]}          - Banners actualizados con nuevo ownedBy
 */
function recalculateBanners(players, seatOrder, banners) {
  return banners.map(banner => {
    // El Trofeo del Cazador tiene su propia lógica — no tocarlo aquí
    if (banner.type !== 'class') return banner

    const className    = banner.class
    const currentOwner = banner.ownedBy  // playerID o null

    // --- Contar unidades de esta clase por jugador ---
    const counts = {}
    for (const player of players) {
      counts[player.id] = countClassForPlayer(player, className)
    }

    const maxCount = Math.max(...Object.values(counts), 0)

    // --- Nadie tiene suficientes (mínimo 3) ---
    if (maxCount < 3) {
      // Si el dueño actual ya no califica, pierde el banner
      if (currentOwner !== null && (counts[currentOwner] ?? 0) < 3) {
        return { ...banner, ownedBy: null }
      }
      return banner
    }

    // --- Candidatos con el máximo conteo ---
    const candidates = players
      .filter(p => counts[p.id] === maxCount)
      .map(p => p.id)

    // CASO 1: Mayoría clara — un solo candidato
    if (candidates.length === 1) {
      return { ...banner, ownedBy: candidates[0] }
    }

    // CASO 2: Empate que incluye al dueño actual → Regla Defensa
    if (currentOwner !== null && candidates.includes(currentOwner)) {
      return banner // Sin cambio
    }

    // CASO 3: Empate sin dueño entre candidatos → Regla Horaria
    // Caminar en sentido horario desde el asiento del dueño anterior
    const startIndex = currentOwner !== null
      ? seatOrder.indexOf(currentOwner)
      : 0

    const n = seatOrder.length
    for (let i = 1; i <= n; i++) {
      const nextPlayer = seatOrder[(startIndex + i) % n]
      if (candidates.includes(nextPlayer)) {
        return { ...banner, ownedBy: nextPlayer }
      }
    }

    return banner
  })
}

/**
 * Verifica si un jugador cumple los requisitos para atacar un monstruo.
 * @param {Object} player   - Estado del jugador
 * @param {Object} monster  - Datos del monstruo desde monsters.json
 * @returns {{ canAttack: boolean, reason: string }}
 */
function canAttackMonster(player, monster) {
  // Total de héroes = suma de classCounts + 1 por el líder (si tiene)
  const heroesFromParty  = Object.values(player.classCounts ?? {}).reduce((a, b) => a + b, 0)
  const leaderBonus      = player.leaderClass ? 1 : 0
  const totalHeroes      = heroesFromParty + leaderBonus

  if (totalHeroes < monster.req_heroes) {
    return {
      canAttack: false,
      reason: `Necesitas al menos ${monster.req_heroes} héroe(s) en tu party (tienes ${totalHeroes}).`
    }
  }

  // Verificar clases específicas requeridas
  for (const requiredClass of (monster.req_classes ?? [])) {
    const count = countClassForPlayer(player, requiredClass)
    if (count < 1) {
      return {
        canAttack: false,
        reason: `Necesitas al menos 1 héroe de clase "${requiredClass}" en tu party.`
      }
    }
  }

  return { canAttack: true, reason: '' }
}

/**
 * Resuelve el resultado de un ataque a monstruo.
 * @param {number}   baseRoll   - Suma de los 2 dados (2–12)
 * @param {number[]} modifiers  - Array de modificadores (+1, -1, etc.)
 * @param {Object}   monster    - Datos del monstruo
 * @returns {{ result: 'SLAY'|'PENALTY'|'NOTHING', finalRoll: number }}
 */
function resolveAttack(baseRoll, modifiers, monster) {
  const finalRoll = baseRoll + modifiers.reduce((a, b) => a + b, 0)

  if (finalRoll >= monster.target_roll) {
    return { result: 'SLAY',    finalRoll }
  } else if (finalRoll <= monster.penalty_roll) {
    return { result: 'PENALTY', finalRoll }
  } else {
    return { result: 'NOTHING', finalRoll }
  }
}

/**
 * Verifica las condiciones de victoria para un jugador.
 * @param {Object} player   - Estado del jugador
 * @param {Object} settings - Configuración de la partida
 * @returns {{ isWinner: boolean, condition: string|null }}
 */
function checkVictory(player, settings) {
  const { winConditions, monstersToWin, classesForFullParty, bannersToWin } = settings

  // Condición 1: Monstruos derrotados
  if (winConditions.slayMonsters) {
    if ((player.slainMonsters?.length ?? 0) >= monstersToWin) {
      return { isWinner: true, condition: 'monsters' }
    }
  }

  // Condición 2: Party completo (clases distintas)
  if (winConditions.fullParty) {
    const allClasses = ALL_CLASSES
    const distinctClasses = allClasses.filter(cls => {
      const count = (player.classCounts?.[cls] ?? 0) + (player.leaderClass === cls ? 1 : 0)
      return count > 0
    })
    if (distinctClasses.length >= classesForFullParty) {
      return { isWinner: true, condition: 'fullParty' }
    }
  }

  // Condición 3: Banner Quest
  if (winConditions.bannerQuest) {
    if ((player.bannersOwned?.length ?? 0) >= bannersToWin) {
      return { isWinner: true, condition: 'bannerQuest' }
    }
  }

  return { isWinner: false, condition: null }
}

export { recalculateBanners, canAttackMonster, resolveAttack, checkVictory, ALL_CLASSES }
