import { useState } from 'react'
import { absoluteAssetUrl, defaultTemplatePreviewUrl } from '../utils/assetUrl'

const IFRAME_WIDTH = 1280
const IFRAME_HEIGHT = 5000
const IFRAME_SCALE = 0.28

/**
 * Template card preview: shows a captured screenshot (or live iframe fallback)
 * and scrolls through the full page on hover.
 */
export default function TemplateScrollPreview({
  template,
  className = 'h-36',
  viewportHeight = '9rem',
  overlay,
}) {
  const name = template?.name || 'Template'
  const slug = template?.slug || ''
  const previewUrl = template?.preview_url || defaultTemplatePreviewUrl(slug)
  const thumbnailUrl = absoluteAssetUrl(template?.thumbnail_url)
  const [iframeFallback, setIframeFallback] = useState(!thumbnailUrl)

  const useIframe = iframeFallback && previewUrl

  return (
    <div
      className={`relative overflow-hidden bg-slate-800 group ${className}`}
      style={{ '--preview-viewport': viewportHeight }}
    >
      {useIframe ? (
        <div
          className="absolute top-0 left-0 transition-transform duration-[8000ms] ease-linear group-hover:-translate-y-[calc(100%-var(--preview-viewport))]"
          style={{
            width: IFRAME_WIDTH * IFRAME_SCALE,
            height: IFRAME_HEIGHT * IFRAME_SCALE,
          }}
        >
          <iframe
            src={previewUrl}
            title={`${name} preview`}
            loading="lazy"
            className="border-0 pointer-events-none origin-top-left"
            style={{
              width: IFRAME_WIDTH,
              height: IFRAME_HEIGHT,
              transform: `scale(${IFRAME_SCALE})`,
              transformOrigin: 'top left',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`${name} preview`}
          className="block w-full h-auto transition-transform duration-[6000ms] ease-linear group-hover:translate-y-[calc(-100%+var(--preview-viewport))]"
          onError={() => setIframeFallback(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400 font-mono text-xs text-center p-4">
          <span>🖼️ No Preview Available</span>
        </div>
      )}

      {overlay}

      {!useIframe && thumbnailUrl && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  )
}
