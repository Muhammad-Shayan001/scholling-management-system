# [PRODUCT_NAME] - Multi-Tenant School Management SaaS Platform

**A comprehensive, production-ready school management system with subscription-based multi-tenancy, LMS, attendance, exams, and financial management.**

---

## 🎯 Project Status

**Phase 0: Repository Audit & Cleanup** — ✅ **COMPLETE**  
**Next Phase:** Phase 1 - Foundation (Security fixes + Identity system)

📅 **Last Updated:** September 26, 2026

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [License](#license)

---

## 🌟 Overview

This is a **multi-tenant SaaS platform** for schools and educational institutions, built with modern technologies and enterprise-grade security. Each organization (school) can manage multiple campuses, with complete isolation between tenants.

### Core Capabilities

- 🏢 **Multi-Tenancy** — Complete organization-level isolation with RLS
- 💳 **Subscription Management** — Plans, trials, grace periods, manual billing
- 👥 **Role-Based Access** — Super Admin, Admin, Teacher, Student, Parent portals
- 🏫 **Multi-Campus** — Organizations can manage multiple physical locations
- 📚 **Learning Management** — Assignments, quizzes, progress tracking, courses
- ✅ **Attendance System** — Manual, QR-based, biometric with notifications
- 📊 **Exams & Results** — Complete exam management with report cards
- 💰 **Financial System** — Invoices, payments, expenses, reports
- 📱 **Push Notifications** — Real-time alerts via Firebase Cloud Messaging
- 📧 **Email System** — Password reset, announcements, billing reminders

---

## ✨ Features

### 🔐 Authentication & Authorization
- Email/password authentication via Supabase Auth
- Role-based access control (RBAC)
- Admin invitation workflow
- Password reset with OTP
- Row Level Security (RLS) enforcement

### 🏢 Super Admin Portal
- Organization creation and management
- Subscription assignment and monitoring
- Manual payment recording
- Platform-wide analytics
- User management across all organizations

### 🎓 School Admin Portal
**Campus Management:**
- Multi-campus configuration
- Campus-specific settings and branding
- Staff and student management

**Financial Management:**
- Fee structures and categories
- Invoice generation
- Payment recording and receipts
- Expense tracking
- Financial reports (collection, outstanding, P&L)

### 👨‍🏫 Teacher Portal
- Class and subject assignments
- Attendance marking (manual/QR)
- Assignment creation and grading
- Marks entry for exams
- Student performance tracking
- Announcements to classes

### 👨‍🎓 Student Portal
- Timetable and schedule
- Attendance history
- Assignments and submissions
- Exam results and report cards
- Fee status and invoices
- Course access and progress

### 👪 Guardian Portal (Optional)
- View linked children's data
- Attendance and results
- Fee invoices and payments
- Teacher communications

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.2.4 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS 4
- **State:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Notifications:** Sonner

### Backend & Database
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime subscriptions
- **Server Actions:** Next.js Server Actions

### Additional Services
- **Push Notifications:** Firebase Cloud Messaging
- **Email:** Nodemailer (SMTP) or Resend
- **PDF Generation:** jsPDF
- **QR Codes:** qrcode + html5-qrcode

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or pnpm/yarn)
- **Supabase Account** — [Create one free](https://supabase.com)
- **Firebase Project** — [Create one free](https://console.firebase.google.com)
- **SMTP Email** — Gmail, SendGrid, or Resend account

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd school-management-software
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (⚠️ keep this secret!)

### 4. Run Database Migrations

In your Supabase Dashboard → SQL Editor, run these migrations **in order**:

```bash
# Copy the contents of each file and run in SQL Editor:
1. supabase/migrations/0001_baseline_schema.sql
2. supabase/migrations/0002_rls_helper_functions.sql
3. supabase/migrations/0003_rls_policies.sql         # (Phase 1)
4. supabase/migrations/0004_indexes.sql              # (Phase 1)
5. supabase/migrations/0005_storage_buckets.sql      # (Phase 1)
```

### 5. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual credentials
nano .env.local
```

Fill in all required values (see `.env.example` for details).

### 6. Seed Super Admin

```bash
npm run seed-super-admin
```

This creates your first platform administrator account using credentials from `.env.local`.

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Login

Use the super admin credentials you set in `.env.local`:
- Email: `SUPER_ADMIN_EMAIL`
- Password: `SUPER_ADMIN_PASSWORD`

---

## 📁 Project Structure

```
school-management-software/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup, reset)
│   ├── (dashboard)/              # Role-based dashboards
│   ├── api/                      # API routes (webhooks, cron)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI primitives
│   └── [feature-folders]/        # Feature-specific components
│
├── lib/                          # Core utilities
│   ├── actions/                  # Server actions
│   ├── supabase/                 # Database clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server component client
│   │   └── middleware.ts         # Middleware client
│   ├── env.ts                    # Environment validation (Zod)
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # App constants
│
├── supabase/                     # Database
│   └── migrations/               # SQL migrations (versioned)
│
├── scripts/                      # Utility scripts
│   ├── seed-super-admin.mjs      # Create platform admin
│   └── seed-demo.mjs             # Demo data (optional)
│
├── docs/                         # Documentation
│   ├── AUDIT.md                  # Phase 0 audit report
│   ├── SETUP.md                  # Detailed setup guide (Phase 1)
│   ├── ARCHITECTURE.md           # System architecture
│   ├── SECURITY.md               # Security review (Phase 8)
│   └── legacy/                   # Archived docs from old system
│
├── .env.example                  # Environment template
├── .env.local                    # Your secrets (never commit!)
├── package.json
├── tsconfig.json
└── README.md                     # This file
```

---

## 📚 Documentation

Detailed guides are available in the `docs/` directory:

- **[SETUP.md](docs/SETUP.md)** — Complete setup instructions (created in Phase 1)
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design and data models
- **[AUDIT.md](docs/AUDIT.md)** — Phase 0 audit findings
- **[SECURITY.md](docs/SECURITY.md)** — Security implementation (Phase 8)

---

## 💻 Development

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
```

### Coding Standards

- **TypeScript** — All code must be typed
- **ESLint** — Run linter before committing
- **Prettier** — Use default formatting
- **Comments** — Only when WHY is non-obvious (not WHAT)
- **Server Actions** — All mutations via server actions (no client mutations)
- **RLS** — Every tenant-scoped table must have RLS policies
- **Validation** — Use Zod schemas for all inputs

### Git Workflow

```bash
# Feature branches
git checkout -b feature/your-feature-name
git commit -m "feat: add subscription status enforcement"
git push origin feature/your-feature-name

# Create PR for review before merging to main
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

### Environment Variables in Production

⚠️ **CRITICAL:** Never commit these to git!

Required in production:
- All Supabase keys
- Email provider credentials
- Firebase credentials
- `CRON_SECRET` for scheduled jobs

---

## 🔒 Security

### Current Security Measures

✅ Row Level Security (RLS) on all tables  
✅ Server-side authorization checks  
✅ Environment validation with Zod  
✅ HTTPS-only in production  
✅ Password hashing by Supabase Auth  
✅ Secure session management

### Security Best Practices

1. **Never commit secrets** — Use `.env.local` only
2. **Rotate credentials** — If exposed, rotate immediately
3. **Service role key** — Server-only, never expose to client
4. **Rate limiting** — Implement on auth endpoints (Phase 1)
5. **Input validation** — Validate all user input with Zod
6. **Audit logging** — Log all security-sensitive operations (Phase 1)

### Reporting Security Issues

If you discover a security vulnerability, please email: **security@[your-domain].com**

Do NOT open a public GitHub issue for security vulnerabilities.

---

## 🗺️ Roadmap

- [x] **Phase 0:** Repository audit and cleanup *(Complete)*
- [ ] **Phase 1:** Foundation (Identity, RLS, Auth) — *2-3 weeks*
- [ ] **Phase 2:** Subscription system — *2-3 weeks*
- [ ] **Phase 3:** Academic core (Students, Teachers) — *4-5 weeks*
- [ ] **Phase 4:** Finance system — *4-5 weeks*
- [ ] **Phase 5:** LMS enhancement — *4-6 weeks*
- [ ] **Phase 6:** Exams & results — *3-4 weeks*
- [ ] **Phase 7:** Portals (Teacher, Student, Guardian) — *2-3 weeks*
- [ ] **Phase 8:** Security, testing, production readiness — *2-3 weeks*
- [ ] **Phase 9:** Optional enhancements (Payment gateways, WhatsApp, Urdu) — *varies*

**Total Estimated Timeline:** 5.5 - 7.75 months

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run typecheck`
6. Submit a Pull Request

---

## 📄 License

[Your License Here - e.g., MIT, Proprietary]

---

## 🙏 Acknowledgments

- **Supabase** — Database, Auth, and Storage
- **Vercel** — Hosting and deployment
- **Next.js** — React framework
- **Firebase** — Push notifications

---

## 📞 Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/your-org/your-repo/issues)
- **Email:** support@[your-domain].com

---

**Built with ❤️ for educational institutions worldwide**
