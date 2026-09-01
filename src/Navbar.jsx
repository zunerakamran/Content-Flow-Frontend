import { FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
    power_admin: 'Power Admin',
    advisor: 'Advisor',
    approver: 'Approver',
    manager: 'Manager',
    client_admin: 'Client Admin',
}

const ROLE_BADGE_STYLES = {
    power_admin: 'bg-orange-500/90 text-white',
    advisor: 'bg-indigo-500/90 text-white',
    approver: 'bg-teal-500/90 text-white',
    manager: 'bg-violet-500/90 text-white',
    client_admin: 'bg-slate-500/90 text-white',
}

function formatRole(role) {
    if (!role) return 'User'
    return ROLE_LABELS[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const roleLabel = formatRole(user?.role)
    const roleBadgeClass = ROLE_BADGE_STYLES[user?.role] || 'bg-[#C8102E] text-white'
    const initials = user?.name
        ?.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?'

    return (
        <nav className="sticky top-0 z-30 bg-[#0B1B3D] text-white border-b border-white/10 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                {/* Brand */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#C8102E] flex items-center justify-center shadow-md shadow-[#C8102E]/30">
                        <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none truncate">
                            Dashboard
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/50 font-semibold mt-0.5 truncate">
                            {roleLabel} Console
                        </p>
                    </div>
                </div>

                {/* User & actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {user && (
                        <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-xl pl-1.5 pr-3 sm:pr-4 py-1.5">
                            <div
                                className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-[11px] font-extrabold text-white uppercase shrink-0"
                                aria-hidden="true"
                            >
                                {initials}
                            </div>

                            <div className="hidden sm:block min-w-0">
                                <p className="text-sm font-bold text-white leading-tight truncate max-w-[140px] lg:max-w-[200px]">
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span
                                        className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md ${roleBadgeClass}`}
                                    >
                                        {roleLabel}
                                    </span>
                                    {user.firm?.name && (
                                        <span className="text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                                            {user.firm.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Compact badges on very small screens */}
                            <div className="flex sm:hidden items-center gap-1">
                                <span
                                    className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${roleBadgeClass}`}
                                >
                                    {roleLabel.split(' ')[0]}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 bg-white text-[#0B1B3D] text-xs font-bold px-3 sm:px-3.5 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm"
                    >
                        <FaSignOutAlt className="w-3 h-3" />
                        <span className="hidden xs:inline sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}
