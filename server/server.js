// ============================================================
//  server.js — Express + Socket.io
//  Puerto 3001 | Sirve assets estáticos + WebSocket en tiempo real
// ============================================================

import express    from 'express'
import http       from 'http'
import { Server } from 'socket.io'
import cors       from 'cors'
import path       from 'path'
import { fileURLToPath } from 'url'

import {
  createRoom, getRoom,
  addPlayer, removePlayer, setLeader, setPlayerName,
  startGame, updateClassCount, slayMonster,
  adminForceUpdate, resetGame,
  sanitizeRoom,
} from './gameState.js'

// -------------------------------------------------------------------
// Setup básico
// -------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const ROOT_DIR   = path.join(__dirname, '..')

const app    = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',          // En red local, aceptamos cualquier origen
    methods: ['GET', 'POST']
  }
})

// -------------------------------------------------------------------
// Middleware
// -------------------------------------------------------------------
app.use(cors())
app.use(express.json())

// Servir las imágenes del juego como assets estáticos
// Accesibles desde el cliente en: /resources/images/...
app.use('/resources', express.static(path.join(ROOT_DIR, 'resources')))

// -------------------------------------------------------------------
// REST endpoints básicos (healthcheck + info de sala)
// -------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.get('/api/room/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId.toUpperCase())
  if (!room) return res.status(404).json({ error: 'Sala no encontrada.' })
  res.json(sanitizeRoom(room))   // También sanitizar en el endpoint REST
})

// -------------------------------------------------------------------
// Helper: emitir el estado actualizado a toda la sala
// -------------------------------------------------------------------
function broadcastState(roomId) {
  const room = getRoom(roomId)
  if (room) {
    // sanitizeRoom elimina _cleanupTimer y cualquier campo no-serializable
    io.to(roomId).emit('gameStateUpdate', sanitizeRoom(room))
  }
}

// -------------------------------------------------------------------
// Socket.io — Gestión de eventos en tiempo real
// -------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`)

  // Sala a la que pertenece este socket (se guarda al unirse)
  let currentRoomId = null

  // ── CREAR SALA ──────────────────────────────────────────────
  socket.on('createRoom', ({ settings } = {}, callback) => {
    try {
      const roomId = createRoom(settings)
      const result = addPlayer(roomId, { socketId: socket.id, name: 'Anfitrión' })

      if (!result.success) {
        return callback?.({ success: false, error: result.error })
      }

      currentRoomId = roomId
      socket.join(roomId)

      console.log(`[Sala] Creada: ${roomId} por ${socket.id}`)
      callback?.({ success: true, roomId, player: result.player })
      broadcastState(roomId)
    } catch (err) {
      console.error('[createRoom]', err)
      callback?.({ success: false, error: 'Error interno del servidor.' })
    }
  })

  // ── UNIRSE A SALA ────────────────────────────────────────────
  socket.on('joinRoom', ({ roomId, name } = {}, callback) => {
    try {
      const id = roomId?.toUpperCase()
      const room = getRoom(id)

      if (!room) {
        return callback?.({ success: false, error: 'Sala no encontrada. Verifica el código.' })
      }

      const result = addPlayer(id, { socketId: socket.id, name })
      if (!result.success) {
        return callback?.({ success: false, error: result.error })
      }

      currentRoomId = id
      socket.join(id)

      if (result.reconnected) {
        console.log(`[Sala] ${name} RECONECTADO a ${id} (nuevo socket: ${socket.id})`)
      } else {
        console.log(`[Sala] ${socket.id} se unió a ${id}`)
      }

      callback?.({ success: true, roomId: id, player: result.player })
      broadcastState(id)
    } catch (err) {
      console.error('[joinRoom]', err)
      callback?.({ success: false, error: 'Error interno del servidor.' })
    }
  })

  // ── SELECCIONAR LÍDER ────────────────────────────────────────
  socket.on('setLeader', ({ leaderId, leaderClass } = {}, callback) => {
    const result = setLeader(currentRoomId, socket.id, leaderId, leaderClass)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── CAMBIAR NOMBRE ───────────────────────────────────────────
  socket.on('setPlayerName', ({ name } = {}, callback) => {
    const result = setPlayerName(currentRoomId, socket.id, name)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── INICIAR PARTIDA ──────────────────────────────────────────
  socket.on('startGame', (_, callback) => {
    const result = startGame(currentRoomId)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── ACTUALIZAR CONTEO DE CLASE ───────────────────────────────
  // delta: +1 para añadir héroe, -1 para quitar
  socket.on('updateClassCount', ({ playerId, className, delta } = {}, callback) => {
    // Un jugador solo puede modificar su propio party, salvo que sea admin
    const room   = getRoom(currentRoomId)
    const caller = room?.players.find(p => p.id === socket.id)
    const target  = playerId || socket.id

    // Solo admin puede modificar el party de otros jugadores
    if (target !== socket.id && !caller?.isAdmin) {
      return callback?.({ success: false, error: 'Solo el admin puede modificar el party de otros jugadores.' })
    }

    const result = updateClassCount(currentRoomId, target, className, delta)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── MATAR MONSTRUO ───────────────────────────────────────────
  socket.on('slayMonster', ({ monsterId } = {}, callback) => {
    const result = slayMonster(currentRoomId, socket.id, monsterId)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── ADMIN: CORRECCIÓN FORZADA ────────────────────────────────
  socket.on('adminForceUpdate', ({ patch } = {}, callback) => {
    const room   = getRoom(currentRoomId)
    const caller = room?.players.find(p => p.id === socket.id)

    if (!caller?.isAdmin) {
      return callback?.({ success: false, error: 'Acción reservada para el administrador.' })
    }

    const result = adminForceUpdate(currentRoomId, patch)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── RESET COMPLETO ───────────────────────────────────────────
  socket.on('resetGame', ({ settings } = {}, callback) => {
    const room   = getRoom(currentRoomId)
    const caller = room?.players.find(p => p.id === socket.id)

    if (!caller?.isAdmin) {
      return callback?.({ success: false, error: 'Solo el admin puede reiniciar la partida.' })
    }

    const result = resetGame(currentRoomId, settings)
    callback?.(result)
    if (result.success) broadcastState(currentRoomId)
  })

  // ── OBTENER ESTADO ACTUAL ────────────────────────────────────
  socket.on('getState', (_, callback) => {
    const room = getRoom(currentRoomId)
    callback?.({ success: !!room, state: room })
  })

  // ── DESCONEXIÓN ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Desconectado: ${socket.id}`)
    if (currentRoomId) {
      removePlayer(currentRoomId, socket.id)
      // Broadcast solo si la sala sigue existiendo (puede haberse eliminado)
      const stillExists = getRoom(currentRoomId)
      if (stillExists) broadcastState(currentRoomId)
    }
  })
})

// -------------------------------------------------------------------
// Arrancar servidor
// -------------------------------------------------------------------
const PORT = process.env.PORT || 3001

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   Here to Slay — Servidor de Partida   ║')
  console.log('╚════════════════════════════════════════╝')
  console.log(`\n  ✅ Servidor activo en: http://localhost:${PORT}`)
  console.log(`  🌐 Acceso LAN:         http://<tu-IP>:${PORT}`)
  console.log(`  🏓 Healthcheck:        http://localhost:${PORT}/api/health\n`)
})

// -------------------------------------------------------------------
// Prevenir crash del servidor por errores no capturados
// -------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('\n⚠️  [uncaughtException] Error no capturado — el servidor sigue activo:')
  console.error(`   ${err.message}`)
  console.error(err.stack?.split('\n').slice(0, 4).join('\n'))
})

process.on('unhandledRejection', (reason) => {
  console.error('\n⚠️  [unhandledRejection] Promesa rechazada sin capturar:')
  console.error(`   ${reason}`)
})
