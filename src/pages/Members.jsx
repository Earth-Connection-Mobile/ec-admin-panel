import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

function InviteModal({ open, onClose }) {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setEmail('')
      setResult(null)
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSend = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setResult({ type: 'error', message: 'Please enter an email address.' })
      return
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setResult({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    if (!session) {
      setResult({ type: 'error', message: 'Session expired. Please refresh the page.' })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL
      const response = await fetch(workerUrl + '/invite', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => 'Invite failed')
        throw new Error(text)
      }

      setResult({ type: 'success', message: 'Invitation sent to ' + trimmed + '!' })
      setEmail('')
      showToast('Invitation sent to ' + trimmed, 'success')
    } catch (err) {
      console.error('Invite error:', err)
      setResult({
        type: 'error',
        message: err.message || 'Failed to send invitation. Please try again.',
      })
      showToast('Failed to send invitation', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !sending) {
      handleSend()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--ec-card-border)] bg-white p-6 shadow-lg">
        <h3 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">
          Invite Member
        </h3>
        <p className="mt-2 text-sm text-[var(--ec-text-secondary)] font-body">
          Send an invitation email to a new community member. They will receive a magic link to create their account.
        </p>

        <div className="mt-4">
          <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
            Email Address
          </label>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="newmember@example.com"
            disabled={sending}
            className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50 disabled:opacity-60"
          />
        </div>

        {result && (
          <div
            className={
              'mt-3 rounded-lg px-3 py-2 text-sm font-body ' +
              (result.type === 'success'
                ? 'border border-[var(--ec-forest)]/20 bg-[var(--ec-forest)]/5 text-[var(--ec-forest)]'
                : 'border border-[var(--ec-rust)]/20 bg-[var(--ec-rust)]/5 text-[var(--ec-rust)]')
            }
          >
            {result.message}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="rounded-lg border border-[var(--ec-card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--ec-text)] font-body hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {result?.type === 'success' ? 'Done' : 'Cancel'}
          </button>
          {result?.type !== 'success' && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-60"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"></span>
                  Sending...
                </span>
              ) : (
                'Send Invite'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const { showToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusAction, setStatusAction] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, email, role, status, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filteredMembers = useMemo(() => {
    let result = members
    if (filter !== 'all') {
      result = result.filter((m) => m.status === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((m) => m.email.toLowerCase().includes(q))
    }
    return result
  }, [members, filter, search])

  const handleStatusChange = async () => {
    if (!statusTarget || !statusAction) return
    setStatusLoading(true)
    try {
      const newStatus = statusAction === 'deactivate' ? 'inactive' : 'active'
      const { error } = await supabase.from('members').update({ status: newStatus }).eq('id', statusTarget.id)
      if (error) throw error
      setMembers((prev) => prev.map((m) => m.id === statusTarget.id ? { ...m, status: newStatus } : m))
      showToast(
        statusAction === 'deactivate'
          ? statusTarget.email + ' has been deactivated'
          : statusTarget.email + ' has been reactivated',
        'success'
      )
      setStatusTarget(null)
      setStatusAction(null)
    } catch (err) {
      console.error('Error updating member status:', err)
      showToast('Failed to update member status', 'error')
    } finally {
      setStatusLoading(false)
    }
  }

  const openStatusModal = (member, action) => {
    setStatusTarget(member)
    setStatusAction(action)
  }

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="font-medium text-[var(--ec-text)]">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <Badge color={row.role === 'admin' ? 'gold' : 'gray'}>{row.role}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge color={row.status === 'active' ? 'green' : 'rust'}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (row) => <span className="text-[var(--ec-text-secondary)] whitespace-nowrap">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'active' ? (
            <button onClick={() => openStatusModal(row, 'deactivate')} className="rounded-lg border border-[var(--ec-rust)]/30 px-3 py-1 text-xs font-medium text-[var(--ec-rust)] hover:bg-[var(--ec-rust)]/5 font-body transition-colors">Deactivate</button>
          ) : (
            <button onClick={() => openStatusModal(row, 'reactivate')} className="rounded-lg border border-[var(--ec-forest)]/30 px-3 py-1 text-xs font-medium text-[var(--ec-forest)] hover:bg-[var(--ec-forest)]/5 font-body transition-colors">Reactivate</button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">Members</h1>
          <p className="mt-1 text-sm text-[var(--ec-text-secondary)] font-body">Manage community membership and access.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Invite Member
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={"rounded-md px-3 py-1.5 text-xs font-medium font-body transition-colors " + (filter === tab.key ? "bg-white text-[var(--ec-text)] shadow-sm" : "text-[var(--ec-text-secondary)] hover:text-[var(--ec-text)]")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ec-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white py-2 pl-9 pr-3 text-sm font-body text-[var(--ec-text)] placeholder:text-[var(--ec-text-secondary)]/50 sm:w-64"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredMembers}
        loading={loading}
        emptyMessage={search ? "No members found matching the search." : "No members found."}
        emptyIcon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        }
      />

      <Modal
        open={!!statusTarget}
        onClose={() => { setStatusTarget(null); setStatusAction(null) }}
        onConfirm={handleStatusChange}
        title={statusAction === 'deactivate' ? 'Deactivate Member' : 'Reactivate Member'}
        message={statusAction === 'deactivate'
          ? "Are you sure you want to deactivate " + (statusTarget?.email || "") + "? They will no longer be able to stream or access new content."
          : "Are you sure you want to reactivate " + (statusTarget?.email || "") + "? They will regain access to all content."}
        confirmLabel={statusAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmColor={statusAction === 'deactivate' ? 'rust' : 'gold'}
        loading={statusLoading}
      />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  )
}
