import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'

function actionBadge(action) {
  const normalized = action?.toLowerCase().replace(/_/g, ' ') || 'unknown'
  const colors = {
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800',
    submitted: 'bg-amber-100 text-amber-800',
    deployed: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    created: 'bg-teal-100 text-teal-800',
    updated: 'bg-sky-100 text-sky-800',
    deleted: 'bg-red-100 text-red-800',
    login: 'bg-violet-100 text-violet-800',
    logout: 'bg-slate-100 text-slate-800',
  }
  const key = action?.toLowerCase()
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${colors[key] || 'bg-gray-100 text-gray-700'}`}>
      {normalized}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function exportLogsToCsv(logs) {
  const headers = ['User', 'Action', 'Details', 'Date']
  const rows = logs.map(log => [
    log.user?.name || '—',
    log.action || '—',
    (log.details || log.description || '—').replace(/"/g, '""'),
    log.created_at ? new Date(log.created_at).toISOString() : '—',
  ])
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `activity-report-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function ClientAdminDashboard() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const res = await api.get('/logs')
      setLogs(res.data.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity reports.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action).filter(Boolean))
    return Array.from(actions).sort()
  }, [logs])

  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const today = logs.filter(l => new Date(l.created_at) >= todayStart).length
    const thisWeek = logs.filter(l => new Date(l.created_at) >= weekStart).length
    const approved = logs.filter(l => l.action?.toLowerCase() === 'approved').length
    const rejected = logs.filter(l => l.action?.toLowerCase() === 'rejected').length
    const uniqueUsers = new Set(logs.map(l => l.user?.name).filter(Boolean)).size

    return { total: logs.length, today, thisWeek, approved, rejected, uniqueUsers }
  }, [logs])

  const actionBreakdown = useMemo(() => {
    const counts = {}
    logs.forEach(log => {
      const action = log.action?.toLowerCase() || 'other'
      counts[action] = (counts[action] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [logs])

  const filteredLogs = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    return logs.filter(log => {
      const matchesSearch = !search || [
        log.user?.name,
        log.action,
        log.details,
        log.description,
      ].some(v => v?.toLowerCase().includes(search.toLowerCase()))

      const matchesAction = actionFilter === 'all' || log.action?.toLowerCase() === actionFilter

      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = new Date(log.created_at) >= todayStart
      } else if (dateFilter === 'week') {
        matchesDate = new Date(log.created_at) >= weekStart
      } else if (dateFilter === 'month') {
        matchesDate = new Date(log.created_at) >= monthStart
      }

      return matchesSearch && matchesAction && matchesDate
    })
  }, [logs, search, actionFilter, dateFilter])

  const recentLogs = useMemo(() => logs.slice(0, 8), [logs])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Activity Reports', count: logs.length },
  ]

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Client Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitor team activity, review audit logs, and export compliance reports.
            </p>
          </div>
          {user && (
            <div className="bg-white border rounded-lg px-4 py-2 text-right shadow-sm">
              <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Logged in as</span>
              <span className="text-sm font-bold text-[#C8102E]">{user.name} (client admin)</span>
              {user.firm && (
                <span className="text-xs text-gray-500 block">{user.firm.name}</span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold hover:opacity-75 text-lg">✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Total Events</p>
            <p className="text-3xl font-extrabold text-[#0B1B3D] mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Today</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{stats.today}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">This Week</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.thisWeek}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Approved</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Rejected</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Active Users</p>
            <p className="text-3xl font-extrabold text-[#C8102E] mt-1">{stats.uniqueUsers}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[#0B1B3D] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading activity reports…</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-[#0B1B3D] mb-4">Action Breakdown</h2>
                  {actionBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {actionBreakdown.map(([action, count]) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                        return (
                          <div key={action}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium capitalize text-gray-700">
                                {action.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-500 font-bold">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0B1B3D] rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#0B1B3D]">Recent Activity</h2>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-bold text-[#C8102E] hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="divide-y">
                    {recentLogs.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No recent activity.</p>
                    ) : (
                      recentLogs.map(log => (
                        <div key={log.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800">
                                {log.user?.name || 'System'}
                              </span>
                              {actionBadge(log.action)}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {log.details || log.description || '—'}
                            </p>
                          </div>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by user, action, or details…"
                    className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  />
                  <select
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] bg-white"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action.toLowerCase()}>
                        {action.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] bg-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <button
                    onClick={() => fetchLogs(true)}
                    disabled={refreshing}
                    className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-60"
                  >
                    {refreshing ? 'Refreshing…' : '↻ Refresh'}
                  </button>
                  <button
                    onClick={() => exportLogsToCsv(filteredLogs)}
                    disabled={filteredLogs.length === 0}
                    className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    ⬇ Export CSV ({filteredLogs.length})
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">#</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">User</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Action</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Details</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map((log, idx) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-800">{log.user?.name || '—'}</span>
                            </td>
                            <td className="px-4 py-3">{actionBadge(log.action)}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-md">
                              <span className="line-clamp-2">{log.details || log.description || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                              <div className="text-4xl mb-2">📋</div>
                              <p className="font-semibold text-gray-500">No matching records</p>
                              <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredLogs.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 font-medium">
                      Showing {filteredLogs.length} of {logs.length} total events
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
