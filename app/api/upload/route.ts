import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import { captureError } from '@/lib/sentry-helpers'
import { validateOrigin } from '@/lib/csrf' // [SECURITY FIX] CSRF check import


// [SECURITY FIX] Whitelist folder yang diizinkan
const ALLOWED_FOLDERS = [
    'Roxy-lay/products',
    'Roxy-lay/categories',
    'Roxy-lay/settings',
] as const

export async function POST(request: NextRequest) {
    // [SECURITY FIX] CSRF check
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json(
            { error: 'Tidak diizinkan' },
            { status: 401 }
        )
    }

    // [SECURITY FIX] Tambahkan role check
    if ((session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const folderInput = (formData.get('folder') as string) || 'Roxy-lay/products'

        // [SECURITY FIX] Validasi folder dari whitelist
        const folder = ALLOWED_FOLDERS.includes(folderInput as any)
            ? folderInput
            : 'Roxy-lay/products'

        if (!file) {
            return NextResponse.json(
                { error: 'File tidak ditemukan' },
                { status: 400 }
            )
        }

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Format file harus JPG, PNG, atau WebP' },
                { status: 400 }
            )
        }

        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Ukuran file maksimal 5MB' },
                { status: 400 }
            )
        }

        // Convert file ke base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

        // Upload ke Cloudinary
        const { url, publicId } = await uploadImage(base64, folder)

        return NextResponse.json({ url, publicId }, { status: 200 })
    } catch (error) {
        captureError(error, { endpoint: '/api/upload' })
        return NextResponse.json(
            { error: 'Gagal mengupload gambar' },
            { status: 500 }
        )
    }
}
