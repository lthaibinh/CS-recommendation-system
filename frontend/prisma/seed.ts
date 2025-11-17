import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurantTable.deleteMany();

  // Create Menu Categories
  console.log('📋 Creating menu categories...');
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: 'Appetizers',
      description: 'Start your meal with our delicious appetizers',
    },
  });

  const hotpot = await prisma.menuCategory.create({
    data: {
      name: 'Hotpot',
      description: 'Fresh ingredients for your hotpot experience',
    },
  });

  const beverages = await prisma.menuCategory.create({
    data: {
      name: 'Beverages',
      description: 'Drinks to complement your meal',
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      description: 'Sweet endings to your dining experience',
    },
  });

  console.log('✅ Created 4 menu categories');

  // Create Menu Items
  console.log('🍽️  Creating menu items...');
  
  // Appetizers
  const appetizersItems = await prisma.menuItem.createMany({
    data: [
      {
        categoryId: appetizers.id,
        name: 'Spring Rolls',
        description: 'Fresh vegetable spring rolls with dipping sauce',
        price: 5.99,
        imageUrl: '/images/spring-rolls.jpg',
        isAvailable: true,
      },
      {
        categoryId: appetizers.id,
        name: 'Fried Dumplings',
        description: 'Crispy pork dumplings',
        price: 6.99,
        imageUrl: '/images/dumplings.jpg',
        isAvailable: true,
      },
      {
        categoryId: appetizers.id,
        name: 'Edamame',
        description: 'Steamed young soybeans with sea salt',
        price: 4.99,
        imageUrl: '/images/edamame.jpg',
        isAvailable: true,
      },
    ],
  });

  // Hotpot Items
  const hotpotItems = await prisma.menuItem.createMany({
    data: [
      {
        categoryId: hotpot.id,
        name: 'Premium Beef Slices',
        description: 'Thinly sliced premium beef for hotpot',
        price: 12.99,
        imageUrl: '/images/beef.jpg',
        isAvailable: true,
      },
      {
        categoryId: hotpot.id,
        name: 'Fresh Shrimp',
        description: 'Large fresh shrimp, peeled and deveined',
        price: 10.99,
        imageUrl: '/images/shrimp.jpg',
        isAvailable: true,
      },
      {
        categoryId: hotpot.id,
        name: 'Mixed Vegetables',
        description: 'Assorted fresh vegetables including bok choy, mushrooms, and napa cabbage',
        price: 6.99,
        imageUrl: '/images/vegetables.jpg',
        isAvailable: true,
      },
      {
        categoryId: hotpot.id,
        name: 'Fish Balls',
        description: 'Handmade fish balls',
        price: 7.99,
        imageUrl: '/images/fishballs.jpg',
        isAvailable: true,
      },
      {
        categoryId: hotpot.id,
        name: 'Udon Noodles',
        description: 'Fresh udon noodles for hotpot',
        price: 4.99,
        imageUrl: '/images/udon.jpg',
        isAvailable: true,
      },
      {
        categoryId: hotpot.id,
        name: 'Tofu',
        description: 'Silken tofu cubes',
        price: 3.99,
        imageUrl: '/images/tofu.jpg',
        isAvailable: true,
      },
    ],
  });

  // Beverages
  const beveragesItems = await prisma.menuItem.createMany({
    data: [
      {
        categoryId: beverages.id,
        name: 'Green Tea',
        description: 'Hot or iced premium green tea',
        price: 2.99,
        imageUrl: '/images/green-tea.jpg',
        isAvailable: true,
      },
      {
        categoryId: beverages.id,
        name: 'Soft Drinks',
        description: 'Coke, Sprite, or Fanta',
        price: 2.50,
        imageUrl: '/images/soda.jpg',
        isAvailable: true,
      },
      {
        categoryId: beverages.id,
        name: 'Fresh Juice',
        description: 'Orange, apple, or mango juice',
        price: 4.99,
        imageUrl: '/images/juice.jpg',
        isAvailable: true,
      },
      {
        categoryId: beverages.id,
        name: 'Beer',
        description: 'Domestic or imported beer',
        price: 5.99,
        imageUrl: '/images/beer.jpg',
        isAvailable: true,
      },
    ],
  });

  // Desserts
  const dessertsItems = await prisma.menuItem.createMany({
    data: [
      {
        categoryId: desserts.id,
        name: 'Mochi Ice Cream',
        description: 'Japanese rice cake with ice cream filling',
        price: 4.99,
        imageUrl: '/images/mochi.jpg',
        isAvailable: true,
      },
      {
        categoryId: desserts.id,
        name: 'Fresh Fruit Platter',
        description: 'Seasonal fresh fruit selection',
        price: 6.99,
        imageUrl: '/images/fruit.jpg',
        isAvailable: true,
      },
    ],
  });

  const totalMenuItems =
    appetizersItems.count + hotpotItems.count + beveragesItems.count + dessertsItems.count;
  console.log(`✅ Created ${totalMenuItems} menu items`);

  // Create Restaurant Tables
  console.log('🪑 Creating restaurant tables...');
  const tablePromises = [];
  for (let i = 1; i <= 10; i++) {
    tablePromises.push(
      prisma.restaurantTable.create({
        data: {
          tableNumber: `T${String(i).padStart(2, '0')}`,
          qrCodeUrl: `/qr-codes/table-${i}.png`,
          status: 'AVAILABLE',
        },
      })
    );
  }
  await Promise.all(tablePromises);
  console.log('✅ Created 10 restaurant tables');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('   - Menu Categories: 4');
  console.log(`   - Menu Items: ${totalMenuItems}`);
  console.log('   - Restaurant Tables: 10');
  console.log('\n💡 You can now:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Test the API: node test-restaurant-api.js');
  console.log('   3. View data in Prisma Studio: npx prisma studio\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

