import { useState, useRef, useCallback } from 'react'

/**
 * Drag-and-drop file upload component.
 *
 * Props:
 *   accept       - File type filter (e.g., "audio/*", "image/*")
 *   label        - Label above the drop zone
 *   hint         - Helper text (e.g., "Recommended: 1200x1200")
 *   value        - Current file key (if already uploaded) or preview info
 *   onFile       - Callback when file is selected: (file) => void
 *   onClear      - Callback to clear the file
 *   uploading    - Boolean, shows progress state
 *   progress     - Number 0-100 for progress bar
 *   previewUrl   - URL/blob URL for image preview
 *   disabled     - Disable the upload zone
 *   multiple     - Allow multiple files
 *   onFiles      - Callback for multiple files: (files[]) => void
 */
export default function FileUpload({
  accept = '*',
  label,
  hint,
  value,
  onFile,
  onClear,
  uploading = false,
  progress = 0,
  previewUrl,
  disabled = false,
  multiple = false,
  onFiles,
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    if (multiple && onFiles) {
      onFiles(files)
    } else if (files[0] && onFile) {
      onFile(files[0])
    }
  }, [disabled, multiple, onFile, onFiles])

  const handleInputChange = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (multiple && onFiles) {
      onFiles(files)
    } else if (files[0] && onFile) {
      onFile(files[0])
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [multiple, onFile, onFiles])

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim() || !onFile) return
    setUrlLoading(true)
    setUrlError(null)
    try {
      const res = await fetch(urlInput.trim())
      if (!res.ok) throw new Error('fail')
      const blob = await res.blob()
      const ext = urlInput.split('.').pop().split('?')[0].toLowerCase()
      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      const filename = 'pasted-image.' + (validExts.includes(ext) ? ext : 'jpg')
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
      onFile(file)
      setUrlInput('')
      setShowUrlInput(false)
    } catch {
      setUrlError('Could not load image from URL')
    } finally {
      setUrlLoading(false)
    }
  }, [urlInput, onFile])

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImage = accept && accept.startsWith('image')

  return (
    <div>
      {label && (
        <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
          {label}
        </label>
      )}

      {/* Show preview/value state or the drop zone */}
      {value && !uploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--ec-card-border)] bg-white p-3">
          {isImage && previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-14 w-14 rounded-lg object-cover border border-[var(--ec-card-border)]"
            />
          )}
          {!isImage && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ec-gold)]/10">
              <svg className="w-5 h-5 text-[var(--ec-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--ec-text)] font-body truncate">
              {typeof value === 'string' ? value.split('/').pop() : value.name || 'Uploaded'}
            </p>
            {value.size && (
              <p className="text-xs text-[var(--ec-text-secondary)] font-body">
                {formatSize(value.size)}
              </p>
            )}
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg p-1.5 text-[var(--ec-text-secondary)] hover:text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/5 transition-colors"
              title="Remove file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : uploading ? (
        <div className="rounded-lg border border-[var(--ec-card-border)] bg-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ec-gold)]/30 border-t-[var(--ec-gold)]"></span>
            <span className="text-sm text-[var(--ec-text-secondary)] font-body">Uploading...</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--ec-gold)] transition-all duration-300"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors
              ${isDragOver
                ? 'border-[var(--ec-gold)] bg-[var(--ec-gold)]/5'
                : 'border-[var(--ec-card-border)] bg-white hover:border-[var(--ec-gold)]/50 hover:bg-[var(--ec-gold)]/[0.02]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-2">
              <svg className="w-5 h-5 text-[var(--ec-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm text-[var(--ec-text-secondary)] font-body">
              <span className="font-medium text-[var(--ec-gold)]">Click to browse</span> or drag and drop
            </p>
            {hint && (
              <p className="mt-1 text-xs text-[var(--ec-text-secondary)]/70 font-body">{hint}</p>
            )}
          </div>
          {isImage && !showUrlInput && (
            <button type="button" onClick={() => setShowUrlInput(true)} className="text-xs text-[var(--ec-text-secondary)] hover:text-[var(--ec-gold)] font-body transition-colors">
              Or paste an image URL
            </button>
          )}
          {isImage && showUrlInput && (
            <div>
              <div className="flex gap-2">
                <input type="text" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(null) }} onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()} placeholder="https://example.com/image.jpg" className="flex-1 rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-2 text-sm text-[var(--ec-text)] font-body" />
                <button type="button" onClick={handleUrlSubmit} disabled={urlLoading || !urlInput.trim()} className="rounded-lg bg-[var(--ec-gold)] px-3 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-50">{urlLoading ? '...' : 'Load'}</button>
                <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput(''); setUrlError(null) }} className="rounded-lg border border-[var(--ec-card-border)] px-2 py-2 text-sm text-[var(--ec-text-secondary)] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
              {urlError && <p className="text-xs text-[var(--ec-rust)] font-body mt-1">{urlError}</p>}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
