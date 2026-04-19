# 🎵 SoundWave — Music Event Management Platform

Platform fullstack untuk menemukan dan mengelola event musik di Indonesia. Dibangun sebagai project bootcamp dengan arsitektur clean dan production-ready MVP.


---

## 📁 Struktur Folder

```
soundwave/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Definisi skema database (TIDAK DIUBAH)
│   │   └── seed.ts                # Data awal untuk development
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts             # Konfigurasi environment variables
│   │   ├── controllers/           # Handler HTTP request/response
│   │   │   ├── auth.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── services/              # Business logic utama
│   │   │   ├── auth.service.ts
│   │   │   ├── event.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── point.service.ts
│   │   │   └── review.service.ts
│   │   ├── repositories/          # Query database (Prisma)
│   │   │   ├── user.repository.ts
│   │   │   ├── event.repository.ts
│   │   │   ├── transaction.repository.ts
│   │   │   ├── review.repository.ts
│   │   │   └── dashboard.repository.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # Verifikasi JWT
│   │   │   └── role.middleware.ts  # Cek role CUSTOMER/ORGANIZER
│   │   ├── routes/                # Definisi endpoint API
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   ├── transaction.routes.ts
│   │   │   ├── review.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts             # Sign & verify token
│   │   │   ├── hash.ts            # bcryptjs password hash
│   │   │   ├── response.ts        # Format respons JSON konsisten
│   │   │   └── slug.ts            # Generator slug, referral code, QR code
│   │   ├── lib/
│   │   │   └── prisma.ts          # Singleton Prisma client
│   │   ├── app.ts                 # Setup Express + middleware
│   │   └── server.ts              # Entry point server
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma.config.ts
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/            # Komponen UI reusable
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   ├── EventCard.tsx
    │   │   ├── EventForm.tsx      # Form create/edit event
    │   │   ├── ReviewList.tsx
    │   │   ├── TicketSelector.tsx
    │   │   └── UIComponents.tsx   # SearchBar, Filter, Pagination, dll.
    │   ├── context/
    │   │   └── AuthContext.tsx    # Global auth state
    │   ├── hooks/
    │   │   └── useDebounce.ts     # Debounce 500ms untuk search
    │   ├── pages/
    │   │   ├── HomePage.tsx       # Landing page dengan event list
    │   │   ├── EventDetailPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── MyTicketsPage.tsx
    │   │   ├── TransactionHistoryPage.tsx
    │   │   └── dashboard/
    │   │       ├── DashboardLayout.tsx
    │   │       ├── DashboardOverview.tsx
    │   │       ├── ManageEvents.tsx
    │   │       ├── CreateEvent.tsx
    │   │       ├── EditEvent.tsx
    │   │       ├── DashboardTransactions.tsx
    │   │       └── DashboardAnalytics.tsx
    │   ├── router/
    │   │   └── AppRouter.tsx      # Route definitions + Protected routes
    │   ├── services/              # Axios API calls
    │   │   ├── api.ts             # Axios instance + interceptors
    │   │   ├── auth.service.ts
    │   │   ├── event.service.ts
    │   │   ├── transaction.service.ts
    │   │   ├── review.service.ts
    │   │   └── dashboard.service.ts
    │   ├── types/
    │   │   └── index.ts           # TypeScript interfaces
    │   ├── utils/
    │   │   └── helpers.ts         # Format currency, date, dll.
    │   ├── index.css              # Global styles + design tokens
    │   └── main.tsx               # Entry point React
    ├── package.json
    └── index.html
```

---

## 🚀 Cara Menjalankan

### 1. Setup Backend

```bash
cd backend

# Install dependencies
npm install
# Yang diinstall:
# - express v5: Framework HTTP server
# - @prisma/client: ORM untuk PostgreSQL
# - bcryptjs: Hash password
# - jsonwebtoken: Buat dan verifikasi JWT
# - cors: Izinkan request dari frontend
# - dotenv: Baca file .env
# - zod: Validasi input di server
# - redis: Akses layer caching
# - nodemailer: Kirim email notifikasi
# - qrcode: Generate QR code image
# - winston: Standardized logging

# Copy .env dan isi dengan kredensial Supabase kamu
cp .env.example .env

# Generate Prisma client (wajib sebelum jalankan server)
npm run db:generate

# Push schema ke database
npm run db:push

# Isi data awal (seed)
npm run db:seed

# Jalankan server development
npm run dev
# Server berjalan di http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
# Yang diinstall:
# - react-router-dom v7: Client-side routing
# - axios: HTTP client untuk panggil API backend
# - react-hook-form: Manajemen form yang efisien
# - @hookform/resolvers: Integrasi Zod dengan react-hook-form
# - zod: Validasi schema form di client
# - chart.js + react-chartjs-2: Chart analitik dashboard
# - lucide-react: Icon library
# - clsx + tailwind-merge: Utility class conditional

# Copy .env
cp .env.example .env

# Jalankan dev server
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## 🗄️ Database (Prisma + Supabase)

### Setup Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. Pergi ke **Settings → Database → Connection string**
3. Ambil **Transaction pooler** (port 6543) untuk `DATABASE_URL`
4. Ambil **Direct connection** (port 5432) untuk `DIRECT_URL`
5. Isi di `backend/.env`

### Isi `.env` Backend
```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# JWT Config
JWT_SECRET="buat-string-random-panjang-di-sini"
FRONTEND_URL="http://localhost:5173"

# Upstash Redis Config (Cloud Redis — tidak perlu container lokal)
UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# SMTP Email Config (contoh pakai Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="nama_user@gmail.com"
SMTP_PASS="password_aplikasi"
SMTP_FROM="reply@soundwave.com"
```

### Perintah Prisma yang Sering Dipakai

| Perintah | Fungsi |
|----------|--------|
| `npm run db:generate` | Generate Prisma Client dari schema |
| `npm run db:push` | Push schema ke DB tanpa migration |
| `npm run db:migrate` | Buat migration baru |
| `npm run db:seed` | Isi data awal |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login, dapat token JWT |
| GET | `/api/auth/me` | Ambil profil user (butuh token) |

### Events (Public)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/events` | Daftar event (pagination, search, filter) |
| GET | `/api/events/cities` | Daftar kota tersedia |
| GET | `/api/events/categories` | Daftar kategori |
| GET | `/api/events/:slug` | Detail event |
| GET | `/api/events/:id/reviews` | Review event |

### Events (Organizer)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/events/organizer/mine` | Event milikku |
| POST | `/api/events` | Buat event baru |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Hapus event |

### Transactions (Customer)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/transactions` | Buat transaksi (beli tiket) |
| GET | `/api/transactions/me` | Riwayat transaksi |
| GET | `/api/transactions/points` | Saldo poin tersedia |
| PATCH | `/api/transactions/:id/pay` | Simulasi pembayaran |

### Reviews
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/reviews` | Tulis review (harus sudah beli tiket) |

### Dashboard (Organizer)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard/analytics` | Overview stats |
| GET | `/api/dashboard/analytics?type=daily` | Revenue per hari (30 hari) |
| GET | `/api/dashboard/analytics?type=monthly` | Revenue per bulan |
| GET | `/api/dashboard/analytics?type=yearly` | Revenue per tahun |
| GET | `/api/dashboard/analytics?type=event-attendees&eventId=...` | Transaksi per event |

---

## 💡 Penjelasan Arsitektur

### Clean Architecture (Backend)

Arsitektur backend dibagi menjadi 4 layer:

```
Request → Controller → Service → Repository → Database
```

1. **Controller** (`src/controllers/`): Menerima HTTP request, validasi input dengan Zod, panggil service, kirim response. Controller tidak tahu detail business logic.

2. **Service** (`src/services/`): Tempat business logic berada. Contoh: logika referral, perhitungan harga, validasi aturan bisnis. Service tidak tahu tentang HTTP.

3. **Repository** (`src/repositories/`): Semua query Prisma ada di sini. Kalau query perlu diubah, cukup ubah di repository tanpa menyentuh service.

4. **Lib/Utils** (`src/lib/`, `src/utils/`): Helper yang bisa dipakai di mana saja: JWT, hashing, formatter.

---

### Mengapa Pendekatan Ini?

- **Maintainable**: Setiap layer punya tanggung jawab jelas
- **Testable**: Service bisa ditest tanpa HTTP, repository bisa di-mock
- **Scalable**: Mudah tambah fitur baru tanpa merusak yang lama

---

## 💳 Transaction System (ATOMIC)

Ini adalah bagian paling kritis. Semua step pembelian tiket dibungkus dalam satu `prisma.$transaction()`:

```typescript
// transaction.service.ts
return prisma.$transaction(async (tx) => {
  // STEP 1: Validasi ketersediaan tiket
  // STEP 2: Hitung base price dari TicketType
  // STEP 3: Apply promo (cek kode, hitung diskon, update usedCount)
  // STEP 4: Apply referral discount (via REFERRAL_VOUCHER promo)
  // STEP 5: Validasi & hitung poin yang akan dipakai
  // STEP 6: Hitung finalAmount = base - discount - points
  // STEP 7: Buat record Transaction
  // STEP 8: Buat record Ticket (1 record per tiket, dengan QR code unik)
  // STEP 9: Update TicketType.sold + Event.soldSeats
  // STEP 10: Kurangi Point (FIFO — oldest first)
  // STEP 11: Buat record Redemption untuk setiap point yang dipakai
});
```

**Kenapa `$transaction`?** Jika salah satu step gagal (misal: seat habis di tengah proses), semua perubahan akan di-rollback otomatis. Tidak ada data setengah-setengah.

---

## 🎁 Referral & Points System

### Cara Kerja Referral
1. Setiap user yang daftar otomatis dapat `ReferralCode` unik (8 karakter)
2. User bisa share kode ini ke teman
3. Teman memasukkan kode saat registrasi
4. Pemilik kode mendapat **10.000 poin** yang berlaku 3 bulan

```typescript
// auth.service.ts
if (referralCodeRecord) {
  await prisma.point.create({
    data: {
      userId: referredById,  // pemilik kode dapat poin
      amount: 10000,
      source: `Referral dari ${input.email}`,
      expiredAt: threeMonthsLater,
    },
  });
}
```

### FIFO Points Redemption
Poin dikurangi dari yang **paling lama dibuat** (first in, first out):

```typescript
// point.service.ts
export const calculatePointsRedemption = (
  points: Array<{ id: string; amount: number }>,  // sudah diurutkan oldest first
  pointsToUse: number
) => {
  // Iterasi dari poin paling lama, kurangi sampai habis quota
};
```

---

## 🔐 Authentication Flow

### JWT-based Auth
1. User login → backend buat JWT (payload: userId, email, role)
2. Token disimpan di `localStorage` (frontend)
3. Setiap request protected → `Authorization: Bearer <token>` header
4. `authMiddleware` verifikasi token dengan `jsonwebtoken`
5. `roleMiddleware` cek apakah role sesuai (CUSTOMER / ORGANIZER)

### Protected Routes (Frontend)
```tsx
// AppRouter.tsx
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  return children;
};
```

---

## 🎨 Design System

### Filosofi Desain
Terinspirasi dari pk-ent.com: **gelap, berani, musik-sentris**.

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `--bg-primary` | `#0a0a0b` | Background utama |
| `--bg-card` | `#16161a` | Card, panel |
| `--accent-red` | `#e5152b` | Primary action, highlight |
| `--accent-gold` | `#f5a623` | Points, warning, premium |
| Font Display | Bebas Neue | Heading besar |
| Font Body | DM Sans | Teks umum |

### Komponen Utama

- **`EventCard`**: Card event dengan gambar, progress bar seat, price
- **`SearchBar`**: Input pencarian dengan debounce 500ms
- **`FilterDropdown`**: Dropdown filter kota & kategori
- **`Pagination`**: Navigasi halaman dengan ellipsis
- **`TicketSelector`**: Pilih tiket, kuantitas, promo, poin
- **`ReviewList`**: Daftar review dengan rating bintang & distribusi
- **`ModalConfirm`**: Konfirmasi sebelum aksi destruktif
- **`EventCardSkeleton`**: Placeholder loading

---

## 🌱 Seed Data

Setelah `npm run db:seed`, tersedia:

### Users
| Email | Password | Role |
|-------|----------|------|
| organizer@soundwave.com | password123 | ORGANIZER |
| organizer2@beatbox.com | password123 | ORGANIZER |
| customer@gmail.com | password123 | CUSTOMER |
| customer2@gmail.com | password123 | CUSTOMER |

### Events (6 event sudah PUBLISHED)
- SoundWave Summer Concert 2025 — Jakarta (Concert)
- Jakarta Jazz Festival 2025 — Jakarta (Jazz)
- Bali Beat Festival 2025 — Bali (Electronic)
- Bandung Indie Fest 2025 — Bandung (Indie)
- Surabaya Classical Night 2025 — Surabaya (Classical)
- Free Music in the Park — Jakarta (Festival, GRATIS)

---

## 📦 Library yang Diinstall & Kegunaannya

### Backend

| Library | Kegunaan |
|---------|----------|
| `express v5` | Framework HTTP server Node.js |
| `@prisma/client` | ORM untuk query PostgreSQL secara type-safe |
| `prisma` | CLI untuk generate client, migrate, seed |
| `bcryptjs` | Hash & verify password dengan salt rounds |
| `jsonwebtoken` | Buat JWT saat login, verify saat request |
| `cors` | Izinkan cross-origin request dari frontend |
| `dotenv` | Load variabel dari file `.env` |
| `zod` | Validasi & parsing input request (schema-first) |
| `redis` | Klien cache data performa tinggi |
| `nodemailer` | Pengirim transport email SMTP (E-Tickets, Welcome Email) |
| `qrcode` | Pembuat barcode gambar QR untuk tiket digital |
| `winston` | Advanced structured file/console logging |
| `tsx` | Jalankan TypeScript langsung (dev mode) |
| `typescript` | Tipe statis untuk catch bug lebih awal |

### Frontend

| Library | Kegunaan |
|---------|----------|
| `react` + `react-dom` | Library UI component |
| `react-router-dom v7` | Client-side routing & protected routes |
| `axios` | HTTP client dengan interceptor untuk JWT auto-attach |
| `react-hook-form` | Manajemen state form yang performant |
| `@hookform/resolvers` | Integrasi Zod dengan react-hook-form |
| `zod` | Validasi schema form di client |
| `chart.js` + `react-chartjs-2` | Chart bar/line untuk analitik dashboard |
| `lucide-react` | Icon library yang ringan dan konsisten |
| `tailwindcss v4` | Utility-first CSS framework |
| `clsx` | Helper conditional className |
| `tailwind-merge` | Merge Tailwind class tanpa konflik |
| `vite` | Build tool yang cepat untuk development |
| `typescript` | Tipe statis di frontend |

---

## 🔧 Troubleshooting

### Error: "Cannot find module '../generated/prisma'"
```bash
cd backend && npm run db:generate
```

### Error: "Prisma Client is not initialized"
Pastikan kamu sudah run `npm run db:push` dan `npm run db:generate`

### CORS Error di Frontend
Pastikan `FRONTEND_URL` di `backend/.env` sesuai dengan URL frontend kamu (default: `http://localhost:5173`)

### Data event tidak muncul di `localhost:5173` (dev lokal)
Pastikan `vite.config.ts` memiliki konfigurasi proxy:
```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```
Tanpa ini, request ke `/api` akan gagal karena tidak ada proxy dari Vite ke backend.

### Data event tidak muncul di `localhost:3000` (Docker)
Pastikan `Dockerfile` tahap `frontend-build` memiliki:
```dockerfile
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
```
Tanpa ini, Vite build menggunakan fallback `http://localhost:5000` yang menyebabkan CORS error di browser.

### Chart tidak muncul di Analytics
Pastikan ada data transaksi PAID terlebih dahulu. Coba jalankan beberapa transaksi via seed atau manual.
