# SKOLIC ENTERPRISE V3 - ARCHITECTURE DOCUMENT
**Document Version:** 1.0  
**Date:** September 20, 2026  
**Status:** Architecture Design

---

## 1. CURRENT ARCHITECTURE

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Web App   │  │ Mobile App  │  │  Third-party Apps   │  │
│  │  (Next.js)  │  │ (Android)   │  │      (API)          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    EDGE LAYER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js Middleware (Auth, Routing, Rate Limiting)  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Server Actions (Business Logic)             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │    │
│  │  │  Auth    │ │ Students │ │ Attendance       │    │    │
│  │  │  Actions │ │ Actions  │ │ Actions          │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API Routes (Webhooks, FCM)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────��───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Supabase   │  │   Firebase   │  │  Nodemailer     │    │
│  │    Auth      │  │     FCM      │  │  (Email)        │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Supabase)                  │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐  │    │
│  │  │ Tables │ │  RLS   │ │Triggers│ │  Functions  │  │    │
│  │  └────────┘ └────────┘ └────────┘ └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Supabase Storage                       │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                  │    │
│  │  │Logos   │ │Documents│ │Avatars │                  │    │
│  │  └────────┘ └────────┘ └────────┘                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Current Data Model

```
┌──────────────┐
│   profiles   │◄──────────────┐
└──────┬───────┘               │
       │                       │
   ┌───┴─────────┐         ┌───▼────────┐
   │ schools     │         │ admin_     │
   │ (dual role) │         │ campuses   │
   └─────────────┘         └────────────┘
         │
    ┌────┴────────────┐
    │                 │
┌───┴────┐      ┌────┴─────┐
│classes │      │subjects  │
└────────┘      └──────────┘
    │
    ├─────────────┬─────────────┐
    │             │             │
┌───┴────┐   ┌───┴────┐   ┌───┴────────┐
│students│   │teachers│   │attendance  │
└────────┘   └────────┘   └────────────┘

Additional tables:
- assignments, results, timetable, exam_timetable
- announcements, notifications, messages
- holidays, syllabus, student_groups
```

### 1.3 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Next.js | 16.2.4 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | 4 |
| State Management | Zustand | 5.0.12 |
| Database | PostgreSQL (Supabase) | Latest |
| Auth | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Push Notifications | Firebase Cloud Messaging | 12.15.0 |
| Email | Nodemailer | 8.0.7 |
| Validation | Zod | 4.4.1 |
| Type Safety | TypeScript | 5 |

---

## 2. TARGET ARCHITECTURE (SKOLIC V3)

### 2.1 Multi-Tenant SaaS Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     PLATFORM LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Super Admin Portal                            │  │
│  │   - Organization Management                                │  │
│  │   - Subscription Management                                │  │
│  │   - Platform Analytics                                     │  │
│  │   - System Configuration                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   TENANT LAYER (Per Organization)                │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                  Organization Admin                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │ Organization │  │  Subscription │  │   Campus      │   │   │
│  │  │   Settings   │  │   Status     │  │  Management   │   │   │
│  │  └──────────────┘  └──────────────┘  └───────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
���         ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Campus 1   │     │   Campus 2   │     │   Campus N   │    │
│  │  ┌─────────┐ │     │  ┌─────────┐ │     │  ┌─────────┐ │    │
│  │  │Classes  │ │     │  │Classes  │ │     │  │Classes  │ │    │
│  │  │Students │ │     │  │Students │ │     │  │Students │ │    │
│  │  │Teachers │ │     │  │Teachers │ │     │  │Teachers │ │    │
│  │  └─────────┘ │     │  └─────────┘ │     │  └─────────┘ │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Hierarchical Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORGANIZATION (Tenant)                        │
│  id, name, slug, logo_url, settings, subscription_id, etc.     │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──┬────────────────────────────────────────────┐
         │ │                                            │
         ▼ ▼                                            ▼
┌─────────────────┐                            ┌─────────────────┐
│ SUBSCRIPTION   │                            │   CAMPUSES      │
│ plan_id,       │                            │  school_id      │
│ status,        │                            │  campus_code    │
│ limits,        │                            │  name, address  │
│ expires_at     │                            │  timezone       │
└─────────────────┘                            └────────┬────────┘
                                                         │
                          ┌──────────────────────────────┼──────────────────────┐
                          │                              │                      │
                          ▼                              ▼                      ▼
                   ┌─────────────┐              ┌─────────────┐        ┌─────────────┐
                   │   CLASSES   │              │   TEACHERS  │        │   STUDENTS  │
                   │ name,       │              │ user_id,    │        │ user_id,    │
                   │ section     │              │ dept,       │        │ class_id,   │
                   │ level       │              │ subjects    │        │ roll_number │
                   └──────┬──────┘              └──────┬──────┘        └──────┬──────┘
                          │                             │                      │
                   ┌──────┴──────┐               ┌──────┴──────┐        ┌──────┴──────┐
                   │  SUBJECTS   │               │  SUBJECTS   │        │ ATTENDANCE  │
                   │ name, code  │               │  (taught)   │        │ date, status│
                   └─────────────┘               └─────────────┘        └─────────────┘

Additional:
- ACADEMIC_YEARS (year, start_date, end_date, is_active)
- DEPARTMENTS (name, code, head_id)
- STAFF (non-teaching employees)
- FINANCE: invoices, payments, expenses, refunds
- LMS: courses, lessons, assignments, quizzes, submissions
- EXAMS: schedules, marks, results, report_cards
```

### 2.3 Microservices-Oriented Design

While using a monolithic Next.js deployment, we architect with **bounded contexts**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     ROUTING LAYER                        │  │
│  │  /api/super-admin    /api/org/:orgId/*   /api/campus/*   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌────────────┬─────────────┼─────────────┬─────────────┐      │
│  │            │             │             │             │      │
│  ▼            ▼             ▼             ▼             ▼      │
│┌──────┐  ┌────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  │
││ Auth │  │Organization│ │ Academic  │  │  Finance │  │  LMS   │  │
││Context│  │ Context   │  │  Context  │  │  Context │  │Context│  │
│└──────┘  └────────┘  └───────────┘  └──────────┘  └────────┘  │
│    │         │            │             │            │         │
│    ▼         ▼            ▼             ▼            ▼         │
│  Supabase Client Layer (Shared Database Access)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ARCHITECTURAL PATTERNS

### 3.1 Multi-Tenancy Patterns

#### Pattern 1: Shared Database, Shared Schema
```
All organizations share the same database and tables.
organization_id column on every tenant-owned table.

Pros: Simple, cost-effective
Cons: Requires strict RLS, noisy neighbor risk

IMPLEMENTATION:
- Every table has organization_id (NOT nullable for tenant data)
- RLS policies enforce organization isolation
- Cross-org queries blocked at RLS level
```

#### Pattern 2: Row Level Security (RLS)
```
Database-level isolation using PostgreSQL RLS.

Key Functions:
- auth.uid() → Current user ID
- current_organization_id() → org context
- current_user_role() → role context
- has_permission('action', 'resource') → granular check

RLS Policy Structure:
┌────────────────────────────────────────────────────────────┐
│ SELECT: organization_id = current_organization_id()        │
│ INSERT: organization_id = current_organization_id()        │
│ UPDATE: organization_id = current_organization_id()        │
│ DELETE: organization_id = current_organization_id()        │
└────────────────────────────────────────────────────────────┘
```

#### Pattern 3: Context Propagation
```
Every request carries organization context:

1. User logs in → Token includes org_id
2. Middleware extracts org_id → Sets header
3. Server Actions read org_id → Applies to queries
4. Client components receive org context → UI reflects it

Implementation:
┌────────────────────────────────────────────────────────────┐
│ Middleware:                                                │
│   - Extract organization_id from JWT                       │
│   - Set header x-organization-id                          │
│                                                            │
│ Server Actions:                                           │
│   - Read header organization_id                           │
│   - Verify user belongs to org                            │
│   - Pass to database queries                              │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Permission System Design

#### RBAC + ABAC Hybrid

```
Role-Based Access Control (RBAC):
┌─────────────┬─────────────────────────────────────────────┐
│   Role      │              Base Permissions               │
├─────────────┼─────────────────────────────────────────────┤
│ super_admin │ platform.*, organization.*, campus.*       │
│ org_admin   │ organization.*, campus.*, academic.*       │
│ principal   │ campus.*, academic.*, attendance.*         │
│ teacher     │ class.*, subject.*, attendance.r, results.w│
│ student     │ own.profile.r, own.attendance.r, courses.r │
│ parent      │ linked_students.*, view_only               │
└─────────────┴─────────────────────────────────────────────┘

Attribute-Based Access Control (ABAC):
- campus_id: Restricts to assigned campus
- academic_year_id: Restricts to active year
- subject_id: Restricts to assigned subjects
- class_id: Restricts to assigned classes
```

#### Permission Matrix

```
Resource          │ super_admin │ org_admin │ principal │ teacher │ student
──────────────────│─────────────│───────────│──────────│────────│───────
organizations     │ CRUD        │ R         │ -        │ -      │ -
campuses          │ CRUD        │ CRUD      │ CRUD     │ R      │ -
classes           │ CRUD        │ CRUD      │ CRUD     │ R/W*   │ R
subjects          │ CRUD        │ CRUD      │ CRUD     │ R/W*   │ R
students          │ CRUD        │ CRUD      │ CRUD     │ R/W*   │ R(own)
teachers          │ CRUD        │ CRUD      │ CRUD     │ R      │ -
attendance        │ CRUD        │ CRUD      │ CRUD     │ CRUD** │ R(own)
assignments       │ CRUD        │ CRUD      │ CRUD     │ CRUD*  │ R/W(own)
results           │ CRUD        │ CRUD      │ CRUD     │ CRUD** │ R(own)
invoices          │ CRUD        │ CRUD      │ CRUD     │ -      │ R(own)
payments          │ CRUD        │ CRUD      │ R        │ -      │ R(own)

* With specific constraints (own classes/subjects)
** Only for assigned classes
```

### 3.3 Event-Driven Architecture

```
User Action → Server Action → Database Write → Event Emit → Async Handlers

Events:
- student.enrolled → Send notification, Update stats
- attendance.marked → Check threshold, Notify parents
- payment.received → Generate receipt, Update invoice
- subscription.expired → Restrict features, Notify admin

Implementation:
- Use PostgreSQL LISTEN/NOTIFY for real-time
- Queue system for heavy processing (Supabase Edge Functions)
- WebSocket for live updates
```

### 3.4 CQRS Pattern (Optional for High Load)

```
Commands (Write):                    Queries (Read):
┌─────────────────────┐              ┌─────────────────────┐
│ Create Invoice      │              │ Get Invoice List    │
│ Mark Attendance     │              │ Get Dashboard Stats │
│ Submit Assignment   │              │ Search Students     │
│ Process Payment     │              │ Get Reports         │
└─────────────────────┘              └─────────────────────┘
        │                                    │
        ▼                                    ▼
   ┌─────────┐                         ┌─────────┐
   │  Write  │                         │  Read   │
   │  DB     │                         │  Cache  │
   └─────────┘                         └─────────┘

Note: Start with simple CRUD. Implement CQRS only if needed for scale.
```

---

## 4. COMPONENT ARCHITECTURE

### 4.1 Frontend Architecture

```
src/
├── app/
│   ├── (auth)/                 # Public routes
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── (platform)/             # Super Admin Portal
│   │   ├── dashboard/
│   │   ├── organizations/
│   │   ├── subscriptions/
│   │   └── settings/
│   │
│   ├── (dashboard)/            # Tenant dashboards
│   │   ├── layout.tsx          # Auth check, org context
│   │   ├── admin/              # Organization Admin
│   │   ├── principal/          # Campus Manager
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   │
│   └── api/                    # API routes
│       ├── auth/
│       ├── notifications/
│       └── webhooks/
│
├── _components/
│   ├── ui/                     # Reusable UI components
│   ├── layout/                 # Shell, sidebar, navbar
│   ├── forms/                  # Form components
│   └── features/               # Feature-specific components
│
├── _lib/
│   ├── actions/                # Server actions (write)
│   ├── queries/                # Data fetching (read)
│   ├── supabase/               # Client wrappers
│   ├── permissions/            # Permission checks
│   ├── utils/                  # Utilities
│   └── types/                  # TypeScript definitions
│
└── _hooks/                     # Custom React hooks
```

### 4.2 Server Action Organization

```
_lib/actions/
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   ├── signup.ts
│   ├── password-reset.ts
│   └── profile-setup.ts
│
├── organization/
│   ├── create-organization.ts
│   ├── update-organization.ts
│   ├── list-organizations.ts
│   └── manage-subscription.ts
│
├── campus/
│   ├── create-campus.ts
│   ├── update-campus.ts
│   ├── assign-campus-admin.ts
│   └── list-campuses.ts
│
├── academic/
│   ├── create-class.ts
│   ├── enroll-student.ts
│   ├── assign-teacher.ts
│   └── promote-students.ts
│
├── attendance/
│   ├── mark-attendance.ts
│   ├── request-correction.ts
│   └── get-attendance-report.ts
│
├── finance/
│   ├── create-invoice.ts
│   ├── record-payment.ts
│   ├── issue-refund.ts
│   └── generate-receipt.ts
│
├── lms/
│   ├── create-course.ts
│   ├── create-assignment.ts
│   ├── submit-homework.ts
│   └── grade-submission.ts
│
└── admin/
    ├── approve-user.ts
    ├── suspend-organization.ts
    └── manage-features.ts
```

### 4.3 API Route Structure

```
/api/
├── auth/
│   ├── callback/               # OAuth callbacks
│   └── reset-password/         # Password reset API
│
├── webhooks/
│   ├── stripe/                # Payment webhooks
│   └── supabase/              # Auth webhooks
│
├── notifications/
│   ├── register-token/        # FCM token registration
│   └── send/                  # Push notification sending
│
└── export/
    ├── students/              # Export student data
    ├── attendance/            # Export attendance
    └── results/               # Export results
```

---

## 5. DATABASE ARCHITECTURE

### 5.1 Core Tables Schema

#### Organizations (Tenants)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trialing',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE subscription_status AS ENUM (
  'pending', 'trialing', 'active', 'grace', 
  'expired', 'suspended', 'canceled'
);
```

#### Campuses
```sql
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 RLS Helper Functions

```sql
-- Get current organization ID from context
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id::UUID
  FROM auth.jwt_token_attributes('organization_id')
$$ LANGUAGE SQL STABLE;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.jwt_token_attributes('role') = 'super_admin';
$$ LANGUAGE SQL STABLE;

-- Check if user belongs to organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND school_id = org_id
  );
$$ LANGUAGE SQL STABLE;

-- Check specific permission
CREATE OR REPLACE FUNCTION has_permission(
  permission TEXT,
  resource TEXT
)
RETURNS BOOLEAN AS $$
  -- Implementation checks profile.permissions JSONB
  SELECT false; -- Default deny
$$ LANGUAGE SQL STABLE;
```

### 5.3 Indexing Strategy

```sql
-- Organization-scoped indexes
CREATE INDEX idx_organization_id ON profiles(organization_id);
CREATE INDEX idx_organization_id ON campuses(organization_id);
CREATE INDEX idx_organization_id ON classes(organization_id);
CREATE INDEX idx_organization_id ON students(organization_id);

-- Campus-scoped indexes
CREATE INDEX idx_campus_id ON classes(campus_id);
CREATE INDEX idx_campus_id ON students(campus_id);
CREATE INDEX idx_campus_id ON attendance(campus_id);

-- Academic year indexes
CREATE INDEX idx_academic_year_id ON classes(academic_year_id);
CREATE INDEX idx_academic_year_id ON enrollments(academic_year_id);

-- Composite indexes for common queries
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_enrollment_student_class ON enrollments(student_id, class_id);
CREATE INDEX idx_results_student_subject ON results(student_id, subject_id);
```

---

## 6. SECURITY ARCHITECTURE

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
│                                                                  │
│  ┌──────────┐    ┌───────────┐    ┌────────────────────────┐   │
│  │  User    │───▶│  Login    │───▶│   Supabase Auth        │   │
│  │  Entry   │    │  Form     │    │   Verify Credentials   │   │
│  └──────────┘    └───────────┘    └───────────┬────────────┘   │
│                                                 │                │
│                                                 ▼                │
│                                          ┌───────────┐          │
│                                          │  JWT      │          │
│                                          │  Generated│          │
│                                          └─────┬─────┘          │
│                                                │                │
│                     ┌──────────────────────────┘                 │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │   Add Custom Claims  │                               │
│          │  - organization_id   │                               │
│          │  - role              │                               │
│          │  - campus_ids        │                               │
│          │  - permissions       │                               │
│          └──────────┬───────────┘                               │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │  Redirect to         │                               │
│          │  Role Dashboard      │                               │
│          └──────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Authorization Layers

```
Layer 1: Network Level
┌────────────────────────────────────────────────────────────┐
│  - Vercel Edge Firewall (WAF)                              │
│  - DDoS Protection                                         │
│  - IP Allowlisting (if needed)                             │
└────────────────────────────────────────────────────────────┘

Layer 2: Application Level
┌────────────────────────────────────────────────────────────┐
│  - Next.js Middleware (route protection)                   │
│  - Server Action permission checks                         │
│  - API route validation                                    │
└────────────────────────────────────────────────────────────┘

Layer 3: Database Level (RLS)
┌────────────────────────────────────────────────────────────┐
│  - Row-level security policies                             │
│  - Organization isolation                                  │
│  - Role-based access                                       │
│  - Campus scoping                                          │
└────────────────────────────────────────────────────────────┘

Layer 4: Storage Level
┌────────────────────────────────────────────────────────────┐
│  - Bucket policies                                         │
│  - Signed URLs for private files                           │
│  - File type validation                                    │
│  - Size limits                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.3 Data Protection

```
Encryption at Rest:
┌────────────────────────────────────────────────────────────┐
│  - Database: Supabase handles (AES-256)                    │
│  - Storage: Supabase handles                               │
│  - Backups: Encrypted automatically                        │
└────────────────────────────────────────────────────────────┘

Encryption in Transit:
┌────────────────────────────────────────────────────────────┐
│  - All connections: TLS 1.3                                │
│  - API: HTTPS only                                         │
│  - WebSocket: WSS                                          │
└────────────────────────────────────────────────────────────┘

Sensitive Data:
┌────────────────────────────────────────────────────────────┐
│  - Passwords: Supabase Auth (hashed, never stored here)   │
│  - Tokens: JWT with expiration                             │
│  - Payment Info: Stripe (PCI compliant)                    │
│  - PII: Encrypted at application level                     │
└────────────────────────────────────────────────────────────┘
```

---

## 7. SCALABILITY ARCHITECTURE

### 7.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                            │
│                      (Vercel Edge)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ Server 1│     │ Server 2│     │ Server N│
   │ Next.js │     │ Next.js │     │ Next.js │
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │                │
        └───────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Supabase       │
              │  (Auto-scaling) │
              └─────────────────┘
```

### 7.2 Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                          │
│                                                             │
│  L1: Browser Cache                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Static assets (JS, CSS, images)                       │  │
│  │ - Cache-Control: public, max-age=31536000            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  L2: CDN (Vercel Edge)                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ - API response caching                                │  │
│  │ - ISR pages                                           │  │
│  │ - Function results                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  L3: Application Cache                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ - Server components (unstable_cache)                 │  │
│  │ - Reference data (countries, classes)                │  │
│  │ - User sessions                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  L4: Database Query Cache                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ - Supabase handles                                    │  │
│  │ - Prepared statements                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 7.3 Performance Targets

| Metric | Target | Current | Action |
|--------|--------|---------|--------|
| First Contentful Paint | < 1.5s | TBD | Optimize images, code split |
| Time to Interactive | < 3s | TBD | Reduce JS bundle |
| API Response (p95) | < 500ms | TBD | Add indexes, cache |
| Database Query (p95) | < 200ms | TBD | Optimize queries |
| Uptime | 99.9% | TBD | Multi-region |

---

## 8. INFRASTRUCTURE

### 8.1 Environment Configuration

```
Development:
┌────────────────────────────────────────────────────────────┐
│  - Local Next.js (localhost:3000)                         │
│  - Supabase local (Docker)                                │
│  - Firebase Emulator                                      │
└────────────────────────────────────────────────────────────┘

Staging:
┌────────────────────────────────────────────────────────────┐
│  - Vercel Preview Deployments                             │
│  - Supabase staging project                               │
│  - Firebase staging project                               │
└────────────────────────────────────────────────────────────┘

Production:
┌────────────────────────────────────────────────────────────┐
│  - Vercel Production                                      │
│  - Supabase Pro (or dedicated)                           │
│  - Firebase production                                    │
│  - Stripe (live)                                          │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Environment Variables

```env
# Public (client-safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Server-only (never exposed to client)
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_PROJECT_ID=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Platform configuration
NEXT_PUBLIC_PLATFORM_NAME=SKOLIC
NEXT_PUBLIC_SUPPORT_EMAIL=
```

---

## 9. MONITORING & OBSERVABILITY

### 9.1 Metrics to Track

```
Application Metrics:
┌────────────────────────────────────────────────────────────┐
│  - Request rate, error rate, latency (p50, p95, p99)      │
│  - Active users, sessions                                  │
│  - API endpoint usage                                      │
│  - Server action execution time                           │
└────────────────────────────────────────────────────────────┘

Business Metrics:
┌────────────────────────────────────────────────────────────┐
│  - Organizations count, growth rate                        │
│  - Active subscriptions, MRR                               │
│  - User registrations, login attempts                      │
│  - Feature usage (attendance, results, etc.)              │
└────────────────────────────────────────────────────────────┘

Infrastructure Metrics:
┌────────────────────────────────────────────────────────────┐
│  - CPU, Memory, Disk usage                                │
│  - Database connections, query performance                │
│  - Storage usage, bandwidth                               │
│  - Function invocation count, cold starts                 │
└────────────────────────────────────────────────────────────┘
```

### 9.2 Logging Strategy

```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'User logged in',
  userId: user.id,
  organizationId: organizationId,
  timestamp: new Date().toISOString(),
  context: { role: user.role, ip: request.ip }
}));
```

### 9.3 Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 5% errors in 5 min | Critical |
| Slow Response | p95 > 5s for 5 min | High |
| Database Connection | > 80% pool used | High |
| Subscription Expiring | < 7 days until expiry | Medium |
| Storage Limit | > 80% used | Medium |

---

## 10. DISASTER RECOVERY

### 10.1 Backup Strategy

```
Supabase Automatic Backups:
┌───────────────────────────────────���────────────────────────┐
│  - Daily automated backups                                 │
│  - Point-in-time recovery (7 days)                        │
│  - Geo-redundant storage                                   │
└────────────────────────────────────────────────────────────┘

Application-Level Backups:
┌────────────────────────────────────────────────────────────┐
│  - Export critical data weekly (JSON/CSV)                 │
│  - Store in separate cloud storage                        │
│  - Document backup verification process                   │
└────────────────────────────────────────────────────────────┘
```

### 10.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Database failure | 1 hour | 1 hour | Restore from Supabase backup |
| Application crash | 5 min | N/A | Deploy to Vercel from git |
| Data corruption | 4 hours | 1 day | Restore from backup + reapply changes |
| Region outage | 1 hour | 1 hour | DNS failover (if multi-region) |

---

## 11. COMPARISON: CURRENT vs TARGET

### Current Architecture
- Single-tenant: One school = one installation
- School-based: No organization layer
- Basic RLS: School-level isolation only
- Limited permissions: Role-based only
- No subscriptions: Flat pricing
- Basic finance: Fee status only

### Target Architecture (SKOLIC V3)
- Multi-tenant: Single installation, multiple organizations
- Organization-based: True SaaS hierarchy
- Advanced RLS: Organization + campus + role + resource
- Granular permissions: RBAC + ABAC
- Subscription management: Plans, trials, limits, billing
- Complete finance: Invoices, payments, refunds, reports

---

## 12. IMPLEMENTATION PRIORITY

### Phase 1: Foundation
1. Organization entity and schema changes
2. Subscription system tables
3. Updated RLS policies
4. Middleware organization context

### Phase 2: Super Admin Portal
1. Organization CRUD
2. Subscription management
3. Platform analytics
4. Feature flag system

### Phase 3: Finance System
1. Invoice generation
2. Payment recording
3. Receipt generation
4. Financial reports

### Phase 4: Advanced Features
1. Enhanced LMS
2. Quizzes and assessments
3. Advanced analytics
4. Third-party integrations

---

**Document Status:** Architecture Design Complete  
**Next Document:** `DATABASE_PLAN.md` → Schema changes required  
**Approval Required:** Before implementing Phase 1