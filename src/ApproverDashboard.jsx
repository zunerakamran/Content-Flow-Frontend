import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { parseJson } from './AdvisorDashboard'
import SectionIframePreview from './SectionIframePreview'

export default function ApproverDashboard() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [previewMap, setPreviewMap] = useState({})
    const [rejectionReason, setRejectionReason] = useState({})
    const [scheduleDateMap, setScheduleDateMap] = useState({})
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [previewMode, setPreviewMode] = useState({}) // 'visual' or 'json'

    const fetchRequests = () => {
        api.get('/change-requests')
            .then(res => setRequests(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to load requests.'))
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAssign = async (id) => {
        setMessage('')
        setError('')
        try {
            await api.post(`/change-requests/${id}/assign`)
            setMessage('Request assigned to you. Status updated to Under Review.')
            fetchRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Could not assign request.')
        }
    }

    const handleTogglePreview = async (req) => {
        if (previewMap[req.id]) {
            setPreviewMap(prev => ({ ...prev, [req.id]: null }))
            return
        }

        try {
            const res = await api.get(`/change-requests/${req.id}/preview`)
            setPreviewMap(prev => ({
                ...prev,
                [req.id]: res.data
            }))
        } catch (err) {
            setError('Could not fetch request preview.')
        }
    }

    const handleApprove = async (id, isScheduled = false) => {
        setMessage('')
        setError('')
        const scheduledTime = scheduleDateMap[id]
        try {
            await api.post(`/change-requests/${id}/approve`, {
                scheduled_at: isScheduled ? scheduledTime : null
            })
            if (isScheduled && scheduledTime) {
                setMessage(`📅 Request approved & scheduled for publication at ${new Date(scheduledTime).toLocaleString()}!`)
            } else {
                setMessage('🎉 Request approved! All sections in this request have been published live.')
            }
            setPreviewMap(prev => ({ ...prev, [id]: null }))
            fetchRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve request.')
        }
    }

    const handleReject = async (id) => {
        if (!rejectionReason[id] || !rejectionReason[id].trim()) {
            setError('Please enter a rejection reason before rejecting.')
            return
        }
        setMessage('')
        setError('')
        try {
            await api.post(`/change-requests/${id}/reject`, {
                rejection_reason: rejectionReason[id]
            })
            setMessage('Request rejected. Section locks released for editor.')
            setPreviewMap(prev => ({ ...prev, [id]: null }))
            fetchRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject request.')
        }
    }

    const statusBadge = (status, scheduledAt) => {
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

    const getRequestSectionTitle = (req) => {
        if (req.section) return `Section: ${req.section.name}`
        try {
            const parsed = JSON.parse(req.proposed_content)
            if (Array.isArray(parsed)) {
                const names = parsed.map(p => p.section_name || 'Section').join(', ')
                return `Single Batch Request (${parsed.length} Sections: ${names})`
            }
        } catch { }
        return `Change Request #${req.id}`
    }

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
                        <button onClick={() => setMessage('')} className="font-bold hover:opacity-75 text-lg">✕</button>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="font-bold hover:opacity-75 text-lg">✕</button>
                    </div>
                )}

                {/* Request List */}
                <div className="space-y-6">
                    {requests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                            <div className="text-4xl mb-3">📁</div>
                            <h3 className="text-lg font-bold text-[#0B1B3D]">No Change Requests Found</h3>
                            <p className="text-sm text-gray-500 mt-1">There are currently no change requests waiting for approval.</p>
                        </div>
                    ) : (
                        requests.map(req => {
                            const isAssignedToMe = req.approver_id === user?.id
                            const previewData = previewMap[req.id]
                            const mode = previewMode[req.id] || 'visual'

                            return (
                                <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-[#0B1B3D]">
                                                    {getRequestSectionTitle(req)}
                                                </h3>
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

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleAssign(req.id)}
                                                    className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
                                                >
                                                    📌 Assign to Me
                                                </button>
                                            )}

                                            {(req.status === 'under_review' || req.status === 'pending' || isAssignedToMe) && (
                                                <button
                                                    onClick={() => handleTogglePreview(req)}
                                                    className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                                                >
                                                    {previewData ? 'Hide Preview' : '👁️ Preview Changes'}
                                                </button>
                                            )}

                                            {(req.status === 'under_review' && isAssignedToMe) && (
                                                <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                                                    <input
                                                        type="datetime-local"
                                                        value={scheduleDateMap[req.id] || ''}
                                                        onChange={e => setScheduleDateMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                        title="Optionally select a future publish date & time"
                                                        className="text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                                    />
                                                    <button
                                                        onClick={() => handleApprove(req.id, !!scheduleDateMap[req.id])}
                                                        className={`text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm ${
                                                            scheduleDateMap[req.id]
                                                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        }`}
                                                    >
                                                        {scheduleDateMap[req.id] ? '📅 Schedule Publish' : '✅ Approve & Publish Now'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rejection input when under review */}
                                    {req.status === 'under_review' && isAssignedToMe && (
                                        <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Provide reason if rejecting..."
                                                value={rejectionReason[req.id] || ''}
                                                onChange={e => setRejectionReason(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                                            />
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-rose-700 transition shadow-sm"
                                            >
                                                ❌ Reject Request
                                            </button>
                                        </div>
                                    )}

                                    {req.rejection_reason && (
                                        <div className="bg-rose-50 px-6 py-3 text-xs text-rose-800 font-medium">
                                            Rejection Reason: {req.rejection_reason}
                                        </div>
                                    )}

                                    {/* Expanded Preview Panel */}
                                    {previewData && (
                                        <div className="p-6 bg-slate-50 border-t space-y-6">
                                            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
                                                <div>
                                                    <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                                                        Side-by-Side Comparison: Current Live Published vs Proposed Changes
                                                    </h4>
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
                                                        onClick={() => setPreviewMode(prev => ({ ...prev, [req.id]: 'visual' }))}
                                                        className={`text-[11px] font-bold px-3 py-1 rounded ${mode === 'visual' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
                                                    >
                                                        Visual Component Preview
                                                    </button>
                                                    <button
                                                        onClick={() => setPreviewMode(prev => ({ ...prev, [req.id]: 'json' }))}
                                                        className={`text-[11px] font-bold px-3 py-1 rounded ${mode === 'json' ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
                                                    >
                                                        JSON Diff View
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Render all section edits in batch request */}
                                            {previewData.is_batch && Array.isArray(previewData.edits) ? (
                                                previewData.edits.map((item, idx) => {
                                                    const curParsed = parseJson(item.current_content)
                                                    const propParsed = parseJson(item.proposed_content)

                                                    return (
                                                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                                            <h5 className="font-extrabold text-[#0B1B3D] text-sm">
                                                                Section #{idx + 1}: {item.section_name}
                                                            </h5>

                                                            {mode === 'visual' ? (
                                                                <div className="grid lg:grid-cols-2 gap-6">
                                                                    <SectionIframePreview
                                                                        sectionName={item.section_name}
                                                                        data={curParsed}
                                                                        height={480}
                                                                        label="Current Live Published Content"
                                                                        borderColor="border-gray-300"
                                                                    />
                                                                    <SectionIframePreview
                                                                        sectionName={item.section_name}
                                                                        data={propParsed}
                                                                        height={480}
                                                                        label="Proposed Draft Content"
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
                                                /* Legacy Single Section Preview */
                                                <div className="grid lg:grid-cols-2 gap-6">
                                                    <SectionIframePreview
                                                        sectionName={req.section?.name}
                                                        data={parseJson(previewData.current_content)}
                                                        height={480}
                                                        label="Current Live Published Content"
                                                        borderColor="border-gray-300"
                                                    />
                                                    <SectionIframePreview
                                                        sectionName={req.section?.name}
                                                        data={parseJson(previewData.proposed_content)}
                                                        height={480}
                                                        label="Proposed Draft Content"
                                                        borderColor="border-emerald-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )
                        })
                    )}
                </div>

            </div>
        </div>
    )
}