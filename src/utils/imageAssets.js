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

export function imageStem(path) {
  if (!path || typeof path !== 'string') return ''
  return path.split('/').pop().split('?')[0].replace(/\.[a-zA-Z0-9]+$/, '')
}

export function selectedLocalValue(path, catalog) {
  const stem = imageStem(path)
  return (catalog || []).some((p) => p.value === stem) ? stem : ''
}

export function displayImagePath(url) {
  if (!url || /^data:/i.test(url)) return ''
  return url
}

export function localThumbSrc(path, catalog) {
  const stem = imageStem(path)
  const hit = (catalog || []).find((p) => p.value === stem)
  if (!hit) return ''
  const file = hit.file || `${stem}.jpg`
  const base = import.meta.env.BASE_URL || '/'
  return `${base}assets/intime/${file}`.replace(/([^:]\/)\/+/g, '$1')
}

export function editorPreviewSrc(imagePath, catalog) {
  if (!imagePath) return ''
  if (/^(data:|blob:)/i.test(imagePath) || isUploadedAsset(imagePath) || /^https?:/i.test(imagePath)) {
    return absoluteAssetUrl(imagePath)
  }
  return localThumbSrc(imagePath, catalog)
}

export function templateThumbSrc(preset) {
  if (!preset) return ''
  const file = preset.file || `${preset.value}.jpg`
  const base = import.meta.env.BASE_URL || '/'
  return `${base}assets/intime/${file}`.replace(/([^:]\/)\/+/g, '$1')
}
