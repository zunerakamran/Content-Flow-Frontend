import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const localTemplateImages = path.resolve(__dirname, 'src/templates/template4/assets/images')
const siblingTemplateImages = path.resolve(__dirname, '../template4/src/assets/images')

const TEMPLATE4_IMAGES = fs.existsSync(localTemplateImages)
  ? localTemplateImages
  : siblingTemplateImages

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}

function listLocalTemplateImages() {
  if (!fs.existsSync(TEMPLATE4_IMAGES)) return []
  return fs.readdirSync(TEMPLATE4_IMAGES)
    .filter((name) => MIME[path.extname(name).toLowerCase()])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => ({
      label: name.replace(/\.[^.]+$/, ''),
      value: name.replace(/\.[^.]+$/, ''),
      file: name,
    }))
}

/**
 * Dev server plugin: serves /assets/intime/* from
 * template4 assets folder without needing files in /public.
 *
 * Production: Vite's build copies everything returned by generateBundle.
 * We use a writeBundle hook to copy files after build completes.
 */
function template4AssetsPlugin() {
  return {
    name: 'template4-assets',

    // DEV: intercept /assets/intime/* requests and serve from template4 folder
    configureServer(server) {
      server.middlewares.use('/assets/intime', (req, res, next) => {
        if (!fs.existsSync(TEMPLATE4_IMAGES)) return next()
        const urlPath = decodeURIComponent((req.url || '').split('?')[0] || '').replace(/^\//, '')
        if (urlPath === 'index.json') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listLocalTemplateImages()))
          return
        }
        const filePath = path.join(TEMPLATE4_IMAGES, urlPath)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase()
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=31536000')
          fs.createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },

    // PRODUCTION: after build, copy images to dist/assets/intime/
    writeBundle(options) {
      if (!fs.existsSync(TEMPLATE4_IMAGES)) {
        console.warn(`⚠️ Warning: TEMPLATE4_IMAGES directory not found at ${TEMPLATE4_IMAGES}. Skipping image copy.`)
        return
      }

      const outDir = options.dir || 'dist'
      const destDir = path.resolve(outDir, 'assets', 'intime')

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      function copyDir(src, dest) {
        if (!fs.existsSync(src)) return
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }

      copyDir(TEMPLATE4_IMAGES, destDir)
      fs.writeFileSync(
        path.join(destDir, 'index.json'),
        JSON.stringify(listLocalTemplateImages())
      )
      console.log(`✅ Copied template4 images → ${destDir}`)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      template4AssetsPlugin(),
    ],
  }
})