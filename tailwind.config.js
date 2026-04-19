/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta fantasía oscura
        fantasy: {
          bg:        '#0d0a1e',   // Fondo principal oscuro
          surface:   '#1a1035',   // Superficie de cartas/paneles
          border:    '#2d1f5e',   // Bordes sutiles
          purple:    '#7c3aed',   // Acento principal
          gold:      '#f59e0b',   // Dorado principal
          'gold-light': '#fcd34d', // Dorado claro
          crimson:   '#dc2626',   // Rojo para penalizaciones
          green:     '#16a34a',   // Verde para éxito/slay
          muted:     '#6b7280',   // Texto secundario
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'serif'],
      },
      backgroundImage: {
        'fantasy-gradient': 'linear-gradient(135deg, #0d0a1e 0%, #1a0a2e 50%, #0d0a1e 100%)',
        'card-gradient':    'linear-gradient(180deg, rgba(124,58,237,0.1) 0%, rgba(13,10,30,0.8) 100%)',
        'gold-gradient':    'linear-gradient(135deg, #f59e0b, #fcd34d, #f59e0b)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124,58,237,0.4)',
        'glow-gold':   '0 0 20px rgba(245,158,11,0.4)',
        'glow-red':    '0 0 20px rgba(220,38,38,0.4)',
        'glow-green':  '0 0 20px rgba(22,163,74,0.4)',
        'card':        '0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'banner-claim': 'bannerClaim 0.5s ease-out',
        'dice-roll':    'diceRoll 0.6s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'fade-in':      'fadeIn 0.2s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124,58,237,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(124,58,237,0.7)' },
        },
        bannerClaim: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        diceRoll: {
          '0%':   { transform: 'rotate(0deg)   scale(1)' },
          '25%':  { transform: 'rotate(180deg) scale(1.2)' },
          '50%':  { transform: 'rotate(360deg) scale(0.9)' },
          '75%':  { transform: 'rotate(540deg) scale(1.1)' },
          '100%': { transform: 'rotate(720deg) scale(1)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
