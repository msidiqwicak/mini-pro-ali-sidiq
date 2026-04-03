# Referral System, Profile & Prizes — Implementation Plan

## Goal
Implement the missing features so these scenarios can be tested end-to-end:
1. **Referral Rewards** – Referrer gets 10,000 pts (✅ backend exists), new registrant gets a **discount coupon** (❌ missing)
2. **Points Expiration** – 3-month expiry (✅ in DB), but **no UI** to see points balance/expiry
3. **Coupon Expiration** – Discount coupon valid 3 months (❌ not implemented at all)
4. **Profile Page** – Entirely missing: edit name, avatar, change password, display referral code, points, coupons

---

## User Review Required

> [!IMPORTANT]
> The `Promotion` model in Prisma is event-specific. For user-level referral coupons we will add a lightweight `Coupon` model and run `prisma migrate dev`. This requires the database to be running.

> [!WARNING]
> Password reset (forgot-password) typically requires SMTP e-mail. We will implement the UI & a backend token-based reset flow, but it will only work if an SMTP service is configured. The page itself will be fully built.

---

## Proposed Changes

### Backend

#### [MODIFY] prisma/schema.prisma
Add new `Coupon` model and relation on `User`:
```prisma
model Coupon {
  id              String   @id @default(cuid())
  userId          String
  code            String   @unique
  discountPercent Int      @default(10)
  isUsed          Boolean  @default(false)
  expiredAt       DateTime
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
  @@map("coupons")
}
```

#### [MODIFY] src/repositories/user.repository.ts
Add helpers: `updateUserById`, `updatePasswordById`, `findCouponsByUser`, `createCoupon`

#### [NEW] src/services/profile.service.ts
Services: `updateProfileService`, `changePasswordService`, `getPointsService`, `getCouponsService`

#### [NEW] src/controllers/profile.controller.ts
Controllers: `updateProfile`, `changePassword`, `getPoints`, `getCoupons`

#### [MODIFY] src/routes/auth.routes.ts
Add authenticated routes:
- `PATCH /auth/profile` → updateProfile
- `PATCH /auth/password` → changePassword
- `GET /auth/points` → getPoints
- `GET /auth/coupons` → getCoupons

#### [MODIFY] src/services/auth.service.ts
In `registerService`, after creating referral points for the referrer, also create a `Coupon` for the **new registrant** with 10% discount valid 3 months.

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

## Verification Plan

### Browser Test Flow
1. Register User A → note referral code
2. Register User B using User A's referral code
3. Login as User A → `/profile` → Poin tab → see 10,000 pts expiring in 3 months
4. Login as User B → `/profile` → Kupon tab → see 10% coupon expiring in 3 months
5. As User A → edit name, set avatar URL → save → verify update
6. As User A → change password → verify new password works on re-login
