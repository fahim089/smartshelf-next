import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchImages } from '@/lib/products'
import { ok, notFound, serverErr } from '@/lib/response'
import { unlink } from 'fs/promises'
import path from 'path'

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const [rows] = await db.execute(
      'SELECT image_url FROM product_images WHERE id=? AND product_id=?',
      [params.imageId, params.id]
    )
    if (!rows.length) return notFound('Image not found.')

    // Delete file from disk — extract bare filename and use absolute path
    const filename = rows[0].image_url.replace(/.*[/\\]uploads[/\\]/, '').replace(/.*[/\\]/, '')
    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
    try { await unlink(path.join(UPLOAD_DIR, filename)) } catch {}

    await db.execute('DELETE FROM product_images WHERE id=?', [params.imageId])
    const images = await fetchImages(params.id)
    return ok(images)
  } catch (e) { return serverErr(e) }
})
