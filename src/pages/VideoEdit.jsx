import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { usePreview } from '../lib/preview'
import { useToast } from '../components/Toast'
import { uploadToR2, generateFileKey, fetchImageAsBlob } from '../lib/media'
import FileUpload from '../components/FileUpload'

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration)
      URL.revokeObjectURL(video.src)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Could not read video metadata'))
    }
    video.src = URL.createObjectURL(file)
  })
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return mins + ':' + secs.toString().padStart(2, '0')
}

export default function VideoEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { setPreviewData } = usePreview()
  const { showToast } = useToast()
  const isNew = !id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFileUrl, setVideoFileUrl] = useState('')
  const [videoPreviewSrc, setVideoPreviewSrc] = useState(null)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 16))

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [thumbUploading, setThumbUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)

  // Update preview pane data whenever form state changes
  useEffect(() => {
    setPreviewData({
      type: 'video',
      data: {
        title,
        description,
        thumbnailUrl: thumbnailPreview,
        duration: durationSeconds,
      },
    })
  }, [title, description, thumbnailPreview, durationSeconds, setPreviewData])

  // Clear preview on unmount
  useEffect(() => {
    return () => setPreviewData(null)
  }, [setPreviewData])

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchErr) throw fetchErr
        setTitle(data.title)
        setDescription(data.description || '')
        setVideoFileUrl(data.video_file_url || '')
        setThumbnailUrl(data.thumbnail_url || '')
        setDurationSeconds(data.duration_seconds || 0)
        setPublishedAt(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        )
        if (data.video_file_url) {
          setVideoPreviewSrc(import.meta.env.VITE_WORKER_URL + '/media/' + data.video_file_url)
        }
        if (data.thumbnail_url) {
          fetchImageAsBlob(data.thumbnail_url, session).then(url => { if (url) setThumbnailPreview(url) })
        }
      } catch (err) {
        console.error('Error loading video:', err)
        setError('Failed to load video.')
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

  const handleVideoFile = useCallback(async (file) => {
    setVideoUploading(true)
    setError(null)
    setDirty(true)
    try {
      try {
        const dur = await getVideoDuration(file)
        setDurationSeconds(dur)
      } catch (_e) { void _e }
      const key = generateFileKey('video', file.name)
      await uploadToR2(file, key, session)
      setVideoFileUrl(key)
      setVideoPreviewSrc(import.meta.env.VITE_WORKER_URL + '/media/' + key)
      showToast('Video file uploaded', 'success')
    } catch (err) {
      console.error('Video upload error:', err)
      setError('Failed to upload video file.')
      showToast('Failed to upload video', 'error')
    } finally {
      setVideoUploading(false)
    }
  }, [session, showToast])

  const handleClearVideo = useCallback(() => {
    setVideoFileUrl('')
    setVideoPreviewSrc(null)
    setDurationSeconds(0)
    setDirty(true)
  }, [])

  const handleThumbnailFile = useCallback(async (file) => {
    setThumbnailPreview(URL.createObjectURL(file))
    setThumbUploading(true)
    setError(null)
    setDirty(true)
    try {
      const key = generateFileKey('thumb', file.name)
      await uploadToR2(file, key, session)
      setThumbnailUrl(key)
      showToast('Thumbnail uploaded', 'success')
    } catch (err) {
      console.error('Thumbnail upload error:', err)
      setError('Failed to upload thumbnail.')
      showToast('Failed to upload thumbnail', 'error')
    } finally {
      setThumbUploading(false)
    }
  }, [session, showToast])

  const handleClearThumbnail = useCallback(() => {
    setThumbnailUrl('')
    setThumbnailPreview(null)
    setDirty(true)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Video title is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const videoData = {
        title: title.trim(),
        description: description.trim() || null,
        video_file_url: videoFileUrl || null,
        thumbnail_url: thumbnailUrl || null,
        duration_seconds: durationSeconds,
        published_at: new Date(publishedAt).toISOString(),
      }
      if (isNew) {
        const { error: insertErr } = await supabase.from('videos').insert(videoData)
        if (insertErr) throw insertErr
      } else {
        const { error: updateErr } = await supabase.from('videos').update(videoData).eq('id', id)
        if (updateErr) throw updateErr
      }
      setDirty(false)
      showToast('Video saved successfully', 'success')
      navigate('/videos')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save video: ' + err.message)
      showToast('Failed to save video', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-[var(--ec-text-secondary)] font-body">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/videos')}
            className="flex items-center gap-1 text-sm text-[var(--ec-text-secondary)] hover:text-[var(--ec-gold)] font-body transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Videos
          </button>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">
            {isNew ? 'New Video' : 'Edit Video'}
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
              Save Video
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
          Video Details
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
              placeholder="e.g., Preparing for Ceremony"
              className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDirty(true) }}
              placeholder="Brief description shown in the mobile app"
              rows={3}
              className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50 resize-vertical"
            />
          </div>

          <FileUpload
            accept="video/mp4"
            label="Video File"
            hint="MP4 only. Max 100 MB on free plan."
            value={videoFileUrl ? { name: videoFileUrl.split('/').pop() } : null}
            onFile={handleVideoFile}
            onClear={handleClearVideo}
            uploading={videoUploading}
            progress={videoUploading ? 50 : 0}
          />

          {videoPreviewSrc && !videoUploading && (
            <div>
              <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
                Video Preview
              </label>
              <video
                src={videoPreviewSrc}
                controls
                className="w-full max-w-2xl rounded-lg border border-[var(--ec-card-border)]"
              >
                Your browser does not support the video element.
              </video>
            </div>
          )}

          {durationSeconds > 0 && (
            <p className="text-xs text-[var(--ec-text-secondary)] font-body">
              Duration: {formatDuration(durationSeconds)}
            </p>
          )}

          <FileUpload
            accept="image/*"
            label="Thumbnail"
            hint="Recommended: 1920x1080 (16:9)"
            value={thumbnailUrl ? { name: thumbnailUrl.split('/').pop() } : null}
            previewUrl={thumbnailPreview}
            onFile={handleThumbnailFile}
            onClear={handleClearThumbnail}
            uploading={thumbUploading}
            progress={thumbUploading ? 50 : 0}
          />

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
        </div>
      </div>
    </div>
  )
}
