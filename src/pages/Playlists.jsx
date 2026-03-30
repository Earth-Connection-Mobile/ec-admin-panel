import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const phaseConfig = {
  preparation: { label: 'Preparation', color: 'green' },
  ceremony_night: { label: 'Ceremony Night', color: 'gold' },
  integration: { label: 'Integration', color: 'forest' },
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [featureLoading, setFeatureLoading] = useState(null)

  const fetchPlaylists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, title, phase_tag, is_featured, published_at, created_at')
        .order('published_at', { ascending: false })
      if (error) throw error
      const playlistIds = (data || []).map((p) => p.id)
      let trackCounts = {}
      if (playlistIds.length > 0) {
        const { data: tracks } = await supabase.from('tracks').select('playlist_id').in('playlist_id', playlistIds)
        ;(tracks || []).forEach((t) => { trackCounts[t.playlist_id] = (trackCounts[t.playlist_id] || 0) + 1 })
      }
      setPlaylists((data || []).map((p) => ({ ...p, trackCount: trackCounts[p.id] || 0 })))
    } catch (err) {
      console.error('Error fetching playlists:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlaylists() }, [fetchPlaylists])

  const handleToggleFeatured = async (playlist) => {
    setFeatureLoading(playlist.id)
    try {
      await supabase.from('playlists').update({ is_featured: false }).eq('is_featured', true)
      if (!playlist.is_featured) {
        await supabase.from('playlists').update({ is_featured: true }).eq('id', playlist.id)
      }
      await fetchPlaylists()
    } catch (err) {
      console.error('Error toggling featured:', err)
    } finally {
      setFeatureLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setPlaylists((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting playlist:', err)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <Link to={"/playlists/" + row.id} className="font-medium text-[var(--ec-text)] hover:text-[var(--ec-gold)] transition-colors">{row.title}</Link>
      ),
    },
    {
      key: 'phase_tag',
      label: 'Phase Tag',
      render: (row) => {
        const cfg = phaseConfig[row.phase_tag] || { label: row.phase_tag, color: 'gray' }
        return <Badge color={cfg.color}>{cfg.label}</Badge>
      },
    },
    {
      key: 'trackCount',
      label: 'Tracks',
      className: 'text-center',
      render: (row) => <span className="text-[var(--ec-text-secondary)]">{row.trackCount}</span>,
    },
    {
      key: 'is_featured',
      label: 'Featured',
      className: 'text-center',
      render: (row) => (
        <button
          onClick={() => handleToggleFeatured(row)}
          disabled={featureLoading === row.id}
          className="inline-flex items-center justify-center disabled:opacity-50 transition-opacity"
          title={row.is_featured ? 'Remove featured' : 'Set as featured'}
        >
          {featureLoading === row.id ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ec-gold)]/30 border-t-[var(--ec-gold)]"></span>
          ) : row.is_featured ? (
            <svg className="w-5 h-5 text-[var(--ec-gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-300 hover:text-[var(--ec-gold)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )}
        </button>
      ),
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (row) => <span className="text-[var(--ec-text-secondary)] whitespace-nowrap">{formatDate(row.published_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={"/playlists/" + row.id} className="rounded-lg border border-[var(--ec-card-border)] px-3 py-1 text-xs font-medium text-[var(--ec-text)] hover:bg-gray-50 font-body transition-colors">Edit</Link>
          <button onClick={() => setDeleteTarget(row)} className="rounded-lg border border-[var(--ec-rust)]/30 px-3 py-1 text-xs font-medium text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/5 font-body transition-colors">Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">Playlists</h1>
          <p className="mt-1 text-sm text-[var(--ec-text-secondary)] font-body">Manage ceremony playlists and tracks.</p>
        </div>
        <Link to="/playlists/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Playlist
        </Link>
      </div>

      <Table
        columns={columns}
        data={playlists}
        loading={loading}
        emptyMessage="No playlists yet. Create your first playlist to get started."
        emptyIcon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        }
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Playlist"
        message={"Are you sure you want to delete \"" + (deleteTarget?.title || "") + "\"? This will also delete all tracks in this playlist. This action cannot be undone."}
        confirmLabel="Delete"
        confirmColor="rust"
        loading={deleting}
      />
    </div>
  )
}
