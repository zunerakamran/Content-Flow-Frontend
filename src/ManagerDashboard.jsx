import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from './api/axios'

export default function ManagerDashboard() {
    const [requests, setRequests] = useState([])
    const [approvers, setApprovers] = useState([])
    const [logs, setLogs] = useState([])
    const [activeTab, setActiveTab] = useState('requests')
    const [selectedApprover, setSelectedApprover] = useState({})
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/change-requests').then(res => setRequests(res.data))
        api.get('/users').then(res => setApprovers(res.data.filter(u => u.role === 'approver')))
        api.get('/logs').then(res => setLogs(res.data.data))
    }, [])

    const handleAssign = async (requestId) => {
        if (!selectedApprover[requestId]) {
            setError('Please select an approver')
            return
        }
        try {
            await api.post(`/change-requests/${requestId}/assign-to-approver`, {
                approver_id: selectedApprover[requestId],
            })
            setMessage('Request assigned successfully')
            const res = await api.get('/change-requests')
            setRequests(res.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const statusColor = (status) => {
        if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
        if (status === 'under_review') return 'bg-blue-100 text-blue-700'
        if (status === 'approved') return 'bg-green-100 text-green-700'
        if (status === 'rejected') return 'bg-red-100 text-red-700'
        return ''
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Manager Dashboard</h2>

                {message && <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Change Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                    >
                        Activity Logs
                    </button>
                </div>

                {/* Change Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        {requests.length === 0 && (
                            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                                No change requests found
                            </div>
                        )}
                        {requests.map(req => (
                            <div key={req.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">Section: {req.section?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Editor: {req.editor?.name} &bull; {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                        {req.approver && (
                                            <p className="text-sm text-gray-500">Approver: {req.approver?.name}</p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded capitalize font-medium ${statusColor(req.status)}`}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-3">
                                        <select
                                            value={selectedApprover[req.id] || ''}
                                            onChange={e => setSelectedApprover(prev => ({ ...prev, [req.id]: e.target.value }))}
                                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Approver</option>
                                            {approvers.map(a => (
                                                <option key={a.id} value={a.id}>{a.name} ({a.firm?.name})</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleAssign(req.id)}
                                            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600">User</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Action</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Details</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs?.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-700">{log.user?.name}</td>
                                        <td className="px-4 py-3 text-gray-700 capitalize">{log.action.replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3 text-gray-500">{log.details}</td>
                                        <td className="px-4 py-3 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}