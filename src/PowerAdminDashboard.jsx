import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { sectionDisplayName } from './utils/sectionDisplay'

export default function PowerAdminDashboard() {
    const [requests, setRequests] = useState([])
    const [templates, setTemplates] = useState([])
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Deployment Modal States
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [cpanelDomain, setCpanelDomain] = useState('')
    const [cpanelDbHost, setCpanelDbHost] = useState('localhost')
    const [cpanelDbName, setCpanelDbName] = useState('')
    const [cpanelDbUser, setCpanelDbUser] = useState('')
    const [cpanelDbPass, setCpanelDbPass] = useState('')
    const [cpanelApiKey, setCpanelApiKey] = useState('')
    const [isDeploying, setIsDeploying] = useState(false)

    // Template Catalog Modal States
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [templateName, setTemplateName] = useState('')
    const [templateSlug, setTemplateSlug] = useState('')
    const [templateDesc, setTemplateDesc] = useState('')
    const [templateThumb, setTemplateThumb] = useState('')
    const [templateIsActive, setTemplateIsActive] = useState(true)
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)

    // Deployment Section Management
    const [sectionManageRequest, setSectionManageRequest] = useState(null)
    const [deploymentSections, setDeploymentSections] = useState([])
    const [sectionDrafts, setSectionDrafts] = useState({})
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [isSavingSections, setIsSavingSections] = useState(false)

    const fetchRequests = () => api.get('/template-requests').then(res => setRequests(res.data)).catch(() => {})
    const fetchTemplates = () => api.get('/templates?all=1').then(res => setTemplates(res.data)).catch(() => {})

    useEffect(() => {
        fetchRequests()
        fetchTemplates()
    }, [])

    const openDeployModal = (req) => {
        setSelectedRequest(req)
        setCpanelDomain(req.cpanel_domain || `https://${req.domain_name}`)
        setCpanelDbHost(req.cpanel_db_host || 'localhost')
        setCpanelDbName(req.cpanel_db_name || '')
        setCpanelDbUser(req.cpanel_db_user || '')
        setCpanelDbPass(req.cpanel_db_pass || '')
        setCpanelApiKey(req.cpanel_api_key || '')
    }

    const handleDeploySubmit = async (e) => {
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
            setMessage(`🎉 Template successfully deployed to ${cpanelDomain}!`)
            setSelectedRequest(null)
            fetchRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deploy template.')
        } finally {
            setIsDeploying(false)
        }
    }

    // Template Catalog CRUD Actions
    const openCreateTemplateModal = () => {
        setEditingTemplate(null)
        setTemplateName('')
        setTemplateSlug('')
        setTemplateDesc('')
        setTemplateThumb('')
        setTemplateIsActive(true)
        setShowTemplateModal(true)
    }

    const openEditTemplateModal = (tpl) => {
        setEditingTemplate(tpl)
        setTemplateName(tpl.name || '')
        setTemplateSlug(tpl.slug || '')
        setTemplateDesc(tpl.description || '')
        setTemplateThumb(tpl.thumbnail_url || '')
        setTemplateIsActive(Boolean(tpl.is_active))
        setShowTemplateModal(true)
    }

    const handleSaveTemplate = async (e) => {
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
                thumbnail_url: templateThumb,
                is_active: templateIsActive,
            }

            if (editingTemplate) {
                await api.put(`/templates/${editingTemplate.id}`, payload)
                setMessage(`🎉 Showcase template "${templateName}" updated successfully!`)
            } else {
                await api.post('/templates', payload)
                setMessage(`🎉 New showcase template "${templateName}" created successfully!`)
            }
            setShowTemplateModal(false)
            fetchTemplates()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save template.')
        } finally {
            setIsSavingTemplate(false)
        }
    }

    const handleDeleteTemplate = async (tpl) => {
        if (!window.confirm(`Are you sure you want to delete template "${tpl.name}"?`)) return
        setMessage('')
        setError('')
        try {
            await api.delete(`/templates/${tpl.id}`)
            setMessage(`Deleted template "${tpl.name}".`)
            fetchTemplates()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete template.')
        }
    }

    const openSectionManageModal = async (req) => {
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
            list.forEach((section) => {
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
            [sectionId]: {
                ...prev[sectionId],
                [field]: value,
            },
        }))
    }

    const handleSaveDeploymentSections = async (e) => {
        e.preventDefault()
        if (!sectionManageRequest) return
        setIsSavingSections(true)
        setMessage('')
        setError('')
        try {
            const payload = deploymentSections.map((section) => {
                const draft = sectionDrafts[section.id] || {}
                return {
                    id: section.id,
                    display_name: draft.display_name?.trim() || section.name,
                    is_visible: draft.is_visible !== false,
                }
            })
            await api.put(`/template-requests/${sectionManageRequest.id}/sections`, { sections: payload })
            setMessage(`Section settings saved for ${sectionManageRequest.domain_name || sectionManageRequest.domain}. Hidden sections will no longer appear on the deployed site.`)
            setSectionManageRequest(null)
            setDeploymentSections([])
            setSectionDrafts({})
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save section settings.')
        } finally {
            setIsSavingSections(false)
        }
    }

    const statusBadge = (status) => {
        if (status === 'pending') return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase">⏳ Pending Deployment</span>
        if (status === 'deployed') return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">✅ Deployed</span>
        if (status === 'rejected') return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full uppercase">❌ Rejected</span>
        return null
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Dashboard Title */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Power Admin Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Register new React templates, deploy requested templates to advisor cPanels, and manage database sync.
                        </p>
                    </div>
                    <button
                        onClick={openCreateTemplateModal}
                        className="bg-[#0B1B3D] text-white text-xs font-extrabold px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-md flex items-center gap-2"
                    >
                        ➕ Register New Template
                    </button>
                </div>

                {message && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
                        <span>{message}</span>
                        <button onClick={() => setMessage('')} className="font-bold hover:opacity-75 text-lg">✕</button>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between text-sm font-medium">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="font-bold hover:opacity-75 text-lg">✕</button>
                    </div>
                )}

                {/* Section 1: Template Showcase Catalog */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between border-b pb-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-[#0B1B3D]">🎨 Showcase Templates Catalog</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage templates available for advisors and managers to choose for website deployment.</p>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                            {templates.length} Template(s) Registered
                        </span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition">
                                <div>
                                    <div className="h-36 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                        {tpl.thumbnail_url ? (
                                            <img src={tpl.thumbnail_url} alt={tpl.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-slate-400 font-mono text-xs text-center p-4">
                                                <span>🖼️ No Preview Image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-[#0B1B3D]/90 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md">
                                            {tpl.slug}
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            {tpl.is_active ? (
                                                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
                                            ) : (
                                                <span className="bg-gray-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Disabled</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-extrabold text-[#0B1B3D] text-base">{tpl.name}</h3>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tpl.description || 'No description provided.'}</p>
                                    </div>
                                </div>

                                <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 mt-3">
                                    <button
                                        onClick={() => openEditTemplateModal(tpl)}
                                        className="text-xs font-bold text-[#0B1B3D] hover:underline flex items-center gap-1"
                                    >
                                        ✏️ Edit Template
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTemplate(tpl)}
                                        className="text-xs font-bold text-rose-600 hover:underline"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}

                        {templates.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 text-sm">
                                No showcase templates found. Click "Register New Template" above to add one.
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: Deployment Requests */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-[#0B1B3D]">🚀 Advisor Template Deployment Requests</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Deploy templates to advisor cPanel hosting and configure remote database API sync.</p>
                    </div>

                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Advisor & Firm</th>
                                <th className="px-6 py-4">Selected Template</th>
                                <th className="px-6 py-4">Target Domain</th>
                                <th className="px-6 py-4">Color Palette</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#0B1B3D]">{req.advisor?.name || 'Advisor'}</div>
                                        <div className="text-xs text-gray-500">{req.firm?.name || 'No Firm'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-xs bg-blue-50 text-[#0B1B3D] px-2.5 py-1 rounded border border-blue-200">
                                            {req.template_name || 'template4'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                                        {req.domain_name || req.domain}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: req.primary_color || req.color_scheme }} />
                                            <span className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: req.secondary_color || '#C8102E' }} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{statusBadge(req.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {req.status === 'deployed' && (
                                                <button
                                                    onClick={() => openSectionManageModal(req)}
                                                    className="bg-white border border-[#0B1B3D] text-[#0B1B3D] text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm"
                                                >
                                                    📋 Manage Sections
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openDeployModal(req)}
                                                className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
                                            >
                                                {req.status === 'deployed' ? '⚙️ Update Deployment' : '🚀 Deploy to cPanel'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                                        No template deployment requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Template Register / Edit Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-[#0B1B3D]">
                                {editingTemplate ? '✏️ Edit Showcase Template' : '🎨 Register New Showcase Template'}
                            </h3>
                            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSaveTemplate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Display Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Template 5 - Modern Executive Wealth"
                                    value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Slug Identifier</label>
                                <input
                                    type="text"
                                    placeholder="e.g. template5"
                                    value={templateSlug}
                                    onChange={e => setTemplateSlug(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none font-mono"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">Unique key used in React theme routing (e.g. template4, template5).</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the layout, sections, and features of this showcase template..."
                                    value={templateDesc}
                                    onChange={e => setTemplateDesc(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Thumbnail Preview Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={templateThumb}
                                    onChange={e => setTemplateThumb(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_active_checkbox"
                                    checked={templateIsActive}
                                    onChange={e => setTemplateIsActive(e.target.checked)}
                                    className="w-4 h-4 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                                />
                                <label htmlFor="is_active_checkbox" className="text-xs font-bold text-gray-700 cursor-pointer">
                                    Active for Advisor Selection
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingTemplate}
                                    className="px-5 py-2 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                                >
                                    {isSavingTemplate ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deployment Section Management Modal */}
            {sectionManageRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#0B1B3D]">📋 Manage Deployment Sections</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {sectionManageRequest.advisor?.name || 'Advisor'} — {sectionManageRequest.domain_name || sectionManageRequest.domain}
                                    {sectionManageRequest.cpanel_domain && (
                                        <> · <a href={sectionManageRequest.cpanel_domain} target="_blank" rel="noopener noreferrer" className="text-[#C8102E] hover:underline">{sectionManageRequest.cpanel_domain}</a></>
                                    )}
                                </p>
                            </div>
                            <button onClick={() => setSectionManageRequest(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                        </div>

                        <p className="text-xs text-gray-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            Change the section label shown in the dashboard, or hide sections from the live deployed site. The template key (used internally) cannot be changed.
                        </p>

                        {isLoadingSections ? (
                            <div className="py-12 text-center text-gray-400 text-sm">Loading sections…</div>
                        ) : deploymentSections.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 text-sm">No sections found for this deployment.</div>
                        ) : (
                            <form onSubmit={handleSaveDeploymentSections} className="space-y-3">
                                {deploymentSections.map((section) => {
                                    const draft = sectionDrafts[section.id] || {}
                                    return (
                                        <div
                                            key={section.id}
                                            className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${draft.is_visible === false ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'}`}
                                        >
                                            <div className="flex-1 space-y-2 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                        {sectionDisplayName(section)}
                                                    </span>
                                                    {draft.is_visible === false && (
                                                        <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">Hidden on site</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Template Key (fixed)</label>
                                                    <div className="w-full text-sm p-2 border rounded-lg bg-slate-50 text-slate-600 font-mono">
                                                        {section.section_key || section.name}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder={section.name}
                                                        value={draft.display_name ?? ''}
                                                        onChange={e => handleSectionDraftChange(section.id, 'display_name', e.target.value)}
                                                        className="w-full text-sm p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E] font-semibold"
                                                    />
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer shrink-0 sm:flex-col sm:items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">Visible on site</span>
                                                <input
                                                    type="checkbox"
                                                    checked={draft.is_visible !== false}
                                                    onChange={e => handleSectionDraftChange(section.id, 'is_visible', e.target.checked)}
                                                    className="w-5 h-5 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                                                />
                                            </label>
                                        </div>
                                    )
                                })}

                                <div className="pt-3 flex items-center justify-end gap-3 border-t sticky bottom-0 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setSectionManageRequest(null)}
                                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingSections}
                                        className="px-5 py-2 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                                    >
                                        {isSavingSections ? 'Saving & Syncing…' : 'Save Section Settings'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Deploy Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#0B1B3D]">🚀 Deploy Template to Advisor cPanel</h3>
                                <p className="text-xs text-gray-500">Domain: <strong>{selectedRequest.domain_name}</strong> | Template: <strong>{selectedRequest.template_name || 'template4'}</strong></p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                        </div>

                        <form onSubmit={handleDeploySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Advisor site URL (where template4/api.php lives) *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://epatronus.space/template4"
                                    value={cpanelDomain}
                                    onChange={e => setCpanelDomain(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">Use the advisor template folder, e.g. https://epatronus.space/template4 — not the central hub.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Database Host</label>
                                    <input
                                        type="text"
                                        value={cpanelDbHost}
                                        onChange={e => setCpanelDbHost(e.target.value)}
                                        placeholder="localhost"
                                        className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Database Name</label>
                                    <input
                                        type="text"
                                        value={cpanelDbName}
                                        onChange={e => setCpanelDbName(e.target.value)}
                                        placeholder="cpanel_advisor_db"
                                        className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Database User</label>
                                    <input
                                        type="text"
                                        value={cpanelDbUser}
                                        onChange={e => setCpanelDbUser(e.target.value)}
                                        placeholder="cpanel_user"
                                        className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Database Password</label>
                                    <input
                                        type="password"
                                        value={cpanelDbPass}
                                        onChange={e => setCpanelDbPass(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full text-sm p-2.5 border rounded-lg outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">cPanel Secret API Key (for webhooks)</label>
                                <input
                                    type="text"
                                    value={cpanelApiKey}
                                    onChange={e => setCpanelApiKey(e.target.value)}
                                    placeholder="secret_cpanel_api_token_123"
                                    className="w-full text-sm p-2.5 border rounded-lg outline-none font-mono text-xs"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequest(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeploying}
                                    className="px-5 py-2 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                                >
                                    {isDeploying ? 'Deploying...' : 'Confirm & Deploy Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
