import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { parseJson } from './utils/parseJson'
import {
  buildPreviewFromRequest,
  isHistoricalRequest,
  loadPreviewSnapshots,
  previewHasStoredSnapshot,
  resolveRequestPreview,
  savePreviewSnapshot,
} from './utils/changeRequestPreview'
import SectionIframePreview from './SectionIframePreview'

const PENDING_STATUS = 'pending'
const PREVIOUS_STATUSES = new Set(['under_review', 'scheduled', 'approved', 'rejected'])

const CREATABLE_ROLES = [
  { value: 'advisor', label: 'Advisor (Editor)' },
  { value: 'approver', label: 'Approver' },
  { value: 'client_admin', label: 'Client Admin' },
]

function getRequestSectionTitle(req) {
  if (req.section) return `Section: ${req.section.name}`
  if (Array.isArray(req.section_edits) && req.section_edits.length > 0) {
    const names = req.section_edits.map(e => e.section_name || 'Section').join(', ')
    return `Batch Request (${req.section_edits.length} Sections: ${names})`
  }
  try {
    const parsed = JSON.parse(req.proposed_content)
    if (Array.isArray(parsed)) {
      const names = parsed.map(p => p.section_name || 'Section').join(', ')
      return `Batch Request (${parsed.length} Sections: ${names})`
    }
  } catch { /* ignore */ }
  return `Change Request #${req.id}`
}

function statusBadge(status, scheduledAt) {
  switch (status) {
    case 'pending':
      return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pending Assignment</span>
    case 'under_review':
      return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Under Review</span>
    case 'scheduled':
      return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Scheduled ({scheduledAt ? new Date(scheduledAt).toLocaleString() : '—'})</span>
    case 'approved':
      return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Approved & Published</span>
    case 'rejected':
      return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Rejected</span>
    default:
      return <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{status}</span>
  }
}

function roleBadge(role) {
  const colors = {
    advisor: 'bg-indigo-100 text-indigo-800',
    approver: 'bg-teal-100 text-teal-800',
    manager: 'bg-violet-100 text-violet-800',
    client_admin: 'bg-slate-100 text-slate-800',
    power_admin: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {role?.replace('_', ' ')}
    </span>
  )
}

const ManagerRequestCard = memo(function ManagerRequestCard({
  req,
  approvers,
  selectedApproverId,
  onSelectApprover,
  onAssign,
  assigning,
  onMessage,
  onError,
  getCachedPreview,
  cachePreview,
}) {
  const [previewData, setPreviewData] = useState(null)
  const [previewMode, setPreviewMode] = useState('visual')
  const [busy, setBusy] = useState(null)

  const sectionTitle = useMemo(() => getRequestSectionTitle(req), [req])
  const isPending = req.status === PENDING_STATUS
  const isHistorical = isHistoricalRequest(req)

  const handleTogglePreview = async () => {
    if (previewData) {
      setPreviewData(null)
      return
    }

    setBusy('preview')
    onError('')
    try {
      const cachedPreview = getCachedPreview(req.id)
      const nextPreview = await resolveRequestPreview(api, req, { cachedPreview })
      setPreviewData(nextPreview)
      if (nextPreview && !isHistorical) {
        cachePreview(req.id, nextPreview)
      }
    } catch {
      const cachedPreview = getCachedPreview(req.id)
      const storedPreview = buildPreviewFromRequest(req)
      if (cachedPreview) {
        setPreviewData(cachedPreview)
      } else if (previewHasStoredSnapshot(storedPreview)) {
        setPreviewData(storedPreview)
      } else {
        onError('Could not fetch request preview.')
      }
    } finally {
      setBusy(null)
    }
  }

  const handleAssign = () => {
    if (!selectedApproverId) {
      onError('Please select an approver before assigning.')
      return
    }
    onAssign(req.id, selectedApproverId)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-[#0B1B3D]">{sectionTitle}</h3>
            {statusBadge(req.status, req.scheduled_at)}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
            <span>Submitted by: <strong className="text-gray-700">{req.editor?.name || 'Editor'}</strong></span>
            <span>&bull;</span>
            <span>Date: <strong>{new Date(req.created_at).toLocaleString()}</strong></span>
            {req.approver && (
              <>
                <span>&bull;</span>
                <span>Assigned to: <strong className="text-[#C8102E]">{req.approver.name}</strong></span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleTogglePreview}
          disabled={busy === 'preview'}
          className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-60"
        >
          {busy === 'preview' ? 'Loading preview…' : previewData ? 'Hide Preview' : '👁️ Preview Changes'}
        </button>
      </div>

      {isPending && (
        <div className="bg-amber-50 px-6 py-4 border-b flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Assign to Approver</span>
          <select
            value={selectedApproverId || ''}
            onChange={e => onSelectApprover(req.id, e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] bg-white"
          >
            <option value="">Select Approver</option>
            {approvers.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email}){a.firm?.name ? ` — ${a.firm.name}` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={assigning === req.id || !selectedApproverId}
            className="bg-[#0B1B3D] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          >
            {assigning === req.id ? 'Assigning…' : '📌 Assign Request'}
          </button>
        </div>
      )}

      {req.rejection_reason && (
        <div className="bg-rose-50 px-6 py-3 text-xs text-rose-800 font-medium border-b">
          Rejection Reason: {req.rejection_reason}
        </div>
      )}

      {previewData && (
        <div className="p-6 bg-slate-50 border-t space-y-6">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                {isHistorical
                  ? 'Submission Snapshot: Live Published vs Proposed Draft'
                  : 'Side-by-Side Comparison: Current Live Published vs Proposed Changes'}
              </h4>
            </div>
            <div className="flex items-center gap-2 bg-white border p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`text-[11px] font-bold px-3 py-1 rounded ${previewMode === 'visual' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
              >
                Visual Preview
              </button>
              <button
                onClick={() => setPreviewMode('json')}
                className={`text-[11px] font-bold px-3 py-1 rounded ${previewMode === 'json' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
              >
                JSON Diff
              </button>
            </div>
          </div>

          {previewData.is_batch && Array.isArray(previewData.edits) ? (
            previewData.edits.map((item, idx) => {
              const curParsed = parseJson(item.current_content)
              const propParsed = parseJson(item.proposed_content)
              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <h5 className="font-extrabold text-[#0B1B3D] text-sm">
                    Section #{idx + 1}: {item.section_name}
                  </h5>
                  {previewMode === 'visual' ? (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <SectionIframePreview
                        sectionName={item.section_name}
                        data={curParsed}
                        height={480}
                        label={isHistorical ? 'Live Published (at submission)' : 'Current Live Published'}
                        borderColor="border-gray-300"
                      />
                      <SectionIframePreview
                        sectionName={item.section_name}
                        data={propParsed}
                        height={480}
                        label={isHistorical ? 'Proposed Draft (at submission)' : 'Proposed Draft'}
                        borderColor="border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="bg-gray-50 border p-3 rounded">
                        <span className="block font-sans font-bold text-gray-500 mb-1 text-[11px]">Current</span>
                        <pre className="whitespace-pre-wrap">{item.current_content || 'None'}</pre>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-300 p-3 rounded">
                        <span className="block font-sans font-bold text-emerald-800 mb-1 text-[11px]">Proposed</span>
                        <pre className="whitespace-pre-wrap">{item.proposed_content}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <SectionIframePreview
                sectionName={req.section?.name}
                data={parseJson(previewData.current_content)}
                height={480}
                label={isHistorical ? 'Live Published (at submission)' : 'Current Live Published'}
                borderColor="border-gray-300"
              />
              <SectionIframePreview
                sectionName={req.section?.name}
                data={parseJson(previewData.proposed_content)}
                height={480}
                label={isHistorical ? 'Proposed Draft (at submission)' : 'Proposed Draft'}
                borderColor="border-emerald-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('new')
  const [selectedApprover, setSelectedApprover] = useState({})
  const [assigningId, setAssigningId] = useState(null)
  const [previewSnapshots, setPreviewSnapshots] = useState(() => loadPreviewSnapshots())
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'advisor',
  })

  const approvers = useMemo(() => users.filter(u => u.role === 'approver'), [users])

  const cachePreview = useCallback((requestId, preview) => {
    if (!preview) return
    setPreviewSnapshots(prev => savePreviewSnapshot(prev, requestId, preview))
  }, [])

  const getCachedPreview = useCallback(
    (requestId) => previewSnapshots[requestId] || null,
    [previewSnapshots]
  )

  const fetchRequests = useCallback(async () => {
    const res = await api.get('/change-requests')
    setRequests(res.data)
    return res.data
  }, [])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    const res = await api.get('/logs')
    setLogs(res.data.data || res.data || [])
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchRequests(), fetchUsers(), fetchLogs()])
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchRequests, fetchUsers, fetchLogs])

  const newRequests = useMemo(
    () => requests.filter(r => r.status === PENDING_STATUS),
    [requests]
  )

  const previousRequests = useMemo(
    () => requests.filter(r => PREVIOUS_STATUSES.has(r.status)),
    [requests]
  )

  const handleAssign = async (requestId, approverId) => {
    setAssigningId(requestId)
    setError('')
    setMessage('')
    try {
      await api.post(`/change-requests/${requestId}/assign-to-approver`, {
        approver_id: Number(approverId),
      })
      setMessage('Request assigned to approver successfully.')
      await fetchRequests()
      setSelectedApprover(prev => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign request.')
    } finally {
      setAssigningId(null)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (userForm.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (userForm.password !== userForm.password_confirmation) {
      setError('Password confirmation does not match.')
      return
    }

    setCreatingUser(true)
    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        password_confirmation: userForm.password_confirmation,
        role: userForm.role,
      }
      if (user?.firm?.id) {
        payload.firm_id = user.firm.id
      }

      await api.post('/users', payload)
      setMessage(`User "${payload.name}" created successfully as ${payload.role.replace('_', ' ')}.`)
      setUserForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'advisor',
      })
      await fetchUsers()
      setActiveTab('users')
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat()[0]
        setError(firstError || 'Validation failed.')
      } else {
        setError(err.response?.data?.message || 'Failed to create user.')
      }
    } finally {
      setCreatingUser(false)
    }
  }

  const tabs = [
    { id: 'new', label: 'New Requests', count: newRequests.length },
    { id: 'previous', label: 'Previous Requests', count: previousRequests.length },
    { id: 'create-user', label: 'Create User' },
    { id: 'users', label: 'All Users', count: users.length },
    { id: 'logs', label: 'Activity Logs' },
  ]

  const renderRequestList = (list, emptyTitle, emptyHint) => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold">Loading requests…</p>
        </div>
      )
    }

    if (list.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-lg font-bold text-[#0B1B3D]">{emptyTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">{emptyHint}</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {list.map(req => (
          <ManagerRequestCard
            key={req.id}
            req={req}
            approvers={approvers}
            selectedApproverId={selectedApprover[req.id]}
            onSelectApprover={(id, approverId) => setSelectedApprover(prev => ({ ...prev, [id]: approverId }))}
            onAssign={handleAssign}
            assigning={assigningId}
            onMessage={setMessage}
            onError={setError}
            getCachedPreview={getCachedPreview}
            cachePreview={cachePreview}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Manager Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Create users, review incoming change requests, assign approvers, and track request history.
            </p>
          </div>
          {user && (
            <div className="bg-white border rounded-lg px-4 py-2 text-right shadow-sm">
              <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Logged in as</span>
              <span className="text-sm font-bold text-[#C8102E]">{user.name} (manager)</span>
              {user.firm && (
                <span className="text-xs text-gray-500 block">{user.firm.name}</span>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="font-bold hover:opacity-75 text-lg">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold hover:opacity-75 text-lg">✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">New Requests</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{newRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Under Review</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">
              {requests.filter(r => r.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Completed</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {requests.filter(r => r.status === 'approved' || r.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Team Members</p>
            <p className="text-3xl font-extrabold text-[#0B1B3D] mt-1">{users.length}</p>
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

        {activeTab === 'new' && renderRequestList(
          newRequests,
          'No New Requests',
          'All incoming change requests have been assigned to approvers.'
        )}

        {activeTab === 'previous' && renderRequestList(
          previousRequests,
          'No Previous Requests',
          'Completed, rejected, and in-review requests will appear here.'
        )}

        {activeTab === 'create-user' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-xl">
            <h2 className="text-xl font-bold text-[#0B1B3D] mb-1">Create New User</h2>
            <p className="text-sm text-gray-500 mb-6">
              Add advisors, approvers, or client admins to your team.
              {user?.firm?.name && ` New users will be linked to ${user.firm.name}.`}
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  placeholder="john@firm.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] bg-white"
                  required
                >
                  {CREATABLE_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={userForm.password_confirmation}
                  onChange={e => setUserForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full bg-[#C8102E] text-white py-3 rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-50 shadow-md mt-2"
              >
                {creatingUser ? 'Creating User…' : 'Create User'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {usersLoading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-8 h-8 mx-auto mb-3 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
                Loading users…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Firm</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3 text-gray-500">{u.firm?.name || '—'}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                        No users found. Create your first team member above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Details</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{log.user?.name || '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{log.action?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-500">{log.details || log.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No activity logs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
