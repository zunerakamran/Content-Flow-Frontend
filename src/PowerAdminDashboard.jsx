import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaRocket,
    FaCog,
    FaLayerGroup,
    FaGlobe,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaSearch,
    FaSync,
    FaTimes,
    FaServer,
    FaDatabase,
    FaPalette,
    FaEye,
    FaEyeSlash,
    FaThLarge,
    FaList,
} from 'react-icons/fa'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import { sectionDisplayName } from './utils/sectionDisplay'
import TemplateScrollPreview from './components/TemplateScrollPreview'
import { defaultTemplatePreviewUrl } from './utils/assetUrl'

const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        icon: FaClock,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
    },
    deployed: {
        label: 'Deployed',
        icon: FaCheckCircle,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
    },
    rejected: {
        label: 'Rejected',
        icon: FaTimesCircle,
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
    },
}

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status]
    if (!config) return null
    const Icon = config.icon
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${config.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    )
}

function StatCard({ label, value, sub, accent = 'text-[#0B1B3D]' }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${accent}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    )
}

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

function ModalShell({ title, subtitle, onClose, children, maxWidth = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 bg-[#0B1B3D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div
                className={`bg-white rounded-2xl ${maxWidth} w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto`}
                role="dialog"
                aria-modal="true"
            >
                <div className="sticky top-0 bg-white z-10 flex items-start justify-between gap-4 p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-[#0B1B3D]">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        aria-label="Close"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

const inputClass =
    'w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E] transition'
const labelClass = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5'

export default function PowerAdminDashboard() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [templates, setTemplates] = useState([])
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [activeTab, setActiveTab] = useState('templates')
    const [templateSearch, setTemplateSearch] = useState('')
    const [requestSearch, setRequestSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [requestView, setRequestView] = useState('table')

    const [selectedRequest, setSelectedRequest] = useState(null)
    const [cpanelDomain, setCpanelDomain] = useState('')
    const [cpanelDbHost, setCpanelDbHost] = useState('localhost')
    const [cpanelDbName, setCpanelDbName] = useState('')
    const [cpanelDbUser, setCpanelDbUser] = useState('')
    const [cpanelDbPass, setCpanelDbPass] = useState('')
    const [cpanelApiKey, setCpanelApiKey] = useState('')
    const [isDeploying, setIsDeploying] = useState(false)

    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [templateName, setTemplateName] = useState('')
    const [templateSlug, setTemplateSlug] = useState('')
    const [templateDesc, setTemplateDesc] = useState('')
    const [templatePreviewUrl, setTemplatePreviewUrl] = useState('')
    const [regeneratePreview, setRegeneratePreview] = useState(false)
    const [templateIsActive, setTemplateIsActive] = useState(true)
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)

    const [sectionManageRequest, setSectionManageRequest] = useState(null)
    const [deploymentSections, setDeploymentSections] = useState([])
    const [sectionDrafts, setSectionDrafts] = useState({})
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [isSavingSections, setIsSavingSections] = useState(false)

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const [reqRes, tplRes] = await Promise.all([
                api.get('/template-requests'),
                api.get('/templates?all=1'),
            ])
            setRequests(reqRes.data)
            setTemplates(tplRes.data)
        } catch {
            setError('Failed to load dashboard data. Please try again.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const stats = useMemo(() => {
        const activeTemplates = templates.filter(t => t.is_active).length
        const pending = requests.filter(r => r.status === 'pending').length
        const deployed = requests.filter(r => r.status === 'deployed').length
        return {
            totalTemplates: templates.length,
            activeTemplates,
            pending,
            deployed,
            totalRequests: requests.length,
        }
    }, [templates, requests])

    const filteredTemplates = useMemo(() => {
        const q = templateSearch.trim().toLowerCase()
        if (!q) return templates
        return templates.filter(
            tpl =>
                tpl.name?.toLowerCase().includes(q) ||
                tpl.slug?.toLowerCase().includes(q) ||
                tpl.description?.toLowerCase().includes(q)
        )
    }, [templates, templateSearch])

    const filteredRequests = useMemo(() => {
        const q = requestSearch.trim().toLowerCase()
        return requests.filter(req => {
            const matchesStatus = statusFilter === 'all' || req.status === statusFilter
            const matchesSearch =
                !q ||
                [
                    req.advisor?.name,
                    req.firm?.name,
                    req.template_name,
                    req.domain_name,
                    req.domain,
                ].some(v => v?.toLowerCase().includes(q))
            return matchesStatus && matchesSearch
        })
    }, [requests, requestSearch, statusFilter])

    const openDeployModal = req => {
        setSelectedRequest(req)
        setCpanelDomain(req.cpanel_domain || `https://${req.domain_name}`)
        setCpanelDbHost(req.cpanel_db_host || 'localhost')
        setCpanelDbName(req.cpanel_db_name || '')
        setCpanelDbUser(req.cpanel_db_user || '')
        setCpanelDbPass(req.cpanel_db_pass || '')
        setCpanelApiKey(req.cpanel_api_key || '')
    }

    const handleDeploySubmit = async e => {
        e.preventDefault()
        if (!selectedRequest) return
        setIsDeploying(true)
        setMessage('')
        setError('')
        try {
            await api.post(`/template-requests/${selectedRequest.id}/deploy`, {
                cpanel_domain: cpanelDomain,
                cpanel_db_host: cpanelDbHost,
                cpanel_db_name: cpanelDbName,
                cpanel_db_user: cpanelDbUser,
                cpanel_db_pass: cpanelDbPass,
                cpanel_api_key: cpanelApiKey,
            })
            setMessage(`Template successfully deployed to ${cpanelDomain}!`)
            setSelectedRequest(null)
            fetchData(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deploy template.')
        } finally {
            setIsDeploying(false)
        }
    }

    const openCreateTemplateModal = () => {
        setEditingTemplate(null)
        setTemplateName('')
        setTemplateSlug('')
        setTemplateDesc('')
        setTemplatePreviewUrl('')
        setRegeneratePreview(false)
        setTemplateIsActive(true)
        setShowTemplateModal(true)
    }

    const openEditTemplateModal = tpl => {
        setEditingTemplate(tpl)
        setTemplateName(tpl.name || '')
        setTemplateSlug(tpl.slug || '')
        setTemplateDesc(tpl.description || '')
        setTemplatePreviewUrl(tpl.preview_url || defaultTemplatePreviewUrl(tpl.slug))
        setRegeneratePreview(false)
        setTemplateIsActive(Boolean(tpl.is_active))
        setShowTemplateModal(true)
    }

    const handleSaveTemplate = async e => {
        e.preventDefault()
        if (!templateName) return
        setIsSavingTemplate(true)
        setMessage('')
        setError('')
        try {
            const payload = {
                name: templateName,
                slug: templateSlug,
                description: templateDesc,
                preview_url: templatePreviewUrl || defaultTemplatePreviewUrl(templateSlug),
                is_active: templateIsActive,
            }
            const requestOptions = { timeout: 180000 }

            if (editingTemplate) {
                if (regeneratePreview) payload.regenerate_preview = true
                await api.put(`/templates/${editingTemplate.id}`, payload, requestOptions)
                setMessage(`Showcase template "${templateName}" updated successfully!`)
            } else {
                await api.post('/templates', payload, requestOptions)
                setMessage(`New showcase template "${templateName}" created successfully!`)
            }
            setShowTemplateModal(false)
            fetchData(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save template.')
        } finally {
            setIsSavingTemplate(false)
        }
    }

    const handleDeleteTemplate = async tpl => {
        if (!window.confirm(`Are you sure you want to delete template "${tpl.name}"?`)) return
        setMessage('')
        setError('')
        try {
            await api.delete(`/templates/${tpl.id}`)
            setMessage(`Deleted template "${tpl.name}".`)
            fetchData(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete template.')
        }
    }

    const openSectionManageModal = async req => {
        setSectionManageRequest(req)
        setDeploymentSections([])
        setSectionDrafts({})
        setIsLoadingSections(true)
        setMessage('')
        setError('')
        try {
            const res = await api.get(`/template-requests/${req.id}/sections`)
            const list = Array.isArray(res.data?.sections) ? res.data.sections : []
            setDeploymentSections(list)
            const drafts = {}
            list.forEach(section => {
                drafts[section.id] = {
                    display_name: section.display_name || section.name || '',
                    is_visible: section.is_visible !== false,
                }
            })
            setSectionDrafts(drafts)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load deployment sections.')
            setSectionManageRequest(null)
        } finally {
            setIsLoadingSections(false)
        }
    }

    const handleSectionDraftChange = (sectionId, field, value) => {
        setSectionDrafts(prev => ({
            ...prev,
            [sectionId]: { ...prev[sectionId], [field]: value },
        }))
    }

    const handleSaveDeploymentSections = async e => {
        e.preventDefault()
        if (!sectionManageRequest) return
        setIsSavingSections(true)
        setMessage('')
        setError('')
        try {
            const payload = deploymentSections.map(section => {
                const draft = sectionDrafts[section.id] || {}
                return {
                    id: section.id,
                    display_name: draft.display_name?.trim() || section.name,
                    is_visible: draft.is_visible !== false,
                }
            })
            await api.put(`/template-requests/${sectionManageRequest.id}/sections`, { sections: payload })
            setMessage(
                `Section settings saved for ${sectionManageRequest.domain_name || sectionManageRequest.domain}. Hidden sections will no longer appear on the deployed site.`
            )
            setSectionManageRequest(null)
            setDeploymentSections([])
            setSectionDrafts({})
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save section settings.')
        } finally {
            setIsSavingSections(false)
        }
    }

    const tabs = [
        { id: 'templates', label: 'Template Catalog', icon: FaThLarge, count: templates.length },
        { id: 'deployments', label: 'Deployment Requests', icon: FaRocket, count: requests.length },
    ]

    const renderRequestActions = req => (
        <div className="flex items-center gap-2 flex-wrap">
            {req.status === 'deployed' && (
                <button
                    type="button"
                    onClick={() => openSectionManageModal(req)}
                    className="inline-flex items-center gap-1.5 bg-white border border-[#0B1B3D] text-[#0B1B3D] text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                >
                    <FaLayerGroup className="w-3 h-3" />
                    Sections
                </button>
            )}
            <button
                type="button"
                onClick={() => openDeployModal(req)}
                className="inline-flex items-center gap-1.5 bg-[#0B1B3D] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
            >
                {req.status === 'deployed' ? (
                    <>
                        <FaCog className="w-3 h-3" />
                        Update
                    </>
                ) : (
                    <>
                        <FaRocket className="w-3 h-3" />
                        Deploy
                    </>
                )}
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-gray-100 font-sans text-gray-800">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 bg-[#0B1B3D]/10 text-[#0B1B3D] text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                                <FaServer className="w-3 h-3" />
                                Power Admin
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Template & Deployment Hub</h1>
                        <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                            Register showcase templates, deploy advisor websites to cPanel, and manage live section visibility.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {user && (
                            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-right shadow-sm">
                                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">
                                    Logged in as
                                </span>
                                <span className="text-sm font-bold text-[#C8102E]">{user.name}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-4 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                        >
                            <FaSync className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={openCreateTemplateModal}
                            className="inline-flex items-center gap-2 bg-[#C8102E] text-white text-xs font-extrabold px-5 py-3 rounded-xl hover:bg-[#A00C23] transition shadow-md"
                        >
                            <FaPlus className="w-3.5 h-3.5" />
                            New Template
                        </button>
                    </div>
                </div>

                {message && <AlertBanner type="success" message={message} onDismiss={() => setMessage('')} />}
                {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Templates" value={stats.totalTemplates} sub={`${stats.activeTemplates} active`} />
                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        sub="Awaiting deployment"
                        accent="text-amber-600"
                    />
                    <StatCard
                        label="Deployed"
                        value={stats.deployed}
                        sub="Live advisor sites"
                        accent="text-emerald-600"
                    />
                    <StatCard
                        label="Total Requests"
                        value={stats.totalRequests}
                        sub="All time"
                        accent="text-[#C8102E]"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                                    activeTab === tab.id
                                        ? 'bg-[#0B1B3D] text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                        <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
                        <p className="text-sm font-semibold text-gray-500">Loading dashboard…</p>
                    </div>
                ) : (
                    <>
                        {/* Template Catalog */}
                        {activeTab === 'templates' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0B1B3D]">Showcase Templates</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Templates available for advisors and managers to choose during deployment.
                                        </p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="search"
                                            placeholder="Search templates…"
                                            value={templateSearch}
                                            onChange={e => setTemplateSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E]"
                                        />
                                    </div>
                                </div>

                                <div className="p-6">
                                    {filteredTemplates.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <FaThLarge className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <h3 className="font-bold text-[#0B1B3D] mb-1">
                                                {templateSearch ? 'No templates match your search' : 'No templates yet'}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                {templateSearch
                                                    ? 'Try a different search term.'
                                                    : 'Register your first showcase template to get started.'}
                                            </p>
                                            {!templateSearch && (
                                                <button
                                                    type="button"
                                                    onClick={openCreateTemplateModal}
                                                    className="inline-flex items-center gap-2 bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition"
                                                >
                                                    <FaPlus className="w-3 h-3" />
                                                    Register Template
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {filteredTemplates.map(tpl => (
                                                <article
                                                    key={tpl.id}
                                                    className="group border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col hover:border-[#0B1B3D]/20 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="relative overflow-hidden">
                                                        <TemplateScrollPreview
                                                            template={tpl}
                                                            className="h-40 w-full"
                                                            overlay={
                                                                <>
                                                                    <div className="absolute top-3 left-3 bg-[#0B1B3D]/90 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md z-10">
                                                                        {tpl.slug}
                                                                    </div>
                                                                    <div className="absolute top-3 right-3 z-10">
                                                                        {tpl.is_active ? (
                                                                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                                                <FaCheckCircle className="w-2.5 h-2.5" />
                                                                                Active
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 bg-gray-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                                                <FaEyeSlash className="w-2.5 h-2.5" />
                                                                                Disabled
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            }
                                                        />
                                                    </div>

                                                    <div className="p-4 flex-1 flex flex-col">
                                                        <h3 className="font-extrabold text-[#0B1B3D] text-base leading-tight">
                                                            {tpl.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 flex-1">
                                                            {tpl.description || 'No description provided.'}
                                                        </p>

                                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditTemplateModal(tpl)}
                                                                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0B1B3D] bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition"
                                                            >
                                                                <FaEdit className="w-3 h-3" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTemplate(tpl)}
                                                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition"
                                                            >
                                                                <FaTrash className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Deployment Requests */}
                        {activeTab === 'deployments' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-[#0B1B3D]">Deployment Requests</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Deploy templates to advisor cPanel hosting and configure database sync.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setRequestView('table')}
                                                className={`p-2 rounded-lg transition ${
                                                    requestView === 'table'
                                                        ? 'bg-[#0B1B3D] text-white'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                                title="Table view"
                                            >
                                                <FaList className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRequestView('cards')}
                                                className={`p-2 rounded-lg transition ${
                                                    requestView === 'cards'
                                                        ? 'bg-[#0B1B3D] text-white'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                                title="Card view"
                                            >
                                                <FaThLarge className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="search"
                                                placeholder="Search by advisor, firm, domain, or template…"
                                                value={requestSearch}
                                                onChange={e => setRequestSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E]"
                                            />
                                        </div>
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-[#C8102E]/30 min-w-[140px]"
                                        >
                                            <option value="all">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="deployed">Deployed</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                {filteredRequests.length === 0 ? (
                                    <div className="py-16 text-center px-6">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <FaRocket className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <h3 className="font-bold text-[#0B1B3D] mb-1">
                                            {requestSearch || statusFilter !== 'all'
                                                ? 'No matching requests'
                                                : 'No deployment requests'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {requestSearch || statusFilter !== 'all'
                                                ? 'Adjust your search or filter to see more results.'
                                                : 'Advisor template requests will appear here when submitted.'}
                                        </p>
                                    </div>
                                ) : requestView === 'table' ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead className="bg-slate-50 text-gray-500 text-[10px] font-extrabold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Advisor & Firm</th>
                                                    <th className="px-6 py-4">Template</th>
                                                    <th className="px-6 py-4">Domain</th>
                                                    <th className="px-6 py-4">Colors</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredRequests.map(req => (
                                                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-[#0B1B3D]">
                                                                {req.advisor?.name || 'Advisor'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {req.firm?.name || 'No Firm'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-bold text-xs bg-blue-50 text-[#0B1B3D] px-2.5 py-1 rounded-lg border border-blue-100">
                                                                {req.template_name || 'template4'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-700">
                                                                <FaGlobe className="w-3 h-3 text-gray-400 shrink-0" />
                                                                {req.domain_name || req.domain}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                                                                    style={{ backgroundColor: req.primary_color || req.color_scheme }}
                                                                    title="Primary"
                                                                />
                                                                <span
                                                                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                                                                    style={{ backgroundColor: req.secondary_color || '#C8102E' }}
                                                                    title="Secondary"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={req.status} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end">
                                                                {renderRequestActions(req)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 grid sm:grid-cols-2 gap-4">
                                        {filteredRequests.map(req => (
                                            <article
                                                key={req.id}
                                                className="border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-[#0B1B3D]/20 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-[#0B1B3D]">
                                                            {req.advisor?.name || 'Advisor'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">{req.firm?.name || 'No Firm'}</p>
                                                    </div>
                                                    <StatusBadge status={req.status} />
                                                </div>

                                                <div className="space-y-2.5 mb-4">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <FaThLarge className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="font-semibold text-gray-700">
                                                            {req.template_name || 'template4'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <FaGlobe className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="font-mono text-gray-700">
                                                            {req.domain_name || req.domain}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <FaPalette className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span
                                                            className="w-4 h-4 rounded-full border shadow-sm"
                                                            style={{ backgroundColor: req.primary_color || req.color_scheme }}
                                                        />
                                                        <span
                                                            className="w-4 h-4 rounded-full border shadow-sm"
                                                            style={{ backgroundColor: req.secondary_color || '#C8102E' }}
                                                        />
                                                    </div>
                                                </div>

                                                {renderRequestActions(req)}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <ModalShell
                    title={editingTemplate ? 'Edit Showcase Template' : 'Register New Template'}
                    subtitle="Configure template details and preview settings"
                    onClose={() => setShowTemplateModal(false)}
                >
                    <form onSubmit={handleSaveTemplate} className="space-y-4">
                        <div>
                            <label className={labelClass}>Display Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Template 5 - Modern Executive Wealth"
                                value={templateName}
                                onChange={e => setTemplateName(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Slug Identifier</label>
                            <input
                                type="text"
                                placeholder="e.g. template5"
                                value={templateSlug}
                                onChange={e => {
                                    const slug = e.target.value
                                    setTemplateSlug(slug)
                                    if (!editingTemplate && !templatePreviewUrl) {
                                        setTemplatePreviewUrl(defaultTemplatePreviewUrl(slug))
                                    }
                                }}
                                className={`${inputClass} font-mono`}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Unique key for React theme routing (e.g. template4, template5).
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea
                                rows={3}
                                placeholder="Describe the layout, sections, and features…"
                                value={templateDesc}
                                onChange={e => setTemplateDesc(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Preview URL</label>
                            <input
                                type="url"
                                placeholder="https://website-template"
                                value={templatePreviewUrl}
                                onChange={e => setTemplatePreviewUrl(e.target.value)}
                                className={inputClass}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                A full-page screenshot is captured from this URL on save. Hover a card to scroll the preview.
                            </p>
                        </div>

                        {editingTemplate && (
                            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={regeneratePreview}
                                    onChange={e => setRegeneratePreview(e.target.checked)}
                                    className="w-4 h-4 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                                />
                                <span className="text-xs font-semibold text-gray-700">
                                    Regenerate preview screenshot from URL
                                </span>
                            </label>
                        )}

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={templateIsActive}
                                onChange={e => setTemplateIsActive(e.target.checked)}
                                className="w-4 h-4 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                            />
                            <span className="text-xs font-semibold text-gray-700">Active for advisor selection</span>
                        </label>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingTemplate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                            >
                                {isSavingTemplate ? (
                                    <>
                                        <FaSync className="w-3 h-3 animate-spin" />
                                        Saving…
                                    </>
                                ) : editingTemplate ? (
                                    'Update Template'
                                ) : (
                                    'Create Template'
                                )}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Section Management Modal */}
            {sectionManageRequest && (
                <ModalShell
                    title="Manage Deployment Sections"
                    subtitle={
                        <>
                            {sectionManageRequest.advisor?.name || 'Advisor'} —{' '}
                            {sectionManageRequest.domain_name || sectionManageRequest.domain}
                            {sectionManageRequest.cpanel_domain && (
                                <>
                                    {' '}
                                    ·{' '}
                                    <a
                                        href={sectionManageRequest.cpanel_domain}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#C8102E] hover:underline"
                                    >
                                        {sectionManageRequest.cpanel_domain}
                                    </a>
                                </>
                            )}
                        </>
                    }
                    onClose={() => setSectionManageRequest(null)}
                    maxWidth="max-w-3xl"
                >
                    <p className="text-xs text-gray-600 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                        Change section labels shown in the dashboard, or hide sections from the live site. Template keys
                        cannot be changed.
                    </p>

                    {isLoadingSections ? (
                        <div className="py-12 text-center">
                            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-4 border-[#C8102E] border-t-transparent animate-spin" />
                            <p className="text-sm text-gray-400">Loading sections…</p>
                        </div>
                    ) : deploymentSections.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">No sections found for this deployment.</div>
                    ) : (
                        <form onSubmit={handleSaveDeploymentSections} className="space-y-3">
                            {deploymentSections.map(section => {
                                const draft = sectionDrafts[section.id] || {}
                                const isHidden = draft.is_visible === false
                                return (
                                    <div
                                        key={section.id}
                                        className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition ${
                                            isHidden
                                                ? 'bg-gray-50 border-gray-200 opacity-80'
                                                : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    {sectionDisplayName(section)}
                                                </span>
                                                {isHidden && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                                                        <FaEyeSlash className="w-2.5 h-2.5" />
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                                    Template Key
                                                </label>
                                                <div className="text-sm p-2 border border-gray-200 rounded-lg bg-slate-50 text-slate-600 font-mono">
                                                    {section.section_key || section.name}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                                    Section Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={section.name}
                                                    value={draft.display_name ?? ''}
                                                    onChange={e =>
                                                        handleSectionDraftChange(section.id, 'display_name', e.target.value)
                                                    }
                                                    className={`${inputClass} font-semibold`}
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer shrink-0 sm:flex-col sm:items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            {draft.is_visible !== false ? (
                                                <FaEye className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <FaEyeSlash className="w-4 h-4 text-gray-400" />
                                            )}
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Visible</span>
                                            <input
                                                type="checkbox"
                                                checked={draft.is_visible !== false}
                                                onChange={e =>
                                                    handleSectionDraftChange(section.id, 'is_visible', e.target.checked)
                                                }
                                                className="w-5 h-5 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                                            />
                                        </label>
                                    </div>
                                )
                            })}

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setSectionManageRequest(null)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingSections}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                                >
                                    {isSavingSections ? (
                                        <>
                                            <FaSync className="w-3 h-3 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        'Save Section Settings'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </ModalShell>
            )}

            {/* Deploy Modal */}
            {selectedRequest && (
                <ModalShell
                    title="Deploy to cPanel"
                    subtitle={
                        <>
                            Domain: <strong>{selectedRequest.domain_name}</strong> · Template:{' '}
                            <strong>{selectedRequest.template_name || 'template4'}</strong>
                        </>
                    }
                    onClose={() => setSelectedRequest(null)}
                    maxWidth="max-w-xl"
                >
                    <form onSubmit={handleDeploySubmit} className="space-y-4">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                            <FaServer className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                Enter the advisor template folder URL where <code className="font-mono">api.php</code>{' '}
                                lives — e.g. <code className="font-mono">https://epatronus.space/template4</code>
                            </span>
                        </div>

                        <div>
                            <label className={labelClass}>Advisor Site URL *</label>
                            <input
                                type="url"
                                required
                                placeholder="https://epatronus.space/template4"
                                value={cpanelDomain}
                                onChange={e => setCpanelDomain(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    <FaDatabase className="inline w-3 h-3 mr-1" />
                                    Database Host
                                </label>
                                <input
                                    type="text"
                                    value={cpanelDbHost}
                                    onChange={e => setCpanelDbHost(e.target.value)}
                                    placeholder="localhost"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Database Name</label>
                                <input
                                    type="text"
                                    value={cpanelDbName}
                                    onChange={e => setCpanelDbName(e.target.value)}
                                    placeholder="cpanel_advisor_db"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Database User</label>
                                <input
                                    type="text"
                                    value={cpanelDbUser}
                                    onChange={e => setCpanelDbUser(e.target.value)}
                                    placeholder="cpanel_user"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Database Password</label>
                                <input
                                    type="password"
                                    value={cpanelDbPass}
                                    onChange={e => setCpanelDbPass(e.target.value)}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>cPanel API Key</label>
                            <input
                                type="text"
                                value={cpanelApiKey}
                                onChange={e => setCpanelApiKey(e.target.value)}
                                placeholder="secret_cpanel_api_token_123"
                                className={`${inputClass} font-mono text-xs`}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">Used for webhook authentication.</p>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isDeploying}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#C8102E] text-white rounded-lg hover:bg-[#A00C23] transition disabled:opacity-50 shadow-md"
                            >
                                {isDeploying ? (
                                    <>
                                        <FaSync className="w-3 h-3 animate-spin" />
                                        Deploying…
                                    </>
                                ) : (
                                    <>
                                        <FaRocket className="w-3 h-3" />
                                        Confirm & Deploy
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </div>
    )
}
