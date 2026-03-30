import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { uploadToR2, deleteFromR2, generateFileKey, getAudioDuration, formatDuration } from '../lib/media'
import FileUpload from '../components/FileUpload'
import Modal from '../components/Modal'

const PHASE_OPTIONS = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'ceremony_night', label: 'Ceremony Night' },
  { value: 'integration', label: 'Integration' },
]

function TrackForm({ initialData, onSave, onCancel, session }) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [artistHealer, setArtistHealer] = useState(initialData?.artist_healer || '')
  const [durationSeconds, setDurationSeconds] = useState(initialData?.duration_seconds || 0)
  const [audioFileUrl, setAudioFileUrl] = useState(initialData?.audio_file_url || '')
  const [audioFile, setAudioFile] = useState(null)
  const [audioUploading, setAudioUploading] = useState(false)
  const [coverArtUrl, setCoverArtUrl] = useState(initialData?.cover_art_url || '')
  const [coverArtPreview, setCoverArtPreview] = useState(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (initialData?.cover_art_url) {
      setCoverArtPreview(import.meta.env.VITE_WORKER_URL + '/media/' + initialData.cover_art_url)
    }
  }, [initialData])

  const handleAudioFile = async (file) => {
    setAudioFile(file)
    setAudioUploading(true)
    setFormError(null)
    try {
      try { setDurationSeconds(await getAudioDuration(file)) } catch (_e) { void _e }
      const key = generateFileKey('audio', file.name)
      await uploadToR2(file, key, session)
      setAudioFileUrl(key)
    } catch (err) {
      console.error('Audio upload error:', err)
      setFormError('Failed to upload audio file.')
    } finally {
      setAudioUploading(false)
    }
  }

  const handleCoverFile = async (file) => {
    setCoverArtPreview(URL.createObjectURL(file))
    setCoverUploading(true)
    try {
      const key = generateFileKey('covers', file.name)
      await uploadToR2(file, key, session)
      setCoverArtUrl(key)
    } catch (err) {
      console.error('Cover upload error:', err)
      setFormError('Failed to upload cover art.')
    } finally {
      setCoverUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) { setFormError('Track title is required.'); return }
    if (!artistHealer.trim()) { setFormError('Artist/Healer is required.'); return }
    onSave({
      title: title.trim(),
      artist_healer: artistHealer.trim(),
      duration_seconds: durationSeconds,
      audio_file_url: audioFileUrl || null,
      cover_art_url: coverArtUrl || null,
    })
  }

  return (
    <div className="rounded-lg border border-[var(--ec-gold)]/30 bg-[var(--ec-gold)]/[0.03] p-4">
      <h3 className="text-sm font-semibold text-[var(--ec-text)] font-body mb-3">
        {initialData ? 'Edit Track' : 'New Track'}
      </h3>
      {formError && (
        <div className="mb-3 rounded-lg border border-[var(--ec-rust)]/20 bg-[var(--ec-rust)]/5 px-3 py-2 text-xs text-[var(--ec-rust)] font-body">{formError}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[12px] font-medium text-[var(--ec-text)] font-body mb-1">Title <span className="text-[var(--ec-rust)]">*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Opening Icaro" className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-2.5 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[var(--ec-text)] font-body mb-1">Artist / Healer <span className="text-[var(--ec-rust)]">*</span></label>
          <input type="text" value={artistHealer} onChange={(e) => setArtistHealer(e.target.value)} placeholder="e.g., Maestro Ricardo" className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-2.5 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <FileUpload accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg" label="Audio File" hint="MP3, WAV, FLAC, M4A"
          value={audioFileUrl ? { name: audioFileUrl.split('/').pop(), size: audioFile?.size } : null}
          onFile={handleAudioFile} onClear={() => { setAudioFileUrl(''); setAudioFile(null); setDurationSeconds(0) }}
          uploading={audioUploading} progress={audioUploading ? 50 : 0} />
        <FileUpload accept="image/*" label="Cover Art (optional)" hint="Per-track art"
          value={coverArtUrl ? { name: coverArtUrl.split('/').pop() } : null} previewUrl={coverArtPreview}
          onFile={handleCoverFile} onClear={() => { setCoverArtUrl(''); setCoverArtPreview(null) }}
          uploading={coverUploading} progress={coverUploading ? 50 : 0} />
      </div>
      {durationSeconds > 0 && <p className="text-xs text-[var(--ec-text-secondary)] font-body mb-3">Duration: {formatDuration(durationSeconds)}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--ec-text)] font-body hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={audioUploading || coverUploading} className="rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-60">{initialData ? 'Update Track' : 'Add Track'}</button>
      </div>
    </div>
  )
}

function TrackRow({ track, index, onEdit, onDelete, onDragStart, onDragEnter, onDragEnd }) {
  const rowClass = "border-b border-[var(--ec-card-border)] last:border-b-0 transition-colors hover:bg-[var(--ec-gold)]/5 " + (index % 2 === 1 ? "bg-gray-50/50 " : "") + (track._needsArtist ? "bg-[var(--ec-gold)]/[0.03]" : "")
  return (
    <tr draggable onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()} className={rowClass}>
      <td className="px-2 py-2.5 cursor-grab active:cursor-grabbing"><svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" /></svg></td>
      <td className="px-2 py-2.5 text-sm text-[var(--ec-text-secondary)] font-body">{index + 1}</td>
      <td className="px-3 py-2.5 text-sm font-medium text-[var(--ec-text)] font-body">{track.title}</td>
      <td className="px-3 py-2.5 text-sm text-[var(--ec-text-secondary)] font-body">{track.artist_healer || <span className="italic text-[var(--ec-rust)]/70">Needs artist</span>}</td>
      <td className="px-3 py-2.5 text-sm text-[var(--ec-text-secondary)] font-body whitespace-nowrap">{formatDuration(track.duration_seconds)}</td>
      <td className="px-3 py-2.5">{track.audio_file_url ? <span className="inline-flex items-center gap-1 text-xs text-[var(--ec-forest)] font-body"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Uploaded</span> : <span className="text-xs text-[var(--ec-text-secondary)]/60 font-body">No file</span>}</td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onEdit(track.id)} className="rounded p-1.5 text-[var(--ec-text-secondary)] hover:text-[var(--ec-gold)] hover:bg-[var(--ec-gold)]/10 transition-colors" title="Edit track"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
          <button onClick={() => onDelete(track)} className="rounded p-1.5 text-[var(--ec-text-secondary)] hover:text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/10 transition-colors" title="Delete track"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
        </div>
      </td>
    </tr>
  )
}

function TrackTable({ tracks, editingTrackId, onEdit, onUpdate, onDelete, onDragStart, onDragEnter, onDragEnd, session }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--ec-card-border)]">
            <th className="w-8 px-2 py-2"></th>
            <th className="w-10 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">#</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">Title</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">Artist / Healer</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">Duration</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">Audio</th>
            <th className="w-24 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => editingTrackId === track.id
            ? <tr key={track.id}><td colSpan={7} className="p-3"><TrackForm initialData={track} onSave={(data) => onUpdate(track.id, data)} onCancel={() => onEdit(null)} session={session} /></td></tr>
            : <TrackRow key={track.id} track={track} index={index} onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} />
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function PlaylistEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const isNew = !id
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [phaseTag, setPhaseTag] = useState('preparation')
  const [coverArtKey, setCoverArtKey] = useState('')
  const [coverArtPreview, setCoverArtPreview] = useState(null)
  const [coverArtFile, setCoverArtFile] = useState(null)
  const [isFeatured, setIsFeatured] = useState(false)
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [tracks, setTracks] = useState([])
  const [editingTrackId, setEditingTrackId] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [deleteTrackTarget, setDeleteTrackTarget] = useState(null)
  const [deletingTrack, setDeletingTrack] = useState(false)
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        const { data: playlist, error: pErr } = await supabase.from('playlists').select('*').eq('id', id).single()
        if (pErr) throw pErr
        setTitle(playlist.title); setDescription(playlist.description || ''); setPhaseTag(playlist.phase_tag)
        setCoverArtKey(playlist.cover_art_url || ''); setIsFeatured(playlist.is_featured)
        setPublishedAt(playlist.published_at ? new Date(playlist.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
        if (playlist.cover_art_url) setCoverArtPreview(import.meta.env.VITE_WORKER_URL + '/media/' + playlist.cover_art_url)
        const { data: td, error: tErr } = await supabase.from('tracks').select('*').eq('playlist_id', id).order('track_order', { ascending: true })
        if (tErr) throw tErr
        setTracks((td || []).map((t) => ({ ...t, _status: 'saved' })))
      } catch (err) { console.error('Error loading playlist:', err); setError('Failed to load playlist.') }
      finally { setLoading(false) }
    }
    load()
  }, [id, isNew])

  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const handleCoverFile = useCallback(async (file) => {
    setCoverArtFile(file); setCoverArtPreview(URL.createObjectURL(file)); setDirty(true); setCoverUploading(true)
    try { const key = generateFileKey('covers', file.name); await uploadToR2(file, key, session); setCoverArtKey(key) }
    catch (err) { console.error('Cover upload error:', err); setError('Failed to upload cover art.') }
    finally { setCoverUploading(false) }
  }, [session])

  const handleClearCover = useCallback(() => { setCoverArtKey(''); setCoverArtPreview(null); setCoverArtFile(null); setDirty(true) }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Playlist title is required.'); return }
    setSaving(true); setError(null)
    try {
      const playlistData = { title: title.trim(), description: description.trim() || null, phase_tag: phaseTag, cover_art_url: coverArtKey || null, is_featured: isFeatured, published_at: new Date(publishedAt).toISOString() }
      let playlistId = id
      if (isNew) {
        if (isFeatured) await supabase.from('playlists').update({ is_featured: false }).eq('is_featured', true)
        const { data, error } = await supabase.from('playlists').insert(playlistData).select('id').single()
        if (error) throw error
        playlistId = data.id
      } else {
        if (isFeatured) await supabase.from('playlists').update({ is_featured: false }).eq('is_featured', true).neq('id', id)
        const { error } = await supabase.from('playlists').update(playlistData).eq('id', id)
        if (error) throw error
      }
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const td = { title: track.title, artist_healer: track.artist_healer, duration_seconds: track.duration_seconds || 0, audio_file_url: track.audio_file_url || null, cover_art_url: track.cover_art_url || null, playlist_id: playlistId, track_order: i + 1 }
        if (track._status === 'new') { const { error } = await supabase.from('tracks').insert(td); if (error) throw error }
        else if (track._status === 'saved' || track._status === 'modified') { const { error } = await supabase.from('tracks').update(td).eq('id', track.id); if (error) throw error }
      }
      setDirty(false); navigate('/playlists')
    } catch (err) { console.error('Save error:', err); setError('Failed to save playlist: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleAddTrack = (formData) => { setTracks((prev) => [...prev, { ...formData, id: crypto.randomUUID(), track_order: prev.length + 1, _status: 'new' }]); setShowAddTrack(false); setDirty(true) }
  const handleUpdateTrack = (trackId, updates) => { setTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, ...updates, _status: t._status === 'new' ? 'new' : 'modified' } : t)); setEditingTrackId(null); setDirty(true) }

  const handleDeleteTrack = async () => {
    if (!deleteTrackTarget) return
    setDeletingTrack(true)
    try {
      if (deleteTrackTarget._status !== 'new') { const { error } = await supabase.from('tracks').delete().eq('id', deleteTrackTarget.id); if (error) throw error }
      if (deleteTrackTarget.audio_file_url) { try { await deleteFromR2(deleteTrackTarget.audio_file_url, session) } catch (_e) { void _e } }
      setTracks((prev) => prev.filter((t) => t.id !== deleteTrackTarget.id)); setDeleteTrackTarget(null); setDirty(true)
    } catch (err) { console.error('Delete track error:', err); setError('Failed to delete track.') }
    finally { setDeletingTrack(false) }
  }

  const handleBulkUpload = async (fileList) => {
    const files = Array.from(fileList)
    if (!files.length) return
    setBulkUploading(true); setBulkProgress(0); setDirty(true)
    const re = /\.(mp3|wav|flac|m4a|aac|ogg)$/i
    const audioFiles = files.filter((f) => f.type.startsWith('audio/') || re.test(f.name))
    if (!audioFiles.length) { setError('No audio files found in selection.'); setBulkUploading(false); return }
    let completed = 0
    const results = await Promise.all(audioFiles.map(async (file) => {
      try {
        const trackTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
        let duration = 0
        try { duration = await getAudioDuration(file) } catch (_e) { void _e }
        const key = generateFileKey('audio', file.name)
        await uploadToR2(file, key, session)
        completed++
        setBulkProgress(Math.round((completed / audioFiles.length) * 100))
        return { id: crypto.randomUUID(), title: trackTitle, artist_healer: '', duration_seconds: duration, audio_file_url: key, cover_art_url: null, track_order: 0, _status: 'new', _needsArtist: true }
      } catch (err) { console.error('Bulk upload error for', file.name, err); return null }
    }))
    setTracks((prev) => [...prev, ...results.filter(Boolean)].map((t, i) => ({ ...t, track_order: i + 1 })))
    setBulkUploading(false); setBulkProgress(0)
  }

  const handleDragStart = (i) => { dragItem.current = i }
  const handleDragEnter = (i) => { dragOverItem.current = i }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return
    setTracks((prev) => { const items = [...prev]; const dragged = items.splice(dragItem.current, 1)[0]; items.splice(dragOverItem.current, 0, dragged); return items.map((t, i) => ({ ...t, track_order: i + 1 })) })
    setDirty(true); dragItem.current = null; dragOverItem.current = null
  }

  if (loading) return (<div className="flex items-center justify-center py-20"><div className="text-center"><div className="spinner mx-auto mb-4"></div><p className="text-sm text-[var(--ec-text-secondary)] font-body">Loading playlist...</p></div></div>)

  const trackDeleteMsg = deleteTrackTarget ? 'Are you sure you want to delete "' + deleteTrackTarget.title + '"? This action cannot be undone.' : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/playlists')} className="flex items-center gap-1 text-sm text-[var(--ec-text-secondary)] hover:text-[var(--ec-gold)] font-body transition-colors mb-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>Back to Playlists</button>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">{isNew ? 'New Playlist' : 'Edit Playlist'}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-5 py-2.5 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-60">
          {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"></span>Saving...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Save Playlist</>}
        </button>
      </div>
      {error && (<div className="mb-6 rounded-lg border border-[var(--ec-rust)]/20 bg-[var(--ec-rust)]/5 px-4 py-3 text-sm text-[var(--ec-rust)] font-body flex items-center justify-between"><span>{error}</span><button onClick={() => setError(null)} className="ml-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>)}
      <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6 mb-8">
        <h2 className="font-heading text-[22px] font-semibold text-[var(--ec-text)] mb-6">Playlist Details</h2>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">Title <span className="text-[var(--ec-rust)]">*</span></label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} placeholder="e.g., March 2026 Ceremony" className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50" /></div>
          <div><label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">Description</label><textarea value={description} onChange={(e) => { setDescription(e.target.value); setDirty(true) }} placeholder="Shown in the mobile app playlist detail view" rows={3} className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50 resize-vertical" /></div>
          <div><label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">Phase Tag <span className="text-[var(--ec-rust)]">*</span></label><select value={phaseTag} onChange={(e) => { setPhaseTag(e.target.value); setDirty(true) }} className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body">{PHASE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <FileUpload accept="image/*" label="Cover Art" hint="Recommended: 1200x1200 square image" value={coverArtKey ? { name: coverArtKey.split('/').pop(), size: coverArtFile?.size } : null} previewUrl={coverArtPreview} onFile={handleCoverFile} onClear={handleClearCover} uploading={coverUploading} progress={coverUploading ? 50 : 0} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">Published At <span className="text-[var(--ec-rust)]">*</span></label><input type="datetime-local" value={publishedAt} onChange={(e) => { setPublishedAt(e.target.value); setDirty(true) }} className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body" /></div>
            <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => { setIsFeatured(e.target.checked); setDirty(true) }} className="h-4 w-4 rounded border-[var(--ec-card-border)] accent-[var(--ec-gold)]" /><span className="text-sm text-[var(--ec-text)] font-body">Featured Playlist</span><span className="text-xs text-[var(--ec-text-secondary)] font-body">(only one can be featured)</span></label></div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">Tracks{tracks.length > 0 && <span className="ml-2 text-base font-normal text-[var(--ec-text-secondary)]">({tracks.length})</span>}</h2>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--ec-card-border)] px-3 py-2 text-sm font-medium text-[var(--ec-text)] font-body hover:bg-gray-50 transition-colors cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>Upload Tracks<input type="file" accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg" multiple className="hidden" onChange={(e) => handleBulkUpload(e.target.files)} /></label>
            <button onClick={() => setShowAddTrack(true)} className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-3 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Track</button>
          </div>
        </div>
        {bulkUploading && (<div className="mb-4 rounded-lg border border-[var(--ec-card-border)] bg-[var(--ec-gold)]/5 p-4"><div className="flex items-center gap-3 mb-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ec-gold)]/30 border-t-[var(--ec-gold)]"></span><span className="text-sm text-[var(--ec-text)] font-body font-medium">Uploading tracks... {bulkProgress}%</span></div><div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-[var(--ec-gold)] transition-all duration-300" style={{ width: Math.max(bulkProgress, 3) + '%' }} /></div></div>)}
        {showAddTrack && <div className="mb-4"><TrackForm onSave={handleAddTrack} onCancel={() => setShowAddTrack(false)} session={session} /></div>}
        {tracks.length === 0 && !showAddTrack ? (
          <div className="py-12 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"><svg className="w-6 h-6 text-[var(--ec-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg></div><p className="text-sm text-[var(--ec-text-secondary)] font-body">No tracks yet. Add tracks individually or use bulk upload.</p></div>
        ) : tracks.length > 0 && (
          <TrackTable tracks={tracks} editingTrackId={editingTrackId} onEdit={setEditingTrackId} onUpdate={handleUpdateTrack} onDelete={setDeleteTrackTarget} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} session={session} />
        )}
      </div>
      <Modal open={!!deleteTrackTarget} onClose={() => setDeleteTrackTarget(null)} onConfirm={handleDeleteTrack} title="Delete Track" message={trackDeleteMsg} confirmLabel="Delete" confirmColor="rust" loading={deletingTrack} />
    </div>
  )
}
