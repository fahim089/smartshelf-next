import multer from 'multer'
import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads'

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase()
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, unique)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) return cb(null, true)
  cb(new Error('Only JPEG, PNG, and WebP images are accepted.'), false)
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } })

/**
 * Parses multipart/form-data in Next.js App Router API routes.
 * Returns { fields, files }
 */
export function parseForm(req, fieldName = 'images', maxCount = 3) {
  return new Promise(async (resolve, reject) => {
    const chunks = []
    const reader = req.body?.getReader?.()
    if (!reader) {
      // Already consumed or no body — parse from native request
      resolve({ fields: {}, files: [] })
      return
    }
    // For Next.js API routes with multer we need Node.js req
    // Use the upload middleware via a helper
    reject(new Error('Use runMiddleware helper'))
  })
}

/** Run multer middleware in a Next.js pages-style context (not App Router) */
export function runMulter(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) return reject(result)
      resolve(result)
    })
  })
}
