import { useState, useEffect, useMemo } from 'react'
import {
  FaInbox,
  FaClipboardCheck,
  FaUserPlus,
  FaUsers,
  FaTimes,
  FaBuilding,
  FaListAlt,
  FaHistory,
  FaRocket,
} from 'react-icons/fa'
import Navbar from './Navbar'
import ChangeRequestAssignmentPanel from './components/ChangeRequestAssignmentPanel'
import ReviewQueuePanel from './components/ReviewQueuePanel'
import PlatformSummaryReport from './components/PlatformSummaryReport'
import DeploymentRequestPanel from './components/DeploymentRequestPanel'
import { CreateUserPanel, TeamUsersPanel } from './components/TeamUserManagement'
import { usePermissions } from './context/PermissionsContext'
import api from './api/axios'
import Pagination from './components/Pagination'

const LOGS_PER_PAGE = 15

function AlertBanner({ type, message, onDismiss }) {
  const isSuccess = type === 'success'
  return (
    <div
      className={`${
        isSuccess ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-rose-50 border-rose-500 text-rose-800'
      } border-l-4 p-4 mb-6 rounded-lg shadow-sm flex items-start justify-between gap-3 text-sm font-medium`}
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

export default function ApproverDashboard({ embedded = false } = {}) {
  const { can } = usePermissions()
  const canReview = can('review_change_requests')
  const canAssignRequests = can('assign_change_requests') || can('view_all_change_requests')
  const canManageUsers = can('manage_users')
  const canViewUsers = can('view_users')
  const canViewPlatformReport = can('view_platform_report')
  const canViewLogs = can('view_activity_logs')
  const canViewRequestHistory = canAssignRequests || canReview
  const canViewDeployments = can('request_deployments') || can('view_all_deployments')

  const [activeTab, setActiveTab] = useState('review')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([])
  const [logPage, setLogPage] = useState(1)
  const [logsLoading, setLogsLoading] = useState(false)

  const tabs = useMemo(() => [
    canReview && { id: 'review', label: 'Review Queue', icon: FaClipboardCheck },
    canAssignRequests && { id: 'change-requests', label: 'New Requests', icon: FaInbox },
    canViewRequestHistory && { id: 'request-history', label: 'History', icon: FaHistory },
    canViewDeployments && { id: 'deployments', label: 'Deployments', icon: FaRocket },
    canManageUsers && { id: 'create-user', label: 'Create User', icon: FaUserPlus },
    canViewUsers && { id: 'users', label: 'Team', icon: FaUsers },
    canViewPlatformReport && { id: 'platform', label: 'Platform Summary', icon: FaBuilding },
    canViewLogs && { id: 'logs', label: 'Activity', icon: FaListAlt },
  ].filter(Boolean), [canReview, canAssignRequests, canViewRequestHistory, canViewDeployments, canManageUsers, canViewUsers, canViewPlatformReport, canViewLogs])

  useEffect(() => {
    if (tabs.length && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  useEffect(() => {
    if (!canViewLogs || activeTab !== 'logs') return
    let cancelled = false
    setLogsLoading(true)
    api.get('/logs')
      .then(res => {
        if (!cancelled) setLogs(res.data.data || res.data || [])
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load activity logs.')
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false)
      })
    return () => { cancelled = true }
  }, [canViewLogs, activeTab])

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * LOGS_PER_PAGE
    return logs.slice(start, start + LOGS_PER_PAGE)
  }, [logs, logPage])

  const inner = (
    <>
      {!embedded && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">Approver Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Review change requests and manage your workflow.
            </p>
          </div>
        </div>
      )}

      {message && <AlertBanner type="success" message={message} onDismiss={() => setMessage('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {tabs.length > 1 && (
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
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'review' && canReview && <ReviewQueuePanel variant="active" />}

      {activeTab === 'deployments' && canViewDeployments && <DeploymentRequestPanel />}

      {activeTab === 'change-requests' && canAssignRequests && (
        <ChangeRequestAssignmentPanel variant="pending" onMessage={setMessage} onError={setError} />
      )}

      {activeTab === 'request-history' && canViewRequestHistory && (
        canAssignRequests
          ? <ChangeRequestAssignmentPanel variant="history" onMessage={setMessage} onError={setError} />
          : <ReviewQueuePanel variant="history" />
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

      {activeTab === 'platform' && canViewPlatformReport && (
        <PlatformSummaryReport onError={setError} />
      )}

      {activeTab === 'logs' && canViewLogs && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {logsLoading ? (
            <div className="p-16 text-center text-gray-500">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
              <p className="text-sm font-semibold">Loading activity…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-sm text-gray-500 font-medium">No activity logs found.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedLogs.map(log => (
                  <div key={log.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="font-semibold text-gray-800 text-sm sm:w-48 shrink-0 truncate">
                      {log.user?.name || 'System'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      {(log.details || log.description) && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{log.details || log.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={logPage}
                  totalItems={logs.length}
                  pageSize={LOGS_PER_PAGE}
                  onPageChange={setLogPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {tabs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-500 font-medium">No permissions assigned for this dashboard.</p>
        </div>
      )}
    </>
  )

  if (embedded) {
    return inner
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {inner}
      </div>
    </div>
  )
}
