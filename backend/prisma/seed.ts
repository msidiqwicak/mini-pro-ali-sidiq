import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] as string,
});
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Categories ────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "concert" },
      update: {},
      create: { name: "Concert", slug: "concert" },
    }),
    prisma.category.upsert({
      where: { slug: "festival" },
      update: {},
      create: { name: "Festival", slug: "festival" },
    }),
    prisma.category.upsert({
      where: { slug: "jazz" },
      update: {},
      create: { name: "Jazz", slug: "jazz" },
    }),
    prisma.category.upsert({
      where: { slug: "electronic" },
      update: {},
      create: { name: "Electronic", slug: "electronic" },
    }),
    prisma.category.upsert({
      where: { slug: "indie" },
      update: {},
      create: { name: "Indie", slug: "indie" },
    }),
    prisma.category.upsert({
      where: { slug: "classical" },
      update: {},
      create: { name: "Classical", slug: "classical" },
    }),
    prisma.category.upsert({
      where: { slug: "hiphop" },
      update: {},
      create: { name: "Hip-Hop", slug: "hiphop" },
    }),
    prisma.category.upsert({
      where: { slug: "pop" },
      update: {},
      create: { name: "Pop", slug: "pop" },
    }),
  ]);

  console.log(`✅ ${categories.length} categories created`);

  // ─── Users ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const organizer1 = await prisma.user.upsert({
    where: { email: "organizer@soundwave.com" },
    update: {},
    create: {
      email: "organizer@soundwave.com",
      name: "SoundWave Events",
      passwordHash,
      role: "ORGANIZER",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
    },
  });

  const organizer2 = await prisma.user.upsert({
    where: { email: "organizer2@beatbox.com" },
    update: {},
    create: {
      email: "organizer2@beatbox.com",
      name: "BeatBox Productions",
      passwordHash,
      role: "ORGANIZER",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "customer@gmail.com" },
    update: {},
    create: {
      email: "customer@gmail.com",
      name: "Budi Santoso",
      passwordHash,
      role: "CUSTOMER",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "customer2@gmail.com" },
    update: {},
    create: {
      email: "customer2@gmail.com",
      name: "Siti Rahayu",
      passwordHash,
      role: "CUSTOMER",
      avatarUrl: "https://i.pravatar.cc/150?img=4",
    },
  });

  console.log(`✅ 4 users created`);

  // ─── Referral Codes ────────────────────────────────────────────
  await prisma.referralCode.upsert({
    where: { ownerId: organizer1.id },
    update: {},
    create: { code: "SOUND001", ownerId: organizer1.id },
  });
  await prisma.referralCode.upsert({
    where: { ownerId: customer1.id },
    update: {},
    create: { code: "BUDI2024", ownerId: customer1.id },
  });
  await prisma.referralCode.upsert({
    where: { ownerId: customer2.id },
    update: {},
    create: { code: "SITI2024", ownerId: customer2.id },
  });

  console.log("✅ Referral codes created");

  // ─── Events ────────────────────────────────────────────────────
  const concertCategory = categories.find((c) => c.slug === "concert")!;
  const festivalCategory = categories.find((c) => c.slug === "festival")!;
  const jazzCategory = categories.find((c) => c.slug === "jazz")!;
  const electronicCategory = categories.find((c) => c.slug === "electronic")!;
  const indieCategory = categories.find((c) => c.slug === "indie")!;
  const classicalCategory = categories.find((c) => c.slug === "classical")!;

  const event1 = await prisma.event.upsert({
    where: { slug: "soundwave-summer-concert-2025" },
    update: {},
    create: {
      organizerId: organizer1.id,
      categoryId: concertCategory.id,
      name: "SoundWave Summer Concert 2025",
      slug: "soundwave-summer-concert-2025",
      description:
        "Malam yang tak terlupakan bersama artis-artis terbaik Indonesia. SoundWave Summer Concert hadir dengan lineup spektakuler yang akan membuat kamu bergoyang sepanjang malam. Dipentaskan di Istora Senayan Jakarta, acara ini menampilkan panggung megah dengan teknologi terkini dan sound system kelas dunia. Siapkan dirimu untuk pengalaman konser terbaik tahun ini!",
      location: "Istora Senayan",
      city: "Jakarta",
      imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800",
      startDate: new Date("2025-08-15T19:00:00Z"),
      endDate: new Date("2025-08-15T23:00:00Z"),
      isFree: false,
      status: "PUBLISHED",
      totalSeats: 5000,
      soldSeats: 1200,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { slug: "jakarta-jazz-festival-2025" },
    update: {},
    create: {
      organizerId: organizer1.id,
      categoryId: jazzCategory.id,
      name: "Jakarta Jazz Festival 2025",
      slug: "jakarta-jazz-festival-2025",
      description:
        "Festival jazz bergengsi yang menampilkan musisi jazz kelas dunia dan lokal terbaik. Jakarta Jazz Festival 2025 hadir dengan tiga panggung berbeda di kawasan Ancol, menghadirkan lebih dari 50 penampil selama dua hari penuh. Nikmati alunan jazz yang memukau sambil menikmati kuliner khas Jakarta dan suasana malam yang romantis.",
      location: "Taman Impian Jaya Ancol",
      city: "Jakarta",
      imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
      startDate: new Date("2025-09-20T16:00:00Z"),
      endDate: new Date("2025-09-21T23:00:00Z"),
      isFree: false,
      status: "PUBLISHED",
      totalSeats: 8000,
      soldSeats: 3500,
    },
  });

  const event3 = await prisma.event.upsert({
    where: { slug: "bali-beat-festival-2025" },
    update: {},
    create: {
      organizerId: organizer2.id,
      categoryId: electronicCategory.id,
      name: "Bali Beat Festival 2025",
      slug: "bali-beat-festival-2025",
      description:
        "Festival musik elektronik terbesar di Asia Tenggara kembali hadir di surga pulau Bali. Bali Beat Festival 2025 menghadirkan DJ dan producer elektronik kelas dunia untuk tiga malam penuh hiburan tanpa henti. Dengan latar belakang pantai Seminyak yang eksotis, ini adalah festival yang wajib kamu hadiri tahun ini.",
      location: "Seminyak Beach Club",
      city: "Bali",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
      startDate: new Date("2025-10-10T20:00:00Z"),
      endDate: new Date("2025-10-12T06:00:00Z"),
      isFree: false,
      status: "PUBLISHED",
      totalSeats: 10000,
      soldSeats: 6800,
    },
  });

  const event4 = await prisma.event.upsert({
    where: { slug: "bandung-indie-fest-2025" },
    update: {},
    create: {
      organizerId: organizer2.id,
      categoryId: indieCategory.id,
      name: "Bandung Indie Fest 2025",
      slug: "bandung-indie-fest-2025",
      description:
        "Merayakan semangat musik indie Bandung yang telah melahirkan ratusan band berbakat. Bandung Indie Fest 2025 hadir sebagai platform bagi musisi indie lokal untuk unjuk kebolehan di hadapan ribuan penonton. Dengan suasana Kota Kembang yang sejuk dan nyaman, festival ini menjanjikan pengalaman yang otentik dan berkesan.",
      location: "Lapangan Gasibu",
      city: "Bandung",
      imageUrl: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800",
      startDate: new Date("2025-11-05T15:00:00Z"),
      endDate: new Date("2025-11-05T22:00:00Z"),
      isFree: false,
      status: "PUBLISHED",
      totalSeats: 3000,
      soldSeats: 450,
    },
  });

  const event5 = await prisma.event.upsert({
    where: { slug: "surabaya-classical-night-2025" },
    update: {},
    create: {
      organizerId: organizer1.id,
      categoryId: classicalCategory.id,
      name: "Surabaya Classical Night 2025",
      slug: "surabaya-classical-night-2025",
      description:
        "Malam konser musik klasik yang elegan dan memukau bersama Surabaya Philharmonic Orchestra. Merasakan keindahan karya-karya agung Mozart, Beethoven, dan Chopin yang dibawakan oleh musisi berkelas internasional di gedung bersejarah Balai Pemuda Surabaya. Dress code: smart casual.",
      location: "Balai Pemuda Surabaya",
      city: "Surabaya",
      imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
      startDate: new Date("2025-12-20T19:30:00Z"),
      endDate: new Date("2025-12-20T22:30:00Z"),
      isFree: false,
      status: "PUBLISHED",
      totalSeats: 800,
      soldSeats: 200,
    },
  });

  const event6 = await prisma.event.upsert({
    where: { slug: "free-music-in-the-park-jakarta" },
    update: {},
    create: {
      organizerId: organizer2.id,
      categoryId: festivalCategory.id,
      name: "Free Music in the Park Jakarta",
      slug: "free-music-in-the-park-jakarta",
      description:
        "Nikmati pertunjukan musik gratis di tengah kota Jakarta bersama keluarga dan sahabat. Acara rutin bulanan yang menampilkan musisi berbakat Jakarta di taman kota yang rindang. Bawa tikar, makanan favorit, dan nikmati sore hari yang menyenangkan bersama orang-orang terkasih.",
      location: "Taman Menteng",
      city: "Jakarta",
      imageUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800",
      startDate: new Date("2025-08-31T15:00:00Z"),
      endDate: new Date("2025-08-31T21:00:00Z"),
      isFree: true,
      status: "PUBLISHED",
      totalSeats: 2000,
      soldSeats: 0,
    },
  });

  console.log("✅ 6 events created");

  // ─── Ticket Types ──────────────────────────────────────────────
  await prisma.ticketType.createMany({
    skipDuplicates: true,
    data: [
      // Event 1: SoundWave Summer Concert
      {
        eventId: event1.id,
        name: "FESTIVAL",
        description: "Akses festival area",
        price: 250000,
        quota: 3000,
        sold: 800,
      },
      {
        eventId: event1.id,
        name: "VIP",
        description: "VIP area dengan akses eksklusif dan minuman gratis",
        price: 750000,
        quota: 1500,
        sold: 350,
      },
      {
        eventId: event1.id,
        name: "VVIP",
        description: "Meet & Greet + area premium + merchandise pack",
        price: 1500000,
        quota: 500,
        sold: 50,
      },

      // Event 2: Jakarta Jazz Festival
      {
        eventId: event2.id,
        name: "REGULER",
        description: "Akses semua stage selama 2 hari",
        price: 350000,
        quota: 5000,
        sold: 2500,
      },
      {
        eventId: event2.id,
        name: "PREMIUM",
        description: "Tribun premium dengan view terbaik",
        price: 650000,
        quota: 2000,
        sold: 800,
      },
      {
        eventId: event2.id,
        name: "JAZZ LOVERS",
        description: "Akses backstage + merchandise + meet artist",
        price: 1200000,
        quota: 1000,
        sold: 200,
      },

      // Event 3: Bali Beat Festival
      {
        eventId: event3.id,
        name: "GENERAL",
        description: "Akses festival 3 malam",
        price: 450000,
        quota: 7000,
        sold: 5000,
      },
      {
        eventId: event3.id,
        name: "VIP BEACH",
        description: "Beach VIP area + unlimited drinks",
        price: 1200000,
        quota: 2000,
        sold: 1500,
      },
      {
        eventId: event3.id,
        name: "ULTRA VIP",
        description: "Private villa access + all inclusive",
        price: 3500000,
        quota: 1000,
        sold: 300,
      },

      // Event 4: Bandung Indie Fest
      {
        eventId: event4.id,
        name: "REGULER",
        description: "Akses seluruh area festival",
        price: 150000,
        quota: 2500,
        sold: 400,
      },
      {
        eventId: event4.id,
        name: "EARLY BIRD",
        description: "Harga spesial early bird",
        price: 100000,
        quota: 500,
        sold: 50,
      },

      // Event 5: Classical Night
      {
        eventId: event5.id,
        name: "BALKON",
        description: "Kursi balkon",
        price: 200000,
        quota: 300,
        sold: 100,
      },
      {
        eventId: event5.id,
        name: "PARKET",
        description: "Kursi parket utama",
        price: 350000,
        quota: 400,
        sold: 90,
      },
      {
        eventId: event5.id,
        name: "FRONT ROW",
        description: "Kursi baris depan eksklusif",
        price: 600000,
        quota: 100,
        sold: 10,
      },

      // Event 6: Free Music
      {
        eventId: event6.id,
        name: "GRATIS",
        description: "Akses gratis, daftarkan dirimu!",
        price: 0,
        quota: 2000,
        sold: 0,
      },
    ],
  });

  console.log("✅ Ticket types created");

  // ─── Promotions ────────────────────────────────────────────────
  await prisma.promotion.createMany({
    skipDuplicates: true,
    data: [
      {
        eventId: event1.id,
        code: "EARLYBIRD25",
        type: "DATE_BASED_DISCOUNT",
        discountPercent: 25,
        maxUsage: 200,
        usedCount: 45,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-08-01"),
      },
      {
        eventId: event2.id,
        code: "JAZZ20",
        type: "DATE_BASED_DISCOUNT",
        discountPercent: 20,
        maxUsage: 100,
        usedCount: 30,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-09-10"),
      },
      {
        eventId: event3.id,
        code: "BALIBEACH10",
        type: "REFERRAL_VOUCHER",
        discountAmount: 100000,
        maxUsage: 500,
        usedCount: 120,
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-10-09"),
      },
    ],
  });

  console.log("✅ Promotions created");

  // ─── Reviews ───────────────────────────────────────────────────
  await prisma.review.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: customer1.id,
        eventId: event2.id,
        rating: 5,
        comment:
          "Festival jazz terbaik yang pernah saya hadiri! Lineup-nya luar biasa dan suasananya sangat meriah. Pasti akan datang lagi tahun depan!",
      },
      {
        userId: customer2.id,
        eventId: event1.id,
        rating: 4,
        comment:
          "Konser yang sangat memukau! Sound system kelas dunia dan penampilan artis yang energik. Sayang antrian masuk cukup panjang.",
      },
    ],
  });

  console.log("✅ Reviews created");
  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log(
    "   Organizer: organizer@soundwave.com / password123 (Role: ORGANIZER)"
  );
  console.log(
    "   Organizer2: organizer2@beatbox.com / password123 (Role: ORGANIZER)"
  );
  console.log(
    "   Customer: customer@gmail.com / password123 (Role: CUSTOMER)"
  );
  console.log(
    "   Customer2: customer2@gmail.com / password123 (Role: CUSTOMER)"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
