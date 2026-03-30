import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 360 }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const colors = {
  success: { bar: '#2D6A4F', icon: '#2D6A4F' },
  error: { bar: '#9C4A1A', icon: '#9C4A1A' },
  info: { bar: '#D8A657', icon: '#D8A657' },
}

function ToastItem({ toast, onDismiss }) {
  const c = colors[toast.type] || colors.info
  return (
    <div className="flex items-start bg-white rounded-lg shadow-lg overflow-hidden" style={{ minWidth: 280 }}>
      <div className="w-1 self-stretch" style={{ backgroundColor: c.bar }} />
      <div className="flex items-start gap-3 p-3 flex-1">
        <span style={{ color: c.icon }} className="mt-0.5 shrink-0 text-lg">
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
        </span>
        <p className="text-sm flex-1" style={{ color: 'var(--ec-text)', fontFamily: 'var(--font-body)' }}>{toast.message}</p>
        <button onClick={onDismiss} className="shrink-0 opacity-40 hover:opacity-100">✕</button>
      </div>
    </div>
  )
}
