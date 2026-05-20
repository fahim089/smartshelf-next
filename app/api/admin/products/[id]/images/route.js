import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildImageUrl, fetchImages } from '@/lib/products'
import { ok, err, serverErr } from '@/lib/response'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads'

async function saveFile(file) {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  const ext      = path.extname(file.name).toLowerCase()
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  const filePath = path.join(UPLOAD_DIR, filename)
  const bytes    = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))
  return filename
}

export const POST = withAdmin(async (req, { params }) => {
  try {
    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) AS count FROM product_images WHERE product_id=?', [params.id]
    )
    const available = 3 - count
    if (available <= 0) return err('Product already has 3 images (maximum).')

    const formData = await req.formData()
    const files    = formData.getAll('images').filter(f => f instanceof File).slice(0, available)
    if (!files.length) return err('No images uploaded.')

    for (let i = 0; i < files.length; i++) {
      const filename = await saveFile(files[i])
      await db.execute(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
        [params.id, filename, count + i]
      )
    }
    const images = await fetchImages(params.id)
    return ok(images)
  } catch (e) { return serverErr(e) }
})
