import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchImages } from '@/lib/products'
import { ok, notFound, serverErr } from '@/lib/response'

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const productId = parseInt(params.id)
    const imageId   = parseInt(params.imageId)
    const [r] = await db.execute(
      'DELETE FROM product_images WHERE id=? AND product_id=?',
      [imageId, productId]
    )
    if (!r.affectedRows) return notFound('Image not found.')
    const images = await fetchImages(productId)
    return ok(images)
  } catch (e) { return serverErr(e) }
})
