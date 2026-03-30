import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
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

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusAction, setStatusAction] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

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
      setStatusTarget(null)
      setStatusAction(null)
    } catch (err) {
      console.error('Error updating member status:', err)
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
        <div className="relative group">
          <button disabled className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body opacity-50 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Invite Member
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block">
            <div className="rounded-lg bg-[var(--ec-nav-bg)] px-3 py-1.5 text-xs text-white font-body whitespace-nowrap shadow-lg">Coming soon</div>
          </div>
        </div>
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
    </div>
  )
}
