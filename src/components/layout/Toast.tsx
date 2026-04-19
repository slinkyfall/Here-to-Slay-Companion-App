// ============================================================
//  Toast.tsx — Notificación flotante temporal
// ============================================================

import { useGameStore } from '../../store/gameStore'

export default function Toast() {
  const { toast } = useGameStore()
  if (!toast) return null

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      {toast.type === 'success' && '✅ '}
      {toast.type === 'danger'  && '⚠️ '}
      {toast.type === 'info'    && 'ℹ️ '}
      {toast.message}
    </div>
  )
}
