import { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import api from './api/axios'
import { useAuth } from './context/AuthContext'
import SectionIframePreview from './SectionIframePreview'
import {
  FaBalanceScale,
  FaBriefcase,
  FaBuilding,
  FaChartLine,
  FaChartPie,
  FaCoins,
  FaComments,
  FaFileInvoiceDollar,
  FaGlobe,
  FaHandHoldingUsd,
  FaHandshake,
  FaLandmark,
  FaLightbulb,
  FaPercentage,
  FaSeedling,
  FaShieldAlt,
  FaStar,
  FaTasks,
  FaUserTie,
  FaUsers,
  FaAward,
} from 'react-icons/fa'

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

function stripPreviewKeys(value) {
  if (Array.isArray(value)) return value.map(stripPreviewKeys)
  if (value && typeof value === 'object') {
    const next = {}
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'preview_slide' || key === 'image_preview' || key === 'preview_url' || key === 'preview_image') continue
      next[key] = stripPreviewKeys(nested)
    }
    return next
  }
  return value
}

function sanitizeSectionContent(content) {
  if (!content || typeof content !== 'object') return content || {}
  return stripDataImageUrls(stripPreviewKeys(content))
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

function isHeroSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'heroslider' || key === 'hero' || key.includes('heroslider')
}

function isWhatWeDoSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'whatwedo' || key === 'featurescarousel' || key === 'features'
}

function isAboutSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key.includes('about')
}

function isCompanyHistorySection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'companyhistory' || key === 'history' || key.includes('history')
}

function isFeaturedServicesSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'featuredservices' || key === 'services'
}

function isAnnualProgressionSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'annualprogression' || key === 'progression' || key.includes('annual')
}

function isPortfolioSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'portfoliosection' || key === 'portfolio' || key.includes('portfolio')
}

function isBranchesSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'branchesandappointment' || key.includes('branch') || key.includes('appointment')
}

function isCounterStatsSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'counterstats' || key === 'stats' || key.includes('counter')
}

function isTestimonialsSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'testimonialscarousel' || key === 'testimonials' || key.includes('testimonial')
}

function isLatestNewsSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'latestnews' || key === 'news' || key.includes('latestnews')
}

function isClientLogosSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'clientlogos' || key.includes('clientlogo')
}

function isCtaBannerSection(name) {
  const key = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return key === 'ctabanner' || key === 'cta' || key.includes('ctabanner')
}

function isAdvisorVisibleSection(name) {
  return isHeroSection(name) || isWhatWeDoSection(name) || isAboutSection(name) || isCompanyHistorySection(name) || isFeaturedServicesSection(name) || isAnnualProgressionSection(name) || isPortfolioSection(name) || isBranchesSection(name) || isCounterStatsSection(name) || isTestimonialsSection(name) || isLatestNewsSection(name) || isClientLogosSection(name) || isCtaBannerSection(name)
}

function advisorSectionOrder(name) {
  if (isHeroSection(name)) return 0
  if (isWhatWeDoSection(name)) return 1
  if (isAboutSection(name)) return 2
  if (isCompanyHistorySection(name)) return 3
  if (isFeaturedServicesSection(name)) return 4
  if (isAnnualProgressionSection(name)) return 5
  if (isPortfolioSection(name)) return 6
  if (isBranchesSection(name)) return 7
  if (isCounterStatsSection(name)) return 8
  if (isTestimonialsSection(name)) return 9
  if (isLatestNewsSection(name)) return 10
  if (isClientLogosSection(name)) return 11
  if (isCtaBannerSection(name)) return 12
  return 99
}

const SERVICE_ICON_OPTIONS = [
  { value: 'chart-pie', label: 'Chart pie', Icon: FaChartPie },
  { value: 'tasks', label: 'Tasks', Icon: FaTasks },
  { value: 'landmark', label: 'Landmark', Icon: FaLandmark },
  { value: 'coins', label: 'Coins', Icon: FaCoins },
  { value: 'holding', label: 'Holding', Icon: FaHandHoldingUsd },
  { value: 'seedling', label: 'Seedling', Icon: FaSeedling },
  { value: 'briefcase', label: 'Briefcase', Icon: FaBriefcase },
  { value: 'chart-line', label: 'Chart line', Icon: FaChartLine },
  { value: 'handshake', label: 'Handshake', Icon: FaHandshake },
  { value: 'building', label: 'Building', Icon: FaBuilding },
  { value: 'users', label: 'Users', Icon: FaUsers },
  { value: 'shield-alt', label: 'Shield', Icon: FaShieldAlt },
  { value: 'lightbulb', label: 'Lightbulb', Icon: FaLightbulb },
  { value: 'file-invoice-dollar', label: 'Invoice', Icon: FaFileInvoiceDollar },
  { value: 'percentage', label: 'Percentage', Icon: FaPercentage },
  { value: 'globe', label: 'Globe', Icon: FaGlobe },
  { value: 'comments', label: 'Comments', Icon: FaComments },
  { value: 'balance-scale', label: 'Balance', Icon: FaBalanceScale },
]

const STAT_ICON_OPTIONS = [
  { value: 'users', label: 'Users', Icon: FaUsers },
  { value: 'star', label: 'Star', Icon: FaStar },
  { value: 'user-tie', label: 'User tie', Icon: FaUserTie },
  { value: 'award', label: 'Award', Icon: FaAward },
  ...SERVICE_ICON_OPTIONS.filter((opt) => opt.value !== 'users'),
]

function defaultFeaturedServiceBoxes() {
  return [
    { icon: 'chart-pie', heading: 'Strategy & Planning', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-strategy-planning' },
    { icon: 'tasks', heading: 'Program Manager', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-program-manager' },
    { icon: 'landmark', heading: 'Tax Management', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-tax-management' },
    { icon: 'coins', heading: 'Investment Policy', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-investment-policy' },
    { icon: 'holding', heading: 'Financial Advices', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-financial-advices' },
    { icon: 'seedling', heading: 'Business Growth Plan', text: 'Collaborate Consulting exists to find the place where being seeming disparate interests meet.', button_text: 'Read more', button_url: '#service-business-growth-plan' },
  ]
}

function normalizeFeaturedServicesEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const defaults = defaultFeaturedServiceBoxes()
  const list = Array.isArray(c.boxes) && c.boxes.length
    ? c.boxes
    : (Array.isArray(c.items) ? c.items : [])
  return {
    subheading: c.subheading || 'FEATURED SERVICES',
    heading: c.heading || 'We help to get Solutions!',
    text: c.text || 'Provide users with appropriate view and access permissions to requests, problems, changes, contracts, assets, solutions',
    boxes: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      return {
        icon: item.icon || fallback.icon,
        heading: item.heading || item.title || fallback.heading,
        text: item.text || item.desc || fallback.text,
        button_text: item.button_text || item.read_more || fallback.button_text,
        button_url: item.button_url || item.url || item.link || (item.slug ? `#service-${item.slug}` : fallback.button_url),
      }
    }),
  }
}

function parseProgressPct(value, fallback) {
  const n = parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

function defaultAnnualProgressionBars() {
  return [
    { label: 'Business growth', year: '2018', pct: 70 },
    { label: 'Investment growth', year: '2019', pct: 80 },
    { label: 'Financial growth', year: '2020', pct: 90 },
  ]
}

function defaultAnnualProgressionHighlights() {
  return [
    { icon: 'shield-alt', heading: 'Risk Free', text: 'We offer risk free business for tension free life.' },
    { icon: 'chart-line', heading: 'Business Growth', text: 'We ensure the business growth without conditions.' },
  ]
}

function normalizeAnnualProgressionEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const legacy = Boolean(c.eyebrow && c.subheading && !c.text)
  const barDefaults = defaultAnnualProgressionBars()
  const highlightDefaults = defaultAnnualProgressionHighlights()
  const barList = Array.isArray(c.bars) && c.bars.length
    ? c.bars
    : (Array.isArray(c.progress) ? c.progress : [])
  const highlightList = Array.isArray(c.highlights) && c.highlights.length
    ? c.highlights
    : (Array.isArray(c.features) ? c.features : [])
  return {
    subheading: legacy ? (c.eyebrow || 'ANNUAL PROGRESSION') : (c.subheading || c.eyebrow || 'ANNUAL PROGRESSION'),
    heading: c.heading || 'Our Business Growth is Really Incredible!',
    text: legacy
      ? (c.subheading || '')
      : (c.text || 'We love what we do and we do it with passion. We value the experimentation, the reformation of the message, and the smart incentives.'),
    bars: barDefaults.map((fallback, i) => {
      const item = barList[i] && typeof barList[i] === 'object' ? barList[i] : {}
      return {
        label: item.label || item.heading || item.title || fallback.label,
        year: item.year || fallback.year,
        pct: parseProgressPct(item.pct ?? item.percent ?? item.value ?? item.percentage, fallback.pct),
      }
    }),
    highlights: highlightDefaults.map((fallback, i) => {
      const item = highlightList[i] && typeof highlightList[i] === 'object' ? highlightList[i] : {}
      return {
        icon: item.icon || fallback.icon,
        heading: item.heading || item.title || fallback.heading,
        text: item.text || item.desc || item.description || fallback.text,
      }
    }),
  }
}

function defaultPortfolioItems() {
  return [
    { heading: 'Market Expansion', category: 'Business Strategy', image_url: 'intime-12.jpg', button_text: 'Read more', button_url: '#portfolio' },
    { heading: 'Business Growth', category: 'Investment', image_url: 'intime-11.jpg', button_text: 'Read more', button_url: '#portfolio' },
    { heading: 'Tax Management', category: 'Tax Consulting', image_url: 'intime-08.jpg', button_text: 'Read more', button_url: '#portfolio' },
    { heading: 'Investment Policy', category: 'Business Strategy', image_url: 'intime-10.jpg', button_text: 'Read more', button_url: '#portfolio' },
    { heading: 'Manage Investment', category: 'Investment', image_url: 'intime-04.jpg', button_text: 'Read more', button_url: '#portfolio' },
    { heading: 'Financial Advices', category: 'Tax Consulting', image_url: 'intime-01.jpg', button_text: 'Read more', button_url: '#portfolio' },
  ]
}

function normalizePortfolioEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const legacy = Boolean(c.eyebrow && c.subheading && !c.items)
  const defaults = defaultPortfolioItems()
  const list = Array.isArray(c.items) && c.items.length
    ? c.items
    : (Array.isArray(c.projects) && c.projects.length ? c.projects : (Array.isArray(c.boxes) ? c.boxes : []))
  return {
    subheading: legacy ? (c.eyebrow || 'COMPLETED PROJECTS') : (c.subheading || c.eyebrow || 'COMPLETED PROJECTS'),
    heading: c.heading || 'You can check our projects as inspirations.',
    items: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      return {
        heading: item.heading || item.title || fallback.heading,
        category: item.category || item.cat || item.caption || fallback.category,
        image_url: item.image_url || item.image || item.img || fallback.image_url,
        image_preview: item.image_preview || '',
        button_text: item.button_text || item.read_more || fallback.button_text,
        button_url: item.button_url || item.url || item.link || fallback.button_url,
      }
    }),
  }
}

function portfolioPreviewPayload(values) {
  const normalized = normalizePortfolioEditorContent(values || {})
  return withAbsoluteUploadUrls({
    ...normalized,
    items: (normalized.items || []).map((item) => {
      const preview = item.image_preview || ''
      const image = preview || item.image_url || ''
      const absImage = /^data:|^blob:/i.test(image)
        ? image
        : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
      return {
        ...item,
        image_preview: preview || undefined,
        image_url: absImage || image,
        image: absImage || image,
        img: absImage || image,
      }
    }),
  })
}

function defaultBranchItems() {
  return [
    { name: 'Sydney (Head Office)', address: '1 Epping Road, North Ryde, NSW 2113', phone: '+61 2 9870 7689', email: 'email@example.com' },
    { name: 'Brisbane', address: 'Level 28, 400 George Street, Brisbane, QLD 4000', phone: '+61 2 9870 7689', email: 'email@example.com' },
    { name: 'Hobart', address: '85 Macquarie Finoa Street, Hobart, TAS 7000', phone: '+61 2 9870 7689', email: 'email@example.com' },
    { name: 'Melbourne', address: 'Level 5, 4 Freshwater Place, Southbank, VIC 3006', phone: '+61 2 9870 7689', email: 'email@example.com' },
  ]
}

function normalizeBranchesEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const legacyLabel = Boolean(c.eyebrow)
  const defaults = defaultBranchItems()
  const list = Array.isArray(c.items) && c.items.length
    ? c.items
    : (Array.isArray(c.branches) && c.branches.length ? c.branches : (Array.isArray(c.offices) ? c.offices : []))
  return {
    subheading: legacyLabel ? (c.eyebrow || 'GET IN TOUCH') : (c.subheading || 'GET IN TOUCH'),
    heading: c.heading || 'We are Connected All Time to Help Your Business!',
    text: legacyLabel
      ? (c.text || c.subheading || 'We understand the importance of approaching each work integrally and believe in the power of simple and easy communication.')
      : (c.text || 'We understand the importance of approaching each work integrally and believe in the power of simple and easy communication.'),
    form_heading: c.form_heading || 'Book an appionment',
    button_text: c.button_text || 'SEND YOUR MESSAGE',
    branches_label: c.branches_label || 'Main Branches:',
    stat_value: c.stat_value || '12+',
    stat_label: c.stat_label || 'Branches',
    map_image: c.map_image || c.image_url || c.image || c.img || 'maps-point.png',
    image_preview: c.image_preview || '',
    items: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      return {
        name: item.name || item.heading || item.title || fallback.name,
        address: item.address || fallback.address,
        phone: item.phone || item.tel || fallback.phone,
        email: item.email || fallback.email,
      }
    }),
  }
}

function branchesPreviewPayload(values) {
  const normalized = normalizeBranchesEditorContent(values || {})
  const preview = normalized.image_preview || ''
  const image = preview || normalized.map_image || ''
  const absImage = /^data:|^blob:/i.test(image)
    ? image
    : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
  return withAbsoluteUploadUrls({
    ...normalized,
    map_image: absImage || image,
    image_url: absImage || image,
    image: absImage || image,
    image_preview: preview || undefined,
  })
}

function defaultCounterStats() {
  return [
    { icon: 'users', value: '2,800+', label: 'Active Clients', sub: 'Empowering businesses globally with passion and proven expertise.' },
    { icon: 'star', value: '1,670+', label: '5-Star Reviews', sub: 'Top customer satisfaction and unmatched quality of service.' },
    { icon: 'user-tie', value: '106+', label: 'Team Members', sub: 'Dedicated specialists and leaders driving continuous innovation.' },
    { icon: 'award', value: '99.8%', label: 'Success Rate', sub: 'Consistently delivering top-tier performance and business growth.' },
  ]
}

function normalizeCounterStatsEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const defaults = defaultCounterStats()
  const list = Array.isArray(c.stats) && c.stats.length
    ? c.stats
    : (Array.isArray(c.items) && c.items.length ? c.items : [])
  return {
    stats: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      const n = i + 1
      return {
        icon: item.icon || c[`stat_${n}_icon`] || fallback.icon,
        value: item.value || item.number || c[`stat_${n}_value`] || fallback.value,
        label: item.label || item.title || item.heading || c[`stat_${n}_label`] || fallback.label,
        sub: item.sub || item.desc || item.description || item.text || c[`stat_${n}_sub`] || fallback.sub,
      }
    }),
  }
}

function defaultTestimonialItems() {
  return [
    { quote: 'Working with several word press themes and templates the last years, I only can say this is the best in every level. I use it for my company and the reviews that I have already are all excellent.', name: 'Alina Lora', role: 'Former Manager, Intime', image_url: 'testimonial-01.jpg' },
    { quote: 'This is one of the BEST THEMES I have ever worked with. The extra bells and whistles added to it are amazing. Elementor features add extra flavor. The customer support is very responsive.', name: 'Rohan Jho', role: 'Former Manager, Intime', image_url: 'testimonial-02.jpg' },
    { quote: 'Great theme, one of the best I have worked with in a while. Full featured and great support for the minor issues I had which were really my not being skilled/experienced enough.', name: 'Donald Frew', role: 'Former Manager, Intime', image_url: 'testimonial-03.jpg' },
  ]
}

function normalizeTestimonialsEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const defaults = defaultTestimonialItems()
  const list = Array.isArray(c.items) && c.items.length
    ? c.items
    : (Array.isArray(c.testimonials) && c.testimonials.length ? c.testimonials : [])
  const legacyThin = Boolean(c.eyebrow && c.heading && !list.length)
  const reviewsLabel = c.reviews_label || c.label || (legacyThin && String(c.subheading || '').length > 40 ? 'Clients Reviews:' : (c.subheading || 'Clients Reviews:'))
  return {
    eyebrow: c.eyebrow || c.tagline || "CLIENT'S TESTIMONIALS",
    heading: c.heading || "We are Very Happy to Get Our Client's Reviews.",
    subheading: reviewsLabel,
    image_url: c.image_url || c.image || c.img || c.side_image || 'intime-17.jpg',
    image_preview: c.image_preview || '',
    items: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      return {
        quote: item.quote || item.text || item.review || fallback.quote,
        name: item.name || item.title || item.author || fallback.name,
        role: item.role || item.position || item.job || item.desc || fallback.role,
        image_url: item.image_url || item.image || item.img || item.avatar || fallback.image_url,
        image_preview: item.image_preview || '',
      }
    }),
  }
}

function testimonialsPreviewPayload(values) {
  const normalized = normalizeTestimonialsEditorContent(values || {})
  const sidePreview = normalized.image_preview || ''
  const sideImage = sidePreview || normalized.image_url || ''
  const absSide = /^data:|^blob:/i.test(sideImage)
    ? sideImage
    : (isUploadedAsset(sideImage) ? absoluteAssetUrl(sideImage) : sideImage)
  return withAbsoluteUploadUrls({
    ...normalized,
    image_url: absSide || sideImage,
    image: absSide || sideImage,
    img: absSide || sideImage,
    image_preview: sidePreview || undefined,
    items: (normalized.items || []).map((item) => {
      const preview = item.image_preview || ''
      const image = preview || item.image_url || ''
      const absImage = /^data:|^blob:/i.test(image)
        ? image
        : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
      return {
        ...item,
        image_preview: preview || undefined,
        image_url: absImage || image,
        image: absImage || image,
        img: absImage || image,
      }
    }),
  })
}

function defaultLatestNewsItems() {
  return [
    { date: '10', month: 'Nov, 20', author: 'John Doe', cat: 'Consulting', title: 'We would love to share a similar experience', excerpt: 'The theory was first published in 2008 a press released under the name of Cliff Arnall, who at the time was a tutor at the…', image_url: 'intime-03.jpg', button_text: 'Read more', button_url: '#news' },
    { date: '06', month: 'Nov, 20', author: 'John Doe', cat: 'HR Consulting', title: 'We glad to discuss your organisation situation.', excerpt: 'The theory was first published in 2008 a press released under the name of Cliff Arnall, who at the time was a tutor at the…', image_url: 'intime-02.jpg', button_text: 'Read more', button_url: '#news' },
    { date: '20', month: 'Oct, 20', author: 'John Doe', cat: 'Consulting', title: 'In this context our main approach was to build.', excerpt: 'The theory was first published in 2008 a press released under the name of Cliff Arnall, who at the time was a tutor at the…', image_url: 'intime-05.jpg', button_text: 'Read more', button_url: '#news' },
  ]
}

function normalizeLatestNewsEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const defaults = defaultLatestNewsItems()
  const list = Array.isArray(c.items) && c.items.length
    ? c.items
    : (Array.isArray(c.posts) && c.posts.length ? c.posts : [])
  return {
    eyebrow: c.eyebrow || c.tagline || 'OUR LATEST NEWS',
    heading: c.heading || 'Learn about our latest news from blog.',
    items: defaults.map((fallback, i) => {
      const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
      return {
        date: item.date || item.day || fallback.date,
        month: item.month || item.month_label || fallback.month,
        author: item.author || item.by || fallback.author,
        cat: item.cat || item.category || item.tag || fallback.cat,
        title: item.title || item.heading || fallback.title,
        excerpt: item.excerpt || item.text || item.desc || item.description || fallback.excerpt,
        image_url: item.image_url || item.image || item.img || fallback.image_url,
        image_preview: item.image_preview || '',
        button_text: item.button_text || item.read_more || fallback.button_text,
        button_url: item.button_url || item.url || item.link || fallback.button_url,
      }
    }),
  }
}

function latestNewsPreviewPayload(values) {
  const normalized = normalizeLatestNewsEditorContent(values || {})
  return withAbsoluteUploadUrls({
    ...normalized,
    items: (normalized.items || []).map((item) => {
      const preview = item.image_preview || ''
      const image = preview || item.image_url || ''
      const absImage = /^data:|^blob:/i.test(image)
        ? image
        : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
      return {
        ...item,
        image_preview: preview || undefined,
        image_url: absImage || image,
        image: absImage || image,
        img: absImage || image,
      }
    }),
  })
}

function defaultClientLogoItems() {
  return [
    { name: 'slack', image_url: '' },
    { name: 'Google', image_url: '' },
    { name: 'envato', image_url: '' },
    { name: 'Sketch', image_url: '' },
    { name: 'Figma', image_url: '' },
  ]
}

function normalizeClientLogosEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  const defaults = defaultClientLogoItems()
  const list = Array.isArray(c.items) && c.items.length
    ? c.items
    : (Array.isArray(c.logos) && c.logos.length ? c.logos : [])
  return {
    items: defaults.map((fallback, i) => {
      const raw = list[i]
      const item = typeof raw === 'string' ? { name: raw } : (raw && typeof raw === 'object' ? raw : {})
      return {
        name: item.name || item.label || item.title || item.text || fallback.name,
        image_url: item.image_url || item.image || item.img || item.logo || fallback.image_url,
        image_preview: item.image_preview || '',
      }
    }),
  }
}

function clientLogosPreviewPayload(values) {
  const normalized = normalizeClientLogosEditorContent(values || {})
  return withAbsoluteUploadUrls({
    ...normalized,
    items: (normalized.items || []).map((item) => {
      const preview = item.image_preview || ''
      const image = preview || item.image_url || ''
      const absImage = /^data:|^blob:/i.test(image)
        ? image
        : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
      return {
        ...item,
        image_preview: preview || undefined,
        image_url: absImage || image,
        image: absImage || image,
        img: absImage || image,
        logo: absImage || image,
      }
    }),
  })
}

function normalizeCtaBannerEditorContent(content) {
  const c = content && typeof content === 'object' ? content : {}
  return {
    heading: c.heading || c.title || 'Looking for the Best Business Consulting?',
    subheading: c.subheading || c.text || c.desc || c.description || 'As a web crawler expert, we will help to organize.',
    button_text: c.button_text || c.btn_text || c.button || 'GET A QUOTE',
    button_url: c.button_url || c.btn_url || c.url || c.link || '#appointment',
  }
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
  c.gauges = defaults.map((fallback, i) => {
    const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
    const n = i + 1
    return {
      ...fallback,
      ...item,
      value: c[`percent_${n}`] || c[`percentage_${n}`] || item.value || item.percentage || item.pct || fallback.value,
      label: c[`percent_${n}_text`] || c[`percentage_${n}_text`] || item.label || item.text || item.heading || fallback.label,
    }
  })
  if (!c.eyebrow) c.eyebrow = 'ABOUT US'
  c.experience_years = c.experience_years || c.red_box_number || c.red_box || c.years || '10+'
  c.experience_label = c.experience_label || c.red_box_text || c.red_box_label || 'Years of Experience'
  c.red_box_number = c.experience_years
  c.red_box_text = c.experience_label
  if (!c.image_url) c.image_url = c.image || c.img || ''
  c.percent_1 = c.gauges[0].value
  c.percent_1_text = c.gauges[0].label
  c.percent_2 = c.gauges[1].value
  c.percent_2_text = c.gauges[1].label
  return c
}

function withAbsoluteUploadUrls(value) {
  if (typeof value === 'string') {
    return isUploadedAsset(value) ? absoluteAssetUrl(value) : value
  }
  if (Array.isArray(value)) return value.map(withAbsoluteUploadUrls)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withAbsoluteUploadUrls(v)]))
  }
  return value
}

function defaultCompanyHistoryYears() {
  return [
    { year: '2010', red_text: '2010 Milestone', grey_text: 'Company Founded', heading: 'Started Business', image_url: 'intime-06.jpg', text: "We partner with you to enable your technology so you focus on your organization's mission, leveraging our top-tier talent." },
    { year: '2012', red_text: '2012 Milestone', grey_text: '10+ Key Partners', heading: 'Resilience & Expansion', image_url: 'intime-07.jpg', text: 'A dedicated People Ops leader committed to the growth and continuous development of leaders across operations.' },
    { year: '2016', red_text: '2016 Milestone', grey_text: '24/7 Support Launched', heading: 'Crisis & Opportunity', image_url: 'intime-09.jpg', text: 'Our support works around the clock to ensure your business operations are secure, resilient, and monitored safely.' },
    { year: '2017', red_text: '2017 Milestone', grey_text: '50+ Nationwide Branches', heading: '50+ Branches Milestone', image_url: 'intime-01.jpg', text: 'We cross industries and provide services to almost every business either as a co-managed or supplemental asset.' },
    { year: '2019', red_text: '2019 Milestone', grey_text: 'Global Market Entry', heading: '100+ Global Branches', image_url: 'intime-04.jpg', text: 'Providing consulting expertise on vendor technology, IT budget strategy, and multi-cloud enterprise security.' },
    { year: '2021', red_text: '2021 Milestone', grey_text: 'Top Enterprise Award', heading: 'Industry Excellence Award', image_url: 'intime-10.jpg', text: 'Our team is held to the highest level of accountability to ensure exceptional satisfaction and proven results.' },
  ]
}

function normalizeCompanyHistoryEditorContent(content) {
  const c = content && typeof content === 'object' ? { ...content } : {}
  const defaults = defaultCompanyHistoryYears()
  const legacy = Boolean(c.eyebrow && c.subheading && !c.text && !c.years)
  const list = Array.isArray(c.years) && c.years.length
    ? c.years
    : (Array.isArray(c.items) && c.items.length ? c.items : (Array.isArray(c.milestones) ? c.milestones : []))
  const originalSubheading = c.subheading
  c.subheading = legacy ? (c.eyebrow || 'OUR JOURNEY') : (c.subheading || c.eyebrow || 'OUR JOURNEY')
  c.text = legacy ? (originalSubheading || '') : (c.text || 'A decade of growth, innovation, and unwavering commitment to client success.')
  if (!c.heading) c.heading = 'Our Company History'
  c.years = defaults.map((fallback, i) => {
    const item = list[i] && typeof list[i] === 'object' ? list[i] : {}
    const year = item.year || fallback.year
    return {
      ...fallback,
      ...item,
      year,
      red_text: item.red_text || item.milestone || item.badge || (year ? `${year} Milestone` : fallback.red_text),
      grey_text: item.grey_text || item.highlight || item.caption || fallback.grey_text,
      heading: item.heading || item.title || fallback.heading,
      image_url: item.image_url || item.image || item.img || fallback.image_url,
      text: item.text || item.desc || item.description || fallback.text,
    }
  })
  return c
}

function companyHistoryPreviewPayload(values) {
  const normalized = normalizeCompanyHistoryEditorContent(values || {})
  return withAbsoluteUploadUrls({
    ...normalized,
    years: (normalized.years || []).map((year) => {
      const preview = year.image_preview || ''
      const image = preview || year.image_url || ''
      const absImage = /^data:|^blob:/i.test(image)
        ? image
        : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
      return {
        ...year,
        image_preview: preview || undefined,
        image_url: absImage || image,
        image: absImage || image,
        img: absImage || image,
      }
    }),
  })
}

function aboutPreviewPayload(values) {
  const normalized = normalizeAboutEditorContent(values || {})
  const preview = normalized.image_preview || ''
  const image = preview || normalized.image_url || ''
  const absImage = /^data:|^blob:/i.test(image)
    ? image
    : (isUploadedAsset(image) ? absoluteAssetUrl(image) : image)
  return withAbsoluteUploadUrls({
    ...normalized,
    image_preview: preview || undefined,
    image_url: absImage || image,
    image: absImage || image,
    img: absImage || image,
    experience_years: normalized.experience_years,
    experience_label: normalized.experience_label,
    red_box_number: normalized.experience_years,
    red_box_text: normalized.experience_label,
    percent_1: normalized.gauges[0].value,
    percent_1_text: normalized.gauges[0].label,
    percent_2: normalized.gauges[1].value,
    percent_2_text: normalized.gauges[1].label,
    gauges: normalized.gauges,
  })
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

  const handleYearImageUpload = async (secId, yearIndex, file) => {
    if (!file) return
    const uploadKey = `year-${secId}-${yearIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => {
        const source = prev[secId]?.years || prev[secId]?.items || defaultCompanyHistoryYears()
        const years = defaultCompanyHistoryYears().map((_, i) => ({ ...(source[i] || {}) }))
        years[yearIndex] = {
          ...years[yearIndex],
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        }
        return { ...prev, [secId]: { ...(prev[secId] || {}), years } }
      })
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const source = prev[secId]?.years || prev[secId]?.items || defaultCompanyHistoryYears()
          const years = defaultCompanyHistoryYears().map((_, i) => ({ ...(source[i] || {}) }))
          years[yearIndex] = {
            ...years[yearIndex],
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || years[yearIndex].image_preview,
          }
          return { ...prev, [secId]: { ...(prev[secId] || {}), years } }
        })
        setMessage(`📸 Image uploaded successfully for Year ${yearIndex + 1}!`)
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

  const handlePortfolioItemImageUpload = async (secId, itemIndex, file) => {
    if (!file) return
    const uploadKey = `portfolio-${secId}-${itemIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => {
        const source = prev[secId]?.items || prev[secId]?.projects || defaultPortfolioItems()
        const items = defaultPortfolioItems().map((_, i) => ({ ...(source[i] || {}) }))
        items[itemIndex] = {
          ...items[itemIndex],
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        }
        return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
      })
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const source = prev[secId]?.items || prev[secId]?.projects || defaultPortfolioItems()
          const items = defaultPortfolioItems().map((_, i) => ({ ...(source[i] || {}) }))
          items[itemIndex] = {
            ...items[itemIndex],
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || items[itemIndex].image_preview,
          }
          return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
        })
        setMessage(`📸 Image uploaded successfully for Project ${itemIndex + 1}!`)
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

  const handleTestimonialsSideImageUpload = async (secId, file) => {
    if (!file) return
    const uploadKey = `testimonials-side-${secId}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => ({
        ...prev,
        [secId]: {
          ...(prev[secId] || {}),
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        },
      }))
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => ({
          ...prev,
          [secId]: {
            ...(prev[secId] || {}),
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || prev[secId]?.image_preview,
          },
        }))
        setMessage('📸 Side image uploaded successfully!')
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

  const handleTestimonialItemImageUpload = async (secId, itemIndex, file) => {
    if (!file) return
    const uploadKey = `testimonial-${secId}-${itemIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => {
        const source = prev[secId]?.items || prev[secId]?.testimonials || defaultTestimonialItems()
        const items = defaultTestimonialItems().map((_, i) => ({ ...(source[i] || {}) }))
        items[itemIndex] = {
          ...items[itemIndex],
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        }
        return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
      })
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const source = prev[secId]?.items || prev[secId]?.testimonials || defaultTestimonialItems()
          const items = defaultTestimonialItems().map((_, i) => ({ ...(source[i] || {}) }))
          items[itemIndex] = {
            ...items[itemIndex],
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || items[itemIndex].image_preview,
          }
          return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
        })
        setMessage(`📸 Avatar uploaded successfully for Testimonial ${itemIndex + 1}!`)
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

  const handleLatestNewsItemImageUpload = async (secId, itemIndex, file) => {
    if (!file) return
    const uploadKey = `latestnews-${secId}-${itemIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => {
        const source = prev[secId]?.items || prev[secId]?.posts || defaultLatestNewsItems()
        const items = defaultLatestNewsItems().map((_, i) => ({ ...(source[i] || {}) }))
        items[itemIndex] = {
          ...items[itemIndex],
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        }
        return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
      })
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const source = prev[secId]?.items || prev[secId]?.posts || defaultLatestNewsItems()
          const items = defaultLatestNewsItems().map((_, i) => ({ ...(source[i] || {}) }))
          items[itemIndex] = {
            ...items[itemIndex],
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || items[itemIndex].image_preview,
          }
          return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
        })
        setMessage(`📸 Image uploaded successfully for News Post ${itemIndex + 1}!`)
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

  const handleClientLogoImageUpload = async (secId, itemIndex, file) => {
    if (!file) return
    const uploadKey = `clientlogo-${secId}-${itemIndex}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => {
        const source = prev[secId]?.items || prev[secId]?.logos || defaultClientLogoItems()
        const items = defaultClientLogoItems().map((_, i) => ({ ...(source[i] || {}) }))
        items[itemIndex] = {
          ...items[itemIndex],
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          logo: dataUrl,
          image_preview: dataUrl,
        }
        return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
      })
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => {
          const source = prev[secId]?.items || prev[secId]?.logos || defaultClientLogoItems()
          const items = defaultClientLogoItems().map((_, i) => ({ ...(source[i] || {}) }))
          items[itemIndex] = {
            ...items[itemIndex],
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            logo: uploadedUrl,
            image_preview: dataUrl || items[itemIndex].image_preview,
          }
          return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
        })
        setMessage(`📸 Logo uploaded successfully for Logo ${itemIndex + 1}!`)
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
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => ({
        ...prev,
        [secId]: {
          ...(prev[secId] || {}),
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        },
      }))
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => ({
          ...prev,
          [secId]: {
            ...(prev[secId] || {}),
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || prev[secId]?.image_preview,
          },
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

  const handleBranchesMapUpload = async (secId, file) => {
    if (!file) return
    const uploadKey = `branches-map-${secId}`
    setLocalPreview(uploadKey, file)
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }))
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (dataUrl) {
      setSectionEdits((prev) => ({
        ...prev,
        [secId]: {
          ...(prev[secId] || {}),
          map_image: dataUrl,
          image_url: dataUrl,
          image: dataUrl,
          img: dataUrl,
          image_preview: dataUrl,
        },
      }))
    }
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('upload-image', formData)
      const uploadedUrl = storedUploadPath(res.data)
      if (uploadedUrl) {
        setSectionEdits((prev) => ({
          ...prev,
          [secId]: {
            ...(prev[secId] || {}),
            map_image: uploadedUrl,
            image_url: uploadedUrl,
            image: uploadedUrl,
            img: uploadedUrl,
            image_preview: dataUrl || prev[secId]?.image_preview,
          },
        }))
        setMessage('📸 Map image uploaded successfully!')
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
      .filter(s => s.is_locked && s.locked_by === user?.id && isAdvisorVisibleSection(s.name))
      .map(s => s.id)

    setCheckedSectionIds(lockedByMeIds)

    const initialEdits = {}
    sectionsForAdvisor.forEach(s => {
      if (lockedByMeIds.includes(s.id)) {
        const parsed = parseJson(s.content)
        initialEdits[s.id] = isAboutSection(s.name)
          ? normalizeAboutEditorContent(parsed)
          : isCompanyHistorySection(s.name)
            ? normalizeCompanyHistoryEditorContent(parsed)
            : isFeaturedServicesSection(s.name)
              ? normalizeFeaturedServicesEditorContent(parsed)
              : isAnnualProgressionSection(s.name)
                ? normalizeAnnualProgressionEditorContent(parsed)
                : isPortfolioSection(s.name)
                  ? normalizePortfolioEditorContent(parsed)
                  : isBranchesSection(s.name)
                    ? normalizeBranchesEditorContent(parsed)
                    : isCounterStatsSection(s.name)
                      ? normalizeCounterStatsEditorContent(parsed)
                      : isTestimonialsSection(s.name)
                        ? normalizeTestimonialsEditorContent(parsed)
                        : isLatestNewsSection(s.name)
                          ? normalizeLatestNewsEditorContent(parsed)
                          : isClientLogosSection(s.name)
                            ? normalizeClientLogosEditorContent(parsed)
                            : isCtaBannerSection(s.name)
                              ? normalizeCtaBannerEditorContent(parsed)
                              : parsed
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
        [section.id]: isAboutSection(section.name)
          ? normalizeAboutEditorContent(parsed)
          : isCompanyHistorySection(section.name)
            ? normalizeCompanyHistoryEditorContent(parsed)
            : isFeaturedServicesSection(section.name)
              ? normalizeFeaturedServicesEditorContent(parsed)
              : isAnnualProgressionSection(section.name)
                ? normalizeAnnualProgressionEditorContent(parsed)
                : isPortfolioSection(section.name)
                  ? normalizePortfolioEditorContent(parsed)
                  : isBranchesSection(section.name)
                    ? normalizeBranchesEditorContent(parsed)
                    : isCounterStatsSection(section.name)
                      ? normalizeCounterStatsEditorContent(parsed)
                      : isTestimonialsSection(section.name)
                        ? normalizeTestimonialsEditorContent(parsed)
                        : isLatestNewsSection(section.name)
                          ? normalizeLatestNewsEditorContent(parsed)
                          : isClientLogosSection(section.name)
                            ? normalizeClientLogosEditorContent(parsed)
                            : isCtaBannerSection(section.name)
                              ? normalizeCtaBannerEditorContent(parsed)
                              : parsed
      }))
      setMessage(`🔒 Section "${section.name}" locked for you. You can now edit its content.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not lock section.')
    }
  }

  const handleFieldValueChange = (sectionId, fieldKey, value) => {
    setSectionEdits(prev => {
      const current = { ...(prev[sectionId] || {}), [fieldKey]: value }
      if (fieldKey === 'image_url') {
        current.image = value
        current.img = value
        if (!/^data:|^blob:/i.test(value || '')) current.image_preview = ''
      }
      if (fieldKey === 'map_image') {
        current.image_url = value
        current.image = value
        current.img = value
        if (!/^data:|^blob:/i.test(value || '')) current.image_preview = ''
      }
      if (fieldKey === 'experience_years') current.red_box_number = value
      if (fieldKey === 'experience_label') current.red_box_text = value
      if (fieldKey === 'red_box_number') current.experience_years = value
      if (fieldKey === 'red_box_text') current.experience_label = value
      return { ...prev, [sectionId]: current }
    })
  }

  const patchBox = (secId, boxIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.boxes || prev[secId]?.items || [{}, {}, {}]
      const boxes = [0, 1, 2].map((i) => ({ ...(source[i] || {}) }))
      boxes[boxIndex] = { ...boxes[boxIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), boxes } }
    })
  }

  const patchServiceBox = (secId, boxIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.boxes || prev[secId]?.items || defaultFeaturedServiceBoxes()
      const boxes = defaultFeaturedServiceBoxes().map((_, i) => ({ ...(source[i] || {}) }))
      boxes[boxIndex] = { ...boxes[boxIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), boxes } }
    })
  }

  const patchProgressBar = (secId, barIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.bars || prev[secId]?.progress || defaultAnnualProgressionBars()
      const bars = defaultAnnualProgressionBars().map((_, i) => ({ ...(source[i] || {}) }))
      bars[barIndex] = { ...bars[barIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), bars } }
    })
  }

  const patchProgressHighlight = (secId, highlightIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.highlights || prev[secId]?.features || defaultAnnualProgressionHighlights()
      const highlights = defaultAnnualProgressionHighlights().map((_, i) => ({ ...(source[i] || {}) }))
      highlights[highlightIndex] = { ...highlights[highlightIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), highlights } }
    })
  }

  const patchPortfolioItem = (secId, itemIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.items || prev[secId]?.projects || defaultPortfolioItems()
      const items = defaultPortfolioItems().map((_, i) => ({ ...(source[i] || {}) }))
      items[itemIndex] = { ...items[itemIndex], ...patch }
      if (patch.image_url && !/^data:|^blob:/i.test(patch.image_url)) {
        items[itemIndex].image_preview = ''
        items[itemIndex].image = patch.image_url
        items[itemIndex].img = patch.image_url
      }
      return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
    })
  }

  const patchBranch = (secId, itemIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.items || prev[secId]?.branches || defaultBranchItems()
      const items = defaultBranchItems().map((_, i) => ({ ...(source[i] || {}) }))
      items[itemIndex] = { ...items[itemIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
    })
  }

  const patchCounterStat = (secId, statIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.stats || prev[secId]?.items || defaultCounterStats()
      const stats = defaultCounterStats().map((_, i) => ({ ...(source[i] || {}) }))
      stats[statIndex] = { ...stats[statIndex], ...patch }
      return { ...prev, [secId]: { ...(prev[secId] || {}), stats } }
    })
  }

  const patchTestimonialItem = (secId, itemIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.items || prev[secId]?.testimonials || defaultTestimonialItems()
      const items = defaultTestimonialItems().map((_, i) => ({ ...(source[i] || {}) }))
      items[itemIndex] = { ...items[itemIndex], ...patch }
      if (patch.image_url && !/^data:|^blob:/i.test(patch.image_url)) {
        items[itemIndex].image_preview = ''
        items[itemIndex].image = patch.image_url
        items[itemIndex].img = patch.image_url
      }
      return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
    })
  }

  const patchNewsItem = (secId, itemIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.items || prev[secId]?.posts || defaultLatestNewsItems()
      const items = defaultLatestNewsItems().map((_, i) => ({ ...(source[i] || {}) }))
      items[itemIndex] = { ...items[itemIndex], ...patch }
      if (patch.image_url && !/^data:|^blob:/i.test(patch.image_url)) {
        items[itemIndex].image_preview = ''
        items[itemIndex].image = patch.image_url
        items[itemIndex].img = patch.image_url
      }
      return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
    })
  }

  const patchClientLogo = (secId, itemIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.items || prev[secId]?.logos || defaultClientLogoItems()
      const items = defaultClientLogoItems().map((_, i) => ({ ...(source[i] || {}) }))
      items[itemIndex] = { ...items[itemIndex], ...patch }
      if (patch.image_url && !/^data:|^blob:/i.test(patch.image_url)) {
        items[itemIndex].image_preview = ''
        items[itemIndex].image = patch.image_url
        items[itemIndex].img = patch.image_url
        items[itemIndex].logo = patch.image_url
      }
      return { ...prev, [secId]: { ...(prev[secId] || {}), items } }
    })
  }

  const patchYear = (secId, yearIndex, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.years || prev[secId]?.items || defaultCompanyHistoryYears()
      const years = defaultCompanyHistoryYears().map((_, i) => ({ ...(source[i] || {}) }))
      years[yearIndex] = { ...years[yearIndex], ...patch }
      if (patch.image_url && !/^data:|^blob:/i.test(patch.image_url)) {
        years[yearIndex].image_preview = ''
        years[yearIndex].image = patch.image_url
        years[yearIndex].img = patch.image_url
      }
      return { ...prev, [secId]: { ...(prev[secId] || {}), years } }
    })
  }

  const patchGauge = (secId, index, patch) => {
    setSectionEdits((prev) => {
      const source = prev[secId]?.gauges || defaultAboutGauges()
      const gauges = [0, 1].map((i) => ({ ...(source[i] || {}) }))
      gauges[index] = { ...gauges[index], ...patch }
      return {
        ...prev,
        [secId]: {
          ...(prev[secId] || {}),
          gauges,
          percent_1: gauges[0].value,
          percent_1_text: gauges[0].label,
          percent_2: gauges[1].value,
          percent_2_text: gauges[1].label,
          percentage_1: gauges[0].value,
          percentage_1_text: gauges[0].label,
          percentage_2: gauges[1].value,
          percentage_2_text: gauges[1].label,
        },
      }
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

    const batchPayload = checkedSectionIds.map(secId => {
      const section = sections.find(s => s.id === secId)
      const raw = sanitizeSectionContent(sectionEdits[secId] || {})
      const content = section && isFeaturedServicesSection(section.name)
        ? normalizeFeaturedServicesEditorContent(raw)
        : section && isAnnualProgressionSection(section.name)
          ? normalizeAnnualProgressionEditorContent(raw)
          : section && isPortfolioSection(section.name)
            ? normalizePortfolioEditorContent(raw)
            : section && isBranchesSection(section.name)
              ? normalizeBranchesEditorContent(raw)
              : section && isCounterStatsSection(section.name)
                ? normalizeCounterStatsEditorContent(raw)
                : section && isTestimonialsSection(section.name)
                  ? normalizeTestimonialsEditorContent(raw)
                  : section && isLatestNewsSection(section.name)
                    ? normalizeLatestNewsEditorContent(raw)
                    : section && isClientLogosSection(section.name)
                      ? normalizeClientLogosEditorContent(raw)
                      : section && isCtaBannerSection(section.name)
                        ? normalizeCtaBannerEditorContent(raw)
                        : raw
      return {
        section_id: secId,
        proposed_content: JSON.stringify(content, null, 2)
      }
    })

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
  const visibleSections = [...sections]
    .filter((s) => isAdvisorVisibleSection(s.name))
    .sort((a, b) => advisorSectionOrder(a.name) - advisorSectionOrder(b.name))

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

                  <div className="flex flex-col gap-3">
                    {visibleSections.map(section => {
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
                      const section = visibleSections.find(s => s.id === secId)
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
                                    <p className="text-xs text-gray-600">
                                      This section has no button. Edit the headings, photo (upload or pick), two percentage + text items, and the red box.
                                    </p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
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
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text (bold)</label>
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

                                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h5 className="text-sm font-bold text-[#0B1B3D] mb-4">Image</h5>
                                    <div className="space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="block text-xs font-extrabold text-[#0B1B3D]">About Image</label>
                                        {displayImagePath(values.image_url) && (
                                          <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full truncate max-w-xs">
                                            {selectedLocalValue(values.image_url, localImages) || displayImagePath(values.image_url)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="grid md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image File</label>
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
                                  </div>

                                  {[0, 1].map((gaugeIndex) => {
                                    const gauge = (values.gauges && values.gauges[gaugeIndex]) || {}
                                    return (
                                      <div key={gaugeIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{gaugeIndex + 1}</span>
                                          Percentage {gaugeIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Percentage</label>
                                            <input
                                              type="text"
                                              value={gauge.value || ''}
                                              onChange={(e) => patchGauge(secId, gaugeIndex, { value: e.target.value })}
                                              placeholder={gaugeIndex === 0 ? '50%' : '75%'}
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
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

                                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h5 className="text-sm font-bold text-[#0B1B3D] mb-4">Red box</h5>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Number in red box</label>
                                        <input
                                          type="text"
                                          value={values.experience_years || ''}
                                          onChange={(e) => handleFieldValueChange(secId, 'experience_years', e.target.value)}
                                          placeholder="10+"
                                          className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Text in red box</label>
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
                              ) : isCompanyHistorySection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Company History</h4>
                                    <p className="text-xs text-gray-600">Edit the red subheading, heading, intro text, and the six year milestones.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || values.eyebrow || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="OUR JOURNEY"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none text-[#C8102E] font-bold tracking-wider uppercase"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="Our Company History"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="A decade of growth, innovation, and unwavering commitment to client success."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2, 3, 4, 5].map((yearIndex) => {
                                    const yearItem = (values.years && values.years[yearIndex]) || {}
                                    const yearImage = yearItem.image_url || yearItem.img || yearItem.image || ''
                                    return (
                                      <div key={yearIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{yearIndex + 1}</span>
                                          Year {yearIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                                            <input
                                              type="text"
                                              value={yearItem.year || ''}
                                              onChange={(e) => patchYear(secId, yearIndex, { year: e.target.value })}
                                              placeholder="2020"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Red text</label>
                                            <input
                                              type="text"
                                              value={yearItem.red_text || ''}
                                              onChange={(e) => patchYear(secId, yearIndex, { red_text: e.target.value })}
                                              placeholder="2020 Milestone"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none text-[#C8102E] font-bold"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Grey text</label>
                                            <input
                                              type="text"
                                              value={yearItem.grey_text || ''}
                                              onChange={(e) => patchYear(secId, yearIndex, { grey_text: e.target.value })}
                                              placeholder="Company Founded"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none text-gray-500"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                            <input
                                              type="text"
                                              value={yearItem.heading || yearItem.title || ''}
                                              onChange={(e) => patchYear(secId, yearIndex, { heading: e.target.value })}
                                              placeholder="Started Business"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                            />
                                          </div>
                                          <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Image</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`year-${secId}-${yearIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleYearImageUpload(secId, yearIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`year-${secId}-${yearIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`year-${secId}-${yearIndex}`] || editorPreviewSrc(displayImagePath(yearImage), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`year-${secId}-${yearIndex}`] || editorPreviewSrc(displayImagePath(yearImage), localImages)}
                                                    alt={`Year ${yearIndex + 1} preview`}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(yearImage, localImages)}
                                                  onChange={(e) => patchYear(secId, yearIndex, { image_url: e.target.value })}
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
                                              value={displayImagePath(yearImage)}
                                              onChange={(e) => patchYear(secId, yearIndex, { image_url: e.target.value })}
                                              placeholder="intime-06 or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                            <textarea
                                              rows={3}
                                              value={yearItem.text || ''}
                                              onChange={(e) => patchYear(secId, yearIndex, { text: e.target.value })}
                                              placeholder="Milestone description..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isFeaturedServicesSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Featured Services</h4>
                                    <p className="text-xs text-gray-600">Edit the red subheading, heading, intro text, and the six service boxes (icon, heading, text, button).</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="FEATURED SERVICES"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="We help to get Solutions!"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="Provide users with appropriate view and access permissions..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2, 3, 4, 5].map((boxIndex) => {
                                    const box = (values.boxes && values.boxes[boxIndex]) || {}
                                    return (
                                      <div key={boxIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{boxIndex + 1}</span>
                                          Box {boxIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Icon</label>
                                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                                              {SERVICE_ICON_OPTIONS.map((opt) => {
                                                const selected = (box.icon || '') === opt.value
                                                const Icon = opt.Icon
                                                return (
                                                  <button
                                                    key={opt.value}
                                                    type="button"
                                                    title={opt.label}
                                                    onClick={() => patchServiceBox(secId, boxIndex, { icon: opt.value })}
                                                    className={`h-10 rounded-lg border flex items-center justify-center transition ${
                                                      selected
                                                        ? 'border-[#0B1B3D] bg-[#0B1B3D] text-white'
                                                        : 'border-gray-200 bg-white text-[#0B1B3D] hover:border-gray-400'
                                                    }`}
                                                  >
                                                    <Icon size={16} />
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                            <input
                                              type="text"
                                              value={box.heading || box.title || ''}
                                              onChange={(e) => patchServiceBox(secId, boxIndex, { heading: e.target.value })}
                                              placeholder="Strategy & Planning"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                            <textarea
                                              rows={2}
                                              value={box.text || ''}
                                              onChange={(e) => patchServiceBox(secId, boxIndex, { text: e.target.value })}
                                              placeholder="Box description..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button text</label>
                                            <input
                                              type="text"
                                              value={box.button_text || ''}
                                              onChange={(e) => patchServiceBox(secId, boxIndex, { button_text: e.target.value })}
                                              placeholder="Read more"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button URL</label>
                                            <input
                                              type="text"
                                              value={box.button_url || box.url || ''}
                                              onChange={(e) => patchServiceBox(secId, boxIndex, { button_url: e.target.value })}
                                              placeholder="#services"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isAnnualProgressionSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Annual Progression</h4>
                                    <p className="text-xs text-gray-600">Edit the red subheading, heading, intro text, three progress bars, and two highlight cards.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="ANNUAL PROGRESSION"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="Our Business Growth is Really Incredible!"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="We love what we do and we do it with passion..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2].map((barIndex) => {
                                    const bar = (values.bars && values.bars[barIndex]) || {}
                                    return (
                                      <div key={barIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{barIndex + 1}</span>
                                          Progress bar {barIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-3 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Label</label>
                                            <input
                                              type="text"
                                              value={bar.label || ''}
                                              onChange={(e) => patchProgressBar(secId, barIndex, { label: e.target.value })}
                                              placeholder="Business growth"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                                            <input
                                              type="text"
                                              value={bar.year || ''}
                                              onChange={(e) => patchProgressBar(secId, barIndex, { year: e.target.value })}
                                              placeholder="2018"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Percent</label>
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={bar.pct ?? ''}
                                              onChange={(e) => patchProgressBar(secId, barIndex, { pct: parseProgressPct(e.target.value, 0) })}
                                              placeholder="70"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {[0, 1].map((highlightIndex) => {
                                    const item = (values.highlights && values.highlights[highlightIndex]) || {}
                                    return (
                                      <div key={highlightIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center text-xs">{highlightIndex + 1}</span>
                                          Highlight {highlightIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Icon</label>
                                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                                              {SERVICE_ICON_OPTIONS.map((opt) => {
                                                const selected = (item.icon || '') === opt.value
                                                const Icon = opt.Icon
                                                return (
                                                  <button
                                                    key={opt.value}
                                                    type="button"
                                                    title={opt.label}
                                                    onClick={() => patchProgressHighlight(secId, highlightIndex, { icon: opt.value })}
                                                    className={`h-10 rounded-lg border flex items-center justify-center transition ${
                                                      selected
                                                        ? 'border-[#0B1B3D] bg-[#0B1B3D] text-white'
                                                        : 'border-gray-200 bg-white text-[#0B1B3D] hover:border-gray-400'
                                                    }`}
                                                  >
                                                    <Icon size={16} />
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                            <input
                                              type="text"
                                              value={item.heading || item.title || ''}
                                              onChange={(e) => patchProgressHighlight(secId, highlightIndex, { heading: e.target.value })}
                                              placeholder="Risk Free"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                            <textarea
                                              rows={2}
                                              value={item.text || ''}
                                              onChange={(e) => patchProgressHighlight(secId, highlightIndex, { text: e.target.value })}
                                              placeholder="Highlight description..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isPortfolioSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Portfolio Section</h4>
                                    <p className="text-xs text-gray-600">Edit the red subheading, heading, and the six project cards (image, category, heading, button).</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="COMPLETED PROJECTS"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="You can check our projects as inspirations."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2, 3, 4, 5].map((itemIndex) => {
                                    const item = (values.items && values.items[itemIndex]) || {}
                                    const itemImage = item.image_url || item.img || item.image || ''
                                    return (
                                      <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{itemIndex + 1}</span>
                                          Project {itemIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Image</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`portfolio-${secId}-${itemIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handlePortfolioItemImageUpload(secId, itemIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`portfolio-${secId}-${itemIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`portfolio-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(itemImage), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`portfolio-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(itemImage), localImages)}
                                                    alt={`Project ${itemIndex + 1} preview`}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(itemImage, localImages)}
                                                  onChange={(e) => patchPortfolioItem(secId, itemIndex, { image_url: e.target.value })}
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
                                              value={displayImagePath(itemImage)}
                                              onChange={(e) => patchPortfolioItem(secId, itemIndex, { image_url: e.target.value })}
                                              placeholder="intime-12 or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                                            <input
                                              type="text"
                                              value={item.category || item.cat || ''}
                                              onChange={(e) => patchPortfolioItem(secId, itemIndex, { category: e.target.value })}
                                              placeholder="Business Strategy"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                            <input
                                              type="text"
                                              value={item.heading || item.title || ''}
                                              onChange={(e) => patchPortfolioItem(secId, itemIndex, { heading: e.target.value })}
                                              placeholder="Market Expansion"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button text</label>
                                            <input
                                              type="text"
                                              value={item.button_text || ''}
                                              onChange={(e) => patchPortfolioItem(secId, itemIndex, { button_text: e.target.value })}
                                              placeholder="Read more"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button URL</label>
                                            <input
                                              type="text"
                                              value={item.button_url || item.url || ''}
                                              onChange={(e) => patchPortfolioItem(secId, itemIndex, { button_url: e.target.value })}
                                              placeholder="#portfolio"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isBranchesSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Branches and Appointment</h4>
                                    <p className="text-xs text-gray-600">Edit the heading copy, map image, form labels, stats overlay, and the four branch cards.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="GET IN TOUCH"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="We are Connected All Time to Help Your Business!"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Text</label>
                                      <textarea
                                        rows={3}
                                        value={values.text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'text', e.target.value)}
                                        placeholder="We understand the importance of approaching each work integrally..."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Form heading</label>
                                      <input
                                        type="text"
                                        value={values.form_heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'form_heading', e.target.value)}
                                        placeholder="Book an appionment"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Button text</label>
                                      <input
                                        type="text"
                                        value={values.button_text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'button_text', e.target.value)}
                                        placeholder="SEND YOUR MESSAGE"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Branches label</label>
                                      <input
                                        type="text"
                                        value={values.branches_label || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'branches_label', e.target.value)}
                                        placeholder="Main Branches:"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Stat value</label>
                                      <input
                                        type="text"
                                        value={values.stat_value || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'stat_value', e.target.value)}
                                        placeholder="12+"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Stat label</label>
                                      <input
                                        type="text"
                                        value={values.stat_label || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'stat_label', e.target.value)}
                                        placeholder="Branches"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                      <label className="block text-xs font-extrabold text-[#0B1B3D]">Map image</label>
                                      <div className="grid md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingState[`branches-map-${secId}`]}
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                handleBranchesMapUpload(secId, e.target.files[0])
                                              }
                                            }}
                                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                          />
                                          {uploadingState[`branches-map-${secId}`] && (
                                            <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                          )}
                                          {(localPreviewUrls[`branches-map-${secId}`] || editorPreviewSrc(displayImagePath(values.map_image), localImages)) && (
                                            <img
                                              src={localPreviewUrls[`branches-map-${secId}`] || editorPreviewSrc(displayImagePath(values.map_image), localImages)}
                                              alt="Map preview"
                                              className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                            />
                                          )}
                                        </div>
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                          <select
                                            value={selectedLocalValue(values.map_image, localImages)}
                                            onChange={(e) => handleFieldValueChange(secId, 'map_image', e.target.value)}
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
                                        value={displayImagePath(values.map_image)}
                                        onChange={(e) => handleFieldValueChange(secId, 'map_image', e.target.value)}
                                        placeholder="maps-point or /uploads/image.jpg"
                                        className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2, 3].map((itemIndex) => {
                                    const item = (values.items && values.items[itemIndex]) || {}
                                    return (
                                      <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{itemIndex + 1}</span>
                                          Branch {itemIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                                            <input
                                              type="text"
                                              value={item.name || item.heading || ''}
                                              onChange={(e) => patchBranch(secId, itemIndex, { name: e.target.value })}
                                              placeholder="Sydney (Head Office)"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                                            <textarea
                                              rows={2}
                                              value={item.address || ''}
                                              onChange={(e) => patchBranch(secId, itemIndex, { address: e.target.value })}
                                              placeholder="1 Epping Road, North Ryde, NSW 2113"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                                            <input
                                              type="text"
                                              value={item.phone || ''}
                                              onChange={(e) => patchBranch(secId, itemIndex, { phone: e.target.value })}
                                              placeholder="+61 2 9870 7689"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                                            <input
                                              type="text"
                                              value={item.email || ''}
                                              onChange={(e) => patchBranch(secId, itemIndex, { email: e.target.value })}
                                              placeholder="email@example.com"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isCounterStatsSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Counter Stats</h4>
                                    <p className="text-xs text-gray-600">Edit the four stat cards shown in the red gradient band — icon, number, label, and description.</p>
                                  </div>

                                  {[0, 1, 2, 3].map((statIndex) => {
                                    const stat = (values.stats && values.stats[statIndex]) || {}
                                    return (
                                      <div key={statIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{statIndex + 1}</span>
                                          Stat {statIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Icon</label>
                                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                                              {STAT_ICON_OPTIONS.map((opt) => {
                                                const selected = (stat.icon || '') === opt.value
                                                const Icon = opt.Icon
                                                return (
                                                  <button
                                                    key={opt.value}
                                                    type="button"
                                                    title={opt.label}
                                                    onClick={() => patchCounterStat(secId, statIndex, { icon: opt.value })}
                                                    className={`h-10 rounded-lg border flex items-center justify-center transition ${
                                                      selected
                                                        ? 'border-[#0B1B3D] bg-[#0B1B3D] text-white'
                                                        : 'border-gray-200 bg-white text-[#0B1B3D] hover:border-gray-400'
                                                    }`}
                                                  >
                                                    <Icon size={16} />
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Value</label>
                                            <input
                                              type="text"
                                              value={stat.value || stat.number || ''}
                                              onChange={(e) => patchCounterStat(secId, statIndex, { value: e.target.value })}
                                              placeholder="2,800+"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Label</label>
                                            <input
                                              type="text"
                                              value={stat.label || stat.title || ''}
                                              onChange={(e) => patchCounterStat(secId, statIndex, { label: e.target.value })}
                                              placeholder="Active Clients"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                                            <textarea
                                              rows={2}
                                              value={stat.sub || stat.desc || ''}
                                              onChange={(e) => patchCounterStat(secId, statIndex, { sub: e.target.value })}
                                              placeholder="Empowering businesses globally with passion and proven expertise."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isTestimonialsSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Testimonials Carousel</h4>
                                    <p className="text-xs text-gray-600">Edit the section heading, side image, and three client testimonial slides.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Eyebrow (red tagline)</label>
                                      <input
                                        type="text"
                                        value={values.eyebrow || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'eyebrow', e.target.value)}
                                        placeholder="CLIENT'S TESTIMONIALS"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="We are Very Happy to Get Our Client's Reviews."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Reviews label (red)</label>
                                      <input
                                        type="text"
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="Clients Reviews:"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2 space-y-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-sm">
                                      <label className="block text-xs font-extrabold text-[#0B1B3D]">Side image (right column)</label>
                                      <div className="grid md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 border p-2.5 rounded-md">
                                          <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingState[`testimonials-side-${secId}`]}
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                handleTestimonialsSideImageUpload(secId, e.target.files[0])
                                              }
                                            }}
                                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                          />
                                          {uploadingState[`testimonials-side-${secId}`] && (
                                            <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                          )}
                                          {(localPreviewUrls[`testimonials-side-${secId}`] || editorPreviewSrc(displayImagePath(values.image_url), localImages)) && (
                                            <img
                                              src={localPreviewUrls[`testimonials-side-${secId}`] || editorPreviewSrc(displayImagePath(values.image_url), localImages)}
                                              alt="Side image preview"
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
                                        placeholder="intime-17 or /uploads/image.jpg"
                                        className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2].map((itemIndex) => {
                                    const item = (values.items && values.items[itemIndex]) || {}
                                    return (
                                      <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{itemIndex + 1}</span>
                                          Testimonial {itemIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Quote</label>
                                            <textarea
                                              rows={3}
                                              value={item.quote || item.text || ''}
                                              onChange={(e) => patchTestimonialItem(secId, itemIndex, { quote: e.target.value })}
                                              placeholder="Working with several word press themes..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                                            <input
                                              type="text"
                                              value={item.name || item.title || ''}
                                              onChange={(e) => patchTestimonialItem(secId, itemIndex, { name: e.target.value })}
                                              placeholder="Alina Lora"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                                            <input
                                              type="text"
                                              value={item.role || item.position || ''}
                                              onChange={(e) => patchTestimonialItem(secId, itemIndex, { role: e.target.value })}
                                              placeholder="Former Manager, Intime"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2 space-y-3 bg-white p-3 border border-gray-200 rounded-lg">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Avatar image</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`testimonial-${secId}-${itemIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleTestimonialItemImageUpload(secId, itemIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`testimonial-${secId}-${itemIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`testimonial-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`testimonial-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)}
                                                    alt={`Testimonial ${itemIndex + 1} avatar`}
                                                    className="mt-2 w-16 h-16 rounded-full object-cover border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(item.image_url, localImages)}
                                                  onChange={(e) => patchTestimonialItem(secId, itemIndex, { image_url: e.target.value })}
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
                                              value={displayImagePath(item.image_url)}
                                              onChange={(e) => patchTestimonialItem(secId, itemIndex, { image_url: e.target.value })}
                                              placeholder="testimonial-01 or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isLatestNewsSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Latest News</h4>
                                    <p className="text-xs text-gray-600">Edit the section heading and three blog post cards with date, author, category, title, excerpt, and image.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Eyebrow (red tagline)</label>
                                      <input
                                        type="text"
                                        value={values.eyebrow || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'eyebrow', e.target.value)}
                                        placeholder="OUR LATEST NEWS"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="Learn about our latest news from blog."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                  </div>

                                  {[0, 1, 2].map((itemIndex) => {
                                    const item = (values.items && values.items[itemIndex]) || {}
                                    return (
                                      <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{itemIndex + 1}</span>
                                          News Post {itemIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Date (day)</label>
                                            <input
                                              type="text"
                                              value={item.date || item.day || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { date: e.target.value })}
                                              placeholder="10"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Month label</label>
                                            <input
                                              type="text"
                                              value={item.month || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { month: e.target.value })}
                                              placeholder="Nov, 20"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Author</label>
                                            <input
                                              type="text"
                                              value={item.author || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { author: e.target.value })}
                                              placeholder="John Doe"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                                            <input
                                              type="text"
                                              value={item.cat || item.category || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { cat: e.target.value })}
                                              placeholder="Consulting"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                                            <input
                                              type="text"
                                              value={item.title || item.heading || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { title: e.target.value })}
                                              placeholder="We would love to share a similar experience"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Excerpt</label>
                                            <textarea
                                              rows={3}
                                              value={item.excerpt || item.text || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { excerpt: e.target.value })}
                                              placeholder="The theory was first published in 2008..."
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button text</label>
                                            <input
                                              type="text"
                                              value={item.button_text || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { button_text: e.target.value })}
                                              placeholder="Read more"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Button URL</label>
                                            <input
                                              type="text"
                                              value={item.button_url || item.url || ''}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { button_url: e.target.value })}
                                              placeholder="#news"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2 space-y-3 bg-white p-3 border border-gray-200 rounded-lg">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Featured image</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`latestnews-${secId}-${itemIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleLatestNewsItemImageUpload(secId, itemIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`latestnews-${secId}-${itemIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`latestnews-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`latestnews-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)}
                                                    alt={`News post ${itemIndex + 1}`}
                                                    className="mt-2 w-full h-24 object-cover rounded border border-gray-200"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(item.image_url, localImages)}
                                                  onChange={(e) => patchNewsItem(secId, itemIndex, { image_url: e.target.value })}
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
                                              value={displayImagePath(item.image_url)}
                                              onChange={(e) => patchNewsItem(secId, itemIndex, { image_url: e.target.value })}
                                              placeholder="intime-03 or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isClientLogosSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">Client Logos</h4>
                                    <p className="text-xs text-gray-600">Edit the five client logos shown in the grey band. Use a text label or upload a logo image for each slot.</p>
                                  </div>

                                  {[0, 1, 2, 3, 4].map((itemIndex) => {
                                    const item = (values.items && values.items[itemIndex]) || {}
                                    return (
                                      <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h5 className="text-sm font-bold text-[#0B1B3D] mb-4 flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs">{itemIndex + 1}</span>
                                          Logo {itemIndex + 1}
                                        </h5>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Text label (shown when no image)</label>
                                            <input
                                              type="text"
                                              value={item.name || item.label || ''}
                                              onChange={(e) => patchClientLogo(secId, itemIndex, { name: e.target.value })}
                                              placeholder="Google"
                                              className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                            />
                                          </div>
                                          <div className="md:col-span-2 space-y-3 bg-white p-3 border border-gray-200 rounded-lg">
                                            <label className="block text-xs font-extrabold text-[#0B1B3D]">Logo image (optional)</label>
                                            <div className="grid md:grid-cols-2 gap-3">
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">📁 Upload Custom Image</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={uploadingState[`clientlogo-${secId}-${itemIndex}`]}
                                                  onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      handleClientLogoImageUpload(secId, itemIndex, e.target.files[0])
                                                    }
                                                  }}
                                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-slate-800 cursor-pointer"
                                                />
                                                {uploadingState[`clientlogo-${secId}-${itemIndex}`] && (
                                                  <p className="text-[11px] text-blue-600 mt-1 font-semibold">⏳ Uploading image to server...</p>
                                                )}
                                                {(localPreviewUrls[`clientlogo-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)) && (
                                                  <img
                                                    src={localPreviewUrls[`clientlogo-${secId}-${itemIndex}`] || editorPreviewSrc(displayImagePath(item.image_url), localImages)}
                                                    alt={`Logo ${itemIndex + 1}`}
                                                    className="mt-2 h-10 w-auto max-w-[140px] object-contain"
                                                  />
                                                )}
                                              </div>
                                              <div className="bg-gray-50 border p-2.5 rounded-md">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">🎨 Or Select Local Template Image</label>
                                                <select
                                                  value={selectedLocalValue(item.image_url, localImages)}
                                                  onChange={(e) => patchClientLogo(secId, itemIndex, { image_url: e.target.value })}
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
                                              value={displayImagePath(item.image_url)}
                                              onChange={(e) => patchClientLogo(secId, itemIndex, { image_url: e.target.value })}
                                              placeholder="logo.png or /uploads/image.jpg"
                                              className="w-full text-xs p-2 border rounded focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : isCtaBannerSection(section.name) ? (
                                <div className="space-y-8">
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-[#0B1B3D] mb-2">CTA Banner</h4>
                                    <p className="text-xs text-gray-600">Edit the dark call-to-action strip — heading, supporting text, and button label/link.</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Heading</label>
                                      <input
                                        type="text"
                                        value={values.heading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'heading', e.target.value)}
                                        placeholder="Looking for the Best Business Consulting?"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none font-semibold text-[#0B1B3D]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Subheading</label>
                                      <textarea
                                        rows={2}
                                        value={values.subheading || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'subheading', e.target.value)}
                                        placeholder="As a web crawler expert, we will help to organize."
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Button text</label>
                                      <input
                                        type="text"
                                        value={values.button_text || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'button_text', e.target.value)}
                                        placeholder="GET A QUOTE"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Button URL</label>
                                      <input
                                        type="text"
                                        value={values.button_url || ''}
                                        onChange={(e) => handleFieldValueChange(secId, 'button_url', e.target.value)}
                                        placeholder="#appointment"
                                        className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none"
                                      />
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
                                data={{
                                  ...(isAboutSection(section.name)
                                    ? aboutPreviewPayload(values)
                                    : isCompanyHistorySection(section.name)
                                      ? companyHistoryPreviewPayload(values)
                                      : isFeaturedServicesSection(section.name)
                                        ? normalizeFeaturedServicesEditorContent(values)
                                        : isAnnualProgressionSection(section.name)
                                          ? normalizeAnnualProgressionEditorContent(values)
                                          : isPortfolioSection(section.name)
                                            ? portfolioPreviewPayload(values)
                                            : isBranchesSection(section.name)
                                              ? branchesPreviewPayload(values)
                                              : isCounterStatsSection(section.name)
                                                ? normalizeCounterStatsEditorContent(values)
                                                : isTestimonialsSection(section.name)
                                                  ? testimonialsPreviewPayload(values)
                                                  : isLatestNewsSection(section.name)
                                                    ? latestNewsPreviewPayload(values)
                                                    : isClientLogosSection(section.name)
                                                      ? clientLogosPreviewPayload(values)
                                                      : isCtaBannerSection(section.name)
                                                        ? normalizeCtaBannerEditorContent(values)
                                                        : values),
                                  preview_slide: previewSlide[secId] ?? 0,
                                }}
                                height={isWhatWeDoSection(section.name) || isAboutSection(section.name) || isCompanyHistorySection(section.name) || isFeaturedServicesSection(section.name) || isAnnualProgressionSection(section.name) || isPortfolioSection(section.name) || isBranchesSection(section.name) || isCounterStatsSection(section.name) || isTestimonialsSection(section.name) || isLatestNewsSection(section.name) || isClientLogosSection(section.name) || isCtaBannerSection(section.name) ? 720 : 520}
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