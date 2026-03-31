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

export default function Updates() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [pinLoading, setPinLoading] = useState(null)

  const fetchUpdates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_updates')
        .select('id, title, is_pinned, published_at, cover_image_url')
        .order('published_at', { ascending: false })
      if (error) throw error
      setUpdates(data || [])
    } catch (err) {
      console.error('Error fetching updates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUpdates() }, [fetchUpdates])

  const handleTogglePin = async (update) => {
    setPinLoading(update.id)
    try {
      const { error } = await supabase
        .from('community_updates')
        .update({ is_pinned: !update.is_pinned })
        .eq('id', update.id)
      if (error) throw error
      setUpdates((prev) => prev.map((u) => u.id === update.id ? { ...u, is_pinned: !u.is_pinned } : u))
      showToast(update.is_pinned ? 'Update unpinned' : 'Update pinned', 'success')
    } catch (err) {
      console.error('Error toggling pin:', err)
      showToast('Failed to update pin status', 'error')
    } finally {
      setPinLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('community_updates').delete().eq('id', deleteTarget.id)
      if (error) throw error

      // Clean up R2 cover image
      if (session && deleteTarget.cover_image_url) {
        try { await deleteFromR2(deleteTarget.cover_image_url, session) } catch (_e) { void _e }
      }

      setUpdates((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Update deleted', 'success')
    } catch (err) {
      console.error('Error deleting update:', err)
      showToast('Failed to delete update', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <Link to={"/updates/" + row.id} className="font-medium text-[var(--ec-text)] hover:text-[var(--ec-gold)] transition-colors">{row.title}</Link>
      ),
    },
    {
      key: 'is_pinned',
      label: 'Pinned',
      className: 'text-center',
      render: (row) => (
        <button
          onClick={() => handleTogglePin(row)}
          disabled={pinLoading === row.id}
          className="inline-flex items-center justify-center disabled:opacity-50 transition-opacity"
          title={row.is_pinned ? 'Unpin update' : 'Pin update'}
        >
          {pinLoading === row.id ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ec-gold)]/30 border-t-[var(--ec-gold)]"></span>
          ) : row.is_pinned ? (
            <svg className="w-5 h-5 text-[var(--ec-gold)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-300 hover:text-[var(--ec-gold)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
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
          <Link to={"/updates/" + row.id} className="rounded-lg border border-[var(--ec-card-border)] px-3 py-1 text-xs font-medium text-[var(--ec-text)] hover:bg-gray-50 font-body transition-colors">Edit</Link>
          <button onClick={() => setDeleteTarget(row)} className="rounded-lg border border-[var(--ec-rust)]/30 px-3 py-1 text-xs font-medium text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/5 font-body transition-colors">Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">Updates</h1>
          <p className="mt-1 text-sm text-[var(--ec-text-secondary)] font-body">Manage community updates and announcements.</p>
        </div>
        <Link to="/updates/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Update
        </Link>
      </div>

      <Table
        columns={columns}
        data={updates}
        loading={loading}
        emptyMessage="No updates yet. Create your first community update."
        emptyIcon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Update"
        message={"Are you sure you want to delete \"" + (deleteTarget?.title || "") + "\"? This action cannot be undone."}
        confirmLabel="Delete"
        confirmColor="rust"
        loading={deleting}
      />
    </div>
  )
}
