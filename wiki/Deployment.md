# Deployment Guide

This guide describes deploying **SIH@GLBGOI** to production using Vercel and Supabase PostgreSQL.

---

## 1. Production Build Pipeline

The repository uses a custom build script (`scripts/build.mjs`) that generates Prisma client types before executing the Next.js production bundle:

```bash
npm run build
```

This executes:
1. `prisma generate` ──► Generates latest TypeScript bindings from `prisma/schema.prisma`.
2. `next build` ───────► Compiles Next.js 16 App Router application and optimizes static assets.

---

## 2. Production Environment Variables Checklist

Ensure the following variables are configured in your production hosting platform (e.g. **Vercel Project Settings ──► Environment Variables**):

| Variable Name | Environment | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production | Clerk production public API key |
| `CLERK_SECRET_KEY` | Production | Clerk production backend secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | All | Set to `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | All | Set to `/signup` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`| All | Set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`| All | Set to `/onboarding` |
| `NEXTAUTH_SECRET` | Production | ≥ 32 character cryptographically random string |
| `NEXTAUTH_URL` | Production | Production URL (e.g. `https://sih.glbgoi.ac.in`) |
| `DATABASE_URL` | Production | Supabase transaction pooler (`port 6543`) with `?pgbouncer=true` |
| `DIRECT_URL` | Production | Supabase direct connection (`port 5432`) for migrations |
| `ENABLE_SANDBOX_ACCOUNT` | Production | Set to `false` in live production |

---

## 3. Database Deployment & Migrations

Before deploying a new application build with schema changes:

1. **Deploy Migrations**:
   ```bash
   npx prisma migrate deploy
   ```
   *Always run migrations against `DIRECT_URL` using `prisma migrate deploy`. Do not use `prisma db push` in production environments.*
2. **Seed Default Themes (If Initial Setup)**:
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## 4. Post-Deployment Verification

After deploying a new release, execute the following smoke tests:

1. **OAuth Sign-in**: Verify that signing in with a `@glbajajgroup.org` Google account successfully completes the Clerk bridge.
2. **Dashboard Hydration**: Confirm that Stage 1 (`/api/dashboard/bootstrap`) returns within 150ms.
3. **Directory Search**: Test filtering in **Browse Teams** and **Browse Teammates** to confirm database indexing is operational.
4. **Avatar Streaming**: Verify that profile photos load via `/api/avatar/[userId]` with `Cache-Control: immutable`.

---

[← Testing & Verification](Testing-and-Verification) • [Next: Troubleshooting →](Troubleshooting)
