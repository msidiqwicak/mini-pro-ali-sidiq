# SETUP Tambahan

Install tambahan Untuk Folder Frontend

`npm install react-router-dom`
`npm install axios react-hook-form @hookform/resolvers zod chart.js react-chartjs-2 lucide-react clsx tailwind-merge`

kegunaan package yang di install:
`react-router-dom` -> Routing Halaman(Home,Login,Dashboard,dll) 
`axios` -> HTTP client untuk panggil API backend
`react-hook-form` -> Manajemen Form (Login, Register, Create Event)
`@hookform/resolvers` -> Jembatan antara react-hook-form dan Zod
`zod` -> Validasi form di sisi frontend
`chart.js` -> Library chart untuk grafik analitik
`react-chartjs-2` -> Wrapper React untuk chart.js
`lucide-react` -> Icon (Calendar, MapPin, Music2, dll)
`clsx` -> Helper conditional className
`tailwind-merge` -> Merge class Tailwind tanpa konflik

---

# SETUP Infrastruktur Backend Tambahan

Berdasarkan arsitektur terbaru, backend kini membutuhkan layer caching, notifikasi email, dan sistem QR:

### 1. Redis Caching via Docker
Untuk menjalankan server secara optimal, wajib menjalankan container Redis:
`docker run -d --name soundwave-redis -p 6379:6379 redis/redis-stack:latest`

### 2. Dependency Tambahan Backend
`npm install redis nodemailer qrcode winston`

kegunaan package tambahan dari sisi backend:
`redis` -> Node.js client untuk terhubung dengan server Redis untuk caching data analitik atau load tinggi.
`nodemailer` -> Mengirim email transaksional berupa E-Ticket, Payment Confirmation, maupun Welcome Email (referral).
`qrcode` -> Membuat/generate QR Code image (base64) secara dinamis sesuai tipe tiket.
`winston` -> Library Advanced Logging, error dan log akses tersimpan dengan rapi di dalam directory log project.
