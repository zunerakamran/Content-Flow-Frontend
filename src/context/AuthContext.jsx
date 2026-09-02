import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

function withPermissions(user, permissions) {
    if (!user) return null
    return {
        ...user,
        permissions: Array.isArray(permissions)
            ? permissions
            : (Array.isArray(user.permissions) ? user.permissions : undefined),
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            api.get('/me')
                .then(res => setUser(withPermissions(res.data, res.data?.permissions)))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password })
        localStorage.setItem('token', res.data.token)
        const nextUser = withPermissions(res.data.user, res.data.permissions)
        setUser(nextUser)
        return nextUser
    }

    const logout = async () => {
        await api.post('/logout')
        localStorage.removeItem('token')
        setUser(null)
    }

    const refreshUser = async () => {
        const res = await api.get('/me')
        const nextUser = withPermissions(res.data, res.data?.permissions)
        setUser(nextUser)
        return nextUser
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
