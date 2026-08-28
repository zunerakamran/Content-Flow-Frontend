import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const user = await login(email, password)
            navigate(`/${user.role}`)
        } catch (err) {
            setError('Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#0B1B3D] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                        🔒
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#0B1B3D]">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-4 rounded text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="e.g. editor@aifirm.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0B1B3D] text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t pt-4">
                    <a href="/" className="text-xs text-gray-400 hover:text-gray-600 font-semibold">← Return to Public Website</a>
                </div>
            </div>
        </div>
    )
}