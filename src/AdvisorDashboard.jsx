import { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import SectionIframePreview from './SectionIframePreview'

const API_BASE = String(api.defaults.baseURL || '').replace(/\/$/, '')

function isUploadedAsset(url) {
  return typeof url === 'string' && (
    url.startsWith('/uploaded-images') ||
    url.includes('/uploaded-images/') ||
    url.startsWith('/uploads') ||
    url.includes('/uploads/')
  )
}

function absoluteAssetUrl(url) {
  if (!url) return ''
  if (/^(data:|blob:)/i.test(url)) return url
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url) && isUploadedAsset(url)) {
    const name = url.split('/').pop()
    return `${API_BASE}/uploaded-images/${name}`
  }
  if (/^(https?:)/i.test(url)) return url
  if (url.startsWith('/uploaded-images') || url.includes('/uploaded-images/')) {
    const name = url.split('/').pop()
    return `${API_BASE}/uploaded-images/${name}`
  }
  if (url.startsWith('/uploads') || url.includes('/uploads/')) {
    const name = url.split('/').pop()
    return `${API_BASE}/uploaded-images/${name}`
  }
  return url
}

const LOCAL_TEMPLATE_IMAGES = [
  { label: 'banner1', value: 'banner1' },
  { label: 'bg-slider-01', value: 'bg-slider-01' },
  { label: 'bg-slider2', value: 'bg-slider2' },
  { label: 'bg-slider3', value: 'bg-slider3' },
  { label: 'business-01-368x290', value: 'business-01-368x290' },
  { label: 'business-02-368x290', value: 'business-02-368x290' },
  { label: 'business-03-368x290', value: 'business-03-368x290' },
  { label: 'gallery-1', value: 'gallery-1' },
  { label: 'gallery-2', value: 'gallery-2' },
  { label: 'gallery-3', value: 'gallery-3' },
  { label: 'gallery-4', value: 'gallery-4' },
  { label: 'gallery-5', value: 'gallery-5' },
  { label: 'gallery-6', value: 'gallery-6' },
  { label: 'intime-01', value: 'intime-01' },
  { label: 'intime-02', value: 'intime-02' },
  { label: 'intime-03', value: 'intime-03' },
  { label: 'intime-04', value: 'intime-04' },
  { label: 'intime-05', value: 'intime-05' },
  { label: 'intime-06', value: 'intime-06' },
  { label: 'intime-07', value: 'intime-07' },
  { label: 'intime-08', value: 'intime-08' },
  { label: 'intime-09', value: 'intime-09' },
  { label: 'intime-10', value: 'intime-10' },
  { label: 'intime-11', value: 'intime-11' },
  { label: 'intime-12', value: 'intime-12' },
  { label: 'intime-14', value: 'intime-14' },
  { label: 'intime-15', value: 'intime-15' },
  { label: 'intime-17', value: 'intime-17' },
  { label: 'logo-dark', value: 'logo-dark' },
  { label: 'logo-light', value: 'logo-light' },
  { label: 'logo-mobile', value: 'logo-mobile' },
  { label: 'maps-point', value: 'maps-point' },
  { label: 'placeholder', value: 'placeholder' },
  { label: 'team-01', value: 'team-01' },
  { label: 'team-02', value: 'team-02' },
  { label: 'team-03', value: 'team-03' },
  { label: 'team-04', value: 'team-04' },
  { label: 'team-05', value: 'team-05' },
  { label: 'team-06', value: 'team-06' },
  { label: 'team-07', value: 'team-07' },
  { label: 'team-08', value: 'team-08' },
  { label: 'team-09', value: 'team-09' },
  { label: 'team-10', value: 'team-10' },
  { label: 'team-11', value: 'team-11' },
  { label: 'team-12', value: 'team-12' },
  { label: 'testimonial-01', value: 'testimonial-01' },
  { label: 'testimonial-02', value: 'testimonial-02' },
  { label: 'testimonial-03', value: 'testimonial-03' },
  { label: 'testimonial-04', value: 'testimonial-04' },
]

const PNG_STEMS = new Set(['logo-dark', 'logo-light', 'logo-mobile', 'maps-point', 'placeholder'])

LOCAL_TEMPLATE_IMAGES.forEach((item) => {
  item.file = `${item.value}.${PNG_STEMS.has(item.value) ? 'png' : 'jpg'}`
})

function imageStem(path) {
  if (!path || typeof path !== 'string') return ''
  return path.split('/').pop().split('?')[0].replace(/\.[a-zA-Z0-9]+$/, '')
}

function selectedLocalValue(path, catalog) {
  const stem = imageStem(path)
  return (catalog || []).some((p) => p.value === stem) ? stem : ''
}

function storedUploadPath(data) {
  const path = data?.relative_url || data?.url || ''
  if (!path || /^data:/i.test(path)) return ''
  const name = String(path).split('/').pop().split('?')[0]
  if (!name) return ''
  if (path.includes('/uploaded-images') || path.includes('/uploads/')) {
    return `/uploaded-images/${name}`
  }
  return path.startsWith('/') ? path : `/uploaded-images/${name}`
}

function localThumbSrc(path, catalog) {
  const stem = imageStem(path)
  const hit = (catalog || []).find((p) => p.value === stem)
  if (!hit) return ''
  const file = hit.file || `${stem}.jpg`
  const base = import.meta.env.BASE_URL || '/'
  return `${base}assets/intime/${file}`.replace(/([^:]\/)\/+/g, '$1')
}

function editorPreviewSrc(slideImage, catalog) {
  if (!slideImage) return ''
  if (/^(data:|blob:)/i.test(slideImage) || isUploadedAsset(slideImage) || /^https?:/i.test(slideImage)) {
    return absoluteAssetUrl(slideImage)
  }
  return localThumbSrc(slideImage, catalog)
}

function stripDataImageUrls(value) {
  if (typeof value === 'string') {
    return /^data:/i.test(value) ? '' : value
  }
  if (Array.isArray(value)) return value.map(stripDataImageUrls)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, stripDataImageUrls(nested)]))
  }
  return value
}

function sanitizeSectionContent(content) {
  if (!content || typeof content !== 'object') return content || {}
  const { preview_slide, ...rest } = content
  return stripDataImageUrls(rest)
}

function displayImagePath(url) {
  if (!url || /^data:/i.test(url)) return ''
  return url
}

export function parseJson(str) {
  if (!str) return {}
  if (typeof str === 'object') return str
  try { return JSON.parse(str) } catch { return { heading: str } }
}

function isWhatWeDoSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'whatwedo' || key === 'featurescarousel' || key === 'features'
}

function isAboutSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'aboutsection' || key === 'about' || key === 'aboutus'
}

function defaultAboutGauges() {
  return [
    { value: '50%', label: 'Business strategy growth' },
    { value: '75%', label: 'Finance valuable ideas' },
  ]
}

function normalizeAboutEditorContent(content) {
  const c = content && typeof content === 'object' ? { ...content } : {}
  const defaults = defaultAboutGauges()
  const list = Array.isArray(c.gauges) && c.gauges.length
    ? c.gauges
    : (Array.isArray(c.stats) ? c.stats : [])
  c.gauges = defaults.map((fallback, i) => ({
    ...fallback,
    ...(list[i] || {}),
  }))
  if (!c.eyebrow) c.eyebrow = 'ABOUT US'
  if (!c.experience_years) c.experience_years = c.years || '10+'
  if (!c.experience_label) c.experience_label = 'Years of Experience'
  if (!c.image_url) c.image_url = c.image || c.img || ''
  return c
}

export default function AdvisorDashboard() {
  const { user } = useAuth()
  const [pages, setPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [sections, setSections] = useState([])
  const [checkedSectionIds, setCheckedSectionIds] = useState([])
  const [sectionEdits, setSectionEdits] = useState({})
  const [previewTab, setPreviewTab] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Template Request States
  const [templateRequests, setTemplateRequests] = useState([])
  const [availableTemplates, setAvailableTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplateName, setSelectedTemplateName] = useState('template4')
  const [domainName, setDomainName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#0B1B3D')
  const [secondaryColor, setSecondaryColor] = useState('#C8102E')
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false)
  const [uploadingState, setUploadingState] = useState({})
  const [localPreviewUrls, setLocalPreviewUrls] = useState({})
  const [localImages, setLocalImages] = useState(LOCAL_TEMPLATE_IMAGES)
  const [previewSlide, setPreviewSlide] = useState({})

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}assets/intime/index.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((list) => {
        if (Array.isArray(list) && list.length) setLocalImages(list)
      })
      .catch(() => {})
  }, [])

  const setLocalPreview = (key, file) => {
    setLocalPreviewUrls((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key])
      return { ...prev, [key]: URL.createObjectURL(file) }
    })
  }

  const handleSlideImageUpload = async (secId, slideIndex, file) => {
    if (!file) return
    const uploadKey = `${secId}-${slideIndex}`
    setPreviewSlide((prev) => ({ ...prev, [secId]: slideIndex }))
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const currentSlides = prev[secId]?.slides || [{}, {}, {}]
          const updatedSlides = [...currentSlides]
          updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bg: uploadedUrl, image_url: uploadedUrl, id: slideIndex + 1 }
          return { ...prev, [secId]: { ...(prev[secId] || {}), slides: updatedSlides } }
        })
        setMessage(`📸 Image uploaded successfully for Slide ${slideIndex + 1}!`)
      } else {
        setError('Upload succeeded but no image path was returned.')
      }
    } catch (err) {
      const fieldError = err.response?.data?.errors?.image?.[0]
      setError(fieldError || err.response?.data?.message || 'Failed to upload image.')
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }

  const handleBoxImageUpload = async (secId, boxIndex, file) => {
    if (!file) return
    const uploadKey = `box-${secId}-${boxIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const currentBoxes = prev[secId]?.boxes || prev[secId]?.items || [{}, {}, {}]
          const updatedBoxes = [0, 1, 2].map((i) => ({ ...(currentBoxes[i] || {}) }))
          updatedBoxes[boxIndex] = { ...updatedBoxes[boxIndex], image_url: uploadedUrl }
          return { ...prev, [secId]: { ...(prev[secId] || {}), boxes: updatedBoxes } }
        })
        setMessage(`📸 Image uploaded successfully for Box ${boxIndex + 1}!`)
      } else {
        setError('Upload succeeded but no image path was returned.')
      }
    } catch (err) {
      const fieldError = err.response?.data?.errors?.image?.[0]
      setError(fieldError || err.response?.data?.message || 'Failed to upload image.')
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }

  const handleAboutImageUpload = async (secId, file) => {
    if (!file) return
    const uploadKey = `about-${secId}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => ({
          ...prev,
          [secId]: { ...(prev[secId] || {}), image_url: uploadedUrl },
        }))
        setMessage('📸 About image uploaded successfully!')
      } else {
        setError('Upload succeeded but no image path was returned.')
      }
    } catch (err) {
      const fieldError = err.response?.data?.errors?.image?.[0]
      setError(fieldError || err.response?.data?.message || 'Failed to upload image.')
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }

  const fetchTemplateRequests = () => {
    api.get('/template-requests')
      .then(res => setTemplateRequests(res.data))
      .catch(() => {})
  }

  const fetchAvailableTemplates = () => {
    api.get('/templates')
      .then(res => {
        setAvailableTemplates(res.data)
        if (res.data.length > 0 && !selectedTemplateName) {
          setSelectedTemplateName(res.data[0].slug)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchTemplateRequests()
    fetchAvailableTemplates()
  }, [])

  const applyPages = (data) => {
    const list = Array.isArray(data) ? data : (data?.pages || [])
    setPages(list)
    if (list.length > 0) {
      handlePageSelect(list[0].id)
    } else {
      setSelectedPageId('')
      setSections([])
    }
  }

  // Fetch pages for the deployed template. Fall back to all/public pages so
  // the dropdown is not empty if the template filter fails.
  useEffect(() => {
    const deployedRequest = templateRequests.find(r => r.status === 'deployed')
    if (!deployedRequest) {
      setPages([])
      setSelectedPageId('')
      setSections([])
      return
    }

    const loadPages = async () => {
      const templateName = deployedRequest.template_name
      try {
        const res = await api.get('/pages', {
          params: templateName ? { template: templateName } : {},
        })
        const list = Array.isArray(res.data) ? res.data : (res.data?.pages || [])
        if (list.length > 0) {
          applyPages(list)
          return
        }
      } catch (_) {
        // Authenticated /pages can 500 if a stale backend still queries pages.advisor_id
      }

      try {
        const fallback = await api.get('/public/pages')
        applyPages(fallback.data)
      } catch (_) {
        setPages([])
        setSelectedPageId('')
        setSections([])
        setError('Could not load pages for the editor.')
      }
    }

    loadPages()
  }, [templateRequests])

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    if (!domainName) return
    setIsSubmittingTemplate(true)
    setError('')
    try {
      await api.post('/template-requests', {
        template_name: selectedTemplateName,
        domain_name: domainName,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        request_type: 'advisor_website'
      })
      setMessage('🎉 Template deployment request submitted! Power admin will manually deploy it to your cPanel.')
      setShowTemplateModal(false)
      setDomainName('')
      setLogoUrl('')
      fetchTemplateRequests()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit template request.')
    } finally {
      setIsSubmittingTemplate(false)
    }
  }

  const fetchAdvisorSections = async (pageId) => {
    const res = await api.get(`/pages/${pageId}/sections`, {
      params: user?.id ? { advisor_id: user.id } : {},
    })
    const list = Array.isArray(res.data) ? res.data : []
    if (!user?.id) return list
    return list.filter(s => String(s.advisor_id) === String(user.id))
  }

  const handlePageSelect = async (pageId) => {
    setSelectedPageId(pageId)
    setCheckedSectionIds([])
    setSectionEdits({})
    setMessage('')
    setError('')

    if (!pageId) {
      setSections([])
      return
    }

    const sectionsForAdvisor = await fetchAdvisorSections(pageId)
    setSections(sectionsForAdvisor)

    const lockedByMeIds = sectionsForAdvisor
      .filter(s => s.is_locked && s.locked_by === user?.id)
      .map(s => s.id)

    setCheckedSectionIds(lockedByMeIds)

    const initialEdits = {}
    sectionsForAdvisor.forEach(s => {
      if (lockedByMeIds.includes(s.id)) {
        const parsed = parseJson(s.content)
        initialEdits[s.id] = isAboutSection(s.name) ? normalizeAboutEditorContent(parsed) : parsed
      }
    })
    setSectionEdits(initialEdits)
  }

  const handleSectionCheckboxChange = async (section, isChecked) => {
    setMessage('')
    setError('')

    if (!isChecked) {
      setError(`Cannot unlock section "${section.name}". Sections remain locked until submitted or reviewed by an approver.`)
      return
    }

    if (section.is_locked && section.locked_by !== user?.id) {
      setError(`Section "${section.name}" is locked by ${section.locked_by_user?.name || 'another advisor'}.`)
      return
    }

    try {
      const lockRes = await api.post(`/sections/${section.id}/lock`)
      if (lockRes.data?.section) {
        setSections(prev => prev.map(s => s.id === section.id ? lockRes.data.section : s))
      }

      setCheckedSectionIds(prev => [...new Set([...prev, section.id])])
      const parsed = parseJson(section.content)
      setSectionEdits(prev => ({
        ...prev,
        [section.id]: isAboutSection(section.name) ? normalizeAboutEditorContent(parsed) : parsed
      }))
      setMessage(`🔒 Section "${section.name}" locked for you. You can now edit its content.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not lock section.')
    }
  }

  const handleFieldValueChange = (sectionId, fieldKey, value) => {
    setSectionEdits(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldKey]: value
      }
    }))
  }

  const patchBox = (secId, boxIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.boxes || prev[secId]?.items || [{}, {}, {}]
      const boxes = [0, 1, 2].map((i) => ({ ...(source[i] || {}) }))
      boxes[boxIndex] = { ...boxes[boxIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), boxes } }
    })
  }

  const patchGauge = (secId, index, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.gauges || defaultAboutGauges()
      const gauges = [0, 1].map((i) => ({ ...(source[i] || {}) }))
      gauges[index] = { ...gauges[index], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), gauges } }
    })
  }

  const handleBatchSubmit = async () => {
    if (checkedSectionIds.length === 0) {
      setError('Please select at least one section to edit and submit.')
      return
    }

    if (Object.values(uploadingState).some(Boolean)) {
      setError('Please wait for the image upload to finish before submitting.')
      return
    }

    setMessage('')
    setError('')
    setIsSubmitting(true)

    const batchPayload = checkedSectionIds.map(secId => ({
      section_id: secId,
      proposed_content: JSON.stringify(sanitizeSectionContent(sectionEdits[secId] || {}), null, 2)
    }))

    try {
      await api.post('/change-requests', { section_edits: batchPayload })
      setMessage(`🎉 Successfully submitted a single request containing edits for ${checkedSectionIds.length} section(s).`)

      if (selectedPageId) {
        const refreshed = await fetchAdvisorSections(selectedPageId)
        setSections(refreshed)
      }
      setCheckedSectionIds([])
      setSectionEdits({})
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit change request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPage = pages.find(p => p.id === Number(selectedPageId))

  // Find deployment statuses
  const deployedRequest = templateRequests.find(r => r.status === 'deployed')
  const pendingRequest = templateRequests.find(r => r.status === 'pending')
  const rejectedRequest = templateRequests.find(r => r.status === 'rejected')
  const isSiteDeployed = Boolean(deployedRequest)

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B1B3D]">Advisor Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Select showcase template, request cPanel deployment, lock sections, edit content, and submit change requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm flex items-center gap-2"
            >
              🎨 Request Template Deployment
            </button>
            {user && (
              <div className="bg-white border rounded-lg px-4 py-2 text-right shadow-sm">
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Logged in as</span>
                <span className="text-sm font-bold text-[#C8102E]">{user.name} ({user.role})</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Notifications */}
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

        {/* Step 1: Template Deployment Status & Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                1. cPanel Template Deployment Status
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Each advisor site must be requested and deployed to cPanel before section editing is enabled.
              </p>
            </div>
            {isSiteDeployed && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                ✅ Site Active & Deployed
              </span>
            )}
            {!isSiteDeployed && pendingRequest && (
              <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                ⏳ Deployment Pending
              </span>
            )}
            {!isSiteDeployed && !pendingRequest && (
              <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                ⚠️ Template Not Deployed
              </span>
            )}
          </div>

          {/* Active Deployed State */}
          {isSiteDeployed && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-emerald-950 text-base flex items-center gap-2">
                    <span>🌐 {deployedRequest.domain_name}</span>
                    <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      {deployedRequest.template_name || 'template4'}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    cPanel Target Domain: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-semibold">{deployedRequest.cpanel_domain || deployedRequest.domain_name}</code>
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-emerald-800 font-bold">Theme Colors:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: deployedRequest.primary_color }} title="Primary Color"></span>
                      <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: deployedRequest.secondary_color }} title="Secondary Color"></span>
                    </div>
                    {deployedRequest.logo_url && (
                      <span className="text-xs bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-medium">
                        🖼️ Logo Attached
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1.5 rounded-lg shadow-sm inline-block">
                    ⚡ Live Content Sync Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pending Deployment State */}
          {!isSiteDeployed && pendingRequest && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                    <span>⏳ Deployment Request Submitted</span>
                    <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded uppercase">
                      Pending Power Admin
                    </span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    Requested Domain: <strong>{pendingRequest.domain_name}</strong> | Template: <strong>{pendingRequest.template_name || 'template4'}</strong>
                  </p>
                  <p className="text-xs text-amber-700 mt-2 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200">
                    💡 Power Admin will review your request and manually deploy the template to your cPanel environment. Once completed, your page and section editor below will unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejected State */}
          {!isSiteDeployed && !pendingRequest && rejectedRequest && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mb-4">
              <h3 className="font-bold text-rose-900 text-sm">❌ Previous Template Request Rejected</h3>
              <p className="text-xs text-rose-700 mt-1">Reason: {rejectedRequest.rejection_reason}</p>
            </div>
          )}

          {/* Setup / Request Form Card if No Deployed Site */}
          {!isSiteDeployed && !pendingRequest && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-[#0B1B3D] mb-1">
                  🎨 Choose a Showcase Template & Request Deployment
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select from available React templates, customize your domain and color palette, and submit a deployment request.
                </p>

                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  {/* Dynamic Template Selection Grid */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Showcase Template *</label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {availableTemplates.map(tpl => {
                        const isSelected = selectedTemplateName === tpl.slug
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedTemplateName(tpl.slug)}
                            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50/70 border-[#0B1B3D] ring-2 ring-[#0B1B3D]/20 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-sm text-[#0B1B3D]">{tpl.name}</span>
                                {isSelected && (
                                  <span className="text-[10px] bg-[#0B1B3D] text-white font-bold px-2 py-0.5 rounded uppercase">Selected</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{tpl.description || 'Showcase template layout'}</p>
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-gray-400">slug: {tpl.slug}</div>
                          </div>
                        )
                      })}
                      {availableTemplates.length === 0 && (
                        <div className="p-4 border border-[#0B1B3D] bg-blue-50/40 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-sm text-[#0B1B3D]">Template 4 - Corporate Financial Advisory</div>
                            <div className="text-xs text-gray-600 mt-0.5">Corporate React showcase template for advisors.</div>
                          </div>
                          <span className="text-xs bg-[#0B1B3D] text-white font-bold px-3 py-1 rounded">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Domain Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. advisor.myfirm.com"
                        value={domainName}
                        onChange={e => setDomainName(e.target.value)}
                        className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Logo URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://myfirm.com/logo.png"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-full text-xs p-2 border rounded font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={e => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={e => setSecondaryColor(e.target.value)}
                          className="w-full text-xs p-2 border rounded font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingTemplate}
                      className="bg-[#0B1B3D] text-white text-xs font-extrabold px-6 py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                    >
                      {isSubmittingTemplate ? 'Submitting Request...' : '🚀 Submit Deployment Request to Power Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Page Selection & Section Editing (Gated by Template Deployment) */}
        {!isSiteDeployed ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-lg font-bold text-[#0B1B3D]">Page & Section Content Editor Locked</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
              Before you can lock sections and edit content, your template deployment request must be submitted and manually deployed to cPanel by Power Admin.
            </p>
            {pendingRequest ? (
              <div className="mt-4 inline-block bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-4 py-2 rounded-lg">
                ⏳ Deployment pending with Power Admin. Check back shortly!
              </div>
            ) : (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-4 bg-[#0B1B3D] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm"
              >
                👆 Request Template Deployment Above
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                2. Select Page
              </label>
              <select
                value={selectedPageId}
                onChange={(e) => handlePageSelect(e.target.value)}
                className="w-full md:w-96 text-sm font-semibold p-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C8102E] outline-none transition"
              >
                <option value="">-- Choose a Page --</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title} ({page.slug})
                  </option>
                ))}
              </select>
            </div>

            {selectedPage && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        3. Select Sections to Edit & Lock ({selectedPage.title})
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">Checking a checkbox locks that section instantly.</p>
                    </div>
                    {checkedSectionIds.length > 0 && (
                      <span className="text-xs bg-red-100 text-[#C8102E] font-bold px-3 py-1 rounded-full">
                        {checkedSectionIds.length} Section(s) Selected & Locked
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map(section => {
                      const isChecked = checkedSectionIds.includes(section.id)
                      const isLockedByMe = section.is_locked && section.locked_by === user?.id
                      const isLockedByOther = section.is_locked && section.locked_by !== user?.id

                      return (
                        <label
                          key={section.id}
                          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${isLockedByOther
                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-75'
                            : isChecked || isLockedByMe
                              ? 'bg-red-50/40 border-[#C8102E] ring-2 ring-[#C8102E]/20 cursor-default'
                              : 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked || isLockedByMe}
                            disabled={isLockedByOther || isChecked || isLockedByMe}
                            onChange={(e) => handleSectionCheckboxChange(section, e.target.checked)}
                            className="w-5 h-5 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E] mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-[#0B1B3D] text-sm flex items-center justify-between">
                              <span>{section.name}</span>
                              {isLockedByOther && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                                  🔒 Locked by {section.locked_by_user?.name || 'Other'}
                                </span>
                              )}
                              {(isChecked || isLockedByMe) && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                                  🔒 Locked by You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {isLockedByOther
                                ? 'Locked by another advisor'
                                : isChecked || isLockedByMe
                                  ? 'Locked & active in editor below'
                                  : 'Click checkbox to lock & edit'}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {checkedSectionIds.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-[#0B1B3D] text-white px-6 py-4 rounded-xl shadow-sm">
                      <div>
                        <h2 className="text-lg font-bold">4. Edit Selected Sections & Submit</h2>
                        <p className="text-xs text-gray-300 mt-0.5">All edits will be submitted together as one single request.</p>
                      </div>
                      <button
                        onClick={handleBatchSubmit}
                        disabled={isSubmitting}
                        className="bg-[#C8102E] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 shadow-md transition disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : '🚀 Submit All Changes'}
                      </button>
                    </div>

                    {checkedSectionIds.map(secId => {
                      const section = sections.find(s => s.id === secId)
                      if (!section) return null
                      const values = sectionEdits[secId] || {}
                      const isPreview = previewTab[secId]

                      return (
                        <div key={secId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-[#C8102E]"></span>
                              <h3 className="text-base font-bold text-[#0B1B3D]">Editing: {section.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 bg-white border p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setPreviewTab(prev => ({ ...prev, [secId]: false }))}
                                className={`text-xs font-bold px-3 py-1 rounded transition ${!isPreview ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
                              >
                                Form Fields
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewTab(prev => ({ ...prev, [secId]: true }))}
                                className={`text-xs font-bold px-3 py-1 rounded transition ${isPreview ? 'bg-[#0B1B3D] text-white' : 'text-gray-600'}`}
                              >
                                Preview
                              </button>
                            </div>
                          </div>

                          {!isPreview ? (
                            <div className="p-6">
                              {section.name === 'Hero Slider' ? (
                                // Hero Slider - 3 Slides Editor
                                <div className="space-y-8">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h4 className="text-sm font-bold text-blue-900 mb-2">Hero Slider - 3 Slides</h4>
                                    <p className="text-xs text-blue-700">Configure each slide with its own background image, heading, text, and buttons.</p>
                                  </div>
                                  
                                  {[0, 1, 2].map((slideIndex) => {
                                    const slide = (values.slides && Array.isArray(values.slides) && values.slides[slideIndex]) || {};
                                    const slideImage = slide.bg || slide.image_url || '';
                                    return (
                                      <div key={slideIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{slideIndex + 1}</span>
                                          Slide {slideIndex + 1}
                                        </h5>
                                        
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <label className="block text-xs font-extrabold text-[#0B1B3D]">
                                                Background Image for Slide {slideIndex + 1}
                                              </label>
                                              {displayImagePath(slideImage) && (
                                                <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full truncate max-w-xs">
                                                  {selectedLocalValue(slideImage, localImages) || displayImagePath(slideImage)}
                                                </span>
                                              )}
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3">
                                              {/* 1. Upload Custom Image */}
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                  📁 Upload Custom Image File
                                                </label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`${secId}-${slideIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleSlideImageUpload(secId, slideIndex, e.target.files[0]);
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`${secId}-${slideIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`${secId}-${slideIndex}`] || editorPreviewSrc(displayImagePath(slideImage), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`${secId}-${slideIndex}`] || editorPreviewSrc(displayImagePath(slideImage), localImages)}
                                                    alt={`Slide ${slideIndex + 1} preview`}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>

                                              {/* 2. Select Local Template Image */}
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                  🎨 Or Select Local Template Image
                                                </label>
                                                <select
                                                  value={selectedLocalValue(slideImage, localImages)}
                                                  onChange={(e) => {
                                                    const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                    updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bg: e.target.value, image_url: e.target.value, id: slideIndex + 1 };
                                                    handleFieldValueChange(secId, 'slides', updatedSlides);
                                                    setPreviewSlide((prev) => ({ ...prev, [secId]: slideIndex }));
                                                  }}
                                                  className="w-full text-xs p-1.5 border rounded bg-white outline-none focus:ring-1 focus:ring-[#C8102E]"
                                                >
                                                  <option value="">-- Choose Local Template Image --</option>
                                                  {localImages.map(preset => (
                                                    <option key={preset.file || preset.value} value={preset.value}>{preset.label}</option>
                                                  ))}
                                                </select>
                                                {localThumbSrc(slideImage, localImages) && (
                                                  <img
                                                    src={localThumbSrc(slideImage, localImages)}
                                                    alt={imageStem(slideImage)}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                            </div>

                                            {/* 3. Direct Image URL / Path Input */}
                                            <div>
                                              <label className="block text-[11px] text-gray-500 mb-1 font-semibold">
                                                🔗 Image URL / Relative Path
                                              </label>
                                              <input
                                                type="text"
                                                value={displayImagePath(slideImage)}
                                                onChange={(e) => {
                                                  const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                  updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bg: e.target.value, image_url: e.target.value, id: slideIndex + 1 };
                                                  handleFieldValueChange(secId, 'slides', updatedSlides);
                                                }}
                                                placeholder="e.g. intime-08 or /uploads/170000_image.jpg"
                                                className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                              />
                                            </div>
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Eyebrow / Tagline</label>
                                            <input
                                              type="text"
                                              value={slide.eyebrow || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], eyebrow: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="e.g. FINANCIAL CENTRE & WEALTH MANAGEMENT"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading / Title</label>
                                            <input
                                              type="text"
                                              value={slide.heading || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], heading: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="e.g. Strategic Advisory for Long-Term Growth"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Subheading</label>
                                            <textarea
                                              rows={2}
                                              value={slide.subheading || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], subheading: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="Summary or tagline..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Body Text</label>
                                            <textarea
                                              rows={2}
                                              value={slide.text || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], text: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="Full slide text..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button Text</label>
                                            <input
                                              type="text"
                                              value={slide.button_text || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], button_text: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="GET IN TOUCH"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button Link</label>
                                            <input
                                              type="text"
                                              value={slide.button_url || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], button_url: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="#appointment"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">YouTube URL</label>
                                            <input
                                              type="text"
                                              value={slide.youtube_url || ''}
                                              onChange={(e) => {
                                                const updatedSlides = [...(values.slides || [{}, {}, {}])];
                                                updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], youtube_url: e.target.value, id: slideIndex + 1 };
                                                handleFieldValueChange(secId, 'slides', updatedSlides);
                                              }}
                                              placeholder="https://www.youtube.com/watch?v=..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : isWhatWeDoSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">What we do</h4>
                                    <p className="text-xs text-gray-600">Edit the red subheading, main heading, intro text, and the three service boxes.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || values.eyebrow || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="WHAT WE DO"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none text-[#C8102E] font-bold tracking-wider uppercase"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Main Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="We are the best agency to improve your deals."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="Section introduction..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2].map((boxIndex) => {
                                    const box = (values.boxes && values.boxes[boxIndex]) || (values.items && values.items[boxIndex]) || {}
                                    const boxImage = box.image_url || box.img || box.image || ''
                                    return (
                                      <div key={boxIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{boxIndex + 1}</span>
                                          Box {boxIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Box Image</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`box-${secId}-${boxIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleBoxImageUpload(secId, boxIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`box-${secId}-${boxIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`box-${secId}-${boxIndex}`] || editorPreviewSrc(displayImagePath(boxImage), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`box-${secId}-${boxIndex}`] || editorPreviewSrc(displayImagePath(boxImage), localImages)}
                                                    alt={`Box ${boxIndex + 1} preview`}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(boxImage, localImages)}
                                                  onChange={(e) => patchBox(secId, boxIndex, { image_url: e.target.value })}
                                                  className="w-full text-xs p-1.5 border rounded bg-white outline-none focus:ring-1 focus:ring-[#C8102E]"
                                                >
                                                  <option value="">-- Choose Local Template Image --</option>
                                                  {localImages.map(preset => (
                                                    <option key={preset.file || preset.value} value={preset.value}>{preset.label}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                            <input
                                              type="text"
                                              value={displayImagePath(boxImage)}
                                              onChange={(e) => patchBox(secId, boxIndex, { image_url: e.target.value })}
                                              placeholder="intime-12 or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                            <input
                                              type="text"
                                              value={box.heading || box.title || ''}
                                              onChange={(e) => patchBox(secId, boxIndex, { heading: e.target.value })}
                                              placeholder="Business & Strategy"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                            <textarea
                                              rows={2}
                                              value={box.text || ''}
                                              onChange={(e) => patchBox(secId, boxIndex, { text: e.target.value })}
                                              placeholder="Box description..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Read more button</label>
                                            <input
                                              type="text"
                                              value={box.button_text || 'Read more'}
                                              onChange={(e) => patchBox(secId, boxIndex, { button_text: e.target.value })}
                                              placeholder="Read more"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">URL</label>
                                            <input
                                              type="text"
                                              value={box.button_url || box.url || ''}
                                              onChange={(e) => patchBox(secId, boxIndex, { button_url: e.target.value })}
                                              placeholder="#services"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isAboutSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">About Section</h4>
                                    <p className="text-xs text-gray-600">Edit the red eyebrow, headings, body copy, two gauges, photo, and years-of-experience badge.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Eyebrow (red)</label>
                                      <input
                                        type="text"
                                        value={values.eyebrow || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'eyebrow', e.target.value)}
                                        placeholder="ABOUT US"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none text-[#C8102E] font-bold tracking-wider uppercase"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Main Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="Why will you choose our?"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading</label>
                                      <textarea
                                        rows={2}
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="Our agency can only be as strong as our people..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="Section introduction..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1].map((gaugeIndex) => {
                                    const gauge = (values.gauges && values.gauges[gaugeIndex]) || {}
                                    return (
                                      <div key={gaugeIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{gaugeIndex + 1}</span>
                                          Gauge {gaugeIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Value</label>
                                            <input
                                              type="text"
                                              value={gauge.value || ''}
                                              onChange={(e) => patchGauge(secId, gaugeIndex, { value: e.target.value })}
                                              placeholder={gaugeIndex === 0 ? '50%' : '75%'}
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Label</label>
                                            <input
                                              type="text"
                                              value={gauge.label || ''}
                                              onChange={(e) => patchGauge(secId, gaugeIndex, { label: e.target.value })}
                                              placeholder={gaugeIndex === 0 ? 'Business strategy growth' : 'Finance valuable ideas'}
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}

                                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                    <h5 className="text-sm font-bold text-[#0B1B3D]">Photo & experience badge</h5>
                                    <div className="space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                      <label className="block text-xs font-extrabold text-[#0B1B3D]">Section Image</label>
                                      <div className="grid md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingState[`about-${secId}`]}
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                handleAboutImageUpload(secId, e.target.files[0])
                                              }
                                            }}
                                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                          />
                                          {uploadingState[`about-${secId}`] && (
                                            <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                          )}
                                          {(localPreviewUrls[`about-${secId}`] || editorPreviewSrc(displayImagePath(values.image_url), localImages)) && (
                                            <img
                                              src={localPreviewUrls[`about-${secId}`] || editorPreviewSrc(displayImagePath(values.image_url), localImages)}
                                              alt="About preview"
                                              className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                            />
                                          )}
                                        </div>
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                          <select
                                            value={selectedLocalValue(values.image_url, localImages)}
                                            onChange={(e) => handleFieldValueChange(secId, 'image_url', e.target.value)}
                                            className="w-full text-xs p-1.5 border rounded bg-white outline-none focus:ring-1 focus:ring-[#C8102E]"
                                          >
                                            <option value="">-- Choose Local Template Image --</option>
                                            {localImages.map(preset => (
                                              <option key={preset.file || preset.value} value={preset.value}>{preset.label}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                      <input
                                        type="text"
                                        value={displayImagePath(values.image_url)}
                                        onChange={(e) => handleFieldValueChange(secId, 'image_url', e.target.value)}
                                        placeholder="intime-04 or /uploads/image.jpg"
                                        className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                      />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Years value</label>
                                        <input
                                          type="text"
                                          value={values.experience_years || ''}
                                          onChange={(e) => handleFieldValueChange(secId, 'experience_years', e.target.value)}
                                          placeholder="10+"
                                          className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Years label</label>
                                        <input
                                          type="text"
                                          value={values.experience_label || ''}
                                          onChange={(e) => handleFieldValueChange(secId, 'experience_label', e.target.value)}
                                          placeholder="Years of Experience"
                                          className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Standard Section Editor
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Eyebrow / Tagline</label>
                                    <input
                                      type="text"
                                      value={values.eyebrow || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'eyebrow', e.target.value)}
                                      placeholder="e.g. ABOUT US"
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Heading / Title</label>
                                    <input
                                      type="text"
                                      value={values.heading || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                      placeholder="e.g. Section Title"
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Subheading</label>
                                    <textarea
                                      rows={2}
                                      value={values.subheading || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                      placeholder="Summary or tagline..."
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Body Text</label>
                                    <textarea
                                      rows={3}
                                      value={values.text || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                      placeholder="Full section text..."
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Image</label>
                                    <div className="grid md:grid-cols-2 gap-3 mb-2">
                                      <select
                                        value={selectedLocalValue(values.image_url, localImages)}
                                        onChange={(e) => handleFieldValueChange(secId, 'image_url', e.target.value)}
                                        className="w-full text-xs p-2 border rounded bg-white outline-none focus:ring-1 focus:ring-[#C8102E]"
                                      >
                                        <option value="">-- Choose Local Template Image --</option>
                                        {localImages.map(preset => (
                                          <option key={preset.file || preset.value} value={preset.value}>{preset.label}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        value={values.image_url || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'image_url', e.target.value)}
                                        placeholder="intime-08"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                      />
                                    </div>
                                    {editorPreviewSrc(values.image_url, localImages) && (
                                      <img
                                        src={editorPreviewSrc(values.image_url, localImages)}
                                        alt="Section image preview"
                                        className="w-full h-28 object-cover rounded border border-gray-200"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Button Text</label>
                                    <input
                                      type="text"
                                      value={values.button_text || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'button_text', e.target.value)}
                                      placeholder="GET IN TOUCH"
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Button Link</label>
                                    <input
                                      type="text"
                                      value={values.button_url || ''}
                                      onChange={(e) => handleFieldValueChange(secId, 'button_url', e.target.value)}
                                      placeholder="#appointment"
                                      className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-100 space-y-3">
                              <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]"></span>
                                  Live Template Preview — reflects your current edits
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {section.name}
                                </span>
                              </div>

                              {/* Real template4 component rendered inside an iframe via postMessage */}
                              <SectionIframePreview
                                sectionName={section.name}
                                data={{ ...values, preview_slide: previewSlide[secId] ?? 0 }}
                                height={isWhatWeDoSection(section.name) || isAboutSection(section.name) ? 720 : 520}
                                borderColor="border-[#C8102E]"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleBatchSubmit}
                        disabled={isSubmitting}
                        className="bg-[#C8102E] text-white text-base font-extrabold px-8 py-3 rounded-xl hover:bg-red-700 shadow-lg transition disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : '🚀 Submit All Section Edits'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                    <div className="text-4xl mb-3">☑️</div>
                    <h3 className="text-lg font-bold text-[#0B1B3D]">No Sections Checked Yet</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                      Check one or more section checkboxes above to lock them for editing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Deployment Request Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#0B1B3D]">🎨 Request Template Deployment</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Showcase Template</label>
                <select
                  value={selectedTemplateName}
                  onChange={e => setSelectedTemplateName(e.target.value)}
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                >
                  {availableTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.slug}>
                      {tpl.name} ({tpl.slug})
                    </option>
                  ))}
                  {availableTemplates.length === 0 && (
                    <option value="template4">Template 4 - Corporate Financial Advisory (template4)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. advisor.myfirm.com"
                  value={domainName}
                  onChange={e => setDomainName(e.target.value)}
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://myfirm.com/logo.png"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-full text-xs p-2 border rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-full text-xs p-2 border rounded font-mono"
                    />
                  </div>
                </div>
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
                  disabled={isSubmittingTemplate}
                  className="px-5 py-2 text-xs font-bold bg-[#0B1B3D] text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-md"
                >
                  {isSubmittingTemplate ? 'Submitting...' : 'Submit Deployment Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}