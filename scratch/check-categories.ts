import { prisma } from '../lib/prisma'

async function checkDb() {
  const categories = await prisma.category.findMany()
  console.log('Categories count:', categories.length)
  console.log('Categories:', categories)

  const productsCount = await prisma.product.count()
  console.log('Products count:', productsCount)
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
