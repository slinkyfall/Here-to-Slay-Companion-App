// ============================================================
//  useSocket.ts — Conexión Socket.io con el servidor
//  Gestiona eventos de red y sincroniza el store automáticamente.
// ============================================================

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGameStore } from '../store/gameStore'
import type { GameRoom } from '../types'

// El socket se crea UNA sola vez (singleton fuera del componente)
let socketInstance: Socket | null = null

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      // Al usar el proxy de Vite, la URL base es la propia app
      path: '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socketInstance
}

// ── Clave de sesión en sessionStorage ─────────────────────────
const SESSION_KEY = 'hts_session'

function saveSession(roomId: string, playerName: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerName }))
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
function loadSession(): { roomId: string; playerName: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// -------------------------------------------------------------------
// Hook principal
// -------------------------------------------------------------------
export function useSocket() {
  const socket      = useRef<Socket>(getSocket())
  const initialized = useRef(false)
  const {
    setConnectionStatus,
    setMyPlayerId,
    setGameRoom,
    setRoomId,
    showToast,
  } = useGameStore()

  // ── Conectar y registrar listeners UNA sola vez ──────────────
  useEffect(() => {
    const s = socket.current

    // Evitar registrar listeners duplicados (React StrictMode monta dos veces)
    if (initialized.current) return
    initialized.current = true

    // Si el socket ya estaba conectado (singleton), actualizar estado inmediatamente
    if (s.connected) {
      setConnectionStatus('connected')
      setMyPlayerId(s.id ?? null)
    } else {
      s.connect()
      setConnectionStatus('connecting')
    }

    s.on('connect', async () => {
      console.log('[Socket] Conectado al servidor:', s.id)
      setConnectionStatus('connected')
      setMyPlayerId(s.id ?? null)

      // Auto-rejoin si hay sesión guardada (ej: refrescó la página)
      const session = loadSession()
      if (session) {
        console.log('[Socket] Intentando reconexión con sesión:', session)
        s.emit('joinRoom', { roomId: session.roomId, name: session.playerName }, (res: any) => {
          if (res?.success) {
            setRoomId(res.roomId)
            showToast(`Reconectado a la sala ${res.roomId}`, 'success')
          } else {
            // La sala ya no existe o expiró
            clearSession()
            showToast('La sesión anterior expiró. Crea o únete a una sala.', 'info')
          }
        })
      }
    })

    s.on('disconnect', (reason) => {
      console.warn('[Socket] Desconectado:', reason)
      setConnectionStatus('disconnected')
      if (reason !== 'io client disconnect') {
        showToast('Conexión perdida. Reconectando…', 'danger')
      }
    })

    s.on('connect_error', (err) => {
      console.error('[Socket] Error de conexión:', err.message)
      setConnectionStatus('disconnected')
    })

    s.on('reconnect', () => {
      setConnectionStatus('connected')
      showToast('Conexión restaurada', 'success')
    })

    // ── Evento principal: el servidor envía el nuevo estado ──
    s.on('gameStateUpdate', (room: GameRoom) => {
      setGameRoom(room)
    })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------
  // Funciones de emisión (wrappers con Promise para manejo de errores)
  // -------------------------------------------------------------------

  const createRoom = useCallback((settings?: object, playerName?: string): Promise<{ roomId: string }> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('createRoom', { settings }, (res: any) => {
        if (res?.success) {
          useGameStore.getState().setRoomId(res.roomId)
          if (playerName) saveSession(res.roomId, playerName)
          resolve(res)
        } else {
          reject(new Error(res?.error ?? 'Error al crear la sala'))
        }
      })
    })
  }, [])

  const joinRoom = useCallback((roomId: string, name: string): Promise<{ roomId: string }> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('joinRoom', { roomId, name }, (res: any) => {
        if (res?.success) {
          useGameStore.getState().setRoomId(res.roomId)
          saveSession(res.roomId, name)  // Guardar para reconexión automática
          resolve(res)
        } else {
          reject(new Error(res?.error ?? 'Error al unirse a la sala'))
        }
      })
    })
  }, [])

  const setLeader = useCallback((leaderId: string, leaderClass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('setLeader', { leaderId, leaderClass }, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  const setPlayerName = useCallback((name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('setPlayerName', { name }, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  const startGame = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('startGame', {}, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  const updateClassCount = useCallback((
    className: string,
    delta: 1 | -1,
    playerId?: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('updateClassCount', { className, delta, playerId }, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  const slayMonster = useCallback((monsterId: string): Promise<{ victory: any }> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('slayMonster', { monsterId }, (res: any) => {
        if (res?.success) resolve(res)
        else reject(new Error(res?.error))
      })
    })
  }, [])

  const adminForceUpdate = useCallback((patch: object): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('adminForceUpdate', { patch }, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  const resetGame = useCallback((settings?: object): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.current.emit('resetGame', { settings }, (res: any) => {
        res?.success ? resolve() : reject(new Error(res?.error))
      })
    })
  }, [])

  return {
    socket: socket.current,
    // Funciones de sala
    createRoom,
    joinRoom,
    setLeader,
    setPlayerName,
    startGame,
    // Acciones del juego
    updateClassCount,
    slayMonster,
    // Admin
    adminForceUpdate,
    resetGame,
  }
}
