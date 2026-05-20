import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchImages } from '@/lib/products'
import { ok, err, serverErr } from '@/lib/response'
import { writeFile } from 'fs/promises'
import path from 'path'

export const POST = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const formData = await req.formData()
    const files = formData.getAll('images')
    if (!files.length) return err('No images provided.')
    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) AS count FROM product_images WHERE product_id=?', [id]
    )
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext  = path.extname(file.name) || '.jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const dest = path.join(process.cwd(), 'public', 'uploads', filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(dest, buffer)
      await db.execute(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?,?,?)',
        [id, filename, parseInt(count) + i]
      )
    }
    const images = await fetchImages(id)
    return ok(images)
  } catch (e) { return serverErr(e) }
})
