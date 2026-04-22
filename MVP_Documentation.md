# Soundwave - MVP Documentation (NotebookLM Knowledge Base)

Dokumen ini disusun sebagai **Knowledge Base** komprehensif dari *Minimum Viable Product (MVP)* aplikasi "Soundwave" (Event Management & Ticketing Platform). Dokumen ini cocok digunakan sebagai referensi sumber untuk Google NotebookLM.

---

## 1. Project Overview

**Soundwave** adalah platform manajemen dan pemesanan tiket acara musik generasi modern. Platform ini menjembatani dua jenis pelaku (*Roles*):
1. **CUSTOMER (Pembeli Tiket):** Mencari acara musik, memesan tiket, menggunakan kupon/poin diskon, membayarkan transaksi (via upload bukti transfer), dan memberikan review.
2. **ORGANIZER (Penyelenggara Acara):** Membuat dan mengelola acara, menentukan tipe tiket (VIP, Regular, dsb), merilis voucher diskon spesifik (Promotions), dan mem-verifikasi pembayaran dari customer.

---

## 2. Tech Stack & Architecture

### Frontend (Client-side)
- **Framework:** React 18 + Vite + TypeScript.
- **Styling:** Tailwind CSS (Vanilla CSS Variables untuk mode gelap/styling modern).
- **Routing:** React Router v6 (Protected Routes untuk Dashboard dan halaman Auth).
- **Form & Validation:** React Hook Form terintegrasi dengan Zod.
- **Icons:** Lucide React.

### Backend (Server-side)
- **Runtime & Framework:** Node.js + Express + TypeScript.
- **ORM & Database:** Prisma ORM dengan database PostgreSQL (Deployment via Supabase/Neon).
- **Caching & Rate Limiting:** Upstash Redis (terintegrasi melalui `cacheManager.ts`).
- **File Upload:** Cloudinary (untuk gambar profil, banner event, dan bukti pembayaran).
- **Mailing:** Resend (Email transaksional: PDF Tiket, Welcome Referral, Reset Password).
- **Security:** JWT (JSON Web Tokens) untuk Autentikasi, Bcrypt (Password Hashing).

---

## 3. Core Features (Minimum Viable Product)

### A. Authentication & Roles System
- Registrasi dan Login akun ganda (*Customer* atau *Organizer*).
- Form registrasi memungkinkan pengguna memasukkan `Kode Referral`.
- Proteksi rute berbasis JWT dan `Role Guard` (hanya Organizer yang bisa mengakses `/dashboard`).

### B. Organizer Dashboard (Event Management)
- **Pembuatan Event:** Input nama otomatis ter-generate menjadi URL Slug ramah SEO, pengaturan Lokasi, Kategori, rentang Tanggal (`startDate` & `endDate`).
- **Tipe Tiket Paralel:** Pembuatan multiple tiket sekaligus (misal: Presale berkuota 100 rp 50rb, VIP berkuota 10 rp 200rb) dalam satu event.
- **Event Promotion (Voucher):** Organizer dapat mengatur kode voucher spesifik suatu event (contoh: `SUMMER20`) dengan opsi diskon fix/persentase, kuota pakai, beserta batas tanggal berlakunya.
- **Approval Transaksi:** Organizer dapat melihat daftar pengguna yang meng-upload bukti transfer (`WAITING_PAYMENT`). Mereka berhak menekan **Approve** (sistem mengirim tiket PDF ke email) atau **Reject** (sistem melakukan *rollback* stok tiket dan poin pembeli).

### C. Customer Ticketing Flow & Checkout
- **Eksplorasi Event:** Halaman utama menampilkan banner artistik dan filter daftar acara.
- **Dynamic Checkout:** Kustomer diarahkan memilih gabungan jenis tiket (Seat availability otomatis dihitung/dibatasi).
- **Diskon Berjenjang (Hybrid):** 
  - Kustomer dapat memasukkan Kode Promo Organizer (*Event Promotion*) **ATAU** Kupon Personal mereka.
  - Kustomer juga dapat menarik (Redeem) sisa Saldo Poin mereka untuk menutupi harga tiket.
- **Upload Bukti Transfer:** Transaksi menggantung (*PENDING*) yang belum dibayar dalam 2 jam akan otomatis direkompensasi (*EXPIRED*) menggunakan fitur **Stale Transaction Lazy Expiry**.

### D. Referral & Reward System (Growth Loop)
- Setiap pengguna secara otomatis diberikan sebuah `Referral Code` unik (contoh: ALI123).
- **Reward untuk Pemilik Kode:** Apabila referal mereka dipakai teman mendaftar, mereka akan mendapatkan injeksi `10.000 Poin` (Berlaku 3 Bulan).
- **Reward untuk Pengguna Baru:** Teman yang mendaftar menggunakan referral akan menerima `Coupon` diskon 10% (Berlaku 3 bulan).

### E. Review & Rating (Reputation System)
- Pengguna yang sudah pernah membeli tiket dan transaksinya berhasil (PAID) berhak memberikan sistem *5-Star Rating* dan deskripsi komentar *Review* terhadap acara tersebut.

---

## 4. Prisma Database Schema (High-Level Entity Relationship)

Struktur tabel inti dalam sistem:
- **`User`**: Mengendalikan tipe (*Role*), password, relasi ke Referral yang mereka punya, dan Bank Rekening.
- **`ReferralCode`**: Tabel unik khusus tracking kode afiliasi.
- **`Point`**: Tabel berjenis FIFO *(First-in-First-out)* untuk melacak pergerakan dan masa kedaluwarsa nilai uang/kredit dompet kustomer.
- **`Coupon`**: Tabel penyimpanan voucher personal 10% milik pengguna baru.
- **`Event`**: Berisi keseluruhan deskripsi konser, `soldSeats`, dan info relasinya ke kategori.
- **`TicketType`**: Variabel harga dan kuota khusus bagian dari event. (e.g. VIP, Festival).
- **`Ticket`**: Representasi fisik/QR dari pembelian yang berhasil.
- **`Transaction`**: Tabel krusial yang menampung `baseAmount`, `discountAmount`, `pointsUsed`, `finalAmount`, status persetujuan, dan bukti bayar.
- **`Promotion`**: Tabel kode diskon yang diciptakan organizer untuk *Event* mereka.
- **`Redemption`**: Jembatan tracking antara poin yang menguap masuk diubah menjadi diskon transaksi.

---

## 5. Automated Lazy Expiration & Cache (Advanced Pattern)

Mengingat tidak adanya proses Cron Job eksternal yang diatur (untuk menyesuaikan deploy minimalis di Serverless Vercel/Render):
1. **Cache Middleware:** Redis digunakan untuk membungkus list acara agar website sekencang kilat. Fungsi revalidation aktif saat Organizer mengubah detail.
2. **Stale Transaction Sweeper:** Alih-alih bot berjalan 24 jam, sistem memeriksa apakah ada transaksi menggantung (kedaluwarsa) pada saat *detik* pengguna tersebut mencoba merequest `/transactions`. Jika ada, sistem melaksanakan *Refund Mechanism* secara senyap dan presisi.

---

## 6. How To Run Locally (Development)

1. Root proyek terpisah menjadi `/frontend` dan `/backend`.
2. Buka terminal 1 di `/backend`, konfigurasi `.env` ke Postgre dan Redis Upstash. Jalankan: `npm install`, `npx prisma db push`, `npx prisma db seed` (Opsional), lalu `npm run dev` (berjalan di port 5000).
3. Buka terminal 2 di `/frontend`, konfigurasi `.env` ke API Localhost. Jalankan: `npm install`, `npm run dev` (Vite, berjalan di port 5173).

---
*Dokumen ini merupakan intisari untuk digunakan di prompt engineering dan ekstraksi tanya-jawab (Q&A) LLMs seperti Google NotebookLM.*
