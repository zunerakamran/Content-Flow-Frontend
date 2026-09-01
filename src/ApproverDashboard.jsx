import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
  FaHandPointer,
  FaCalendarAlt,
  FaSearch,
  FaSync,
  FaInbox,
  FaClipboardCheck,
  FaUser,
  FaCalendarCheck,
} from 'react-icons/fa'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { parseJson } from './utils/parseJson'
import {
  buildPreviewFromRequest,
  capturePreviewSnapshot,
  isHistoricalRequest,
  loadPreviewSnapshots,
  previewHasStoredSnapshot,
  resolveRequestPreview,
  savePreviewSnapshot,
} from './utils/changeRequestPreview'
import SectionIframePreview from './SectionIframePreview'

const ACTIVE_STATUSES = new Set(['pending', 'under_review', 'scheduled'])

const STATUS_CONFIG = {
  pending: {
    label: 'Awaiting Pickup',
    icon: FaInbox,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  under_review: {
    label: 'Under Review',
    icon: FaClipboardCheck,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  scheduled: {
    label: 'Scheduled',
    icon: FaCalendarCheck,
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  approved: {
    label: 'Approved & Published',
    icon: FaCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    icon: FaTimesCircle,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
}

function getRequestSectionTitle(req) {
  if (req.section) return `Section: ${req.section.name}`
  try {
    const parsed = JSON.parse(req.proposed_content)
    if (Array.isArray(parsed)) {
      const names = parsed.map(p => p.section_name || 'Section').join(', ')
      return `Single Batch Request (${parsed.length} Sections: ${names})`
    }
  } catch { /* ignore malformed content */ }
  return `Change Request #${req.id}`
}

function StatusBadge({ status, scheduledAt }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null
  const Icon = config.icon
  const label = status === 'scheduled' && scheduledAt
    ? `${config.label} · ${new Date(scheduledAt).toLocaleString()}`
    : config.label
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  )
}

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

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[#0B1B3D] leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-semibold mt-1">{label}</p>
      </div>
    </div>
  )
}

const RequestCard = memo(function RequestCard({
  req,
  user,
  onStatusChange,
  onMessage,
  onError,
  getCachedPreview,
  cachePreview,
}) {
  const [previewData, setPreviewData] = useState(null)
  const [previewMode, setPreviewMode] = useState('visual')
  const [rejectionReason, setRejectionReason] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [busy, setBusy] = useState(null)

  const isAssignedToMe = req.approver_id === user?.id
  const sectionTitle = useMemo(() => getRequestSectionTitle(req), [req.id, req.section, req.proposed_content])

  const handleAssign = async () => {
    setBusy('assign')
    onError('')
    onMessage('')
    try {
      await api.post(`/change-requests/${req.id}/assign`)
      onStatusChange(req.id, {
        status: 'under_review',
        approver_id: user.id,
        approver: user,
      })
      onMessage('Request picked up. You can now review and approve or reject.')
    } catch (err) {
      onError(err.response?.data?.message || 'Could not pick up this request.')
    } finally {
      setBusy(null)
    }
  }

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
      if (nextPreview && !isHistoricalRequest(req)) {
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

  const handleApprove = async (isScheduled = false) => {
    setBusy('approve')
    onError('')
    onMessage('')
    const scheduledTime = scheduleDate
    try {
      const snapshot = await capturePreviewSnapshot(api, req.id, previewData)
      cachePreview(req.id, snapshot)

      await api.post(`/change-requests/${req.id}/approve`, {
        scheduled_at: isScheduled ? scheduledTime : null,
      })
      if (isScheduled && scheduledTime) {
        onMessage(`Request approved and scheduled for publication at ${new Date(scheduledTime).toLocaleString()}.`)
        onStatusChange(req.id, { status: 'scheduled', scheduled_at: scheduledTime })
      } else {
        onMessage('Request approved. All sections in this request have been published live.')
        onStatusChange(req.id, { status: 'approved', scheduled_at: null })
      }
      setPreviewData(null)
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to approve request.')
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      onError('Please enter a rejection reason before rejecting.')
      return
    }
    setBusy('reject')
    onError('')
    onMessage('')
    try {
      const snapshot = await capturePreviewSnapshot(api, req.id, previewData)
      cachePreview(req.id, snapshot)

      await api.post(`/change-requests/${req.id}/reject`, {
        rejection_reason: rejectionReason,
      })
      onMessage('Request rejected. Section locks released for editor.')
      onStatusChange(req.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      setPreviewData(null)
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to reject request.')
    } finally {
      setBusy(null)
    }
  }

  const isHistorical = isHistoricalRequest(req)
  const canPreview = req.status === 'under_review' || req.status === 'pending' || isAssignedToMe || isHistorical
  const showReviewPanel = req.status === 'under_review' && isAssignedToMe

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="p-5 sm:p-6 border-b border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D]">{sectionTitle}</h3>
              <StatusBadge status={req.status} scheduledAt={req.scheduled_at} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <FaUser className="w-3 h-3 text-gray-400" />
                <span>Submitted by <strong className="text-gray-700">{req.editor?.name || 'Editor'}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FaClock className="w-3 h-3 text-gray-400" />
                <span>{new Date(req.created_at).toLocaleString()}</span>
              </span>
              {req.approver && (
                <span className="inline-flex items-center gap-1.5">
                  <FaClipboardCheck className="w-3 h-3 text-[#C8102E]" />
                  <span>Assigned to <strong className="text-[#C8102E]">{req.approver.name}</strong></span>
                </span>
              )}
            </div>
          </div>

          {canPreview && (
            <button
              type="button"
              onClick={handleTogglePreview}
              disabled={busy === 'preview'}
              className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-60 shrink-0 ${
                previewData
                  ? 'bg-[#0B1B3D] text-white hover:bg-slate-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {busy === 'preview' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading…
                </>
              ) : previewData ? (
                <>
                  <FaEyeSlash className="w-3.5 h-3.5" />
                  Hide Preview
                </>
              ) : (
                <>
                  <FaEye className="w-3.5 h-3.5" />
                  Preview Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pending pickup banner */}
      {req.status === 'pending' && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900">Available for review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Pick this request to start reviewing. No one else has claimed it yet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!!busy}
            className="inline-flex items-center gap-2 bg-[#0B1B3D] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-60 shrink-0"
          >
            {busy === 'assign' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Picking…
              </>
            ) : (
              <>
                <FaHandPointer className="w-3.5 h-3.5" />
                Pick it
              </>
            )}
          </button>
        </div>
      )}

      {/* Review actions panel */}
      {showReviewPanel && (
        <div className="bg-slate-50 border-b border-gray-100 px-5 sm:px-6 py-5 space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your decision</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Approve */}
            <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FaCheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0B1B3D]">Approve & Publish</p>
                  <p className="text-[11px] text-gray-500">Publish changes immediately or schedule for later</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-500">
                  <FaCalendarAlt className="inline w-3 h-3 mr-1 text-purple-500" />
                  Optional: schedule publish date
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleApprove(!!scheduleDate)}
                disabled={!!busy}
                className={`w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-60 ${
                  scheduleDate
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {busy === 'approve' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </>
                ) : scheduleDate ? (
                  <>
                    <FaCalendarCheck className="w-3.5 h-3.5" />
                    Schedule Publish
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-3.5 h-3.5" />
                    Approve & Publish Now
                  </>
                )}
              </button>
            </div>

            {/* Reject */}
            <div className="bg-white rounded-xl border border-rose-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <FaTimesCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0B1B3D]">Reject Request</p>
                  <p className="text-[11px] text-gray-500">Send back to the editor with feedback</p>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor={`reject-reason-${req.id}`} className="block text-[11px] font-semibold text-gray-500">
                  Rejection reason (required)
                </label>
                <input
                  id={`reject-reason-${req.id}`}
                  type="text"
                  placeholder="Explain what needs to be changed…"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!busy || !rejectionReason.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
              >
                {busy === 'reject' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rejecting…
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="w-3.5 h-3.5" />
                    Reject Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {req.rejection_reason && (
        <div className="bg-rose-50 px-5 sm:px-6 py-3 text-sm text-rose-800 border-b border-rose-100 flex items-start gap-2">
          <FaTimesCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-bold">Rejection reason: </span>
            {req.rejection_reason}
          </div>
        </div>
      )}

      {previewData && (
        <div className="p-5 sm:p-6 bg-slate-50 border-t space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 flex-wrap gap-3">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                {isHistorical
                  ? 'Submission Snapshot: Live Published vs Proposed Draft'
                  : 'Side-by-Side Comparison: Current Live vs Proposed'}
              </h4>
              {isHistorical && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Showing content as it existed when this request was submitted.
                </p>
              )}
              <a
                href="https://epatronus.space/template4/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#C8102E] font-bold underline mt-1 inline-block hover:opacity-80"
              >
                View deployed advisor site ↗
              </a>
            </div>

            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => setPreviewMode('visual')}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
                  previewMode === 'visual' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Visual Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('json')}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
                  previewMode === 'json' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
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
                        label={isHistorical ? 'Live Published Content (at submission)' : 'Current Live Published Content'}
                        borderColor="border-gray-300"
                      />
                      <SectionIframePreview
                        sectionName={item.section_name}
                        data={propParsed}
                        height={480}
                        label={isHistorical ? 'Proposed Draft Content (at submission)' : 'Proposed Draft Content'}
                        borderColor="border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="bg-gray-50 border p-3 rounded-lg">
                        <span className="block font-sans font-bold text-gray-500 mb-1 text-[11px]">Current (Raw)</span>
                        <pre className="whitespace-pre-wrap">{item.current_content || 'None'}</pre>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-300 p-3 rounded-lg">
                        <span className="block font-sans font-bold text-emerald-800 mb-1 text-[11px]">Proposed (Raw)</span>
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
                label={isHistorical ? 'Live Published Content (at submission)' : 'Current Live Published Content'}
                borderColor="border-gray-300"
              />
              <SectionIframePreview
                sectionName={req.section?.name}
                data={parseJson(previewData.proposed_content)}
                height={480}
                label={isHistorical ? 'Proposed Draft Content (at submission)' : 'Proposed Draft Content'}
                borderColor="border-emerald-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default function ApproverDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [previewSnapshots, setPreviewSnapshots] = useState(() => loadPreviewSnapshots())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState('active')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const cachePreview = useCallback((requestId, preview) => {
    if (!preview) return
    setPreviewSnapshots(prev => savePreviewSnapshot(prev, requestId, preview))
  }, [])

  const getCachedPreview = useCallback(
    (requestId) => previewSnapshots[requestId] || null,
    [previewSnapshots]
  )

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await api.get('/change-requests')
      setRequests(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStatusChange = useCallback((id, updates) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }, [])

  const clearMessage = useCallback(() => setMessage(''), [])
  const clearError = useCallback(() => setError(''), [])
  const setFeedbackMessage = useCallback((msg) => setMessage(msg), [])
  const setFeedbackError = useCallback((msg) => setError(msg), [])

  const stats = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    underReview: requests.filter(r => r.status === 'under_review').length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    active: requests.filter(r => ACTIVE_STATUSES.has(r.status)).length,
  }), [requests])

  const filteredRequests = useMemo(() => {
    let list = view === 'all' ? requests : requests.filter(r => ACTIVE_STATUSES.has(r.status))

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r => {
        const title = getRequestSectionTitle(r).toLowerCase()
        const editor = (r.editor?.name || '').toLowerCase()
        const approver = (r.approver?.name || '').toLowerCase()
        return title.includes(q) || editor.includes(q) || approver.includes(q) || String(r.id).includes(q)
      })
    }

    return list
  }, [requests, view, search])

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">Review Queue</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Pick up change requests, preview edits side-by-side, then approve or reject.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-60"
          >
            <FaSync className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {message && <AlertBanner type="success" message={message} onDismiss={clearMessage} />}
        {error && <AlertBanner type="error" message={error} onDismiss={clearError} />}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Awaiting Pickup"
              value={stats.pending}
              icon={FaInbox}
              accent="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Under Review"
              value={stats.underReview}
              icon={FaClipboardCheck}
              accent="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Scheduled"
              value={stats.scheduled}
              icon={FaCalendarCheck}
              accent="bg-purple-100 text-purple-600"
            />
            <StatCard
              label="Total Active"
              value={stats.active}
              icon={FaClock}
              accent="bg-teal-100 text-teal-600"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                view === 'active'
                  ? 'bg-[#0B1B3D] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Needs Review ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setView('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                view === 'all'
                  ? 'bg-[#0B1B3D] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Requests ({requests.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by section, editor, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center text-gray-500">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading change requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FaInbox className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1B3D]">
              {search.trim() ? 'No matching requests' : 'No change requests found'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {search.trim()
                ? 'Try a different search term or clear the filter.'
                : view === 'active'
                  ? 'You\'re all caught up — no requests need review right now.'
                  : 'There are currently no change requests in the system.'}
            </p>
            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-bold text-[#C8102E] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredRequests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                user={user}
                onStatusChange={handleStatusChange}
                onMessage={setFeedbackMessage}
                onError={setFeedbackError}
                getCachedPreview={getCachedPreview}
                cachePreview={cachePreview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
