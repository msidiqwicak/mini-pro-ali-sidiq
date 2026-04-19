# Referral System, Profile & Prizes — Implementation Plan

## Goal

Implement the missing features so these scenarios can be tested end-to-end:

1. **Referral Rewards** – Referrer gets 10,000 pts (✅ backend DONE), new registrant gets a **discount coupon** (✅ backend DONE, missing UI)
2. **Points Expiration** – 3-month expiry (✅ in DB), but **no UI** to see points balance/expiry
3. **Coupon Expiration** – Discount coupon valid 3 months (✅ backend DONE, missing UI)
4. **Profile Page** – Missing in UI: edit name, avatar, change password, display referral code, points, coupons (✅ backend APIs are DONE)

---

## User Review Required

> [!IMPORTANT]
> The `Promotion` model in Prisma is event-specific. For user-level referral coupons we will add a lightweight `Coupon` model and run `prisma migrate dev`. This requires the database to be running.

> [!WARNING]
> Password reset (forgot-password) typically requires SMTP e-mail. We will implement the UI & a backend token-based reset flow, but it will only work if an SMTP service is configured. The page itself will be fully built.

---

## Proposed Changes

### Backend

#### [DONE] prisma/schema.prisma

Added new `Coupon` model and relation on `User`.

#### [DONE] src/repositories/user.repository.ts

Added helpers: `updateUserById`, `updatePasswordById`, `findCouponsByUser`, `createCoupon`

#### [DONE] src/services/profile.service.ts

Services: `updateProfileService`, `changePasswordService`, `getPointsService`, `getCouponsService`

#### [DONE] src/controllers/profile.controller.ts

Controllers: `updateProfile`, `changePassword`, `getPoints`, `getCoupons`

#### [DONE] src/routes/auth.routes.ts

Added authenticated routes:

- `PATCH /auth/profile` → updateProfile
- `PATCH /auth/password` → changePassword
- `GET /auth/points` → getPoints
- `GET /auth/coupons` → getCoupons

#### [DONE] src/services/auth.service.ts

In `registerService`, after creating referral points for the referrer, also created a `Coupon` for the **new registrant** with 10% discount valid 3 months.

---

### Frontend

#### [NEW] src/pages/ProfilePage.tsx

Four-tab profile page:

- **Profil** — edit name, avatar URL, display referral code (copy button)
- **Poin** — points balance, per-point rows with expiry dates
- **Kupon** — list of discount coupons (code, %, expiry, used/available)
- **Keamanan** — change password form

#### [MODIFY] src/services/auth.service.ts (frontend)

Add: `updateProfile`, `changePassword`, `getPoints`, `getCoupons`

#### [MODIFY] src/context/AuthContext.tsx

Expose `updateUser(u: User)` so ProfilePage can refresh local user after edits

#### [MODIFY] src/components/Navbar.tsx

Add "Profil Saya" link to dropdown for both CUSTOMER and ORGANIZER

#### [MODIFY] src/App.tsx

Add `<Route path="/profile">` protected for any authenticated user

---

### Infrastructure & DevOps (2026-04-19)

#### [DONE] Dockerfile — `ARG VITE_API_URL=/api`

Menambahkan `ARG VITE_API_URL=/api` dan `ENV VITE_API_URL=$VITE_API_URL` di tahap `frontend-build`. Tanpa ini, Vite build menggunakan fallback `http://localhost:5000` yang menyebabkan CORS error di browser saat akses via Docker (`localhost:3000`).

#### [DONE] frontend/vite.config.ts — Dev Server Proxy

Menambahkan konfigurasi `server.proxy` sehingga semua request `/api/*` di dev lokal diteruskan ke `http://localhost:5000`. Diperlukan agar `VITE_API_URL=/api` (relatif) berfungsi tanpa harus hardcode URL backend.

#### [DONE] docker-compose.yml — Hapus Service Redis

Service `redis` (container lokal `redis:7-alpine`) dihapus dari `docker-compose.yml` karena Redis sekarang menggunakan **Upstash Cloud** (HTTP-based). Volume `redis-data` dan dependency `api→redis` juga dihapus.

#### [DONE] backend/.env — Resolve Git Conflict

Conflict markers (`<<<<<<< / =======  / >>>>>>>`) di `.env` akibat `git stash` diselesaikan. Konfigurasi Upstash dipertahankan.

## Verification Plan

### Browser Test Flow

1. Register User A → note referral code
2. Register User B using User A's referral code
3. Login as User A → `/profile` → Poin tab → see 10,000 pts expiring in 3 months
4. Login as User B → `/profile` → Kupon tab → see 10% coupon expiring in 3 months
5. As User A → edit name, set avatar URL → save → verify update
6. As User A → change password → verify new password works on re-login
