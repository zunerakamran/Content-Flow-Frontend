import api from '../api/axios'

const API_BASE = String(api.defaults.baseURL || '').replace(/\/$/, '')

export function isUploadedAsset(url) {
  return typeof url === 'string' && (
    url.startsWith('/uploaded-images') ||
    url.includes('/uploaded-images/') ||
    url.startsWith('/uploads') ||
    url.includes('/uploads/')
  )
}

export function absoluteAssetUrl(url) {
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

export function defaultTemplatePreviewUrl(slug) {
  if (!slug) return ''
  return `https://epatronus.space/${String(slug).replace(/^\/+|\/+$/g, '')}/`
}
