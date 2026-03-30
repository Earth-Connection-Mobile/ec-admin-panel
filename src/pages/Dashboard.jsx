import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const icons = {
  members: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  playlists: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  ),
  videos: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
    </svg>
  ),
  updates: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 mb-3"></div>
          <div className="h-8 w-12 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100"></div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, loading }) {
  if (loading) return <StatCardSkeleton />
  return (
    <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--ec-text-secondary)] font-body">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[var(--ec-text)] font-heading">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ec-gold)]/10 text-[var(--ec-gold)]">{icon}</div>
      </div>
    </div>
  )
}

function RecentListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--ec-card-border)] pb-3 last:border-b-0 last:pb-0">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ members: 0, playlists: 0, videos: 0, updates: 0 })
  const [recentPlaylists, setRecentPlaylists] = useState([])
  const [recentUpdates, setRecentUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersRes, playlistsRes, videosRes, updatesRes, recentPlaylistsRes, recentUpdatesRes] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('playlists').select('id', { count: 'exact', head: true }),
          supabase.from('videos').select('id', { count: 'exact', head: true }),
          supabase.from('community_updates').select('id', { count: 'exact', head: true }),
          supabase.from('playlists').select('id, title, published_at').order('published_at', { ascending: false }).limit(5),
          supabase.from('community_updates').select('id, title, published_at, is_pinned').order('published_at', { ascending: false }).limit(5),
        ])
        setStats({ members: membersRes.count ?? 0, playlists: playlistsRes.count ?? 0, videos: videosRes.count ?? 0, updates: updatesRes.count ?? 0 })
        const playlists = recentPlaylistsRes.data || []
        if (playlists.length > 0) {
          const playlistIds = playlists.map((p) => p.id)
          const { data: tracks } = await supabase.from('tracks').select('playlist_id').in('playlist_id', playlistIds)
          const trackCounts = {}
          ;(tracks || []).forEach((t) => { trackCounts[t.playlist_id] = (trackCounts[t.playlist_id] || 0) + 1 })
          setRecentPlaylists(playlists.map((p) => ({ ...p, trackCount: trackCounts[p.id] || 0 })))
        }
        setRecentUpdates(recentUpdatesRes.data || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold text-[var(--ec-text)]">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--ec-text-secondary)] font-body">Overview of your Earth Connection community.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={icons.members} label="Active Members" value={stats.members} loading={loading} />
        <StatCard icon={icons.playlists} label="Total Playlists" value={stats.playlists} loading={loading} />
        <StatCard icon={icons.videos} label="Total Videos" value={stats.videos} loading={loading} />
        <StatCard icon={icons.updates} label="Total Updates" value={stats.updates} loading={loading} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/playlists/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Playlist
        </Link>
        <Link to="/updates/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Update
        </Link>
        <Link to="/videos/new" className="inline-flex items-center gap-2 rounded-lg bg-[var(--ec-gold)] px-4 py-2 text-sm font-medium text-[var(--ec-nav-bg)] font-body hover:bg-[var(--ec-gold-hover)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Video
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">Recent Playlists</h2>
            <Link to="/playlists" className="text-sm font-medium text-[var(--ec-gold)] hover:text-[var(--ec-gold-hover)] font-body transition-colors">View all</Link>
          </div>
          {loading ? <RecentListSkeleton /> : recentPlaylists.length === 0 ? (
            <p className="text-sm text-[var(--ec-text-secondary)] font-body">No playlists yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPlaylists.map((playlist) => (
                <div key={playlist.id} className="flex items-center justify-between border-b border-[var(--ec-card-border)] pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <Link to={"/playlists/" + playlist.id} className="text-sm font-medium text-[var(--ec-text)] hover:text-[var(--ec-gold)] font-body transition-colors">{playlist.title}</Link>
                    <p className="text-xs text-[var(--ec-text-secondary)] font-body">{playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}</p>
                  </div>
                  <span className="text-xs text-[var(--ec-text-secondary)] font-body">{formatDate(playlist.published_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--ec-card-border)] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[22px] font-semibold text-[var(--ec-text)]">Recent Updates</h2>
            <Link to="/updates" className="text-sm font-medium text-[var(--ec-gold)] hover:text-[var(--ec-gold-hover)] font-body transition-colors">View all</Link>
          </div>
          {loading ? <RecentListSkeleton /> : recentUpdates.length === 0 ? (
            <p className="text-sm text-[var(--ec-text-secondary)] font-body">No updates yet.</p>
          ) : (
            <div className="space-y-3">
              {recentUpdates.map((update) => (
                <div key={update.id} className="flex items-center justify-between border-b border-[var(--ec-card-border)] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {update.is_pinned && (
                      <svg className="w-3.5 h-3.5 text-[var(--ec-gold)]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                    )}
                    <Link to={"/updates/" + update.id} className="text-sm font-medium text-[var(--ec-text)] hover:text-[var(--ec-gold)] font-body transition-colors">{update.title}</Link>
                  </div>
                  <span className="text-xs text-[var(--ec-text-secondary)] font-body whitespace-nowrap ml-3">{formatDate(update.published_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
