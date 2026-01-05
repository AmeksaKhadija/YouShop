import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('AdminP@ss123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@youshop.com' },
    update: {},
    create: {
      email: 'admin@youshop.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create Client User
  const clientPassword = await bcrypt.hash('ClientP@ss123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@youshop.com' },
    update: {},
    create: {
      email: 'client@youshop.com',
      password: clientPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.CLIENT,
    },
  });
  console.log(`Created client user: ${client.email}`);

  // Create Categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and gadgets' },
    { name: 'Clothing', description: 'Fashion and apparel' },
    { name: 'Home & Garden', description: 'Home decor and gardening supplies' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
    { name: 'Books', description: 'Books and educational materials' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
    console.log(`Created category: ${category.name}`);
  }

  // Create Products with Inventory
  const products = [
    {
      name: 'iPhone 15 Pro',
      description: 'Latest Apple smartphone with A17 Pro chip',
      price: 999.99,
      categoryName: 'Electronics',
      sku: 'IPHONE-15-PRO',
      stock: 50,
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Samsung flagship with AI features',
      price: 899.99,
      categoryName: 'Electronics',
      sku: 'GALAXY-S24',
      stock: 75,
    },
    {
      name: 'MacBook Pro 14"',
      description: 'Powerful laptop for professionals',
      price: 1999.99,
      categoryName: 'Electronics',
      sku: 'MACBOOK-PRO-14',
      stock: 30,
    },
    {
      name: 'Nike Air Max',
      description: 'Comfortable running shoes',
      price: 129.99,
      categoryName: 'Sports',
      sku: 'NIKE-AIRMAX',
      stock: 100,
    },
    {
      name: 'Levi\'s 501 Jeans',
      description: 'Classic fit denim jeans',
      price: 79.99,
      categoryName: 'Clothing',
      sku: 'LEVIS-501',
      stock: 200,
    },
    {
      name: 'The Great Gatsby',
      description: 'Classic novel by F. Scott Fitzgerald',
      price: 14.99,
      categoryName: 'Books',
      sku: 'BOOK-GATSBY',
      stock: 150,
    },
    {
      name: 'Garden Tool Set',
      description: 'Complete set of gardening tools',
      price: 49.99,
      categoryName: 'Home & Garden',
      sku: 'GARDEN-TOOLS',
      stock: 80,
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Premium noise-canceling headphones',
      price: 349.99,
      categoryName: 'Electronics',
      sku: 'SONY-XM5',
      stock: 60,
    },
  ];

  for (const prod of products) {
    const category = createdCategories.find((c) => c.name === prod.categoryName);
    if (!category) continue;

    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        categoryId: category.id,
        inventory: {
          create: {
            sku: prod.sku,
            quantity: prod.stock,
            lowStockAlert: 10,
          },
        },
      },
    });
    console.log(`Created product: ${product.name} (SKU: ${prod.sku})`);
  }

  console.log('\nSeeding completed!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@youshop.com / AdminP@ss123');
  console.log('Client: client@youshop.com / ClientP@ss123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
