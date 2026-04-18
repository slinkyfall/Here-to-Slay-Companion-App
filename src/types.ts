// ============================================================
//  types.ts — Tipos compartidos en toda la app
// ============================================================

export type HeroClass =
  | 'bard' | 'fighter' | 'guardian' | 'ranger' | 'thief' | 'wizard'
  | 'warrior' | 'druid' | 'berserker' | 'necromancer'

export const ALL_CLASSES: HeroClass[] = [
  'bard', 'fighter', 'guardian', 'ranger', 'thief', 'wizard',
  'warrior', 'druid', 'berserker', 'necromancer'
]

export const CLASS_LABELS: Record<HeroClass, string> = {
  bard:        'Bardo',
  fighter:     'Luchador',
  guardian:    'Guardián',
  ranger:      'Explorador',
  thief:       'Ladrón',
  wizard:      'Mago',
  warrior:     'Guerrero',
  druid:       'Druida',
  berserker:   'Berserker',
  necromancer: 'Nigromante',
}

// Colores de acento por clase (Tailwind clases inline o hex)
export const CLASS_COLORS: Record<HeroClass, string> = {
  bard:        '#a855f7',  // Violeta
  fighter:     '#ef4444',  // Rojo
  guardian:    '#3b82f6',  // Azul
  ranger:      '#22c55e',  // Verde
  thief:       '#6b7280',  // Gris
  wizard:      '#06b6d4',  // Cian
  warrior:     '#f97316',  // Naranja
  druid:       '#84cc16',  // Lima
  berserker:   '#dc2626',  // Carmesí
  necromancer: '#8b5cf6',  // Púrpura
}

// -------------------------------------------------------------------
// Tipos del juego
// -------------------------------------------------------------------

export type ClassCounts = Record<HeroClass, number>

export interface Player {
  id:            string
  name:          string
  seatIndex:     number
  leaderId:      string | null
  leaderClass:   HeroClass | null
  classCounts:   ClassCounts
  slainMonsters: string[]
  bannersOwned:  string[]
  isAdmin:       boolean
}

export interface Banner {
  id:              string
  name:            string
  type:            'class' | 'trophy'
  class:           HeroClass | null
  claim_threshold: number | null
  effect:          string
  image:           string
  ownedBy:         string | null  // playerID o null
}

export interface Monster {
  id:           string
  name:         string
  expansion:    string
  req_heroes:   number
  req_classes:  HeroClass[]
  target_roll:  number
  penalty_roll: number
  effect:       string
  penalty:      string
  image:        string
}

export interface Leader {
  id:        string
  name:      string
  class:     HeroClass
  expansion: string
  ability:   string
  image:     string
}

export interface WinConditions {
  slayMonsters: boolean
  fullParty:    boolean
  bannerQuest:  boolean
}

export interface GameSettings {
  winConditions:      WinConditions
  monstersToWin:      number
  classesForFullParty: number
  bannersToWin:       number
}

export type GamePhase = 'setup' | 'playing' | 'finished'

export interface GameRoom {
  roomId:         string
  phase:          GamePhase
  settings:       GameSettings
  players:        Player[]
  seatOrder:      string[]
  activeMonsters: string[]
  monsterDeck:    string[]
  discardPile:    string[]
  banners:        Banner[]
  turnIndex:      number
  winner:         { playerId: string; condition: string } | null
  actionLog:      { message: string; timestamp: number }[]
}

// -------------------------------------------------------------------
// Tipos de resultados de combate
// -------------------------------------------------------------------
export type AttackResult = 'SLAY' | 'PENALTY' | 'NOTHING'

export interface CombatValidation {
  canAttack: boolean
  reason:    string
}
