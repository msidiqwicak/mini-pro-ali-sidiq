import prisma from './src/lib/prisma.js';

async function run() {
  const organizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
  const category = await prisma.category.findFirst();

  if (!organizer || !category) {
    console.error('No organizer or category found!');
    return;
  }

  // Create an Event
  const event = await prisma.event.create({
    data: {
      name: 'Event Voucher Test Final',
      slug: 'event-voucher-test-final-' + Date.now(),
      description: 'Ini adalah event untuk mengetes voucher secara end-to-end dengan sangat mendalam.',
      location: 'Test Venue',
      city: 'Jakarta',
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 172800000), // Day after tomorrow
      isFree: false,
      status: 'PUBLISHED',
      totalSeats: 100,
      organizerId: organizer.id,
      categoryId: category.id,
      ticketTypes: {
        create: [
          {
            name: 'VVIP',
            price: 100000,
            quota: 100,
          }
        ]
      },
      promotions: {
        create: [
          {
            code: 'TEST10',
            type: 'DATE_BASED_DISCOUNT', // using DATE_BASED_DISCOUNT based on enum PromotionType
            discountPercent: 10,
            maxUsage: 100,
            startDate: new Date(Date.now() - 86400000), // yesterday
            endDate: new Date(Date.now() + 604800000), // next week
          }
        ]
      }
    }
  });

  console.log('✅ Created dummy event:', event.slug);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
