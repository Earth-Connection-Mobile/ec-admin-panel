import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { uploadToR2, generateFileKey } from '../lib/media'
import FileUpload from '../components/FileUpload'

export default function UpdateEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const isNew = !id

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverImagePreview, setCoverImagePreview] = useState(null)
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 16))

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('community_updates')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchErr) throw fetchErr
        setTitle(data.title)
        setBody(data.body || '')
        setCoverImageUrl(data.cover_image_url || '')
        setIsPinned(data.is_pinned)
        setPublishedAt(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        )
        if (data.cover_image_url) {
          setCoverImagePreview(import.meta.env.VITE_WORKER_URL + '/media/' + data.cover_image_url)
        }
      } catch (err) {
        console.error('Error loading update:', err)
        setError('Failed to load update.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isNew])

  useEffect(() => {
    const handler = (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const handleCoverFile = useCallback(async (file) => {
    setCoverImagePreview(URL.createObjectURL(file))
    setCoverUploading(true)
    setError(null)
    setDirty(true)
    try {
      const key = generateFileKey('images', file.name)
      await uploadToR2(file, key, session)
      setCoverImageUrl(key)
    } catch (err) {
      console.error('Cover upload error:', err)
      setError('Failed to upload cover image.')
    } finally {
      setCoverUploading(false)
    }
  }, [session])

  const handleClearCover = useCallback(() => {
    setCoverImageUrl('')
    setCoverImagePreview(null)
    setDirty(true)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!body.trim()) { setError('Body content is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const updateData = {
        title: title.trim(),
        body: body,
        cover_image_url: coverImageUrl || null,
        is_pinned: isPinned,
        published_at: new Date(publishedAt).toISOString(),
      }
      if (isNew) {
        const { error: insertErr } = await supabase.from('community_updates').insert(updateData)
        if (insertErr) throw insertErr
      } else {
        const { error: updateErr } = await supabase.from('community_updates').update(updateData).eq('id', id)
        if (updateErr) throw updateErr
      }
      setDirty(false)
      navigate('/updates')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-[var(--ec-text-secondary)] font-body">Loading update...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/updates')}
            className="flex items-center gap-1 text-sm text-[var(--ec-text-secondary)] hover:text-[var(--ec-gold)] font-body transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Updates
          </button>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">
            {isNew ? 'New Update' : 'Edit Update'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-5 py-2.5 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"></span>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Save Update
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-[var(--ec-rust)]/20 bg-[var(--ec-rust)]/5 px-4 py-3 text-sm text-[var(--ec-rust)] font-body flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6 mb-8">
        <h2 className="font-heading text-[22px] font-semibold text-[var(--ec-text)] mb-6">
          Update Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
              Title <span className="text-[var(--ec-rust)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              placeholder="e.g., April Ceremony Dates Announced"
              className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50"
            />
          </div>

          <div data-color-mode="light">
            <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
              Body <span className="text-[var(--ec-rust)]">*</span>
            </label>
            <div className="ec-md-editor">
              <MDEditor
                value={body}
                onChange={(val) => { setBody(val || ''); setDirty(true) }}
                height={360}
                preview="live"
                visibleDragbar={false}
              />
            </div>
          </div>

          <FileUpload
            accept="image/*"
            label="Cover Image"
            hint="Optional header image for the update"
            value={coverImageUrl ? { name: coverImageUrl.split('/').pop() } : null}
            previewUrl={coverImagePreview}
            onFile={handleCoverFile}
            onClear={handleClearCover}
            uploading={coverUploading}
            progress={coverUploading ? 50 : 0}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
                Published At <span className="text-[var(--ec-rust)]">*</span>
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => { setPublishedAt(e.target.value); setDirty(true) }}
                className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => { setIsPinned(e.target.checked); setDirty(true) }}
                  className="h-4 w-4 rounded border-[var(--ec-card-border)] accent-[var(--ec-gold)]"
                />
                <span className="text-sm text-[var(--ec-text)] font-body">Pinned</span>
                <span className="text-xs text-[var(--ec-text-secondary)] font-body">(shows on Home screen)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
