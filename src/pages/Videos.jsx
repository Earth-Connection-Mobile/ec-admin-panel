import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { deleteFromR2 } from '../lib/media'
import { useToast } from '../components/Toast'
import Table from '../components/Table'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins + ':' + secs.toString().padStart(2, '0')
}

export default function Videos() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, duration_seconds, published_at, thumbnail_url, video_file_url')
        .order('published_at', { ascending: false })
      if (error) throw error
      setVideos(data || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('videos').delete().eq('id', deleteTarget.id)
      if (error) throw error

      // Clean up R2 files
      if (session) {
        if (deleteTarget.video_file_url) {
          try { await deleteFromR2(deleteTarget.video_file_url, session) } catch (_e) { void _e }
        }
        if (deleteTarget.thumbnail_url) {
          try { await deleteFromR2(deleteTarget.thumbnail_url, session) } catch (_e) { void _e }
        }
      }

      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Video deleted', 'success')
    } catch (err) {
      console.error('Error deleting video:', err)
      showToast('Failed to delete video', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <Link to={"/videos/" + row.id} className="font-medium text-[var(--ec-text)] hover:text-[var(--ec-gold)] transition-colors">{row.title}</Link>
      ),
    },
    {
      key: 'duration_seconds',
      label: 'Duration',
      render: (row) => <span className="text-[var(--ec-text-secondary)] font-mono text-xs">{formatDuration(row.duration_seconds)}</span>,
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
          <Link to={"/videos/" + row.id} className="rounded-lg border border-[var(--ec-card-border)] px-3 py-1 text-xs font-medium text-[var(--ec-text)] hover:bg-gray-50 font-body transition-colors">Edit</Link>
          <button onClick={() => setDeleteTarget(row)} className="rounded-lg border border-[var(--ec-rust)]/30 px-3 py-1 text-xs font-medium text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/5 font-body transition-colors">Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">Videos</h1>
          <p className="mt-1 text-sm text-[var(--ec-text-secondary)] font-body">Manage video content for the community.</p>
        </div>
        <Link to="/videos/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Video
        </Link>
      </div>

      <Table
        columns={columns}
        data={videos}
        loading={loading}
        emptyMessage="No videos yet. Upload your first video to get started."
        emptyIcon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
          </svg>
        }
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Video"
        message={"Are you sure you want to delete \"" + (deleteTarget?.title || "") + "\"? This action cannot be undone."}
        confirmLabel="Delete"
        confirmColor="rust"
        loading={deleting}
      />
    </div>
  )
}
