import { useState } from 'react'
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaSpinner } from 'react-icons/fa'
import { useAuth } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const user = await login(email, password)
            navigate(`/${user.role}`)
        } catch {
            setError('Invalid email or password. Please check your credentials and try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex font-sans">
            {/* Brand panel — hidden on small screens */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[#0B1B3D] text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#C8102E]" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C8102E] translate-x-1/3 translate-y-1/3" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C8102E] flex items-center justify-center shadow-lg shadow-[#C8102E]/30">
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-wide">Dashboard</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <p className="text-[#C8102E] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                            Welcome back
                        </p>
                        <h1 className="text-4xl xl:text-5xl font-bold leading-tight font-serif">
                            Sign in to manage your workspace
                        </h1>
                    </div>
                    <p className="text-white/70 text-base leading-relaxed max-w-md">
                        Access your role-based dashboard to review content, manage approvals, and stay on top of your workflow.
                    </p>
                </div>

                <p className="relative z-10 text-white/40 text-sm">
                    Secure access for authorized team members only.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex items-center justify-center bg-[#F5F5F5] px-4 py-10 sm:px-8">
                <div className="w-full max-w-[420px]">
                    {/* Mobile brand header */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-[#C8102E] flex items-center justify-center shadow-md shadow-[#C8102E]/25">
                                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                            <span className="text-xl font-bold text-[#0B1B3D]">Dashboard</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 p-8 sm:p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#0B1B3D]">Sign in</h2>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Enter your credentials to continue
                            </p>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="flex gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-4 mb-6 rounded-xl text-sm"
                            >
                                <span className="shrink-0 w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold mt-0.5">
                                    !
                                </span>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <FaEnvelope className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] focus:bg-white transition-colors"
                                        placeholder="you@company.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <FaLock className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] focus:bg-white transition-colors"
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="w-4 h-4" />
                                        ) : (
                                            <FaEye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#0B1B3D] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#07122A] focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        Signing in…
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Need help? Contact your administrator for access.
                    </p>
                </div>
            </div>
        </div>
    )
}
