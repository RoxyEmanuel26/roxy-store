import { ProductRepository } from '@/repositories/product.repository'

export class ProductService {
    private productRepository: ProductRepository

    constructor() {
        this.productRepository = new ProductRepository()
    }

    async getSearchProducts(query: string, take: number = 50) {
        return await this.productRepository.findActiveProductsWithSearch(query, take)
    }

    async trackProductView(id: string) {
        return await this.productRepository.incrementViewCount(id)
    }

    async getPaginatedList(searchParams: URLSearchParams) {
        const q = searchParams.get('q') || ''
        const category = searchParams.get('category') || searchParams.get('kategori') || ''
        const badge = searchParams.get('badge') || ''
        const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
        const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
        const sort = searchParams.get('sort') || 'newest'
        const page = Math.max(1, Number(searchParams.get('page')) || 1)
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 12))

        const { products, total } = await this.productRepository.getProductList({
            query: q,
            categorySlug: category,
            badge,
            minPrice,
            maxPrice,
            sort,
            page,
            limit,
        })

        return { products, total, page }
    }
}

export const productService = new ProductService()
