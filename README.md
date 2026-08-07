# GL Bajaj Internal SIH Portal (Powered by NexaSphere)

The GL Bajaj Internal SIH Portal is a premium, high-performance platform designed for **GL Bajaj Group of Institutions** to streamline internal evaluations, team formation, and mentor matching for the **Smart India Hackathon (SIH)**. Developed and maintained by the **NexaSphere** student club, the application facilitates discovery and seamless coordination between students, team leaders, and faculty mentors.

---

## 🚀 Key Features

### 1. Find Teammates
* Search and filter student profiles by name, department/branch, year of study, skills, and availability status.
* View student profiles, portfolios, GitHub URLs, and cover graphics.
* Send direct team invitations with a custom message.

### 2. Discover Teams
* Explore existing teams, view their rosters, current sizes, and domains.
* Search and filter teams by problem statement, category (Software/Hardware), domain, skills needed, or leader name.
* Request to join open teams directly.

### 3. Mentor Matching
* Find faculty mentors sorted by expertise, department, and current load capacity.
* Send mentorship requests directly from the team leader dashboard.

### 4. Interactive Collaboration Hub
* Team leaders can manage pending invitations, review incoming member requests, assign custom developer roles (e.g., frontend developer, hardware engineer), and toggle recruitment status.
* Real-time actionable notifications (Accept, Decline, On-Hold, Waitlist, or request meeting).

---

## 🛠️ Tech Stack & Architecture

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router, dynamic caching via `unstable_cache`, customized `proxy.ts` middleware gate).
* **UI/UX & Styling**: Tailwind CSS v4, customized components, and custom CSS token design.
* **Animations**: Framer Motion (for modal springs, bell dropdowns, card reveals) and GSAP (with ScrollTrigger for hardware-accelerated parallax/effects).
* **Smooth Scroll**: Lenis integrated with a shared ticker loop.
* **Authentication**: Clerk OAuth sync.
* **Database & ORM**: PostgreSQL (hosted on Supabase) with Prisma ORM.
* **Testing**: Node.js native test runner and WCAG AA contrast testing checker.

---

## 📁 Repository Structure

```
SIH-GLBGOI/
├── .github/workflows/    # CI Pipeline (Typecheck, Lint, Test, Contrast)
├── docs/                 # Extended PRDs, Design Systems, and phase guides
├── prisma/               # Schema definition and database seed scripts
├── public/               # Static assets, branding, and images
│   ├── Logo/             # Corporate branding logos
│   └── sih-2026/         # Hackathon timelines and banners
├── src/
│   ├── app/              # Next.js Pages, Layouts, and API Endpoints
│   │   ├── (auth)/       # Sign-in/Sign-up workflows
│   │   ├── admin/        # Administration console
│   │   ├── api/          # Rate-limited REST JSON Endpoints
│   │   ├── onboarding/   # User role selection and profile building
│   │   ├── team-formation/# Find Teammate, Find Team, and Find Mentor pages
│   │   └── proxy.ts      # Authentication request middleware gate
│   ├── components/       # Reusable layout, seo, motion, and UI elements
│   ├── hooks/            # Focus trapping, escape, scroll locking, and GSAP hooks
│   ├── lib/              # Client instances, auth helpers, and rate-limit managers
│   └── styles/           # Modern tokens and global styling systems
└── tests/                # Automated validation and session test specs
```

---

## ⚙️ Development Setup

### 1. Prerequisites
Ensure you have [Node.js (v20+)](https://nodejs.org/) installed.

### 2. Environment Configuration
Create a `.env` file in the root directory. You can copy the template from `.env.example`:

```bash
# Database URL (Supabase PostgreSQL Connection String)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true"

# JWT Authentication secret (Minimum 32 characters)
NEXTAUTH_SECRET="your-super-secure-jwt-signing-secret"

# Clerk credentials
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Prepare your database tables and seed test data (users, problem statements, and profiles):
```bash
# Push schema changes to remote Supabase instance
npx prisma db push

# Generate client
npx prisma generate

# Seed initial database records
npx prisma db seed
```

### 5. Running Locally
Start the development server:
```bash
npm run dev
```
Open `http://localhost:3000` to view the portal.

---

## 🧪 Available Scripts

* `npm run dev`: Runs the Next.js development server.
* `npm run build`: Builds the production bundle (pre-seeded with Prisma migration check).
* `npm run typecheck`: Validates TypeScript without emitting code output.
* `npm run lint`: Performs ESLint check across all directories.
* `npm test`: Runs automated unit tests in `tests/` directory.
* `npm run test:contrast`: Audits WCAG AA colour contrast standards.
* `npm run verify`: Combines type checking, unit tests, and contrast audits.

---

## 🤝 Contribution Guide

1. Create a descriptive feature branch: `git checkout -b feature/cool-feature`
2. Implement and test your changes: `npm run verify`
3. Commit with concise logs: `git commit -m "Add cool feature"`
4. Push to origin and open a Pull Request.

---

## 📄 License
This project is proprietary and maintained for Internal Hackathon Evaluations at GL Bajaj Group of Institutions.
