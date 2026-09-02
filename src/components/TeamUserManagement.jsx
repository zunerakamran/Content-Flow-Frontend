import { useEffect, useMemo, useState } from 'react'
import {
  FaBuilding,
  FaSearch,
  FaUser,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useRoleLabels } from '../context/RoleLabelsContext'

const ROLE_COLORS = {
  advisor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  approver: 'bg-teal-100 text-teal-800 border-teal-200',
  manager: 'bg-violet-100 text-violet-800 border-violet-200',
  client_admin: 'bg-slate-100 text-slate-800 border-slate-200',
  power_admin: 'bg-orange-100 text-orange-800 border-orange-200',
}

function RoleBadge({ role }) {
  const { getRoleLabel } = useRoleLabels()
  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {getRoleLabel(role)}
    </span>
  )
}

export function CreateUserPanel({ onCreated, onError, onMessage }) {
  const { user } = useAuth()
  const { getRoleLabel, getRoleDescription } = useRoleLabels()
  const [creatingUser, setCreatingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'advisor',
  })

  const creatableRoles = useMemo(() => ([
    {
      value: 'advisor',
      label: `${getRoleLabel('advisor')} (Editor)`,
      description: getRoleDescription('advisor'),
    },
    {
      value: 'approver',
      label: getRoleLabel('approver'),
      description: getRoleDescription('approver'),
    },
    {
      value: 'client_admin',
      label: getRoleLabel('client_admin'),
      description: getRoleDescription('client_admin'),
    },
  ]), [getRoleLabel, getRoleDescription])

  const selectedRoleInfo = creatableRoles.find(r => r.value === userForm.role)

  const handleCreateUser = async (e) => {
    e.preventDefault()
    onError?.('')
    onMessage?.('')

    if (userForm.password !== userForm.password_confirmation) {
      onError?.('Passwords do not match.')
      return
    }
    if (userForm.password.length < 8) {
      onError?.('Password must be at least 8 characters.')
      return
    }

    setCreatingUser(true)
    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
        firm_id: user?.firm_id || user?.firm?.id || null,
      }

      await api.post('/users', payload)
      onMessage?.(`User "${payload.name}" created successfully as ${getRoleLabel(payload.role)}.`)
      setUserForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'advisor',
      })
      onCreated?.()
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat()[0]
        onError?.(firstError || 'Validation failed.')
      } else {
        onError?.(err.response?.data?.message || 'Failed to create user.')
      }
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C8102E]/10 flex items-center justify-center">
            <FaUserPlus className="w-5 h-5 text-[#C8102E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0B1B3D]">Create New User</h2>
            <p className="text-sm text-gray-500">
              Add {getRoleLabel('advisor').toLowerCase()}s, {getRoleLabel('approver').toLowerCase()}s, or {getRoleLabel('client_admin').toLowerCase()}s to your team.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition"
                placeholder="john@firm.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={userForm.role}
              onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] bg-white transition"
              required
            >
              {creatableRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={userForm.password_confirmation}
                onChange={e => setUserForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition"
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {user?.firm?.name && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2">
              <FaBuilding className="w-3 h-3 shrink-0" />
              New user will be linked to <strong>{user.firm.name}</strong>
            </p>
          )}

          <button
            type="submit"
            disabled={creatingUser}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#C8102E] text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition disabled:opacity-50 shadow-md"
          >
            {creatingUser ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating User…
              </>
            ) : (
              <>
                <FaUserPlus className="w-4 h-4" />
                Create User
              </>
            )}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#0B1B3D] mb-3">Role Guide</h3>
          <div className="space-y-3">
            {creatableRoles.map(r => (
              <div
                key={r.value}
                className={`p-3 rounded-xl border transition ${
                  userForm.role === r.value
                    ? 'border-[#C8102E]/30 bg-[#C8102E]/5'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <RoleBadge role={r.value} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedRoleInfo && (
          <div className="bg-[#0B1B3D] rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Selected Role</p>
            <p className="text-lg font-bold">{selectedRoleInfo.label}</p>
            <p className="text-sm text-white/70 mt-1">{selectedRoleInfo.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function TeamUsersPanel({ onCreateClick }) {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    setUsersLoading(true)
    setError('')
    try {
      const res = await api.get('/users')
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.role || '').toLowerCase().includes(q)
      || (u.firm?.name || '').toLowerCase().includes(q)
    )
  }, [users, userSearch])

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search team members…"
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {usersLoading ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading team members…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1B3D]">
              {userSearch.trim() ? 'No matching users' : 'No team members yet'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {userSearch.trim()
                ? 'Try a different search term.'
                : 'Create your first team member in the Create User tab.'}
            </p>
            {!userSearch.trim() && onCreateClick && (
              <button
                type="button"
                onClick={onCreateClick}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#C8102E] hover:underline"
              >
                <FaUserPlus className="w-3.5 h-3.5" />
                Create User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Firm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FaUser className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="font-semibold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{u.firm?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Showing {filteredUsers.length} of {users.length} users.
      </p>
    </div>
  )
}
