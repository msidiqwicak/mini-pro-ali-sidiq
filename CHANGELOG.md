# Changelog & Update History

Dokumen ini mencatat seluruh perubahan, perbaikan bug, dan penambahan fitur yang dilakukan pada proyek Soundwave Music Platform.

## [2026-04-19] - Audit, Bug Fix & Docker Overhaul

### 🔧 Bug & Conflict Fixes

- **Resolve Git Merge Conflict (`backend/.env`)**: Menyelesaikan conflict markers (`<<<<<<< Updated upstream` / `>>>>>>> Stashed changes`) yang membuat `.env` invalid. Konflik diselesaikan dengan mempertahankan konfigurasi **Upstash Redis** dan menghapus baris `REDIS_URL=redis://redis:6379`.
- **Fix Docker CORS Error (Frontend tidak tampil data)**: Data event tidak muncul di `http://localhost:3000` karena Vite build di Docker tidak membawa variabel `VITE_API_URL`, sehingga Axios fallback ke `http://localhost:5000` (hardcoded) dan menghasilkan CORS error. Fix: menambahkan `ARG VITE_API_URL=/api` + `ENV VITE_API_URL=$VITE_API_URL` di tahap `frontend-build` Dockerfile.
- **Fix Vite Dev Proxy (`vite.config.ts`)**: `VITE_API_URL=/api` tidak berfungsi di lokal karena tidak ada proxy Vite. Tambah konfigurasi `server.proxy` yang meneruskan semua request `/api/*` ke `http://localhost:5000`.
- **Bersihkan Log Files**: Menghapus isi lama `combined.log` dan `error.log` yang mengandung git conflict markers dan ratusan baris error Redis lama.

### 🐳 Docker Compose Overhaul

- **Hapus Service `redis` dari `docker-compose.yml`**: Redis lokal tidak lagi dibutuhkan karena sudah migrasi ke Upstash Cloud (HTTP-based). Service `redis`, volume `redis-data`, dan dependency `api→redis` dihapus dari `docker-compose.yml`.
- **Rebuild Docker Dari Awal**: Menghapus seluruh Docker containers, images, volumes, dan networks (`docker system prune -af --volumes`), lalu rebuild ulang dengan `docker compose up -d --build`. Semua 3 service (`postgres`, `api`, `web`) berhasil dibangun dan berjalan.

### ✅ Verifikasi

- `tsc --noEmit` → **0 TypeScript error** setelah `@upstash/redis` terinstall
- `http://localhost:5000/api/events` → **HTTP 200 OK**
- `http://localhost:3000/api/events` → **HTTP 200 OK** (via Nginx proxy)
- Backend log menunjukkan: `✅ Upstash Redis ping successful`, `✅ Database terhubung`

---

## [2026-04-15] - Migrasi Redis ke Upstash (Cloud Redis untuk Vercel)

### ☁️ Migrasi dari `redis` (TCP) ke `@upstash/redis` (HTTP/REST)

Mentor merekomendasikan penggunaan **Upstash Redis** saat deploy ke Vercel karena Vercel berjalan di lingkungan _serverless_ yang tidak mendukung koneksi TCP persisten. Package `redis` v5 menggunakan TCP yang hanya bekerja di server konvensional (lokal/VPS). Upstash menggunakan REST API (HTTP) sehingga kompatibel dengan Vercel, Netlify, AWS Lambda, dan platform serverless lainnya.

#### File yang Diubah:

- **`lib/redis.ts`** — Ditulis ulang sepenuhnya menggunakan `@upstash/redis`. Tidak ada `client.connect()` karena Upstash bersifat stateless HTTP. Fungsi `initializeRedis()` kini sinkron (tidak perlu `await`).
- **`utils/cacheManager.ts`** — Disesuaikan dengan API `@upstash/redis`:
  - `setEx(key, ttl, value)` → `set(key, value, { ex: ttl })`
  - `del([...keys])` → `del(...keys)` (spread syntax)
  - `mGet([...keys])` → `mget(...keys)` (spread + lowercase)
  - JSON serialisasi/deserialisasi **tidak perlu lagi** karena `@upstash/redis` menanganinya otomatis
- **`config/env.ts`** — Variabel `redis.url` diganti menjadi `redis.url` (UPSTASH_REDIS_REST_URL) dan `redis.token` (UPSTASH_REDIS_REST_TOKEN)
- **`server.ts`** — `await initializeRedis()` diubah menjadi `initializeRedis()` (sinkron)
- **`.env`** — `REDIS_URL` diganti dengan `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`

#### Keuntungan Upstash vs Redis Lokal:

| Aspek                 | `redis` (TCP)     | `@upstash/redis` (HTTP) |
| --------------------- | ----------------- | ----------------------- |
| Vercel/Serverless     | ❌ Tidak didukung | ✅ Didukung             |
| Lokal                 | ✅                | ✅                      |
| Persistent connection | Ya (TCP)          | Tidak (stateless HTTP)  |
| Setup                 | Butuh Docker/WSL  | Cukup URL + Token       |
| Free tier             | -                 | ✅ 10.000 request/hari  |

### 🔴 Redis Kini Aktif Digunakan

Redis sebelumnya sudah diinisialisasi (`lib/redis.ts`, `utils/cacheManager.ts`, `utils/redisKeys.ts`) namun belum terhubung ke satupun service. Pada update ini, Redis diaktifkan secara penuh di tiga area:

---

#### 1. 🗄️ Event Caching (`services/event.service.ts`)

Redis digunakan sebagai **read-through cache** untuk mengurangi query berulang ke database PostgreSQL.

- **`getEventsService`** — Hasil pencarian/filter event di-cache selama **5 menit** menggunakan key unik per kombinasi filter (`search`, `city`, `categoryId`, `page`, `limit`). Request kedua dengan filter yang sama langsung dikembalikan dari Redis tanpa menyentuh database.
- **`getEventBySlugService`** — Detail event per slug di-cache selama **5 menit**. Sangat berguna untuk halaman detail event yang sering dibuka berulang.
- **`getCitiesService`** — Daftar kota di-cache selama **1 jam** karena data ini sangat jarang berubah.
- **`getCategoriesService`** — Daftar kategori di-cache selama **1 jam** karena data ini sangat jarang berubah.
- **Cache Invalidation** — Setiap kali event dibuat (`createEventService`), diperbarui (`updateEventService`), atau dihapus (`deleteEventService`), cache yang terkait otomatis dihapus dari Redis agar data lama tidak muncul ke user.

---

#### 2. 🚫 Token Blacklist untuk Logout (`services/auth.service.ts`, `middlewares/auth.middleware.ts`, `controllers/auth.controller.ts`, `routes/auth.routes.ts`)

Sebelumnya, tidak ada endpoint logout dan token JWT tetap valid hingga expired meskipun user sudah "logout" di frontend. Dengan implementasi ini, logout benar-benar memblokir token lama.

- **`logoutService`** (baru di `auth.service.ts`) — Menerima token JWT, membuat hash SHA-256 dari token tersebut, lalu menyimpan hash ke Redis dengan TTL yang sama persis dengan sisa waktu expired JWT. Token mentah tidak disimpan untuk alasan keamanan.
- **`authMiddleware`** (diperbarui di `auth.middleware.ts`) — Setiap request yang menggunakan token kini melalui pengecekan blacklist ke Redis. Jika hash token ditemukan di blacklist, request ditolak dengan status `401 Unauthorized`.
- **`logout` controller** (baru di `auth.controller.ts`) — Controller yang membaca token dari Authorization header dan memanggil `logoutService`.
- **Route `POST /api/auth/logout`** (baru di `auth.routes.ts`) — Endpoint logout yang dilindungi `authMiddleware` (harus login dulu untuk logout).

---

#### 3. 🔄 Cache Invalidation setelah Pembelian Tiket (`services/transaction.service.ts`)

Ketika tiket berhasil dibeli, `soldSeats` pada event berubah. Cache event lama yang masih menyimpan data jumlah kursi yang belum terkurangi harus segera dihapus.

- **`createTransactionService`** — Setelah `prisma.$transaction` berhasil commit, script mengambil slug event lalu menghapus cache event tersebut dari Redis. Proses ini berjalan **di luar** blok transaksi Prisma agar tidak memblokir operasi database.
- Variabel `return prisma.$transaction(...)` diubah menjadi `const result = await prisma.$transaction(...)` untuk memungkinkan eksekusi kode setelah transaksi selesai.

- **Backend Audit & TypeScript Check**: Melakukan pengecekan menyeluruh pada backend project. Konfirmasi `tsc --noEmit` **lulus tanpa error**. Memverifikasi kelengkapan implementasi atomic transaction (11-step `prisma.$transaction`), JWT auth middleware, referral logic, dan email notification system.
- **Pembaruan CHANGELOG.md**: Menambahkan entri yang sebelumnya belum tercatat sejak 2026-04-09 hingga fitur-fitur infrastruktur yang sudah ada di kode namun belum terdokumentasi.

## [2026-04-11]

- **Fixing Prisma Seed Execution**: Mengatasi `SyntaxError` saat menjalankan `ts-node` dengan flag `--compiler-options` karena format JSON yang salah di argumen command-line. Memastikan script `prisma/seed.ts` berhasil dieksekusi untuk mengisi data awal ke database.

## [2026-04-09 – 2026-04-10]

- **Building Auth & Referral API**: Mengimplementasikan sistem autentikasi backend secara lengkap, mencakup:
  - Endpoint **Register** dan **Login** dengan validasi skema menggunakan Zod
  - JWT-based **Role-Based Access Control (RBAC)** middleware (`auth.middleware.ts`, `role.middleware.ts`)
  - **Referral logic** menggunakan Prisma SQL transactions: pemberian 10.000 poin ke pemilik referral dan kupon diskon 10% kepada pendaftar baru (keduanya berlaku 3 bulan)
  - Unit test untuk memverifikasi alur autentikasi dan referral

## [2026-04-03]

- **Fixing Voucher Validation**: Memperbaiki logika validasi pemakaian Voucher Diskon oleh event organizer di halaman checkout yang sebelumnya menyebabkan error _pukul rata_ "kode tidak valid". Menambahkan pesan respons spesifik di `transaction.service.ts` agar klien mendapatkan detail perbaikan seperti: "Kode promo ini belum aktif", "Kode promo sudah kadaluarsa", "Kode promo sudah habis digunakan", dan "Kode promo tidak valid" (jika eksistensinya tidak ditemukan).
- **Changelog Tracking**: Memulai inisialisasi dokumen `CHANGELOG.md` untuk mencatat setiap instruksi perubahan yang dilakukan.

## [2026-04-02]

- **Testing Referral Voucher System**: Melakukan pengujian sistem voucher _End-to-End_ secara manual pada _flow_ proses _checkout_ tiket menggunakan dummy event (_Event Voucher Test Final_) untuk memvalidasi penggunaan kode promosi diskon di web secara empiris.
- **Implementing Event Voucher System**: Menambahkan dukungan fitur pembuatan diskon / voucher pada komponen `EventForm`. Memungkinkan Organizer untuk bisa menentukan kode promo, rentang tanggal `startDate` dan `endDate`, max kuota, serta persentase diskon saat merilis event, sehingga backend (Prisma) bisa menyimpan detail promosi yang valid.

## [2026-04-01]

- **Fixing TypeScript Spread Error (`response.ts`)**: Turun tangan untuk mengatasi error _"Spread types may only be created from object types"_. Merefaktor ulang fungsi `errorResponse` agar penyebaran atribut objek (termasuk optional `errors` object) menjadi _type-safe_ tanpa melanggar strict mode dari TypeScript.
- **Documenting Event Platform Features (`Explanation.md`)**: Menyusun format dokumentasi terstruktur platform yang utuh. Pembuatan file Markdown teknis yang memperjelas _timeline_ pekerjaan dan pembagian _scope_ antara Feature 1 dan Feature 2, membantu manajemen tugas presentasi nantinya.
- **Fixing Event Service Type Mismatch (`event.service.ts`)**: Penyesuaian tipe `startDate` & `endDate` pada layanan update (fungsi `updateEventService`). Mengatasi konflik tipe dari Zod form input (`string | Date | undefined`) agar berhasil ter-_parse_ dan masuk menjadi _Object Date_ murni sebelum dieksekusi layanan Prisma.
- **Fixing TypeScript Type Mismatch (`review.controller.ts`)**: Membetulkan pembacaan `req.params.id`. Menyelesaikan _error mismatch_ mengingat Express dapat mengurai params menjadi `string` tunggal atau array `string[]`, dengan cara memperkuat filter validasi menjadi param string mutlak yang dapat dimasukkan ke layanan _Get Review_.
- **Fixing Chart.js TypeScript Errors (`DashboardAnalytics.tsx`)**: Menangani masalah persimpangan tipe untuk _Chart Data_. Menyelesaikan inkonsistensi tipe prop (Type Error) pada _dynamic charting_ (ketika komponen dapat berganti tampilan fleksibel antara grafik Batang / _Bar Chart_ dan grafik _Line Chart_).

---

## 📌 Fitur tambahan 10 - 14 April 2026 di Push Ke Github Tgl 14 April 2026

- **Redis Caching Layer** (`lib/redis.ts`): Integrasi Redis sebagai layer caching menggunakan package `redis` v5. Di-inisialisasi di `server.ts` sebelum server dibuka, dengan fungsi `initializeRedis()` dan `testRedisConnection()`.
- **Email Notification System** (`utils/mail.ts`): Implementasi pengiriman email transaksional menggunakan **Nodemailer** (`nodemailer` v6), mencakup tiga jenis email: _welcome email_ saat registrasi (dengan referral code), _ticket email_ setelah pembayaran (dengan QR code), dan _payment confirmation email_.
- **QR Code Generation** (`utils/slug.ts`): Pembuatan kode QR unik untuk setiap tiket menggunakan package `qrcode`, dikirimkan ke pengguna melalui email setelah pembayaran berhasil.
- **Structured Logging** (`utils/logger.ts`): Implementasi logging tingkat produksi menggunakan **Winston** (`winston` v3). Log disimpan ke direktori `logs/` dengan format terstruktur, digunakan di seluruh siklus hidup server dan error handling.
