# Changelog & Update History

Dokumen ini mencatat seluruh perubahan, perbaikan bug, dan penambahan fitur yang dilakukan pada proyek Soundwave Music Platform.

## [2026-04-14] - Pembaruan Saat Ini

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
