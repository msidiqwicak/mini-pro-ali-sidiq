# 🎵 Soundwave Music — Event Management Platform

## Penjelasan Lengkap Pembagian Fitur & Arsitektur Teknis

---

## 🎯 Project Overview

**Soundwave Music** adalah sebuah **Event Management Platform** yang memungkinkan:

- **Event Organizer** membuat, mengelola, dan mempromosikan event mereka.
- **Customer** menemukan, menjelajahi, dan membeli tiket event yang tersedia.

### Tujuan Utama MVP

Membuat platform sederhana namun fungsional di mana:

1. Organizer bisa membuat event lengkap dengan tipe tiket dan harga.
2. Customer bisa mendaftar, mencari event, membeli tiket, dan memberikan review.
3. Terdapat sistem referral yang memberikan reward berupa **point** dan **coupon**.
4. Organizer memiliki dashboard untuk mengelola event, melihat transaksi, dan menganalisis data.

### Tech Stack yang Digunakan

| Layer        | Teknologi                                                      |
| ------------ | -------------------------------------------------------------- |
| Frontend     | React + TypeScript, Vite, React Router, CSS                    |
| Backend      | Node.js + Express + TypeScript                                 |
| Database     | PostgreSQL (via Prisma ORM)                                    |
| Validasi     | Zod (schema validation)                                        |
| Auth         | JWT (JSON Web Token)                                           |
| Charting     | Chart.js (untuk grafik di dashboard)                           |
| **Caching**  | **Redis via Upstash Cloud (HTTP REST, tanpa container lokal)** |
| **Utilitas** | **Nodemailer (Email), QRCode, Winston (Logging)**              |

---

# 🚀 FEATURE 1 — SISTEM EVENT & TRANSAKSI

> **Fokus utama:** Semua hal yang berhubungan dengan event — mulai dari menampilkan, membuat, membeli tiket, hingga memberikan review.

---

## 1. Event Discovery, Creation, dan Promotion

### 1.1 Landing Page (Daftar Event)

**Tujuan:** Menampilkan daftar event yang sedang tersedia (status `PUBLISHED`) kepada semua pengunjung, termasuk yang belum login.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | Komponen `HomePage.tsx` — menampilkan grid kartu event (`EventCard.tsx`) dengan gambar, nama, lokasi, harga, dan tanggal. |
| **Backend**  | Endpoint `GET /api/events` — mengambil data event dari database dengan pagination.                                        |
| **Database** | Tabel `events` — menyimpan semua informasi event termasuk foreign key ke `categories` dan `users` (organizer).            |

**Validasi & Edge Case:**

- Hanya tampilkan event berstatus `PUBLISHED` (bukan `DRAFT`, `CANCELLED`, atau `COMPLETED`).
- Gunakan **pagination** (default 9 event per halaman) agar halaman tidak berat.
- Tampilkan **empty state** jika tidak ada event yang ditemukan (misalnya: "Belum ada event tersedia").

---

### 1.2 Event Browsing (Filter Berdasarkan Kategori & Lokasi)

**Tujuan:** Membantu customer menemukan event yang sesuai dengan minat mereka berdasarkan kategori (contoh: _Musik_, _Workshop_) dan lokasi/kota.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | Dropdown/filter di `HomePage.tsx` untuk memilih kategori dan kota.                                                                                                                  |
| **Backend**  | Endpoint `GET /api/events?categoryId=xxx&city=xxx` — menerima query parameter untuk filter. Endpoint `GET /api/events/cities` dan `GET /api/events/categories` untuk data dropdown. |
| **Database** | Tabel `categories` (daftar kategori) + field `city` pada tabel `events`.                                                                                                            |

**Validasi & Edge Case:**

- Filter bisa dikombinasikan (kategori + kota + search secara bersamaan).
- Tampilkan pesan yang informatif jika hasil filter kosong: _"Tidak ada event untuk filter yang dipilih"_.

---

### 1.3 Search Bar dengan Debounce

**Tujuan:** Memungkinkan customer mencari event berdasarkan nama, deskripsi, atau kota secara real-time.

**Apa itu Debounce?**

> Bayangkan kamu mengetik kata "konser" di search bar. **Tanpa debounce**, setiap kali kamu menekan tombol keyboard, aplikasi langsung mengirim request ke server:
>
> - "k" → request ke server
> - "ko" → request ke server
> - "kon" → request ke server
> - "kons" → request ke server
> - "konse" → request ke server
> - "konser" → request ke server
>
> Itu berarti **6 request** hanya untuk satu kata! Ini membuat server kewalahan.
>
> **Dengan debounce**, aplikasi akan **menunggu dulu** (misalnya 500 milidetik) setelah kamu berhenti mengetik, baru mengirim request. Jadi kalau kamu mengetik "konser" dengan cepat, hanya ada **1 request** yang terkirim. Jauh lebih efisien!

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | Custom hook `useDebounce.ts` — menunda perubahan value selama 500ms sebelum memicu request.                                                                     |
| **Backend**  | Query `search` pada endpoint `GET /api/events` — menggunakan `contains` + `insensitive` (case-insensitive search) pada field `name`, `description`, dan `city`. |

**Implementasi di project ini:**

```typescript
// hooks/useDebounce.ts
export const useDebounce = <T>(value: T, delay = 500): T => {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
```

---

### 1.4 Halaman Detail Event

**Tujuan:** Menampilkan informasi lengkap sebuah event — deskripsi, lokasi, tanggal, tipe tiket, promo aktif, dan review dari customer lain.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | `EventDetailPage.tsx` — menampilkan semua informasi event. `TicketSelector.tsx` — komponen untuk memilih tipe tiket dan memasukkan kode promo. `ReviewList.tsx` — menampilkan daftar review. |
| **Backend**  | Endpoint `GET /api/events/:slug` — mengambil detail event berdasarkan URL slug, termasuk reviews, promotions, ticket types, dan kategori.                                                    |

**Validasi & Edge Case:**

- Setiap event memiliki **slug unik** (contoh: `konser-jazz-jakarta-a1b2c3`) yang digunakan di URL, bukan ID.
- Tampilkan sisa kursi yang tersedia (`quota - sold` per ticket type).
- Hanya tampilkan promo yang masih aktif (tanggal saat ini berada di antara `startDate` dan `endDate` promo).

---

### 1.5 Pembuatan Event (Event Creation)

**Tujuan:** Event organizer bisa membuat event baru dengan informasi lengkap.

**Field yang perlu diisi:**

| Field         | Validasi                                                          |
| ------------- | ----------------------------------------------------------------- |
| `name`        | Minimal 3 karakter                                                |
| `description` | Minimal 20 karakter                                               |
| `categoryId`  | Wajib dipilih                                                     |
| `location`    | Minimal 3 karakter                                                |
| `city`        | Minimal 2 karakter                                                |
| `imageUrl`    | Harus URL valid (opsional)                                        |
| `startDate`   | Wajib diisi, format tanggal valid                                 |
| `endDate`     | Wajib diisi, format tanggal valid                                 |
| `isFree`      | Boolean — menentukan apakah event gratis                          |
| `totalSeats`  | Angka positif                                                     |
| `status`      | `DRAFT` atau `PUBLISHED`                                          |
| `ticketTypes` | Array minimal 1 item — setiap item punya `name`, `price`, `quota` |

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | `EventForm.tsx` — form lengkap dengan dynamic ticket type inputs. `CreateEvent.tsx` — halaman wrapper yang menggunakan form.                       |
| **Backend**  | Endpoint `POST /api/events` (protected, role: ORGANIZER). Service `createEventService` — validasi Zod, generate slug, simpan event + ticket types. |
| **Database** | Insert ke tabel `events` + batch insert ke tabel `ticket_types`.                                                                                   |

**Validasi & Edge Case:**

- **Slug auto-generated** dari nama event + random string (untuk memastikan unik).
- **Minimal 1 ticket type** harus ditambahkan.
- Hanya user dengan role `ORGANIZER` yang bisa mengakses endpoint ini.

---

### 1.6 Event Gratis vs Berbayar

**Tujuan:** Membedakan event yang gratis dan berbayar.

| Jenis              | Penjelasan                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event Gratis**   | `isFree = true`. Ticket type bisa memiliki `price = 0`. Saat checkout, jika `finalAmount = 0`, status langsung `PAID` tanpa perlu upload bukti pembayaran. |
| **Event Berbayar** | `isFree = false`. Customer harus membayar sesuai harga ticket type yang dipilih.                                                                           |

---

### 1.7 Sistem Voucher Promo (Promotion)

**Tujuan:** Event organizer bisa membuat kode promo **khusus untuk event tertentu**, dengan batas waktu dan batas penggunaan.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**  | Model `Promotion` dengan field: `code`, `type`, `discountPercent`, `discountAmount`, `maxUsage`, `usedCount`, `startDate`, `endDate`. |
| **Database** | Tabel `promotions` — terhubung ke tabel `events` via `eventId`.                                                                       |

**Jenis Diskon:**

- **Diskon Persentase** (`discountPercent`): Contoh — diskon 20% dari harga total.
- **Diskon Nominal** (`discountAmount`): Contoh — potongan Rp 50.000 langsung.

**Validasi & Edge Case:**

- Kode promo hanya berlaku dalam rentang `startDate` – `endDate`.
- Cek `usedCount < maxUsage` sebelum mengaplikasikan promo.
- Promo **hanya berlaku untuk event tertentu** (satu promo satu event).
- `usedCount` bertambah 1 setiap kali promo digunakan.

---

## 2. Sistem Transaksi Event

### 2.1 Flow Pembelian Tiket

Berikut adalah **alur lengkap** ketika customer membeli tiket event:

```
Customer memilih event → Pilih tipe tiket & jumlah → Masukkan kode promo (opsional)
→ Pilih berapa point yang ingin digunakan (opsional)
→ Checkout
→ [Jika finalAmount = 0] → Status langsung PAID ✅
→ [Jika finalAmount > 0] → Status PENDING → Upload bukti bayar → Menunggu konfirmasi
```

**11 Langkah dalam Satu Transaksi (Atomic via `prisma.$transaction`):**

| Step | Aksi                                                              |
| ---- | ----------------------------------------------------------------- |
| 1    | Validasi ticket type & cek ketersediaan seat                      |
| 2    | Hitung harga dasar (`baseAmount = price × quantity`)              |
| 3    | Terapkan promo/voucher (jika ada) → hitung `discountAmount`       |
| 4    | (Referral discount sudah dihandle sebagai promo code)             |
| 5    | Terapkan point redemption (FIFO — point terlama digunakan duluan) |
| 6    | Hitung `finalAmount = baseAmount - discountAmount - pointsUsed`   |
| 7    | Buat record transaksi                                             |
| 8    | Buat record tiket (dengan QR code unik per tiket)                 |
| 9    | Update `sold` di ticket type + `soldSeats` di event               |
| 10   | Kurangi saldo point yang digunakan                                |
| 11   | Buat record Redemption (log penggunaan point)                     |

---

### 2.2 Enam Status Transaksi

| Status                                  | Deskripsi                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PENDING` (Waiting for Payment)         | Transaksi baru dibuat, menunggu customer upload bukti pembayaran. Countdown 2 jam dimulai. |
| `PAID` (Waiting for Admin Confirmation) | Customer sudah upload/bayar. Menunggu organizer menerima atau menolak. Batas 3 hari.       |
| `DONE` (Selesai)                        | Organizer sudah menerima (accept) pembayaran. Tiket resmi.                                 |
| `REJECTED` (Ditolak)                    | Organizer menolak bukti pembayaran. Point, voucher, dan seat dikembalikan.                 |
| `EXPIRED` (Kadaluarsa)                  | Customer tidak upload bukti pembayaran dalam 2 jam. Semua dikembalikan.                    |
| `CANCELLED` (Dibatalkan)                | Organizer tidak merespon dalam 3 hari. Semua dikembalikan.                                 |

**Diagram Alur Status:**

```
                         ┌──── REJECTED ◄────┐
                         │                    │
PENDING ──► PAID ──► DONE                    │
   │          │                    Organizer menolak
   │          │
   │          └──► CANCELLED (otomatis 3 hari tanpa respon)
   │
   └──► EXPIRED (otomatis 2 jam tanpa bukti bayar)
```

---

### 2.3 Upload Bukti Pembayaran (Countdown 2 Jam)

**Tujuan:** Setelah checkout, customer punya waktu **2 jam** untuk meng-upload bukti pembayaran.

**Aturan:**

- Timer 2 jam dimulai sejak transaksi dibuat (`createdAt`).
- Jika dalam 2 jam tidak ada bukti bayar → status otomatis berubah ke `EXPIRED`.
- Setelah expired, semua resource yang sudah dialokasikan dikembalikan.

---

### 2.4 Aturan Expired Otomatis

| Kondisi                                    | Aksi Otomatis        |
| ------------------------------------------ | -------------------- |
| 2 jam tanpa upload bukti bayar             | Status → `EXPIRED`   |
| 3 hari setelah paid tanpa respon organizer | Status → `CANCELLED` |

---

### 2.5 Aturan Konfirmasi Organizer (3 Hari)

- Setelah customer upload bukti bayar (status `PAID`), organizer punya waktu **3 hari** untuk **accept** atau **reject**.
- Jika tidak ada aksi dalam 3 hari → transaksi otomatis **cancelled**.

---

### 2.6 Logika Rollback (Pengembalian Resource)

Saat transaksi berstatus `EXPIRED`, `CANCELLED`, atau `REJECTED`, semua resource harus dikembalikan:

| Resource          | Aksi Rollback                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Point**         | Saldo point yang sudah dipotong dikembalikan ke akun customer (status kembali `ACTIVE`). |
| **Voucher/Promo** | `usedCount` pada promotion dikurangi 1 (promo bisa dipakai lagi).                        |
| **Seat (Kursi)**  | `sold` pada ticket type dan `soldSeats` pada event dikurangi sesuai quantity.            |

> ⚠️ **PENTING:** Proses rollback ini harus menggunakan **SQL Transaction** (`prisma.$transaction`) agar data konsisten. Jika salah satu langkah gagal, semua langkah dibatalkan.

---

### 2.7 Penggunaan Point (Contoh Perhitungan)

Point bisa digunakan untuk **mengurangi harga pembayaran**. 1 Point = IDR 1.

**Contoh Kasus:**

```
📋 Skenario:
- Harga tiket event: IDR 300.000
- Saldo point customer: 20.000 point
- Customer ingin menggunakan semua point

📊 Perhitungan:
- Base Amount     = IDR 300.000
- Discount (promo)= IDR 0
- Points Used     = IDR 20.000
- Final Amount    = IDR 300.000 - IDR 0 - IDR 20.000 = IDR 280.000

✅ Customer bayar IDR 280.000
```

**Contoh Kasus dengan Promo:**

```
📋 Skenario:
- Harga tiket event: IDR 300.000
- Promo diskon 10%: IDR 30.000
- Saldo point customer: 50.000 point
- Customer pakai semua point

📊 Perhitungan:
- Base Amount     = IDR 300.000
- Discount (promo)= IDR 30.000
- After discount  = IDR 270.000
- Points Used     = IDR 50.000 (tapi max = sisa harga = IDR 270.000)
  → Jadi yang dipakai = IDR 50.000
- Final Amount    = IDR 270.000 - IDR 50.000 = IDR 220.000

✅ Customer bayar IDR 220.000
```

**Sistem FIFO (First In, First Out):**

> Point yang **lebih dulu didapat** akan **lebih dulu digunakan**. Ini penting karena setiap batch point punya tanggal kadaluarsa sendiri-sendiri.

---

### 2.8 Pertimbangan Database untuk Transaksi

**Tabel-tabel yang terlibat dalam satu transaksi pembelian:**

| Tabel          | Operasi                                                       |
| -------------- | ------------------------------------------------------------- |
| `ticket_types` | READ (cek ketersediaan) + UPDATE (tambah `sold`)              |
| `events`       | UPDATE (tambah `soldSeats`)                                   |
| `promotions`   | READ (validasi promo) + UPDATE (tambah `usedCount`)           |
| `points`       | READ (ambil saldo) + UPDATE (kurangi `amount`, ubah `status`) |
| `transactions` | CREATE (buat record transaksi baru)                           |
| `tickets`      | CREATE (buat record tiket per quantity)                       |
| `redemptions`  | CREATE (log pemakaian point)                                  |

### Kenapa Perlu SQL Transaction?

> Bayangkan kamu membeli tiket, dan saat proses berlangsung, 5 step berhasil tapi step ke-6 gagal (misalnya koneksi database terputus). **Tanpa SQL Transaction**, 5 step yang sudah berhasil akan tetap tersimpan, menyebabkan data "setengah jadi" — kursi sudah terpakai tapi tiket tidak dibuat!
>
> **Dengan SQL Transaction**, semua 11 step diperlakukan sebagai **satu paket**. Jika satu step gagal, semua step dibatalkan (**rollback**). Ini menjamin **data consistency** — data selalu dalam keadaan valid.

Implementasi di project ini menggunakan **`prisma.$transaction()`**:

```typescript
return prisma.$transaction(async (tx) => {
  // Step 1: Validasi ticket type
  // Step 2: Hitung harga
  // Step 3: Apply promo
  // ... step 4-11
  // Jika salah satu step throw error → semua dibatalkan
});
```

---

## 3. Review & Rating Event

### 3.1 Siapa yang Boleh Review?

**Aturan:** Hanya customer yang **sudah membeli tiket dan pembayarannya sudah diterima** (status transaksi `PAID`) yang boleh memberikan review.

**Validasi:**

- Cek apakah ada transaksi dengan `userId` + `eventId` + `status: PAID` → fungsi `hasUserPurchasedEvent()`.
- Satu customer hanya boleh **satu review per event** (menggunakan `@@unique([userId, eventId])` pada tabel `reviews`).
- Rating: angka 1–5. Komentar: minimal 10 karakter.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Frontend** | Form review di `EventDetailPage.tsx`. Komponen `ReviewList.tsx` menampilkan review + info user. |
| **Backend**  | Endpoint `POST /api/reviews` (protected). Endpoint `GET /api/events/:id/reviews`.               |
| **Database** | Tabel `reviews` — relasi ke `users` dan `events`. Unique constraint pada `userId` + `eventId`.  |

---

### 3.2 Tampilan Rating di Profile Organizer

- Setiap event menampilkan **rata-rata rating** dan **jumlah review**.
- Rata-rata rating dihitung di backend: `avg = sum(rating) / count`.
- Review ditampilkan dengan nama dan avatar user yang memberikan review.

---

---

# 🔐 FEATURE 2 — SISTEM USER & DASHBOARD

> **Fokus utama:** Semua hal yang berhubungan dengan user — autentikasi, profil, referral, dan dashboard organizer.

---

## 1. Authentication & Authorization

### 1.1 Register & Login

**Tujuan:** Memungkinkan user membuat akun dan masuk ke platform.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend** | `RegisterPage.tsx` — form registrasi dengan pilihan role. `LoginPage.tsx` — form login.                                                                            |
| **Backend**  | Endpoint `POST /api/auth/register` — validasi Zod, hash password (bcrypt), generate JWT. Endpoint `POST /api/auth/login` — validasi credentials, return JWT token. |
| **Database** | Tabel `users` — menyimpan email (unique), nama, password hash, role, dan avatar.                                                                                   |

**Validasi:**

- Email harus valid dan belum pernah terdaftar.
- Password minimal 8 karakter.
- Nama minimal 2 karakter.
- Password di-hash menggunakan **bcrypt** sebelum disimpan (tidak pernah simpan password plain text!).

---

### 1.2 Role: Customer dan Event Organizer

| Role          | Kemampuan                                                                               |
| ------------- | --------------------------------------------------------------------------------------- |
| **CUSTOMER**  | Browsing event, beli tiket, lihat tiket saya, lihat riwayat transaksi, beri review.     |
| **ORGANIZER** | Semua kemampuan customer + buat event, kelola event, lihat dashboard, kelola transaksi. |

---

### 1.3 Input Referral Saat Registrasi

- Saat registrasi, customer bisa **opsional** memasukkan kode referral dari user lain.
- Jika kode referral valid:
  - **Yang mendaftar (referred user)** mendapat **coupon diskon**.
  - **Pemilik kode referral (referrer)** mendapat **10.000 point**.

---

### 1.4 Cara Generate Referral Code

- Setiap user baru **otomatis** mendapat referral code unik saat registrasi.
- Kode bersifat **permanen** — tidak bisa diubah.
- Format: string acak (contoh: `REF-X7K2M9`).
- Disimpan di tabel `referral_codes` dengan relasi one-to-one ke `users`.

**Implementasi:**

```typescript
// Saat registrasi:
let newRefCode = generateReferralCode();
let attempts = 0;
while (attempts < 5) {
  try {
    await createReferralCode(user.id, newRefCode);
    break; // Berhasil, berhenti.
  } catch {
    newRefCode = generateReferralCode(); // Kalau duplikat, coba lagi.
    attempts++;
  }
}
```

---

### 1.5 Role-Based Access (Protected Route)

**Tujuan:** Memastikan halaman tertentu hanya bisa diakses oleh user yang sudah login, dengan role yang sesuai.

**Implementasi:**

| Layer        | Mekanisme                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**  | `authMiddleware` — verifikasi JWT token dari header `Authorization: Bearer <token>`. `roleMiddleware("ORGANIZER")` — cek role user dari decoded token.                     |
| **Frontend** | Komponen wrapper `ProtectedRoute` — cek status login dan role sebelum render halaman. `GuestRoute` — halaman yang hanya bisa diakses kalau BELUM login (login & register). |

**Halaman yang Diproteksi:**

| Halaman                      | Akses                       |
| ---------------------------- | --------------------------- |
| `/` (Home)                   | 🌐 Public (semua orang)     |
| `/events/:slug` (Detail)     | 🌐 Public                   |
| `/login`                     | 👤 Guest only (belum login) |
| `/register`                  | 👤 Guest only               |
| `/my-tickets`                | 🎫 Customer only            |
| `/transactions`              | 🎫 Customer only            |
| `/dashboard`                 | 🏢 Organizer only           |
| `/dashboard/events`          | 🏢 Organizer only           |
| `/dashboard/events/create`   | 🏢 Organizer only           |
| `/dashboard/events/:id/edit` | 🏢 Organizer only           |
| `/dashboard/transactions`    | 🏢 Organizer only           |
| `/dashboard/analytics`       | 🏢 Organizer only           |

**Contoh Pembatasan Akses:**

- Jika customer mencoba akses `/dashboard` → diarahkan ke `/` (home).
- Jika user belum login mencoba akses `/my-tickets` → diarahkan ke `/login`.
- Jika user sudah login mencoba akses `/login` → diarahkan ke `/` (home).

---

## 2. Referral System, Profile & Rewards

### 2.1 Logika Referral

**Alur:**

```
User B mendaftar dengan referral code milik User A
        │
        ├──► User B mendapat: Coupon diskon (berlaku 3 bulan)
        │
        └──► User A mendapat: 10.000 point (berlaku 3 bulan)
```

**Detail Rewards:**

| Penerima              | Reward                    | Masa Berlaku             |
| --------------------- | ------------------------- | ------------------------ |
| User baru (referred)  | Coupon diskon             | 3 bulan dari registrasi  |
| Pengundang (referrer) | 10.000 point per referral | 3 bulan dari dikreditkan |

---

### 2.2 Masa Berlaku Point (3 Bulan)

**Aturan:** Setiap batch point kadaluarsa **3 bulan** setelah dikreditkan.

**Contoh Kasus:**

```
📋 Skenario:
- Hari ini: 28 Desember 2023
- Ada 3 orang mendaftar menggunakan referral code kamu:
  • User A mendaftar 28 Des 2023 → +10.000 point → expired 28 Mar 2024
  • User B mendaftar 5 Jan 2024  → +10.000 point → expired 5 Apr 2024
  • User C mendaftar 15 Jan 2024 → +10.000 point → expired 15 Apr 2024

📊 Saldo per tanggal:
- 28 Des 2023 : 10.000 point
- 5 Jan 2024  : 20.000 point
- 15 Jan 2024 : 30.000 point
- 28 Mar 2024 : 20.000 point (batch dari User A expired)
- 5 Apr 2024  : 10.000 point (batch dari User B expired)
- 15 Apr 2024 : 0 point      (batch dari User C expired)
```

**Implementasi:**

```typescript
// Saat membuat point reward:
const threeMonthsLater = new Date();
threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

await prisma.point.create({
  data: {
    userId: referredById,
    amount: 10000,
    status: "ACTIVE",
    source: `Referral dari ${input.email}`,
    expiredAt: threeMonthsLater,
  },
});
```

**Saat menggunakan point**, hanya point berstatus `ACTIVE` dan belum kadaluarsa (`expiredAt > now()`) yang diambil:

```typescript
const activePoints = await prisma.point.findMany({
  where: {
    userId,
    status: "ACTIVE",
    expiredAt: { gt: new Date() }, // Hanya yang belum expired
  },
  orderBy: { createdAt: "asc" }, // FIFO: yang pertama masuk, pertama keluar
});
```

---

### 2.3 Masa Berlaku Coupon (3 Bulan)

- Coupon yang didapat dari registrasi dengan referral berlaku **3 bulan** setelah didapatkan.
- Setelah 3 bulan, coupon tidak bisa digunakan lagi.

---

### 2.4 Profile Management

**Fitur:**

- **Edit profile:** Ubah nama dan foto profil (avatar).
- **Ganti password:** Ubah password dengan validasi password lama.
- **Reset password:** Kirim link reset ke email jika lupa password.

**Yang perlu dibuat:**

| Sisi         | Detail                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend** | Halaman profile dengan form edit. Modal atau halaman untuk ganti password.                                                                                                                                   |
| **Backend**  | Endpoint `PATCH /api/auth/profile` — update nama dan avatar. Endpoint `PATCH /api/auth/password` — validasi password lama, hash password baru. Endpoint `POST /api/auth/reset-password` — kirim email reset. |

---

## 3. Dashboard Event Organizer

### 3.1 Overview Dashboard

**Tujuan:** Memberikan ringkasan keseluruhan performa event organizer.

**Statistik yang ditampilkan (di `DashboardOverview.tsx`):**

| Metrik              | Sumber Data                                              |
| ------------------- | -------------------------------------------------------- |
| Total Events        | `COUNT` events milik organizer                           |
| Total Revenue       | `SUM` finalAmount dari transaksi berstatus `PAID`        |
| Total Attendees     | `COUNT` tiket dari transaksi berstatus `PAID`            |
| Recent Transactions | 5 transaksi terakhir (termasuk nama user dan nama event) |

---

### 3.2 Kelola Event (Manage Events)

**Fitur (di `ManageEvents.tsx`):**

| Aksi              | Detail                                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| Lihat semua event | Daftar event milik organizer dengan info kategori, tanggal, dan status. |
| Edit event        | Redirect ke `EditEvent.tsx` (menggunakan `EventForm.tsx`).              |
| Hapus event       | Hanya bisa jika belum ada transaksi. Tampilkan **popup konfirmasi**.    |

**Validasi saat hapus:**

- Cek apakah event memiliki transaksi → jika ada, **tidak boleh dihapus**.
- Tampilkan popup dialog konfirmasi: _"Apakah Anda yakin ingin menghapus event ini?"_

---

### 3.3 Melihat Transaksi & Accept/Reject Pembayaran

**Fitur (di `DashboardTransactions.tsx`):**

- Lihat semua transaksi untuk event milik organizer.
- Untuk setiap transaksi, organizer bisa:
  - ✅ **Accept** — status berubah jadi `DONE`.
  - ❌ **Reject** — status berubah jadi `REJECTED` + rollback point/voucher/seat.
  - 👁️ **Lihat bukti pembayaran** — tampilkan gambar/file yang diupload customer.

---

### 3.4 Daftar Peserta (Attendee List)

**Tujuan:** Menampilkan daftar orang yang sudah membeli/menghadiri event.

**Informasi yang ditampilkan:**

| Kolom         | Detail                               |
| ------------- | ------------------------------------ |
| Nama peserta  | Dari `user.name`                     |
| Email peserta | Dari `user.email`                    |
| Jumlah tiket  | Count dari `tickets` dalam transaksi |
| Total bayar   | `finalAmount` dari transaksi         |

Endpoint: `GET /api/dashboard?type=event-attendees&eventId=xxx`

---

## 4. Statistik & Laporan

### 4.1 Visualisasi Data

**Tujuan:** Menampilkan data keuangan dan performa event dalam bentuk grafik yang mudah dipahami.

**Jenis Visualisasi (di `DashboardAnalytics.tsx`):**

| Periode     | Endpoint                                    | Jenis Grafik           |
| ----------- | ------------------------------------------- | ---------------------- |
| **Harian**  | `GET /api/dashboard?type=daily&days=30`     | Line Chart / Bar Chart |
| **Bulanan** | `GET /api/dashboard?type=monthly&year=2024` | Bar Chart              |
| **Tahunan** | `GET /api/dashboard?type=yearly`            | Bar Chart              |

**Contoh Data Bulanan:**

```json
[
  { "month": 1, "label": "Jan", "revenue": 5000000 },
  { "month": 2, "label": "Feb", "revenue": 7500000 },
  { "month": 3, "label": "Mar", "revenue": 3200000 }
]
```

**Library:** `Chart.js` via React wrapper (`react-chartjs-2`). User bisa toggle antara Bar Chart dan Line Chart.

---

## 5. Email Notifikasi

### 5.1 Kapan Email Dikirim?

| Event                          | Penerima     | Isi Email                                                                    |
| ------------------------------ | ------------ | ---------------------------------------------------------------------------- |
| Transaksi diterima (accepted)  | Customer     | "Pembayaran Anda untuk event [nama event] telah dikonfirmasi."               |
| Transaksi ditolak (rejected)   | Customer     | "Pembayaran Anda ditolak. Point/voucher/seat sudah dikembalikan."            |
| Registrasi berhasil            | User baru    | "Selamat datang! Ini adalah referral code Anda: [kode]."                     |
| Transaksi mendekati expired    | Customer     | "Segera upload bukti pembayaran! Sisa waktu: [X jam]."                       |
| **Pembayaran berhasil (PAID)** | **Customer** | **Berisi E-Ticket lengkap dengan lampiran QR Code (generated by `qrcode`).** |

**Catatan Integrasi Email & QR Code:**

- Email dikirim menggunakan **Nodemailer** (`nodemailer`), dengan transport SMTP yang diambil dari variabel environment (contoh Gmail SMTP).
- File konfigurasi email berada di `backend/src/utils/mail.ts`.
- Fungsi `generateQRCode()` di `backend/src/utils/slug.ts` menggunakan library `qrcode` untuk membuat base64 image dari unique string tiket. Ini kemudian di-inject ke HTML email dan digenerate.
- Pastikan detail pengembalian (point, voucher, seat) ditulis di dalam email jika transaksi rejected.

### 🔗 Konfigurasi Proxy Pengembangan Lokal (Vite Dev Server)

Saat mengembangkan secara lokal (`npm run dev`), `VITE_API_URL=/api` (relatif) memerlukan proxy di Vite agar request tidak 404. Konfigurasi di `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

Dengan proxy ini, `fetch('/api/events')` di browser akan diteruskan otomatis ke `http://localhost:5000/api/events`.

---

# ⚠️ Kebutuhan Teknis Penting

## 1. Responsiveness (Mobile-Friendly)

- Semua halaman harus tampil baik di desktop, tablet, dan mobile.
- Gunakan **CSS media queries** atau **flexbox/grid** yang responsif.
- Navbar harus punya **hamburger menu** di mobile.

## 2. Debounce pada Search

- Implementasi menggunakan custom hook `useDebounce` dengan delay 500ms.
- Mencegah spam request ke server saat user mengetik.

## 3. Handling Data Kosong (Empty State)

- Jika pencarian atau filter tidak menghasilkan data, tampilkan pesan yang informatif.
- Contoh: _"Tidak ada event yang sesuai dengan pencarian Anda"_ — bukan layar kosong.

## 4. Popup Konfirmasi saat Edit/Hapus Data

- Tampilkan dialog konfirmasi **sebelum** melakukan aksi yang tidak bisa di-undo.
- Contoh: _"Apakah Anda yakin ingin menghapus event ini? Aksi ini tidak dapat dibatalkan."_
- Gunakan komponen dialog/modal — bukan `window.confirm()`.

## 5. Unit Testing

- Buat unit test untuk setiap flow penting:
  - Registrasi & login
  - Pembuatan event
  - Pembelian tiket (termasuk edge case: seat habis, promo expired)
  - Penggunaan point
  - Rollback saat transaksi gagal
- Gunakan testing framework seperti **Jest** atau **Vitest**.

## 6. SQL Transaction untuk Proses Multi-Step

- Gunakan `prisma.$transaction()` untuk setiap operasi yang melibatkan **lebih dari satu penulisan ke database**.
- Contoh: pembuatan transaksi (11 step), rollback (3+ step).
- Ini memastikan **atomicity** — semua berhasil, atau semua dibatalkan.

---

# 🧠 Pembagian Tugas

## Tim Feature 1 — Sistem Event & Transaksi

### 🖥️ Frontend

| No  | Tugas                                         | File                              |
| --- | --------------------------------------------- | --------------------------------- |
| 1   | Landing page — daftar event dengan pagination | `HomePage.tsx`                    |
| 2   | Komponen kartu event                          | `EventCard.tsx`                   |
| 3   | Halaman detail event                          | `EventDetailPage.tsx`             |
| 4   | Pemilih tiket & form checkout                 | `TicketSelector.tsx`              |
| 5   | Form pembuatan & edit event                   | `EventForm.tsx`                   |
| 6   | Daftar review                                 | `ReviewList.tsx`                  |
| 7   | Halaman tiket saya                            | `MyTicketsPage.tsx`               |
| 8   | Halaman riwayat transaksi                     | `TransactionHistoryPage.tsx`      |
| 9   | Search bar dengan debounce                    | `HomePage.tsx` + `useDebounce.ts` |
| 10  | Filter event (kategori & kota)                | `HomePage.tsx`                    |
| 11  | Empty state untuk pencarian/filter kosong     | Semua halaman list                |
| 12  | Popup konfirmasi hapus event                  | `ManageEvents.tsx`                |

### ⚙️ Backend

| No  | Tugas                                                | File                                                               |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | CRUD Event (create, read, update, delete)            | `event.controller.ts` + `event.service.ts` + `event.repository.ts` |
| 2   | Browsing event dengan search, filter, pagination     | `event.service.ts` → `getEventsService`                            |
| 3   | Detail event by slug (termasuk reviews & promotions) | `event.service.ts` → `getEventBySlugService`                       |
| 4   | Pembuatan transaksi (11-step atomic)                 | `transaction.service.ts` → `createTransactionService`              |
| 5   | Pembayaran transaksi (PENDING → PAID)                | `transaction.service.ts` → `payTransactionService`                 |
| 6   | Point service — ambil saldo & FIFO redemption        | `point.service.ts`                                                 |
| 7   | Review & rating — create + get + validasi purchased  | `review.service.ts` + `review.repository.ts`                       |
| 8   | Validasi promo code (cek expired, max usage)         | `transaction.service.ts` (Step 3)                                  |
| 9   | Logika rollback (point, voucher, seat)               | `transaction.service.ts`                                           |
| 10  | Slug generation untuk event                          | `utils/slug.ts`                                                    |
| 11  | QR code generation untuk tiket                       | `utils/slug.ts`                                                    |

### 🗄️ Database

| No  | Tabel          | Fungsi                                       |
| --- | -------------- | -------------------------------------------- |
| 1   | `events`       | Menyimpan data event                         |
| 2   | `categories`   | Daftar kategori event                        |
| 3   | `ticket_types` | Tipe-tipe tiket untuk setiap event           |
| 4   | `tickets`      | Tiket yang dimiliki customer (per transaksi) |
| 5   | `transactions` | Log transaksi pembelian tiket                |
| 6   | `promotions`   | Voucher promo khusus event                   |
| 7   | `reviews`      | Review dan rating dari customer              |
| 8   | `redemptions`  | Log pemakaian point dalam transaksi          |

---

## Tim Feature 2 — Sistem User & Dashboard

### 🖥️ Frontend

| No  | Tugas                                                            | File                        |
| --- | ---------------------------------------------------------------- | --------------------------- |
| 1   | Halaman registrasi (termasuk input referral code & pilihan role) | `RegisterPage.tsx`          |
| 2   | Halaman login                                                    | `LoginPage.tsx`             |
| 3   | Auth context & state management                                  | `AuthContext.tsx`           |
| 4   | Protected route & guest route wrapper                            | `App.tsx`                   |
| 5   | Navbar (dynamic menu berdasarkan role & login status)            | `Navbar.tsx`                |
| 6   | Footer                                                           | `Footer.tsx`                |
| 7   | Dashboard layout (sidebar + content area)                        | `DashboardLayout.tsx`       |
| 8   | Dashboard overview — statistik ringkasan                         | `DashboardOverview.tsx`     |
| 9   | Halaman manage events di dashboard                               | `ManageEvents.tsx`          |
| 10  | Halaman buat event di dashboard                                  | `CreateEvent.tsx`           |
| 11  | Halaman edit event di dashboard                                  | `EditEvent.tsx`             |
| 12  | Halaman kelola transaksi (accept/reject)                         | `DashboardTransactions.tsx` |
| 13  | Halaman analitik & grafik                                        | `DashboardAnalytics.tsx`    |
| 14  | Halaman profil & edit password                                   | (perlu dibuat)              |
| 15  | UI Components reusable (Button, Card, Modal, dll)                | `UIComponents.tsx`          |

### ⚙️ Backend

| No  | Tugas                                                                | File                                                     |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Register service (validasi, hash password, buat user, buat referral) | `auth.service.ts` → `registerService`                    |
| 2   | Login service (validasi credentials, generate JWT)                   | `auth.service.ts` → `loginService`                       |
| 3   | Referral logic (validasi kode, beri 10.000 point ke referrer)        | `auth.service.ts`                                        |
| 4   | Auth middleware (verifikasi JWT token)                               | `auth.middleware.ts`                                     |
| 5   | Role middleware (cek role user)                                      | `role.middleware.ts`                                     |
| 6   | JWT utility (sign & verify token)                                    | `utils/jwt.ts`                                           |
| 7   | Password utility (hash & compare)                                    | `utils/hash.ts`                                          |
| 8   | Dashboard stats (total events, revenue, attendees)                   | `dashboard.repository.ts` → `getOrganizerStats`          |
| 9   | Revenue analytics (daily, monthly, yearly)                           | `dashboard.repository.ts` → `getRevenueByDay/Month/Year` |
| 10  | Daftar peserta per event                                             | `transaction.repository.ts` → `findTransactionsByEvent`  |
| 11  | Email notification service (Nodemailer, template)                    | `utils/mail.ts`                                          |
| 12  | Redis Caching setup (Docker based config)                            | `lib/redis.ts`                                           |
| 13  | Profile update endpoint                                              | (perlu dibuat)                                           |

### 🗄️ Database

| No  | Tabel            | Fungsi                                               |
| --- | ---------------- | ---------------------------------------------------- |
| 1   | `users`          | Data user (email, nama, password hash, role, avatar) |
| 2   | `referral_codes` | Kode referral unik per user                          |
| 3   | `points`         | Saldo point user (dengan expired date per batch)     |

---

## 🤝 Dikerjakan Bersama-sama (Shared / Collaborative Work)

> ⚠️ **PENTING:** Bagian ini menjelaskan komponen-komponen yang **HARUS dikerjakan bersama** oleh kedua tim, karena saling bergantung satu sama lain. Koordinasi yang buruk di bagian ini akan menyebabkan **conflict** saat merge dan **bug** yang sulit dilacak.

---

### 1. Database Schema (`schema.prisma`) — 🔴 PRIORITAS TERTINGGI

**Kenapa harus bersama?**

> Semua tabel di database saling terhubung. Misalnya, tabel `transactions` (Feature 1) membutuhkan foreign key ke tabel `users` (Feature 2), dan tabel `points` (Feature 2) digunakan dalam logika transaksi (Feature 1). Jika satu tim mengubah schema tanpa koordinasi, Prisma migrate akan gagal.

| File            | Lokasi                         |
| --------------- | ------------------------------ |
| `schema.prisma` | `backend/prisma/schema.prisma` |
| `seed.ts`       | `backend/prisma/seed.ts`       |

**Yang harus disepakati bersama:**

| Komponen             | Dibutuhkan oleh | Detail                                                                                                        |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| Tabel `users`        | Kedua tim       | Feature 2 membuat tabel ini, Feature 1 membutuhkannya untuk relasi di `events`, `transactions`, `reviews`     |
| Tabel `points`       | Kedua tim       | Feature 2 membuat point saat referral, Feature 1 menggunakan point saat transaksi                             |
| Tabel `promotions`   | Kedua tim       | Feature 1 membuat voucher promo event, Feature 2 membuat coupon referral — **keduanya pakai tabel yang sama** |
| Tabel `transactions` | Kedua tim       | Feature 1 membuat transaksi, Feature 2 menampilkan dan mengelolanya di dashboard                              |
| Enum `PromotionType` | Kedua tim       | `DATE_BASED_DISCOUNT` (Feature 1) dan `REFERRAL_VOUCHER` (Feature 2)                                          |
| Seeder data          | Kedua tim       | Data dummy untuk testing harus mencakup users, events, transaksi, dan referral                                |

**Rekomendasi:**

- Buat schema **di awal project** bersama-sama sebelum mulai coding.
- Tentukan satu orang sebagai **"schema owner"** yang bertanggung jawab menjalankan `prisma migrate`.
- Setiap perubahan schema harus dikomunikasikan ke tim lain **sebelum di-commit**.

---

### 2. Prisma Client & Konfigurasi Database

| File               | Lokasi                      | Fungsi                                                |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| `prisma.ts`        | `backend/src/lib/prisma.ts` | Singleton instance Prisma Client                      |
| `prisma.config.ts` | `backend/prisma.config.ts`  | Konfigurasi Prisma                                    |
| `.env`             | `backend/.env`              | Environment variables (DATABASE_URL, JWT_SECRET, dll) |

**Kenapa harus bersama?**

> Kedua tim menggunakan Prisma Client yang sama untuk mengakses database. Jika ada perubahan di konfigurasi koneksi atau environment variables, kedua tim harus tahu.

---

### 3. TypeScript Type Definitions (Frontend)

| File       | Lokasi                        |
| ---------- | ----------------------------- |
| `index.ts` | `frontend/src/types/index.ts` |

**Kenapa harus bersama?**

> File ini mendefinisikan **semua interface TypeScript** yang dipakai di seluruh frontend. Kedua tim menambah/memodifikasi type di sini.

| Interface                          | Digunakan oleh                                            |
| ---------------------------------- | --------------------------------------------------------- |
| `User`                             | Feature 2 (auth), Feature 1 (organizer info di event)     |
| `Event`, `TicketType`, `Category`  | Feature 1 (event display & creation)                      |
| `Transaction`, `Ticket`            | Feature 1 (pembelian), Feature 2 (dashboard)              |
| `Promotion`                        | Feature 1 (voucher promo), Feature 2 (coupon referral)    |
| `Point`                            | Feature 2 (referral reward), Feature 1 (penggunaan point) |
| `Review`                           | Feature 1 (review event)                                  |
| `PaginatedResponse`, `ApiResponse` | Kedua tim (format response API)                           |

**Rekomendasi:**

- Definisikan **semua types di awal** berdasarkan schema Prisma.
- Gunakan naming convention yang konsisten.

---

### 4. API Base Configuration (Frontend)

| File     | Lokasi                         | Fungsi                                               |
| -------- | ------------------------------ | ---------------------------------------------------- |
| `api.ts` | `frontend/src/services/api.ts` | Axios instance dengan base URL dan interceptor token |

**Kenapa harus bersama?**

> Semua API call dari kedua tim menggunakan Axios instance yang sama. Jika satu tim mengubah base URL, interceptor, atau error handling, tim lain harus tahu.

**Yang disepakati:**

- Base URL API (contoh: `http://localhost:3000/api`)
- Format header Authorization (`Bearer <token>`)
- Format response dari backend (selalu `{ success, message, data }`)

---

### 5. Utility Response Format (Backend)

| File          | Lokasi                          | Fungsi                                           |
| ------------- | ------------------------------- | ------------------------------------------------ |
| `response.ts` | `backend/src/utils/response.ts` | Helper `successResponse()` dan `errorResponse()` |

**Kenapa harus bersama?**

> Semua controller dari kedua tim menggunakan format response yang sama. Konsistensi ini penting agar frontend bisa mem-parse response dengan cara yang seragam.

---

### 6. Routing — Frontend (`App.tsx`)

| File      | Lokasi                 |
| --------- | ---------------------- |
| `App.tsx` | `frontend/src/App.tsx` |

**Kenapa harus bersama?**

> File ini mendefinisikan **semua route** aplikasi. Kedua tim menambahkan route di sini:

| Route                            | Ditambahkan oleh |
| -------------------------------- | ---------------- |
| `/` (Home), `/events/:slug`      | Feature 1        |
| `/my-tickets`, `/transactions`   | Feature 1        |
| `/login`, `/register`            | Feature 2        |
| `/dashboard/*` (semua sub-route) | Feature 2        |

**⚠️ Potensi Conflict:** Jika kedua tim mengedit `App.tsx` secara bersamaan tanpa koordinasi → **merge conflict** dijamin terjadi.

**Rekomendasi:**

- Definisikan **skeleton route** di awal bersama-sama.
- Setelah itu, masing-masing tim hanya mengisi konten halaman masing-masing.

---

### 7. Routing — Backend (`routes/index.ts`)

| File       | Lokasi                        |
| ---------- | ----------------------------- |
| `index.ts` | `backend/src/routes/index.ts` |

**Kenapa harus bersama?**

> File ini mendaftarkan semua router ke Express app:

```typescript
router.use("/auth", authRoutes); // Feature 2
router.use("/events", eventRoutes); // Feature 1
router.use("/transactions", transactionRoutes); // Feature 1 + 2
router.use("/reviews", reviewRoutes); // Feature 1
router.use("/dashboard", dashboardRoutes); // Feature 2
```

---

### 8. Shared UI Components

| File               | Lokasi                                     | Fungsi                                                                                                 |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `UIComponents.tsx` | `frontend/src/components/UIComponents.tsx` | Komponen reusable: Button, Card, Modal, Input, dll                                                     |
| `Navbar.tsx`       | `frontend/src/components/Navbar.tsx`       | Navigasi — berubah berdasarkan login state (Feature 2) dan menampilkan link ke event/tiket (Feature 1) |
| `Footer.tsx`       | `frontend/src/components/Footer.tsx`       | Footer — dipakai di semua halaman                                                                      |

**Kenapa harus bersama?**

> **Navbar** adalah contoh nyata ketergantungan kedua tim:
>
> - **Feature 2** bertanggung jawab atas logika login/logout, tampilan nama user, dan menu berdasarkan role.
> - **Feature 1** menambahkan link ke halaman event, tiket, dan transaksi.
>
> Jika masing-masing tim mengedit Navbar sendiri-sendiri → conflict.

> **UIComponents** dipakai bersama. Jika Feature 1 membuat tombol baru dan Feature 2 juga membuat tombol baru tapi beda style → UI tidak konsisten.

**Rekomendasi:**

- Buat **design system dasar** di awal (warna, ukuran font, border radius, dll).
- Sepakati komponen UIComponents **sebelum** mulai coding halaman.

---

### 9. Global Styles (`index.css`)

| File        | Lokasi                   |
| ----------- | ------------------------ |
| `index.css` | `frontend/src/index.css` |

**Kenapa harus bersama?**

> CSS global mempengaruhi tampilan seluruh aplikasi. Jika satu tim mengubah variabel warna atau spacing, semua halaman terpengaruh.

**Yang harus disepakati:**

- Color palette (warna utama, warna aksen, warna background)
- Typography (font family, ukuran heading)
- Spacing system (gap, padding, margin)
- Breakpoint untuk responsiveness

---

### 10. Entry Points & Config

| File            | Lokasi                  | Fungsi                                                |
| --------------- | ----------------------- | ----------------------------------------------------- |
| `main.tsx`      | `frontend/src/main.tsx` | Entry point frontend (memasang `AuthProvider`)        |
| `app.ts`        | `backend/src/app.ts`    | Express app setup (CORS, JSON parser, route mounting) |
| `server.ts`     | `backend/src/server.ts` | Server startup                                        |
| `package.json`  | Frontend & Backend      | Dependencies — kedua tim bisa menambah package        |
| `tsconfig.json` | Frontend & Backend      | TypeScript config                                     |

**Kenapa harus bersama?**

> Jika masing-masing tim menambah dependency di `package.json` secara bersamaan → merge conflict. `main.tsx` membutuhkan `AuthProvider` dari Feature 2 yang membungkus seluruh app termasuk halaman Feature 1.

---

### 11. Helper / Utility Functions

| File          | Lokasi                          | Dipakai oleh                                       |
| ------------- | ------------------------------- | -------------------------------------------------- |
| `helpers.ts`  | `frontend/src/utils/helpers.ts` | Kedua tim (format tanggal, format harga IDR, dll)  |
| `response.ts` | `backend/src/utils/response.ts` | Kedua tim (format API response)                    |
| `slug.ts`     | `backend/src/utils/slug.ts`     | Feature 1 (slug event) + Feature 2 (referral code) |

**Perhatian khusus untuk `slug.ts`:**

> File ini berisi `generateSlug()` (dipakai Feature 1 untuk slug event), `generateReferralCode()` (dipakai Feature 2 untuk referral), dan `generateQRCode()` (dipakai Feature 1 untuk QR tiket). Kedua tim berkontribusi di file ini.

---

### 12. Unit Testing Setup

| Komponen          | Detail                                                      |
| ----------------- | ----------------------------------------------------------- |
| Testing framework | Harus disepakati bersama (Jest atau Vitest)                 |
| Test config       | `jest.config.ts` atau `vitest.config.ts` — satu untuk semua |
| Test database     | Database testing terpisah dari development                  |
| Mock setup        | Cara mock Prisma, JWT, dll harus konsisten                  |

**Kenapa harus bersama?**

> Jika Feature 1 menggunakan Jest tapi Feature 2 menggunakan Vitest → dua framework testing dalam satu project = kacau.

---

### 13. Deployment & Environment

| Komponen               | Detail                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `.env` file            | Kedua tim harus punya env variable yang sama                                                                                      |
| Database migrations    | Harus dijalankan berurutan, tidak boleh concurrent                                                                                |
| Git branching strategy | Harus disepakati agar merge berjalan lancar                                                                                       |
| **Upstash Redis**      | Gunakan Upstash Cloud (bukan Docker container Redis lokal). Isi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` di `.env` |
| **Docker Build**       | Frontend Docker build **wajib** melewati `ARG VITE_API_URL=/api` agar tidak kena CORS error saat deployment                       |

---

### 📊 Ringkasan Visual — Peta Ketergantungan

```
┌─────────────────────────────────────────────────────────┐
│                  🤝 DIKERJAKAN BERSAMA                  │
│                                                         │
│  📋 schema.prisma    📋 seed.ts       📋 .env           │
│  📋 types/index.ts   📋 api.ts        📋 response.ts    │
│  📋 App.tsx          📋 routes/index   📋 index.css      │
│  📋 Navbar.tsx       📋 Footer.tsx     📋 UIComponents   │
│  📋 main.tsx         📋 app.ts         📋 slug.ts        │
│  📋 helpers.ts       📋 package.json   📋 tsconfig       │
│  📋 Testing setup    📋 Git strategy   📋 prisma.ts      │
│                                                         │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│  🚀 FEATURE 1       │         🔐 FEATURE 2              │
│  Sistem Event &     │         Sistem User &             │
│  Transaksi          │         Dashboard                 │
│                     │                                   │
│  • HomePage         │  • LoginPage                      │
│  • EventDetailPage  │  • RegisterPage                   │
│  • EventCard        │  • AuthContext                    │
│  • TicketSelector   │  • DashboardLayout                │
│  • EventForm        │  • DashboardOverview              │
│  • ReviewList       │  • DashboardTransactions          │
│  • MyTicketsPage    │  • DashboardAnalytics             │
│  • TransactionHist  │  • ManageEvents                   │
│                     │  • CreateEvent / EditEvent        │
│  • event.service    │                                   │
│  • event.repository │  • auth.service                   │
│  • event.controller │  • auth.controller                │
│  • transaction.*    │  • dashboard.*                    │
│  • review.*         │  • user.repository                │
│  • point.service    │  • auth.middleware                 │
│                     │  • role.middleware                 │
│                     │  • jwt.ts / hash.ts               │
└─────────────────────┴───────────────────────────────────┘
```

---

### 💡 Tips Kolaborasi agar Tidak Bentrok

| No  | Tips                                 | Penjelasan                                                                                                    |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | **Schema first**                     | Buat `schema.prisma` dan `types/index.ts` bersama-sama di hari pertama.                                       |
| 2   | **Branching strategy**               | Gunakan branch terpisah per feature: `feature/1-events`, `feature/2-auth`. Merge ke `develop` secara berkala. |
| 3   | **Komunikasi perubahan shared file** | Sebelum mengubah file bersama (Navbar, App.tsx, dll), informasikan ke tim lain via chat/meeting.              |
| 4   | **Daily sync**                       | Lakukan sync singkat (15 menit) setiap hari untuk update progress dan potensi conflict.                       |
| 5   | **Pull sebelum push**                | Selalu `git pull` sebelum mulai kerja dan sebelum push.                                                       |
| 6   | **Jangan edit file yang sama**       | Jika harus edit file yang sama, bagi per section/function dan merge manual.                                   |
| 7   | **Seed data bersama**                | Buat seed data yang lengkap dan konsisten untuk testing kedua fitur.                                          |
| 8   | **Sepakati format**                  | Format response API, format tanggal, format harga — harus konsisten sejak awal.                               |

---

# 🏗️ Struktur Folder Project

```
project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 📋 Definisi semua tabel database
│   │   └── seed.ts                # 🌱 Data awal (seeder)
│   ├── src/
│   │   ├── controllers/           # 🎮 Menerima & merespon HTTP request
│   │   │   ├── auth.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   └── transaction.controller.ts
│   │   ├── services/              # 🧠 Business logic (aturan dan validasi)
│   │   │   ├── auth.service.ts
│   │   │   ├── event.service.ts
│   │   │   ├── point.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── transaction.service.ts
│   │   ├── repositories/          # 🗄️ Akses database (Prisma queries)
│   │   │   ├── dashboard.repository.ts
│   │   │   ├── event.repository.ts
│   │   │   ├── review.repository.ts
│   │   │   ├── transaction.repository.ts
│   │   │   └── user.repository.ts
│   │   ├── routes/                # 🛣️ Definisi endpoint API
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   ├── review.routes.ts
│   │   │   └── transaction.routes.ts
│   │   ├── middlewares/           # 🔒 Auth & role checking
│   │   │   ├── auth.middleware.ts
│   │   │   └── role.middleware.ts
│   │   ├── utils/                 # 🔧 Helper functions
│   │   │   ├── hash.ts
│   │   │   ├── jwt.ts
│   │   │   ├── response.ts
│   │   │   └── slug.ts
│   │   ├── lib/                   # 📚 Prisma client instance
│   │   ├── app.ts                 # 🚀 Express app setup
│   │   └── server.ts              # 🌐 Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 # 📄 Halaman-halaman utama
│   │   │   ├── HomePage.tsx
│   │   │   ├── EventDetailPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── MyTicketsPage.tsx
│   │   │   ├── TransactionHistoryPage.tsx
│   │   │   └── dashboard/         # 📊 Halaman dashboard organizer
│   │   │       ├── DashboardLayout.tsx
│   │   │       ├── DashboardOverview.tsx
│   │   │       ├── ManageEvents.tsx
│   │   │       ├── CreateEvent.tsx
│   │   │       ├── EditEvent.tsx
│   │   │       ├── DashboardTransactions.tsx
│   │   │       └── DashboardAnalytics.tsx
│   │   ├── components/            # 🧩 Komponen reusable
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── TicketSelector.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   └── UIComponents.tsx
│   │   ├── context/               # 🔄 Global state management
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/                 # 🪝 Custom React hooks
│   │   │   └── useDebounce.ts
│   │   ├── services/              # 📡 API call functions
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── event.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── transaction.service.ts
│   │   ├── types/                 # 📝 TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── utils/                 # 🔧 Helper functions
│   │   │   └── helpers.ts
│   │   ├── App.tsx                # 🗺️ Router & route definitions
│   │   ├── main.tsx               # ⚡ App entry point
│   │   └── index.css              # 🎨 Global styles
│   └── package.json
│
├── Explanation.md                 # 📖 File ini!
└── README.md                      # 📘 Panduan setup project
```

---

# 📝 Catatan Penting

## Perbedaan Voucher dan Coupon

Ini adalah perbedaan yang **sangat penting** dan sering membingungkan:

| Aspek             | 🎟️ Voucher (Promotion)                                           | 🎁 Coupon (Referral Reward)                        |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| **Dibuat oleh**   | Event Organizer                                                  | Sistem (otomatis saat registrasi dengan referral)  |
| **Berlaku untuk** | **Hanya event tertentu** (event milik organizer tsb)             | **Semua event** di platform                        |
| **Cara kerja**    | Organizer membuat kode promo khusus untuk eventnya               | Sistem otomatis memberi coupon ke user baru        |
| **Masa berlaku**  | Sesuai `startDate` dan `endDate` yang ditentukan organizer       | 3 bulan sejak registrasi                           |
| **Batas pakai**   | Sesuai `maxUsage` yang ditentukan organizer                      | Biasanya sekali pakai per user                     |
| **Contoh**        | Kode "EARLYBIRD20" → diskon 20% untuk event "Jazz Night Jakarta" | Coupon otomatis → diskon 10% untuk event apa saja  |
| **Di database**   | Tabel `promotions` dengan `eventId` spesifik                     | Tabel `promotions` dengan `type: REFERRAL_VOUCHER` |

### Ringkasan Sederhana:

> - **Voucher** = diskon dari **organizer** → hanya untuk **event dia**.
> - **Coupon** = diskon dari **sistem** → bisa untuk **semua event**.

---

# 🔑 Ringkasan Poin Penting untuk Presentasi

1. **Arsitektur Backend** menggunakan pola **Controller → Service → Repository**, memisahkan tanggung jawab setiap layer.
2. **Semua harga dalam IDR** (Rupiah Indonesia) dan disimpan sebagai integer (tanpa desimal).
3. **Point menggunakan sistem FIFO** — point yang paling lama didapat, paling duluan dipakai.
4. **Setiap transaksi bersifat atomic** — menggunakan `prisma.$transaction()` untuk menjamin konsistensi data.
5. **Proteksi berlapis** — JWT di backend (middleware) + route guard di frontend (`ProtectedRoute`).
6. **Validasi berlapis** — Zod schema di backend + form validation di frontend.
7. **Responsive design** wajib diterapkan di semua halaman.
8. **Debounce** mengurangi beban server saat pencarian real-time.

---

> 📌 **Dokumen ini dibuat berdasarkan analisis lengkap source code project Soundwave Music Platform.**
> Terakhir diperbarui: April 2026.
