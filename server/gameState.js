// ============================================================
//  gameState.js — Estado global de la partida (en memoria)
//  Gestiona salas, jugadores y mutaciones del estado.
// ============================================================

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { recalculateBanners, checkVictory, ALL_CLASSES } from './gameLogic.js'

// Carga de JSON compatible con Node.js v22+ (sin import assertions)
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const ROOT       = path.join(__dirname, '..')

const bannersData  = JSON.parse(readFileSync(path.join(ROOT, 'src/data/banners.json'),  'utf-8'))
const monstersData = JSON.parse(readFileSync(path.join(ROOT, 'src/data/monsters.json'), 'utf-8'))

// -------------------------------------------------------------------
// Estado global: mapa de rooms activas  { roomId -> roomState }
// -------------------------------------------------------------------
const rooms = new Map()

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/** Genera un ID de sala corto (6 caracteres, mayúsculas) */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/** Construye el classCounts inicial con 0 para todas las clases */
function buildEmptyClassCounts() {
  return Object.fromEntries(ALL_CLASSES.map(c => [c, 0]))
}

/** Baraja un array (Fisher-Yates) */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Inicializa los banners del servidor con ownedBy: null */
function buildInitialBanners() {
  return bannersData.map(b => ({ ...b, ownedBy: null }))
}

/** Saca los 3 primeros monstruos del mazo y devuelve { deck, active } */
function drawInitialMonsters(deck) {
  const active = deck.slice(0, 3)
  const remaining = deck.slice(3)
  return { active, remaining }
}

// -------------------------------------------------------------------
// CRUD de Salas
// -------------------------------------------------------------------

/**
 * Crea una sala nueva y devuelve su ID.
 */
function createRoom(settings) {
  const roomId = generateRoomId()

  // Mezclar mazo de monstruos
  const shuffledDeck = shuffle(monstersData.map(m => m.id))
  const { active, remaining } = drawInitialMonsters(shuffledDeck)

  rooms.set(roomId, {
    roomId,
    phase: 'setup',   // 'setup' | 'playing' | 'finished'
    settings: {
      winConditions: {
        slayMonsters: settings?.winConditions?.slayMonsters ?? true,
        fullParty:     settings?.winConditions?.fullParty    ?? true,
        bannerQuest:   settings?.winConditions?.bannerQuest  ?? true,
      },
      monstersToWin:     settings?.monstersToWin     ?? 3,
      classesForFullParty: settings?.classesForFullParty ?? 6,
      bannersToWin:      settings?.bannersToWin      ?? 3,
    },
    players:     [],
    seatOrder:   [],
    activeMonsters: active,
    monsterDeck:    remaining,
    discardPile:    [],
    banners:     buildInitialBanners(),
    turnIndex:   0,
    winner:      null,
    actionLog:   [],
  })

  return roomId
}

/**
 * Obtiene el estado de una sala (o null si no existe).
 */
function getRoom(roomId) {
  return rooms.get(roomId) ?? null
}

/**
 * Añade un jugador a una sala.
 * — Si la partida ya comenzó y hay un jugador con el mismo nombre desconectado,
 *   restaura su sesión con el nuevo socketId (reconexión).
 * @returns {{ success: boolean, error?: string, player?: Object }}
 */
function addPlayer(roomId, { socketId, name }) {
  const room = rooms.get(roomId)
  if (!room) return { success: false, error: 'Sala no encontrada.' }

  const trimmedName = (name || '').trim()

  // ── Reconexión: partida en marcha + jugador con ese nombre existe ──
  if (room.phase !== 'setup' && trimmedName) {
    const existing = room.players.find(
      p => p.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (existing) {
      const oldId = existing.id

      // Cancelar timer de limpieza si lo había
      if (existing._cleanupTimer) {
        clearTimeout(existing._cleanupTimer)
        delete existing._cleanupTimer
      }

      // Actualizar ID en player, seatOrder y banners
      existing.id       = socketId
      existing.offline  = false
      const seatIdx     = room.seatOrder.indexOf(oldId)
      if (seatIdx !== -1) room.seatOrder[seatIdx] = socketId

      // Actualizar ownership de banners
      room.banners.forEach(b => { if (b.ownedBy === oldId) b.ownedBy = socketId })
      syncBannersOwned(room)

      addLog(room, `🔄 ${existing.name} reconectó a la sala.`)
      return { success: true, player: existing, reconnected: true }
    }
    // Si no existe un jugador con ese nombre, bloquear entrada en mid-game
    return { success: false, error: 'La partida ya ha comenzado. Usa el mismo nombre con el que entraste.' }
  }

  if (room.players.length >= 6) return { success: false, error: 'La sala está llena (máx. 6 jugadores).' }

  const player = {
    id:            socketId,
    name:          trimmedName || `Jugador ${room.players.length + 1}`,
    seatIndex:     room.players.length,
    leaderId:      null,
    leaderClass:   null,
    classCounts:   buildEmptyClassCounts(),
    slainMonsters: [],
    bannersOwned:  [],
    isAdmin:       room.players.length === 0,
    offline:       false,
  }

  room.players.push(player)
  room.seatOrder.push(socketId)

  return { success: true, player }
}

/**
 * Gestiona la desconexión de un jugador.
 * — En setup: elimina al jugador inmediatamente.
 * — En playing/finished: lo marca como offline y programa limpieza en 90s
 *   para dar tiempo a reconectar.
 */
function removePlayer(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) return

  const player = room.players.find(p => p.id === socketId)
  if (!player) return

  if (room.phase === 'setup') {
    // Eliminar inmediatamente en fase de lobby
    room.players   = room.players.filter(p => p.id !== socketId)
    room.seatOrder = room.seatOrder.filter(id => id !== socketId)

    if (room.players.length > 0 && !room.players.some(p => p.isAdmin)) {
      room.players[0].isAdmin = true
    }
    if (room.players.length === 0) rooms.delete(roomId)
  } else {
    // Marcar como offline — dar 90 segundos para reconectar
    player.offline = true
    addLog(room, `📴 ${player.name} se desconectó. Tiene 90s para reconectar.`)

    player._cleanupTimer = setTimeout(() => {
      const r = rooms.get(roomId)
      if (!r) return
      const p = r.players.find(x => x.id === socketId)
      if (p && p.offline) {
        r.players   = r.players.filter(x => x.id !== socketId)
        r.seatOrder = r.seatOrder.filter(id => id !== socketId)
        addLog(r, `🗑️ ${player.name} fue eliminado por inactividad.`)
        if (r.players.length > 0 && !r.players.some(x => x.isAdmin)) {
          r.players[0].isAdmin = true
        }
        if (r.players.length === 0) rooms.delete(roomId)
      }
    }, 90_000)
  }
}

/**
 * Asigna un líder a un jugador.
 */
function setLeader(roomId, socketId, leaderId, leaderClass) {
  const room   = rooms.get(roomId)
  const player = room?.players.find(p => p.id === socketId)
  if (!player) return { success: false, error: 'Jugador no encontrado.' }

  player.leaderId    = leaderId
  player.leaderClass = leaderClass

  return { success: true }
}

/**
 * Cambia el nombre de un jugador.
 */
function setPlayerName(roomId, socketId, name) {
  const room   = rooms.get(roomId)
  const player = room?.players.find(p => p.id === socketId)
  if (!player) return { success: false, error: 'Jugador no encontrado.' }

  player.name = name.slice(0, 20)  // Máximo 20 caracteres
  return { success: true }
}

/**
 * Inicia la partida (cambia phase a 'playing').
 */
function startGame(roomId) {
  const room = rooms.get(roomId)
  if (!room) return { success: false, error: 'Sala no encontrada.' }
  if (room.players.length < 2) return { success: false, error: 'Se necesitan al menos 2 jugadores.' }

  room.phase = 'playing'
  return { success: true }
}

// -------------------------------------------------------------------
// Mutaciones del juego
// -------------------------------------------------------------------

/**
 * Añade o resta 1 de una clase en el party de un jugador.
 * Recalcula banners automáticamente.
 * @param {number} delta  +1 o -1
 */
function updateClassCount(roomId, playerId, className, delta) {
  const room   = rooms.get(roomId)
  const player = room?.players.find(p => p.id === playerId)
  if (!room || !player) return { success: false, error: 'Jugador o sala no encontrados.' }

  // Límite: no bajar de 0, no superar 5 héroes de una clase
  const current = player.classCounts[className] ?? 0
  const newCount = Math.max(0, Math.min(5, current + delta))

  if (newCount === current) return { success: true }  // Sin cambio

  player.classCounts[className] = newCount

  // Recalcular banners de clase
  room.banners = recalculateBanners(room.players, room.seatOrder, room.banners)

  // Actualizar bannersOwned de cada jugador
  syncBannersOwned(room)

  // Registrar en log
  addLog(room, `${player.name} ${delta > 0 ? 'añadió' : 'quitó'} un héroe de clase "${className}".`)

  return { success: true }
}

/**
 * Registra que un jugador mató un monstruo.
 * Transfiere el Trofeo del Cazador al slayer.
 * Revela un nuevo monstruo del mazo.
 * Verifica victoria.
 */
function slayMonster(roomId, slayerPlayerId, monsterId) {
  const room   = rooms.get(roomId)
  const player = room?.players.find(p => p.id === slayerPlayerId)
  if (!room || !player) return { success: false, error: 'Jugador o sala no encontrados.' }

  // Añadir a slainMonsters del jugador
  if (!player.slainMonsters.includes(monsterId)) {
    player.slainMonsters.push(monsterId)
  }

  // Retirar de activeMonsters y revelar el siguiente
  room.activeMonsters = room.activeMonsters.filter(id => id !== monsterId)
  room.discardPile.push(monsterId)

  if (room.monsterDeck.length > 0) {
    const next = room.monsterDeck.shift()
    room.activeMonsters.push(next)
  }

  // Trofeo del Cazador → siempre al que mató
  const trophy = room.banners.find(b => b.type === 'trophy')
  if (trophy) trophy.ownedBy = slayerPlayerId

  // Recalcular banners de clase (no cambian, pero actualizamos consistencia)
  room.banners = recalculateBanners(room.players, room.seatOrder, room.banners)
  syncBannersOwned(room)

  addLog(room, `⚔️ ${player.name} derrotó a "${monsterId}". 🏆 Trofeo del Cazador transferido.`)

  // Verificar victoria
  const victory = checkVictory(player, room.settings)
  if (victory.isWinner) {
    room.phase  = 'finished'
    room.winner = { playerId: slayerPlayerId, condition: victory.condition }
    addLog(room, `🎉 ¡${player.name} ganó la partida! (${victory.condition})`)
  }

  return { success: true, victory }
}

/**
 * Acción de admin: forzar un cambio en el estado (corrección manual).
 */
function adminForceUpdate(roomId, patch) {
  const room = rooms.get(roomId)
  if (!room) return { success: false, error: 'Sala no encontrada.' }

  // patch puede contener: { playerId, field, value }
  const { playerId, field, value } = patch

  if (playerId) {
    const player = room.players.find(p => p.id === playerId)
    if (!player) return { success: false, error: 'Jugador no encontrado.' }
    player[field] = value
  } else {
    room[field] = value
  }

  // Recalcular banners después de cualquier corrección
  room.banners = recalculateBanners(room.players, room.seatOrder, room.banners)
  syncBannersOwned(room)
  addLog(room, `🛠️ Admin realizó una corrección manual.`)

  return { success: true }
}

/**
 * Reinicia la sala a estado inicial.
 */
function resetGame(roomId, settings) {
  const room = rooms.get(roomId)
  if (!room) return { success: false, error: 'Sala no encontrada.' }

  const players = room.players.map(p => ({
    ...p,
    leaderId:     null,
    leaderClass:  null,
    classCounts:  buildEmptyClassCounts(),
    slainMonsters: [],
    bannersOwned:  [],
  }))

  const shuffledDeck = shuffle(monstersData.map(m => m.id))
  const { active, remaining } = drawInitialMonsters(shuffledDeck)

  room.phase           = 'setup'
  room.players         = players
  room.banners         = buildInitialBanners()
  room.activeMonsters  = active
  room.monsterDeck     = remaining
  room.discardPile     = []
  room.turnIndex       = 0
  room.winner          = null
  room.actionLog       = []

  if (settings) {
    room.settings = { ...room.settings, ...settings }
  }

  addLog(room, '🔄 Partida reiniciada.')
  return { success: true }
}

// -------------------------------------------------------------------
// Helpers internos
// -------------------------------------------------------------------

/** Sincroniza el array bannersOwned de cada jugador según el estado de room.banners */
function syncBannersOwned(room) {
  for (const player of room.players) {
    player.bannersOwned = room.banners
      .filter(b => b.ownedBy === player.id)
      .map(b => b.id)
  }
}

/** Añade una entrada al log de acciones (máximo 50 entradas) */
function addLog(room, message) {
  room.actionLog.unshift({ message, timestamp: Date.now() })
  if (room.actionLog.length > 50) room.actionLog.pop()
}

export {
  createRoom, getRoom,
  addPlayer, removePlayer, setLeader, setPlayerName,
  startGame, updateClassCount, slayMonster,
  adminForceUpdate, resetGame
}
