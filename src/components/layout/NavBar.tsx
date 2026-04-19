// ============================================================
//  NavBar.tsx — Barra de navegación inferior (móvil)
//  4 tabs: Tablero | Party | Banners | Combate
// ============================================================

import { useGameStore } from '../../store/gameStore'

type Tab = 'tablero' | 'party' | 'banners' | 'combate'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'tablero',  label: 'Tablero',  icon: '🗺️' },
  { id: 'party',    label: 'Party',    icon: '🧙' },
  { id: 'banners',  label: 'Banners',  icon: '🚩' },
  { id: 'combate',  label: 'Combate',  icon: '🎲' },
]

export default function NavBar() {
  const { activeTab, setActiveTab } = useGameStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-fantasy-border/50">
      <div className="max-w-2xl mx-auto flex">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5
                         transition-all duration-200 active:scale-95 no-select relative"
            >
              {/* Indicador activo */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full
                                 bg-fantasy-gold animate-fade-in" />
              )}

              {/* Ícono */}
              <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>

              {/* Label */}
              <span className={`text-xs font-semibold transition-colors duration-200
                ${isActive
                  ? 'text-fantasy-gold'
                  : 'text-fantasy-muted'
                }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Safe area para dispositivos con barra inferior */}
      <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
