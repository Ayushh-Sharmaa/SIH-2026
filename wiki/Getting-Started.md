# Getting Started

This guide walks through setting up the **SIH@GLBGOI** platform locally for development, testing, and contribution.

---

## Prerequisites

Before running the application locally, ensure you have the following installed:

* **Node.js**: v20.x or later (LTS recommended)
* **npm**: v10.x or later
* **Git**: v2.x or later
* **PostgreSQL Database**: Access to a Supabase PostgreSQL instance (or local PostgreSQL 15+)
* **Clerk Account**: For user authentication and Google OAuth provider setup

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/TryEye/SIH-GLBGOI.git
cd SIH-GLBGOI
```

### 2. Install Dependencies

```bash
npm install
```

*Note: The `postinstall` script will automatically trigger `prisma generate` to build the TypeScript client types.*

---

## Environment Variables

Copy the provided `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` and configure the following required environment variables:

```env
# 1. Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# 2. Application JWT Secret
# Must be at least 32 characters. Generate using:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
NEXTAUTH_SECRET=your-secure-random-secret-at-least-32-characters
NEXTAUTH_URL=http://localhost:3000

# 3. Supabase PostgreSQL
# DATABASE_URL uses the transaction pooler (port 6543) for application queries
# DIRECT_URL uses the session pooler (port 5432) for database migrations
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres"

# 4. Sandbox Troubleshooting Account (Optional)
# Enables passwordless exploration account (BanTan@BanTan0607)
ENABLE_SANDBOX_ACCOUNT=true

# 5. Mentor Master Registration Key (Optional)
# GLB_MENTOR_MASTER_KEY=
```

> [!WARNING]
> **Never commit your `.env` file to version control.** Real API keys and connection strings must only be configured in local `.env` files or secure hosting dashboards (e.g. Vercel Project Settings).

---

## Database Initialization & Seeding

Sync the Prisma schema to your database and generate the Prisma Client:

```bash
# Generate Prisma Client types
npx prisma generate

# Apply migrations to database (for development)
npx prisma migrate dev

# Seed official 17 SIH themes and initial data
npm run seed # (or npx tsx prisma/seed.ts)
```

---

## Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the platform.

---

## Verification Commands

Run the full verification suite to validate code quality, contrast compliance, and test suites:

```bash
# Run all automated tests (105 tests across 30 suites)
npm test

# Run TypeScript typecheck without emitting output
npm run typecheck

# Run WCAG AA color contrast audit
npm run test:contrast

# Run performance and privacy audit
npm run audit:perf

# Run full consolidated verification pipeline
npm run verify
```

---

## Common Setup Issues

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| `DATABASE_URL initialization failed` | Special characters in PostgreSQL password not URL-encoded | URL-encode special characters in password (`?` → `%3F`, `+` → `%2B`, `@` → `%40`) |
| `Clerk Publishable Key missing` | Environment variable not loaded or misnamed | Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is defined in `.env` and restart dev server |
| `JWT secret too short` | `NEXTAUTH_SECRET` has fewer than 32 characters | Generate a 48-byte hex secret using `crypto.randomBytes(48).toString('hex')` |
| `Prisma Client out of date` | Schema changes made without regenerating types | Run `npx prisma generate` |

---

[← Back to Home](Home) • [Next: Architecture →](Architecture)
