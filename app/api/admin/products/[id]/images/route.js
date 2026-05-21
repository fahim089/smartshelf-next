import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchImages } from '@/lib/products'
import { ok, err, serverErr } from '@/lib/response'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const POST = withAdmin(async (req, { params }) => {
  try {
    const productId  = params.id
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    // Ensure uploads directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) AS count FROM product_images WHERE product_id=?', [productId]
    )
    const available = 3 - parseInt(count)
    if (available <= 0) return err('Product already has 3 images (maximum).')

    const formData = await req.formData()
    const files    = formData.getAll('images').filter(f => f instanceof File).slice(0, available)
    if (!files.length) return err('No images uploaded.')

    for (let i = 0; i < files.length; i++) {
      const file     = files[i]
      const ext      = path.extname(file.name || '').toLowerCase() || '.jpg'
      const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${ext}`
      const dest     = path.join(uploadsDir, filename)
      const buffer   = Buffer.from(await file.arrayBuffer())

      await writeFile(dest, buffer)

      // Store only the bare filename in DB
      await db.execute(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?,?,?)',
        [productId, filename, String(parseInt(count) + i)]
      )
    }

    const images = await fetchImages(productId)
    return ok(images)
  } catch (e) {
    console.error('Image upload error:', e)
    return serverErr(e)
  }
})