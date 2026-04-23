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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCsvRows(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const parsed = []
  const skipped = []
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim())
    if (parts.length < 3) {
      skipped.push({ line: i + 1, text: lines[i], reason: 'need 3 columns: name, phone, email' })
      continue
    }
    const [full_name, phone, email] = parts
    if (!EMAIL_REGEX.test(email)) {
      skipped.push({ line: i + 1, text: lines[i], reason: 'invalid email' })
      continue
    }
    if (!full_name) {
      skipped.push({ line: i + 1, text: lines[i], reason: 'missing name' })
      continue
    }
    parsed.push({ full_name, phone, email })
  }
  return { parsed, skipped }
}

async function sendOneInvite({ workerUrl, token, email, full_name, phone }) {
  const response = await fetch(workerUrl + '/invite', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, full_name, phone }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => 'Invite failed')
    throw new Error(text)
  }
}

function InviteModal({ open, onClose }) {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState('single')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [csvText, setCsvText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [bulkProgress, setBulkProgress] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMode('single')
      setFullName('')
      setPhone('')
      setEmail('')
      setCsvText('')
      setResult(null)
      setBulkProgress(null)
      setBulkResults(null)
      setSending(false)
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const { parsed, skipped } = useMemo(() => parseCsvRows(csvText), [csvText])

  const handleSendSingle = async () => {
    const trimmedEmail = email.trim()
    const trimmedName = fullName.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName) {
      setResult({ type: 'error', message: 'Please enter a name.' })
      return
    }
    if (!trimmedPhone) {
      setResult({ type: 'error', message: 'Please enter a phone number.' })
      return
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
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
      await sendOneInvite({
        workerUrl: import.meta.env.VITE_WORKER_URL,
        token: session.access_token,
        email: trimmedEmail,
        full_name: trimmedName,
        phone: trimmedPhone,
      })
      setResult({ type: 'success', message: 'Invitation sent to ' + trimmedEmail + '!' })
      setFullName('')
      setPhone('')
      setEmail('')
      showToast('Invitation sent to ' + trimmedEmail, 'success')
    } catch (err) {
      console.error('Invite error:', err)
      setResult({ type: 'error', message: err.message || 'Failed to send invitation. Please try again.' })
      showToast('Failed to send invitation', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSendBulk = async () => {
    if (!session) {
      setResult({ type: 'error', message: 'Session expired. Please refresh the page.' })
      return
    }
    if (parsed.length === 0) {
      setResult({ type: 'error', message: 'No valid rows to invite.' })
      return
    }

    setSending(true)
    setResult(null)
    setBulkResults(null)
    setBulkProgress({ current: 0, total: parsed.length })

    const workerUrl = import.meta.env.VITE_WORKER_URL
    const succeeded = []
    const failed = skipped.map((s) => ({ row: s.text, reason: s.reason }))

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i]
      setBulkProgress({ current: i + 1, total: parsed.length })
      try {
        await sendOneInvite({
          workerUrl,
          token: session.access_token,
          email: row.email,
          full_name: row.full_name,
          phone: row.phone,
        })
        succeeded.push(row.email)
      } catch (err) {
        failed.push({ row: row.email, reason: err.message || 'failed' })
      }
    }

    setSending(false)
    setBulkProgress(null)
    setBulkResults({ succeeded, failed })
    showToast('Sent ' + succeeded.length + ' of ' + (parsed.length + skipped.length) + ' invites', succeeded.length > 0 ? 'success' : 'error')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && mode === 'single' && !sending && !e.shiftKey) {
      e.preventDefault()
      handleSendSingle()
    }
  }

  if (!open) return null

  const TabBtn = ({ value, label }) => (
    <button
      type="button"
      onClick={() => { if (!sending) setMode(value) }}
      className={
        'flex-1 rounded-md px-3 py-1.5 text-xs font-medium font-body transition-colors ' +
        (mode === value
          ? 'bg-white text-[var(--ec-text)] shadow-sm'
          : 'text-[var(--ec-text-secondary)] hover:text-[var(--ec-text)]')
      }
      disabled={sending}
    >
      {label}
    </button>
  )

  const inputClass = 'w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50 disabled:opacity-60'
  const labelClass = 'block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5'

  const isDone = result?.type === 'success' || !!bulkResults
  const canSend = mode === 'single' || parsed.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget && !sending) onClose() }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--ec-card-border)] bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">Invite Member</h3>
        <p className="mt-2 text-sm text-[var(--ec-text-secondary)] font-body">
          Send invitation emails with App Store and Play Store download links.
        </p>

        <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
          <TabBtn value="single" label="Single" />
          <TabBtn value="bulk" label="Bulk (CSV)" />
        </div>

        {mode === 'single' && (
          <>
            <div className="mt-3">
              <label className={labelClass}>Full Name</label>
              <input
                ref={firstInputRef}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jane Doe"
                disabled={sending}
                className={inputClass}
              />
            </div>
            <div className="mt-3">
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="+1 555 555 5555"
                disabled={sending}
                className={inputClass}
              />
            </div>
            <div className="mt-3">
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="jane@example.com"
                disabled={sending}
                className={inputClass}
              />
            </div>
          </>
        )}

        {mode === 'bulk' && (
          <div className="mt-4">
            <label className="block text-[13px] font-medium text-[var(--ec-text)] font-body mb-1.5">
              Paste CSV — one per line, columns: name, phone, email
            </label>
            <textarea
              ref={firstInputRef}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'Jane Doe, +1 555 555 5555, jane@example.com\nJohn Smith, +1 555 123 4567, john@example.com'}
              rows={8}
              disabled={sending}
              className="w-full rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-3 text-sm text-[var(--ec-text)] font-body placeholder:text-[var(--ec-text-secondary)]/50 disabled:opacity-60 font-mono"
            />
            {csvText.trim() && (
              <p className="mt-2 text-xs text-[var(--ec-text-secondary)] font-body">
                {parsed.length} valid row{parsed.length === 1 ? '' : 's'}
                {skipped.length > 0 ? ', ' + skipped.length + ' will be skipped' : ''}
              </p>
            )}
          </div>
        )}

        {bulkProgress && (
          <div className="mt-4 rounded-lg border border-[var(--ec-card-border)] bg-gray-50 px-3 py-2 text-sm font-body text-[var(--ec-text)]">
            Sending {bulkProgress.current} of {bulkProgress.total}...
          </div>
        )}

        {bulkResults && (
          <div className="mt-4 rounded-lg border border-[var(--ec-card-border)] bg-gray-50 px-3 py-2 text-sm font-body">
            <div className="text-[var(--ec-forest)] font-medium">
              Sent {bulkResults.succeeded.length} invitation{bulkResults.succeeded.length === 1 ? '' : 's'}.
            </div>
            {bulkResults.failed.length > 0 && (
              <div className="mt-2">
                <div className="text-[var(--ec-rust)] font-medium">
                  {bulkResults.failed.length} failed:
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-[var(--ec-text-secondary)]">
                  {bulkResults.failed.map((f, i) => (
                    <li key={i}><span className="font-mono">{f.row}</span> — {f.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
            {isDone ? 'Done' : 'Cancel'}
          </button>
          {!isDone && (
            <button
              onClick={mode === 'single' ? handleSendSingle : handleSendBulk}
              disabled={sending || !canSend}
              className="rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors disabled:opacity-60"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"></span>
                  Sending...
                </span>
              ) : (
                mode === 'single' ? 'Send Invite' : 'Send ' + parsed.length + ' Invite' + (parsed.length === 1 ? '' : 's')
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
        .select('id, email, full_name, phone, role, status, created_at')
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
