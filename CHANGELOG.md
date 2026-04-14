# Changelog & Update History

# Dokumen ini mencatat seluruh perubahan, perbaikan bug, dan penambahan fitur yang dilakukan pada       proyek Soundwave Music Platform.

## [2026-04-03] - Pembaruan Saat Ini
- **Fixing Event Voucher Validation**: Memperbaiki logika validasi pemakaian Voucher Diskon oleh event organizer di halaman checkout yang sebelumnya menyebabkan error *pukul rata* "kode tidak valid". Menambahkan pesan respons spesifik di `transaction.service.ts` agar klien mendapatkan detail perbaikan seperti: "Kode promo ini belum aktif", "Kode promo sudah kadaluarsa", "Kode promo sudah habis digunakan", dan "Kode promo tidak valid" (jika eksistensinya tidak ditemukan).
- **Changelog Tracking**: Memulai inisialisasi dokumen `CHANGELOG.md` untuk mencatat setiap instruksi peruabahan yang dilakukan dari hari ini dan 2 hari sebelumnya.

*(Riwayat 2 hari terakhir di bawah ini di-ekstrak dari daftar aktivitas History)*

## [2026-04-02]
- **Testing Referral Voucher System**: Melakukan pengujian sistem voucher *End-to-End* secara manual pada *flow* proses *checkout* tiket menggunakan dummy event (*Event Voucher Test Final*) untuk memvalidasi penggunaan kode promosi diskon di web secara empiris.
- **Implementing Event Voucher System**: Menambahkan dukungan fitur pembuatan diskon / voucher pada komponen `EventForm`. Memungkinkan Organizer untuk bisa menentukan kode promo, rentang tanggal `startDate` dan `endDate`, max kuota, serta persentase diskon saat merilis event, sehingga backend (Prisma) bisa menyimpan detail promosi yang valid.

## [2026-04-01]
- **Fixing TypeScript Spread Error (`response.ts`)**: Turun tangan untuk mengatasi error *"Spread types may only be created from object types"*. Merefaktor ulang fungsi `errorResponse` agar penyebaran atribut objek (termasuk optional `errors` object) menjadi *type-safe* tanpa melanggar strict mode dari TypeScript.
- **Documenting Event Platform Features (`Explanation.md`)**: Menyusun format dokumentasi terstruktur platform yang utuh. Pembuatan file Markdown teknis yang memperjelas *timeline* pekerjaan dan pembagian *scope* antara Feature 1 dan Feature 2, membantu manajemen tugas presentasi nantinya.
- **Fixing Event Service Type Mismatch (`event.service.ts`)**: Penyesuaian tipe `startDate` & `endDate` pada layanan update (fungsi `updateEventService`). Mengatasi konflik tipe dari Zod form input (`string | Date | undefined`) agar berhasil ter-*parse* dan masuk menjadi *Object Date* murni sebelum dieksekusi layanan Prisma.
- **Fixing TypeScript Type Mismatch (`review.controller.ts`)**: Membetulkan pembacaan `req.params.id`. Menyelesaikan *error mismatch* mengingat Express dapat mengurai params menjadi `string` tunggal atau array `string[]`, dengan cara memperkuat filter validasi menjadi param string mutlak yang dapat dimasukkan ke layanan *Get Review*.
- **Fixing Chart.js TypeScript Errors (`DashboardAnalytics.tsx`)**: Menangani masalah persimpangan tipe untuk *Chart Data*. Menyelesaikan inkonsistensi tipe prop (Type Error) pada *dynamic charting* (ketika komponen dapat berganti tampilan fleksibel antara grafik Batang / *Bar Chart* dan grafik *Line Chart*).
