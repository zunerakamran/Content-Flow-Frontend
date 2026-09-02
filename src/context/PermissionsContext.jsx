import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

export const PERMISSION_CATALOG = [
    { key: 'manage_users', name: 'Create & Manage Users', description: 'Create new users and manage team accounts.', category: 'Team' },
    { key: 'view_users', name: 'View Team Users', description: 'View the list of users on the team.', category: 'Team' },
    { key: 'assign_change_requests', name: 'Assign Change Requests', description: 'Assign pending change requests to an approver.', category: 'Change Requests' },
    { key: 'view_all_change_requests', name: 'View All Change Requests', description: 'See change requests across firms.', category: 'Change Requests' },
    { key: 'review_change_requests', name: 'Review Change Requests', description: 'Approve, reject, or schedule submitted content changes.', category: 'Change Requests' },
    { key: 'submit_change_requests', name: 'Submit Change Requests', description: 'Edit sections and submit changes for approval.', category: 'Content' },
    { key: 'edit_sections', name: 'Edit Sections', description: 'Lock and edit website section content.', category: 'Content' },
    { key: 'request_deployments', name: 'Request Deployments', description: 'Request a new showcase site deployment.', category: 'Deployments' },
    { key: 'view_all_deployments', name: 'View All Deployments', description: 'See all deployment requests.', category: 'Deployments' },
    { key: 'deploy_websites', name: 'Deploy Websites', description: 'Deploy or update advisor sites on cPanel.', category: 'Deployments' },
    { key: 'manage_templates', name: 'Manage Templates', description: 'Create, edit, and delete showcase templates.', category: 'Templates' },
    { key: 'manage_deployment_sections', name: 'Manage Deployment Sections', description: 'Show or hide sections on a deployed site.', category: 'Deployments' },
    { key: 'publish_live_content', name: 'Publish Live Content', description: 'Publish live site content without approver review.', category: 'Content' },
    { key: 'view_activity_logs', name: 'View Activity Logs', description: 'View audit and activity logs.', category: 'Compliance' },
    { key: 'manage_role_labels', name: 'Manage Role Labels', description: 'Rename role display names shown in the dashboard.', category: 'Settings' },
    { key: 'manage_role_permissions', name: 'Manage Role Permissions', description: 'Grant or revoke what each role can do.', category: 'Settings' },
]

const DEFAULT_MATRIX = {
    power_admin: Object.fromEntries(PERMISSION_CATALOG.map(p => [p.key, true])),
    manager: {
        manage_users: true,
        view_users: true,
        assign_change_requests: true,
        view_all_change_requests: true,
        view_all_deployments: true,
        view_activity_logs: true,
    },
    client_admin: {
        view_activity_logs: true,
    },
    approver: {
        review_change_requests: true,
    },
    advisor: {
        submit_change_requests: true,
        edit_sections: true,
        request_deployments: true,
    },
}

const ROLE_KEYS = ['power_admin', 'manager', 'client_admin', 'approver', 'advisor']

function normalizeRoleKey(role) {
    if (role === 'admin') return 'power_admin'
    if (role === 'editor') return 'advisor'
    return role
}

function buildDefaultMatrix() {
    const matrix = {}
    for (const role of ROLE_KEYS) {
        matrix[role] = {}
        for (const perm of PERMISSION_CATALOG) {
            matrix[role][perm.key] = Boolean(DEFAULT_MATRIX[role]?.[perm.key])
        }
    }
    return matrix
}

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
    const { user } = useAuth()
    const [permissions, setPermissions] = useState(PERMISSION_CATALOG)
    const [roles, setRoles] = useState(ROLE_KEYS)
    const [matrix, setMatrix] = useState(() => buildDefaultMatrix())
    const [locked, setLocked] = useState({ power_admin: ['manage_role_permissions'] })
    const [loading, setLoading] = useState(true)

    const applyPayload = useCallback((data) => {
        if (Array.isArray(data?.permissions) && data.permissions.length) {
            setPermissions(data.permissions)
        }
        if (Array.isArray(data?.roles) && data.roles.length) {
            setRoles(data.roles)
        }
        if (data?.matrix && typeof data.matrix === 'object') {
            const next = buildDefaultMatrix()
            for (const [role, grants] of Object.entries(data.matrix)) {
                next[role] = { ...(next[role] || {}), ...grants }
            }
            setMatrix(next)
        }
        if (data?.locked) {
            setLocked(data.locked)
        }
    }, [])

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await api.get('/role-permissions')
            applyPayload(res.data)
        } catch {
            setMatrix(buildDefaultMatrix())
        } finally {
            setLoading(false)
        }
    }, [applyPayload])

    useEffect(() => {
        fetchPermissions()
    }, [fetchPermissions])

    useEffect(() => {
        const refresh = () => { fetchPermissions() }
        const onVisibility = () => {
            if (document.visibilityState === 'visible') refresh()
        }
        window.addEventListener('focus', refresh)
        document.addEventListener('visibilitychange', onVisibility)
        const interval = window.setInterval(refresh, 30000)
        return () => {
            window.removeEventListener('focus', refresh)
            document.removeEventListener('visibilitychange', onVisibility)
            window.clearInterval(interval)
        }
    }, [fetchPermissions])

    const roleKey = normalizeRoleKey(user?.role)

    const can = useCallback((permissionKey) => {
        if (!permissionKey || !roleKey) return false
        // Live matrix is the source of truth so Power Admin changes apply without re-login
        if (Object.prototype.hasOwnProperty.call(matrix[roleKey] || {}, permissionKey)) {
            return Boolean(matrix[roleKey][permissionKey])
        }
        if (Array.isArray(user?.permissions) && user.permissions.length > 0) {
            return user.permissions.includes(permissionKey)
        }
        return false
    }, [user?.permissions, matrix, roleKey])

    const isLocked = useCallback((role, permissionKey) => {
        return Boolean(locked[role]?.includes(permissionKey))
    }, [locked])

    const updatePermission = useCallback(async (roleKeyArg, permissionKey, granted) => {
        const res = await api.put('/role-permissions', {
            role_key: roleKeyArg,
            permission_key: permissionKey,
            granted: Boolean(granted),
        })
        setMatrix(prev => ({
            ...prev,
            [roleKeyArg]: {
                ...(prev[roleKeyArg] || {}),
                [permissionKey]: Boolean(granted),
            },
        }))
        return res.data
    }, [])

    const value = useMemo(() => ({
        permissions,
        roles,
        matrix,
        locked,
        loading,
        can,
        isLocked,
        fetchPermissions,
        updatePermission,
    }), [permissions, roles, matrix, locked, loading, can, isLocked, fetchPermissions, updatePermission])

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionsContext)
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider')
    }
    return context
}
