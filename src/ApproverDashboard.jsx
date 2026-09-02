import { useState, useEffect, useMemo } from 'react'
import {
  FaInbox,
  FaClipboardCheck,
  FaUserPlus,
  FaUsers,
  FaTimes,
} from 'react-icons/fa'
import Navbar from './Navbar'
import ChangeRequestAssignmentPanel from './components/ChangeRequestAssignmentPanel'
import ReviewQueuePanel from './components/ReviewQueuePanel'
import { CreateUserPanel, TeamUsersPanel } from './components/TeamUserManagement'
import { usePermissions } from './context/PermissionsContext'

function AlertBanner({ type, message, onDismiss }) {
  const isSuccess = type === 'success'
  return (
    <div
      className={`${
        isSuccess ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-rose-50 border-rose-500 text-rose-800'
      } border-l-4 p-4 mb-6 rounded-lg shadow-sm flex items-start justify-between gap-3 text-sm font-medium`}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded hover:bg-black/5 transition"
        aria-label="Dismiss"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ApproverDashboard({ embedded = false } = {}) {
  const { can } = usePermissions()
  const canReview = can('review_change_requests')
  const canAssignRequests = can('assign_change_requests') || can('view_all_change_requests')
  const canManageUsers = can('manage_users')
  const canViewUsers = can('view_users') || canManageUsers

  const [activeTab, setActiveTab] = useState('review')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const tabs = useMemo(() => [
    canReview && { id: 'review', label: 'Review Queue', icon: FaClipboardCheck },
    canAssignRequests && { id: 'change-requests', label: 'Change Requests', icon: FaInbox },
    canManageUsers && { id: 'create-user', label: 'Create User', icon: FaUserPlus },
    canViewUsers && { id: 'users', label: 'Team', icon: FaUsers },
  ].filter(Boolean), [canReview, canAssignRequests, canManageUsers, canViewUsers])

  useEffect(() => {
    if (tabs.length && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  const inner = (
    <>
      {!embedded && (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">Approver Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Review change requests and manage your workflow.
            </p>
          </div>
        </div>
      )}

      {message && <AlertBanner type="success" message={message} onDismiss={() => setMessage('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {tabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-[#0B1B3D] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'review' && canReview && <ReviewQueuePanel />}

      {activeTab === 'change-requests' && canAssignRequests && (
        <ChangeRequestAssignmentPanel onMessage={setMessage} onError={setError} />
      )}

      {activeTab === 'create-user' && canManageUsers && (
        <CreateUserPanel
          onCreated={() => setActiveTab('users')}
          onError={setError}
          onMessage={setMessage}
        />
      )}

      {activeTab === 'users' && canViewUsers && (
        <TeamUsersPanel onCreateClick={canManageUsers ? () => setActiveTab('create-user') : undefined} />
      )}

      {!canReview && !canAssignRequests && !canManageUsers && !canViewUsers && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-500 font-medium">No permissions assigned for this dashboard.</p>
        </div>
      )}
    </>
  )

  if (embedded) {
    return inner
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {inner}
      </div>
    </div>
  )
}
