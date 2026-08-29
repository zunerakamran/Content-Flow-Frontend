import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { parseJson } from './utils/parseJson'
import {
  buildPreviewFromRequest,
  isHistoricalRequest,
  preferStoredPreview,
  previewHasStoredSnapshot,
  previewSidesMatch,
} from './utils/changeRequestPreview'
import SectionIframePreview from './SectionIframePreview'

const ACTIVE_STATUSES = new Set(['pending', 'under_review', 'scheduled'])

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

function statusBadge(status, scheduledAt) {
  switch (status) {
    case 'pending':
      return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pending Assignment</span>
    case 'under_review':
      return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Under Review</span>
    case 'scheduled':
      return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">📅 Scheduled ({scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Pending Schedule'})</span>
    case 'approved':
      return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Approved & Published</span>
    case 'rejected':
      return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Rejected</span>
    default:
      return null
  }
}

const RequestCard = memo(function RequestCard({ req, user, onStatusChange, onMessage, onError }) {
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
      onMessage('Request assigned to you. Status updated to Under Review.')
    } catch (err) {
      onError(err.response?.data?.message || 'Could not assign request.')
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
      const storedPreview = buildPreviewFromRequest(req)
      const historical = isHistoricalRequest(req)

      if (historical && previewHasStoredSnapshot(storedPreview)) {
        setPreviewData(storedPreview)
        return
      }

      const res = await api.get(`/change-requests/${req.id}/preview`)
      let nextPreview = res.data

      if (previewHasStoredSnapshot(storedPreview)) {
        if (historical || previewSidesMatch(nextPreview)) {
          nextPreview = preferStoredPreview(nextPreview, storedPreview)
        }
      } else if (historical && previewSidesMatch(nextPreview)) {
        onError('Historical snapshot is unavailable for this request. Live content may have changed since submission.')
      }

      setPreviewData(nextPreview)
    } catch {
      const storedPreview = buildPreviewFromRequest(req)
      if (previewHasStoredSnapshot(storedPreview)) {
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
      await api.post(`/change-requests/${req.id}/approve`, {
        scheduled_at: isScheduled ? scheduledTime : null,
      })
      if (isScheduled && scheduledTime) {
        onMessage(`📅 Request approved & scheduled for publication at ${new Date(scheduledTime).toLocaleString()}!`)
        onStatusChange(req.id, { status: 'scheduled', scheduled_at: scheduledTime })
      } else {
        onMessage('🎉 Request approved! All sections in this request have been published live.')
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#0B1B3D]">{sectionTitle}</h3>
            {statusBadge(req.status, req.scheduled_at)}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
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

        <div className="flex items-center gap-3 flex-wrap">
          {req.status === 'pending' && (
            <button
              onClick={handleAssign}
              disabled={!!busy}
              className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm disabled:opacity-60"
            >
              {busy === 'assign' ? 'Assigning…' : '📌 Assign to Me'}
            </button>
          )}

          {(req.status === 'under_review' || req.status === 'pending' || isAssignedToMe || isHistoricalRequest(req)) && (
            <button
              onClick={handleTogglePreview}
              disabled={busy === 'preview'}
              className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-60"
            >
              {busy === 'preview' ? 'Loading preview…' : previewData ? 'Hide Preview' : '👁️ Preview Changes'}
            </button>
          )}

          {(req.status === 'under_review' && isAssignedToMe) && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                title="Optionally select a future publish date & time"
                className="text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <button
                onClick={() => handleApprove(!!scheduleDate)}
                disabled={!!busy}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-60 ${
                  scheduleDate
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {busy === 'approve'
                  ? 'Processing…'
                  : scheduleDate
                    ? '📅 Schedule Publish'
                    : '✅ Approve & Publish Now'}
              </button>
            </div>
          )}
        </div>
      </div>

      {req.status === 'under_review' && isAssignedToMe && (
        <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-3">
          <input
            type="text"
            placeholder="Provide reason if rejecting..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 bg-white"
          />
          <button
            onClick={handleReject}
            disabled={!!busy}
            className="bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-rose-700 transition shadow-sm disabled:opacity-60"
          >
            {busy === 'reject' ? 'Rejecting…' : '❌ Reject Request'}
          </button>
        </div>
      )}

      {req.rejection_reason && (
        <div className="bg-rose-50 px-6 py-3 text-xs text-rose-800 font-medium">
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
              {isHistorical && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Showing content as it existed when this request was submitted.
                </p>
              )}
              <a
                href="https://epatronus.space/template4/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#C8102E] font-bold underline mt-0.5 inline-block hover:opacity-80"
              >
                🔗 View Deployed Advisor Site (https://epatronus.space/template4/) ↗
              </a>
            </div>

            <div className="flex items-center gap-2 bg-white border p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`text-[11px] font-bold px-3 py-1 rounded ${previewMode === 'visual' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
              >
                Visual Component Preview
              </button>
              <button
                onClick={() => setPreviewMode('json')}
                className={`text-[11px] font-bold px-3 py-1 rounded ${previewMode === 'json' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
              >
                JSON Diff View
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
                      <div className="bg-gray-50 border p-3 rounded">
                        <span className="block font-sans font-bold text-gray-500 mb-1 text-[11px]">Current (Raw)</span>
                        <pre className="whitespace-pre-wrap">{item.current_content || 'None'}</pre>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-300 p-3 rounded">
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
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('active')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get('/change-requests')
      .then(res => {
        if (!cancelled) setRequests(res.data)
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load requests.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleStatusChange = useCallback((id, updates) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }, [])

  const clearMessage = useCallback(() => setMessage(''), [])
  const clearError = useCallback(() => setError(''), [])
  const setFeedbackMessage = useCallback((msg) => setMessage(msg), [])
  const setFeedbackError = useCallback((msg) => setError(msg), [])

  const filteredRequests = useMemo(() => {
    if (view === 'all') return requests
    return requests.filter(r => ACTIVE_STATUSES.has(r.status))
  }, [requests, view])

  const activeCount = useMemo(
    () => requests.filter(r => ACTIVE_STATUSES.has(r.status)).length,
    [requests]
  )

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Approver Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Review pending batch change requests, preview proposed edits side-by-side, and publish live.</p>
          </div>

          {user && (
            <div className="bg-white border rounded-lg px-4 py-2 text-right shadow-sm">
              <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Logged in as</span>
              <span className="text-sm font-bold text-[#C8102E]">{user.name} ({user.role})</span>
            </div>
          )}
        </div>

        {message && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
            <span>{message}</span>
            <button onClick={clearMessage} className="font-bold hover:opacity-75 text-lg">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold hover:opacity-75 text-lg">✕</button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              view === 'active'
                ? 'bg-[#0B1B3D] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Needs Review ({activeCount})
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              view === 'all'
                ? 'bg-[#0B1B3D] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Requests ({requests.length})
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading change requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-bold text-[#0B1B3D]">No Change Requests Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {view === 'active'
                ? 'There are no requests waiting for review right now.'
                : 'There are currently no change requests in the system.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                user={user}
                onStatusChange={handleStatusChange}
                onMessage={setFeedbackMessage}
                onError={setFeedbackError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
