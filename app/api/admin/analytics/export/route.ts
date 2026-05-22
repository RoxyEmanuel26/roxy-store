import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { viewCount: 'desc' }
        })

        // Generate CSV content
        let csvContent = 'ID,Nama Produk,Kategori,Harga,Views,Klik Shopee,Total Klik,Tanggal Dibuat\n'

        products.forEach(p => {
            const escapedTitle = p.title.replace(/"/g, '""')
            const totalClicks = p.shopeeClicks
            csvContent += `"${p.id}","${escapedTitle}","${p.category?.name || '-'}","${p.price}","${p.viewCount}","${p.shopeeClicks}","${totalClicks}","${p.createdAt.toISOString()}"\n`
        })

        const bom = '\uFEFF'
        const csvData = bom + csvContent

        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })
    } catch (error) {
        captureError(error, { endpoint: '/api/admin/analytics/export' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
