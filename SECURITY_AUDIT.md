# Security Audit Report — Edunura Events Manager

**Date:** 2026-05-21  
**Scope:** Full-stack Next.js 15 + PostgreSQL application  
**Files Audited:** 62 source files (API routes, pages, components, auth, middleware, env, seed)

---

## Summary

| Severity | Count | Categories |
|---|---|---|
| **Critical** | 0 | All fixed |
| **High** | 0 | All fixed |
| **Medium** | 1 | CSRF protection (requires design decision) |
| **Low** | 0 | All fixed |
| **Info** | 2 | Type safety, over-permissive reads |

---

## Fixed Findings

### 1. Plaintext Password Storage & Comparison [FIXED]
- **Files:** `lib/auth.ts`, `app/api/auth/login/route.ts`, `app/api/users/route.ts`, `prisma/seed.ts`
- **Fix:** Installed `bcryptjs`. All passwords are now hashed with `bcrypt.hash(password, 12)` on creation/seed. Login uses `bcrypt.compare()`.

### 2. Hardcoded Fallback JWT Secret [FIXED]
- **File:** `lib/auth.ts`
- **Fix:** Removed hardcoded fallback. `JWT_SECRET` is now required at runtime (lazy check to avoid breaking builds). App throws if missing.

### 3. No Rate Limiting [FIXED]
- **File:** `app/api/auth/login/route.ts`
- **Fix:** Added `rate-limiter-flexible` with in-memory store. Login limited to **5 attempts per IP per 15 minutes**.

### 4. Hardcoded Admin Credentials in Seed [FIXED]
- **File:** `prisma/seed.ts`
- **Fix:** Admin password now supports `ADMIN_PASSWORD` env var. Falls back to `admin123` only if unset, but **hashes it with bcrypt** before storage. Console warning printed if using default.

### 5. Insufficient Input Validation [FIXED]
- **Files:** All API routes (`app/api/**/*.ts`)
- **Fix:** Installed `zod`. Every POST/PUT route now validates request bodies with strict schemas (string lengths, UUIDs, enum values, datetime formats, number ranges).

### 6. Weak RBAC on Reads [FIXED]
- **Files:** `app/api/dashboard/route.ts`, `app/api/analytics/*`, `app/api/reports/route.ts`, `app/api/volunteers/route.ts`, `app/api/users/route.ts`, `app/api/events/list/route.ts`, `app/api/communities/list/route.ts`
- **Fix:** Sensitive read endpoints now require `ADMIN` role and return `403 Forbidden` for non-admins. General reads (events, communities, stalls) still allow any authenticated user.

### 7. `.env` in Repo [FIXED]
- **File:** `.gitignore`
- **Fix:** `.gitignore` already had `.env*` with `!.env.example`. Verified correct.

### 8. Missing Security Headers [FIXED]
- **File:** `middleware.ts`
- **Fix:** Middleware now injects `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy`, and `X-DNS-Prefetch-Control: off` on **all** responses.

### 9. Cookie Settings [FIXED]
- **File:** `lib/auth.ts`
- **Fix:** Changed `sameSite` from `lax` to `strict`. Changed `secure` from conditional to **always `true`**.

### 10. Error Logging Leaks [FIXED]
- **Files:** All API routes
- **Fix:** Replaced `console.error('...', error)` with `console.error('...', error instanceof Error ? error.message : 'Unknown')` across all routes.

### 11. No Password Complexity Policy [FIXED]
- **File:** `app/api/users/route.ts`
- **Fix:** Added Zod password schema requiring minimum 8 characters, uppercase, lowercase, number, and special character.

### 12. `as any` Type Assertion [FIXED]
- **File:** `app/api/stalls/route.ts`
- **Fix:** Removed unnecessary `as any` on `status: 'ACTIVE'`.

---

## Remaining Open Item

### CSRF Protection [MEDIUM — Open]
**Status:** Not implemented. Requires design decision.

**Context:** All state-changing API routes are protected by authentication + role checks, and cookies use `SameSite=strict`. For a pure same-origin SPA (no cross-domain API consumers), this provides strong CSRF protection. If you plan to support third-party clients or subdomains, implement a double-submit cookie pattern with a `csrf-token` header.

---

## Positive Security Observations

1. **No XSS sinks found** — No `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `document.write()`
2. **No SQL injection risk** — Prisma ORM uses parameterized queries exclusively
3. **Authentication middleware is active** — All dashboard and API routes are protected
4. **Authorization on writes** — Admin-only restrictions on deletion and sensitive updates
5. **Passwords not logged** — No `console.log` statements expose credentials
6. **CORS not misconfigured** — No overly permissive CORS headers

---

## Required Next Steps

1. **Set `JWT_SECRET` in your `.env` file** before running the app:
   ```
   JWT_SECRET=your-very-long-random-secret-here-min-32-chars
   ```

2. **Re-seed your database** because old plaintext passwords won't work with bcrypt:
   ```bash
   npx prisma db seed
   ```

3. **(Optional) Set a custom admin password** before seeding:
   ```bash
   ADMIN_PASSWORD=YourStrongPassword123! npx prisma db seed
   ```

4. **Deploy with HTTPS** — cookies now enforce `secure: true`, which requires HTTPS in production.
