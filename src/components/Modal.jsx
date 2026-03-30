import { useEffect, useRef } from 'react'

export default function Modal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'gold',
  loading = false,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const confirmClasses =
    confirmColor === 'rust'
      ? 'bg-[var(--ec-rust)] text-white hover:bg-[#7C3A12]'
      : 'bg-[var(--ec-gold)] text-[var(--ec-nav-bg)] hover:bg-[var(--ec-gold-hover)]'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--ec-card-border)] bg-white p-6 shadow-lg">
        <h3 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--ec-text-secondary)] font-body">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--ec-card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--ec-text)] font-body hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium font-body transition-colors disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"></span>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
