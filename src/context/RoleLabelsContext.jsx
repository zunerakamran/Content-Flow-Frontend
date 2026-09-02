import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const DEFAULT_ROLE_LABELS = {
    power_admin: 'Power Admin',
    advisor: 'Advisor',
    approver: 'Approver',
    manager: 'Manager',
    client_admin: 'Client Admin',
}

const DEFAULT_ROLE_DESCRIPTIONS = {
    advisor: 'Can edit website sections and submit change requests.',
    approver: 'Reviews and approves or rejects submitted changes.',
    client_admin: 'Manages firm settings and user access.',
}

const RoleLabelsContext = createContext(null)

function buildMaps(rows) {
    const labels = { ...DEFAULT_ROLE_LABELS }
    const descriptions = { ...DEFAULT_ROLE_DESCRIPTIONS }

    for (const row of rows) {
        if (row.role_key && row.label) {
            labels[row.role_key] = row.label
        }
        if (row.role_key && row.description) {
            descriptions[row.role_key] = row.description
        }
    }

    return { labels, descriptions }
}

export function RoleLabelsProvider({ children }) {
    const [labels, setLabels] = useState(DEFAULT_ROLE_LABELS)
    const [descriptions, setDescriptions] = useState(DEFAULT_ROLE_DESCRIPTIONS)
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)

    const applyRows = useCallback((rows) => {
        const next = buildMaps(rows)
        setLabels(next.labels)
        setDescriptions(next.descriptions)
        setRecords(Array.isArray(rows) ? rows : [])
    }, [])

    const fetchRoleLabels = useCallback(async () => {
        try {
            const res = await api.get('/role-labels')
            applyRows(res.data)
        } catch {
            // Keep defaults when the API is unavailable.
        } finally {
            setLoading(false)
        }
    }, [applyRows])

    useEffect(() => {
        fetchRoleLabels()
    }, [fetchRoleLabels])

    const getRoleLabel = useCallback((role, fallback = 'User') => {
        if (!role) return fallback
        return labels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }, [labels])

    const getRoleDescription = useCallback((role) => descriptions[role] || '', [descriptions])

    const getDashboardTitle = useCallback((role) => `${getRoleLabel(role)} Dashboard`, [getRoleLabel])

    const getConsoleTitle = useCallback((role) => `${getRoleLabel(role)} Console`, [getRoleLabel])

    const updateRoleLabel = useCallback(async (roleKey, payload) => {
        const res = await api.put(`/role-labels/${roleKey}`, payload)
        setRecords(prev => {
            const idx = prev.findIndex(row => row.role_key === roleKey)
            const next = idx >= 0
                ? prev.map(row => (row.role_key === roleKey ? res.data : row))
                : [...prev, res.data]
            applyRows(next)
            return next
        })
        return res.data
    }, [applyRows])

    const value = useMemo(() => ({
        labels,
        descriptions,
        records,
        loading,
        getRoleLabel,
        getRoleDescription,
        getDashboardTitle,
        getConsoleTitle,
        fetchRoleLabels,
        updateRoleLabel,
    }), [
        labels,
        descriptions,
        records,
        loading,
        getRoleLabel,
        getRoleDescription,
        getDashboardTitle,
        getConsoleTitle,
        fetchRoleLabels,
        updateRoleLabel,
    ])

    return (
        <RoleLabelsContext.Provider value={value}>
            {children}
        </RoleLabelsContext.Provider>
    )
}

export function useRoleLabels() {
    const context = useContext(RoleLabelsContext)
    if (!context) {
        throw new Error('useRoleLabels must be used within a RoleLabelsProvider')
    }
    return context
}
