import { CategoryRepository } from '@/repositories/category.repository'

export class CategoryService {
    private categoryRepository: CategoryRepository

    constructor() {
        this.categoryRepository = new CategoryRepository()
    }

    async getAllCategories() {
        return await this.categoryRepository.findAllCategories()
    }

    async getCategoryBySlug(slug: string) {
        return await this.categoryRepository.findCategoryBySlug(slug)
    }
}

export const categoryService = new CategoryService()
