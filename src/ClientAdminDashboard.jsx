import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from './api/axios'

export default function ClientAdminDashboard() {
    const [logs, setLogs] = useState([])
    const [activeTab, setActiveTab] = useState('logs')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const fetchLogs = () => api.get('/logs').then(res => setLogs(res.data))

    useEffect(() => {
        fetchLogs()
    }, [])

    const actionColor = (action) => {
        if (action === 'approved') return 'bg-green-100 text-green-700'
        if (action === 'rejected') return 'bg-red-100 text-red-700'
        if (action === 'submitted') return 'bg-yellow-100 text-yellow-700'
        if (action === 'deployed') return 'bg-blue-100 text-blue-700'
        return 'bg-gray-100 text-gray-700'
    }

    const tabs = ['logs']

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Client Admin Dashboard</h2>

                {message && <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Logs */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-gray-600">User</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Action</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Description</th>
                                    <th className="text-left px-4 py-3 text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-800">{log.user?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${actionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{log.description}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-sm">
                                            No logs yet
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