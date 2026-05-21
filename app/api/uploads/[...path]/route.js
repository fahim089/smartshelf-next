import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(req, { params }) {
  try {
    const filename = params.path.join('/')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath   = path.join(uploadsDir, filename)

    // Security: prevent path traversal
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (!existsSync(filePath)) {
      return new NextResponse('Not found', { status: 404 })
    }

    const file = await readFile(filePath)
    const ext  = path.extname(filePath).toLowerCase()
    const mime = {
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.webp': 'image/webp',
      '.gif':  'image/gif',
    }[ext] || 'application/octet-stream'

    return new NextResponse(file, {
      headers: {
        'Content-Type':  mime,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      }
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}