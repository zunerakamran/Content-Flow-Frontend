import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import {
  FaTimes,
  FaSync,
  FaSearch,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaListAlt,
  FaChartBar,
  FaDownload,
  FaBuilding,
  FaCalendarDay,
  FaCalendarWeek,
  FaHistory,
  FaFilter,
  FaUserPlus,
  FaInbox,
  FaClipboardCheck,
  FaRocket,
  FaEdit,
} from 'react-icons/fa'
import Navbar from './Navbar'
import Pagination from './components/Pagination'
import ChangeRequestAssignmentPanel from './components/ChangeRequestAssignmentPanel'
import ReviewQueuePanel from './components/ReviewQueuePanel'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { useRoleLabels } from './context/RoleLabelsContext'
import { usePermissions } from './context/PermissionsContext'
import { CreateUserPanel, TeamUsersPanel } from './components/TeamUserManagement'
import PlatformSummaryReport from './components/PlatformSummaryReport'

const AdvisorDashboard = lazy(() => import('./AdvisorDashboard'))
const PowerAdminDashboard = lazy(() => import('./PowerAdminDashboard'))

const LOGS_PER_PAGE = 15

const ACTION_COLORS = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  submitted: 'bg-amber-100 text-amber-800 border-amber-200',
  deployed: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  created: 'bg-teal-100 text-teal-800 border-teal-200',
  updated: 'bg-sky-100 text-sky-800 border-sky-200',
  deleted: 'bg-red-100 text-red-800 border-red-200',
  login: 'bg-violet-100 text-violet-800 border-violet-200',
  logout: 'bg-slate-100 text-slate-800 border-slate-200',
}

const BREAKDOWN_BAR_COLORS = [
  'bg-[#0B1B3D]',
  'bg-[#C8102E]',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
]

function ActionBadge({ action }) {
  const normalized = action?.toLowerCase().replace(/_/g, ' ') || 'unknown'
  const key = action?.toLowerCase()
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full capitalize border ${ACTION_COLORS[key] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {normalized}
    </span>
  )
}

function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-slate-100 text-slate-800 border-slate-200">
      {role?.replace(/_/g, ' ')}
    </span>
  )
}

function AlertBanner({ message, onDismiss }) {
  return (
    <div
      className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-start justify-between gap-3 text-sm font-medium"
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded hover:bg-black/5 transition"
        aria-label="Dismiss"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D] leading-none">{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1 truncate">{label}</p>
      </div>
    </div>
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

function ActivityRow({ log, showIndex, index }) {
  return (
    <div className="px-5 py-4 hover:bg-gray-50/80 transition flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
      {showIndex && (
        <span className="text-xs text-gray-400 font-bold shrink-0 sm:w-6">{index}</span>
      )}
      <div className="flex items-center gap-3 min-w-0 sm:w-44 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <FaUser className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <span className="font-semibold text-gray-800 text-sm truncate">
          {log.user?.name || 'System'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <ActionBadge action={log.action} />
        {(log.details || log.description) && (
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            {log.details || log.description}
          </p>
        )}
      </div>
      <div className="text-xs text-gray-400 shrink-0 flex items-center gap-1.5 sm:self-center">
        <FaClock className="w-3 h-3 shrink-0" />
        {formatDate(log.created_at)}
      </div>
    </div>
  )
}

export default function ClientAdminDashboard() {
  const { user } = useAuth()
  const { getDashboardTitle } = useRoleLabels()
  const { can } = usePermissions()
  const canManageUsers = can('manage_users')
  const canViewUsers = can('view_users')
  const canViewLogs = can('view_activity_logs')
  const canViewPlatformReport = can('view_platform_report')
  const canAssignRequests = can('assign_change_requests') || can('view_all_change_requests')
  const canReview = can('review_change_requests')
  const canContentEditor = can('submit_change_requests') || can('edit_sections') || can('request_deployments')
  const canDeploymentHub = can('deploy_websites') || can('manage_templates') || can('manage_deployment_sections') || can('publish_live_content') || can('view_all_deployments')
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [logPage, setLogPage] = useState(1)

  const fetchLogs = useCallback(async (silent = false) => {
    if (!canViewLogs) {
      setLoading(false)
      return
    }
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
  }, [canViewLogs])

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

  useEffect(() => {
    setLogPage(1)
  }, [search, actionFilter, dateFilter])

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * LOGS_PER_PAGE
    return filteredLogs.slice(start, start + LOGS_PER_PAGE)
  }, [filteredLogs, logPage])

  const recentLogs = useMemo(() => logs.slice(0, 8), [logs])

  const hasActiveFilters = search.trim() || actionFilter !== 'all' || dateFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setActionFilter('all')
    setDateFilter('all')
  }

  const canViewRequestHistory = canAssignRequests || canReview

  const tabs = useMemo(() => [
    canViewLogs && { id: 'overview', label: 'Overview', icon: FaChartBar },
    canViewPlatformReport && { id: 'platform', label: 'Platform Summary', icon: FaBuilding },
    canViewLogs && { id: 'reports', label: 'Activity Reports', count: logs.length, icon: FaListAlt },
    canAssignRequests && { id: 'change-requests', label: 'New Requests', icon: FaInbox },
    canReview && { id: 'review-queue', label: 'Review Queue', icon: FaClipboardCheck },
    canViewRequestHistory && { id: 'request-history', label: 'History', icon: FaHistory },
    canManageUsers && { id: 'create-user', label: 'Create User', icon: FaUserPlus },
    canViewUsers && { id: 'users', label: 'Team', icon: FaUsers },
    canContentEditor && { id: 'content-editor', label: 'Content Editor', icon: FaEdit },
    canDeploymentHub && { id: 'deployment-hub', label: 'Deployment Hub', icon: FaRocket },
  ].filter(Boolean), [
    canViewLogs,
    canViewPlatformReport,
    canManageUsers,
    canViewUsers,
    canAssignRequests,
    canReview,
    canViewRequestHistory,
    canContentEditor,
    canDeploymentHub,
    logs.length,
  ])

  useEffect(() => {
    if (tabs.length && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">{getDashboardTitle('client_admin')}</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Monitor team activity, review audit logs, and export compliance reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchLogs(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-60"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && <AlertBanner message={error} onDismiss={() => setError('')} />}
        {message && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-lg shadow-sm flex items-start justify-between gap-3 text-sm font-medium">
            <span className="flex-1">{message}</span>
            <button type="button" onClick={() => setMessage('')} className="shrink-0 p-1 rounded hover:bg-black/5" aria-label="Dismiss">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && canViewLogs && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Total Events"
              value={stats.total}
              icon={FaListAlt}
              accent="bg-slate-100 text-slate-600"
            />
            <StatCard
              label="Today"
              value={stats.today}
              icon={FaCalendarDay}
              accent="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="This Week"
              value={stats.thisWeek}
              icon={FaCalendarWeek}
              accent="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              icon={FaCheckCircle}
              accent="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={FaTimesCircle}
              accent="bg-rose-100 text-rose-600"
            />
            <StatCard
              label="Active Users"
              value={stats.uniqueUsers}
              icon={FaUsers}
              accent="bg-violet-100 text-violet-600"
            />
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-[#0B1B3D] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count != null && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading && (activeTab === 'overview' || activeTab === 'reports') ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading activity reports…</p>
          </div>
        ) : (
          <>
            {activeTab === 'platform' && canViewPlatformReport && (
              <PlatformSummaryReport onError={setError} />
            )}

            {activeTab === 'overview' && canViewLogs && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Action breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1B3D]/10 flex items-center justify-center">
                      <FaChartBar className="w-5 h-5 text-[#0B1B3D]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0B1B3D]">Action Breakdown</h2>
                      <p className="text-xs text-gray-500">Top activity types across all events</p>
                    </div>
                  </div>

                  {actionBreakdown.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FaChartBar className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No activity recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actionBreakdown.map(([action, count], idx) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                        const barColor = BREAKDOWN_BAR_COLORS[idx % BREAKDOWN_BAR_COLORS.length]
                        return (
                          <div key={action}>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <ActionBadge action={action} />
                              </div>
                              <span className="text-xs text-gray-500 font-bold shrink-0">
                                {count} <span className="text-gray-400">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C8102E]/10 flex items-center justify-center">
                        <FaHistory className="w-5 h-5 text-[#C8102E]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0B1B3D]">Recent Activity</h2>
                        <p className="text-xs text-gray-500">Latest 8 events</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-bold text-[#C8102E] hover:underline shrink-0"
                    >
                      View all →
                    </button>
                  </div>

                  {recentLogs.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FaHistory className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No recent activity.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentLogs.map(log => (
                        <ActivityRow key={log.id} log={log} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick export card */}
                <div className="lg:col-span-2 bg-[#0B1B3D] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Export Compliance Report</h3>
                    <p className="text-sm text-white/70 mt-1 max-w-lg">
                      Download a CSV of all activity logs for auditing, compliance, or record-keeping.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportLogsToCsv(logs)}
                    disabled={logs.length === 0}
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#0B1B3D] text-sm font-bold px-5 py-3 rounded-xl hover:bg-gray-100 transition shadow-md disabled:opacity-50 shrink-0"
                  >
                    <FaDownload className="w-4 h-4" />
                    Export All ({logs.length})
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'reports' && canViewLogs && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FaFilter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filters</span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-bold text-[#C8102E] hover:underline ml-auto"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by user, action, or details…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition"
                      />
                    </div>

                    <select
                      value={actionFilter}
                      onChange={e => setActionFilter(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] bg-white transition sm:min-w-[160px]"
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
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] bg-white transition sm:min-w-[140px]"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => exportLogsToCsv(filteredLogs)}
                      disabled={filteredLogs.length === 0}
                      className="inline-flex items-center justify-center gap-2 bg-[#0B1B3D] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50 shrink-0"
                    >
                      <FaDownload className="w-3.5 h-3.5" />
                      Export CSV ({filteredLogs.length})
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {filteredLogs.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FaListAlt className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0B1B3D]">No matching records</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                        {hasActiveFilters
                          ? 'Try adjusting your search or filters.'
                          : 'No activity has been recorded yet.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 text-sm font-bold text-[#C8102E] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="text-left px-5 py-3 text-gray-500 font-bold uppercase text-[11px] tracking-wider w-12">#</th>
                              <th className="text-left px-5 py-3 text-gray-500 font-bold uppercase text-[11px] tracking-wider">User</th>
                              <th className="text-left px-5 py-3 text-gray-500 font-bold uppercase text-[11px] tracking-wider">Action</th>
                              <th className="text-left px-5 py-3 text-gray-500 font-bold uppercase text-[11px] tracking-wider">Details</th>
                              <th className="text-left px-5 py-3 text-gray-500 font-bold uppercase text-[11px] tracking-wider">Date & Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedLogs.map((log, idx) => (
                              <tr key={log.id} className="hover:bg-gray-50/80 transition">
                                <td className="px-5 py-3.5 text-gray-400 text-xs font-bold">{(logPage - 1) * LOGS_PER_PAGE + idx + 1}</td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <FaUser className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <span className="font-semibold text-gray-800">{log.user?.name || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <ActionBadge action={log.action} />
                                </td>
                                <td className="px-5 py-3.5 text-gray-600 max-w-md">
                                  <span className="line-clamp-2 leading-relaxed">
                                    {log.details || log.description || '—'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    <FaClock className="w-3 h-3 text-gray-400" />
                                    {formatDate(log.created_at)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile / tablet list */}
                      <div className="lg:hidden divide-y divide-gray-100">
                        {paginatedLogs.map((log, idx) => (
                          <ActivityRow
                            key={log.id}
                            log={log}
                            showIndex
                            index={(logPage - 1) * LOGS_PER_PAGE + idx + 1}
                          />
                        ))}
                      </div>

                      <Pagination
                        currentPage={logPage}
                        totalItems={filteredLogs.length}
                        pageSize={LOGS_PER_PAGE}
                        onPageChange={setLogPage}
                        endLabel={hasActiveFilters ? 'Filtered' : undefined}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'change-requests' && canAssignRequests && (
              <ChangeRequestAssignmentPanel variant="pending" onMessage={setMessage} onError={setError} />
            )}

            {activeTab === 'review-queue' && canReview && (
              <ReviewQueuePanel variant="active" />
            )}

            {activeTab === 'request-history' && canViewRequestHistory && (
              canAssignRequests
                ? <ChangeRequestAssignmentPanel variant="history" onMessage={setMessage} onError={setError} />
                : <ReviewQueuePanel variant="history" />
            )}

            {activeTab === 'content-editor' && canContentEditor && (
              <Suspense fallback={
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
                  <p className="text-sm font-semibold">Loading content editor…</p>
                </div>
              }>
                <AdvisorDashboard embedded />
              </Suspense>
            )}

            {activeTab === 'deployment-hub' && canDeploymentHub && (
              <Suspense fallback={
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
                  <p className="text-sm font-semibold">Loading deployment hub…</p>
                </div>
              }>
                <PowerAdminDashboard embedded />
              </Suspense>
            )}

            {activeTab === 'create-user' && canManageUsers && (
              <CreateUserPanel
                onCreated={() => setActiveTab(canViewUsers ? 'users' : 'create-user')}
                onError={setError}
                onMessage={setMessage}
              />
            )}

            {activeTab === 'users' && canViewUsers && (
              <TeamUsersPanel onCreateClick={canManageUsers ? () => setActiveTab('create-user') : undefined} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
