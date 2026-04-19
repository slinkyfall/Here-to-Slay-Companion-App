// ============================================================
//  gameStore.ts — Estado global del cliente (Zustand)
//  Sincroniza el estado del servidor con la UI.
// ============================================================

import { create } from 'zustand'
import type { GameRoom, Player, Monster, Banner } from '../types'

// -------------------------------------------------------------------
// Tipos del store
// -------------------------------------------------------------------

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface GameStore {
  // ── Estado de red ──────────────────────────────────────────
  connectionStatus: ConnectionStatus
  roomId:           string | null
  myPlayerId:       string | null

  // ── Estado del juego (viene del servidor) ──────────────────
  gameRoom: GameRoom | null

  // ── UI local (no sincronizado) ─────────────────────────────
  selectedMonsterId:  string | null
  selectedPlayerId:   string | null
  modalCard:          { type: 'monster' | 'banner' | 'leader'; id: string } | null
  activeTab:          'tablero' | 'party' | 'banners' | 'combate'
  toast:              { message: string; type: 'success' | 'danger' | 'info' } | null

  // Combate local (no afecta al servidor hasta confirmar)
  diceRoll:     number | null   // Resultado de los dados (2–12)
  modifiers:    number[]        // Stack de modificadores aplicados
  combatResult: 'SLAY' | 'PENALTY' | 'NOTHING' | null

  // ── Setters de estado de red ───────────────────────────────
  setConnectionStatus: (status: ConnectionStatus) => void
  setRoomId:           (id: string | null) => void
  setMyPlayerId:       (id: string | null) => void

  // ── Setter principal: reemplaza el estado del juego ────────
  setGameRoom: (room: GameRoom | null) => void

  // ── UI actions ─────────────────────────────────────────────
  setSelectedMonster:  (id: string | null) => void
  setSelectedPlayer:   (id: string | null) => void
  openModal:           (card: { type: 'monster' | 'banner' | 'leader'; id: string } | null) => void
  closeModal:          () => void
  setActiveTab:        (tab: GameStore['activeTab']) => void
  showToast:           (message: string, type?: 'success' | 'danger' | 'info') => void
  clearToast:          () => void

  // ── Combate local ──────────────────────────────────────────
  setDiceRoll:     (roll: number | null) => void
  addModifier:     (value: number) => void
  removeModifier:  (index: number) => void
  clearCombat:     () => void
  setCombatResult: (result: 'SLAY' | 'PENALTY' | 'NOTHING' | null) => void

  // ── Selectores derivados (getters) ─────────────────────────
  getMyPlayer:         () => Player | null
  getActiveMonsters:   () => Monster[]
  getBanners:          () => Banner[]
  getModifierTotal:    () => number
  getFinalRoll:        () => number | null
}

// -------------------------------------------------------------------
// Datos estáticos de monstruos cargados desde JSON
// (el cliente también los necesita para mostrar info de cartas)
// -------------------------------------------------------------------
import monstersJson from '../data/monsters.json'
import bannersJson  from '../data/banners.json'

const MONSTERS_MAP = new Map(
  (monstersJson as Monster[]).map(m => [m.id, m])
)

// -------------------------------------------------------------------
// Store
// -------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  // ── Valores iniciales ──────────────────────────────────────
  connectionStatus:  'connecting',
  roomId:            null,
  myPlayerId:        null,
  gameRoom:          null,

  selectedMonsterId: null,
  selectedPlayerId:  null,
  modalCard:         null,
  activeTab:         'tablero',
  toast:             null,

  diceRoll:     null,
  modifiers:    [],
  combatResult: null,

  // ── Setters ────────────────────────────────────────────────
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setRoomId:           (id)     => set({ roomId: id }),
  setMyPlayerId:       (id)     => set({ myPlayerId: id }),

  setGameRoom: (room) => set({ gameRoom: room }),

  setSelectedMonster: (id) => set({ selectedMonsterId: id }),
  setSelectedPlayer:  (id) => set({ selectedPlayerId: id }),

  openModal:  (card) => set({ modalCard: card }),
  closeModal: ()     => set({ modalCard: null }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } })
    // Auto-dismiss a los 3 segundos
    setTimeout(() => set({ toast: null }), 3000)
  },
  clearToast: () => set({ toast: null }),

  // ── Combate ────────────────────────────────────────────────
  setDiceRoll: (roll) => set({ diceRoll: roll, combatResult: null }),

  addModifier: (value) =>
    set(state => ({ modifiers: [...state.modifiers, value] })),

  removeModifier: (index) =>
    set(state => ({
      modifiers: state.modifiers.filter((_, i) => i !== index)
    })),

  clearCombat: () => set({ diceRoll: null, modifiers: [], combatResult: null }),

  setCombatResult: (result) => set({ combatResult: result }),

  // ── Selectores derivados ───────────────────────────────────

  getMyPlayer: () => {
    const { gameRoom, myPlayerId } = get()
    return gameRoom?.players.find(p => p.id === myPlayerId) ?? null
  },

  getActiveMonsters: () => {
    const { gameRoom } = get()
    if (!gameRoom) return []
    return gameRoom.activeMonsters
      .map(id => MONSTERS_MAP.get(id))
      .filter(Boolean) as Monster[]
  },

  getBanners: () => {
    const { gameRoom } = get()
    if (!gameRoom) return bannersJson as Banner[]
    return gameRoom.banners
  },

  getModifierTotal: () =>
    get().modifiers.reduce((a, b) => a + b, 0),

  getFinalRoll: () => {
    const { diceRoll, modifiers } = get()
    if (diceRoll === null) return null
    return diceRoll + modifiers.reduce((a, b) => a + b, 0)
  },
}))
