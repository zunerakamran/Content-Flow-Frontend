import { useAuth } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    return (
        <nav className="bg-[#0B1B3D] text-white px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#C8102E]"></span>
                <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm">
                    {user?.name}
                    <span className="ml-2 bg-[#C8102E] text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                        {user?.role}
                    </span>
                    {user?.firm && (
                        <span className="ml-2 bg-slate-700 text-xs px-2 py-1 rounded font-medium">
                            {user.firm.name}
                        </span>
                    )}
                </span>
                <button
                    onClick={handleLogout}
                    className="bg-white text-[#0B1B3D] text-xs font-bold px-3.5 py-1.5 rounded hover:bg-gray-100 transition shadow-sm"
                >
                    Logout
                </button>
            </div>
        </nav>
    )
}
