# SKOLIC ENTERPRISE V3 - DATABASE PLAN
**Document Version:** 1.0  
**Date:** September 20, 2026  
**Status:** Database Schema Design

---

## 1. CURRENT DATABASE STATE

### 1.1 Existing Tables

The current database contains ~40 tables with the following hierarchy:

```
organizations (MISSING - needs to be created)
    │
    ├── schools (acts as both organization and campus)
    │   ├── classes
    │   ├── subjects
    │   ├── timetable
    │   ├── exam_timetable
    │   ├── holidays
    │   ├── assignments
    │   ├── attendance
    │   ├── results
    │   ├── final_results
    │   ├── announcements
    │   └── notifications
    │
    ├── admin_campuses (junction table - partial implementation)
    ├── teacher_profiles
    ├── student_profiles
    ├── teacher_subject
    ├── student_groups
    ├── syllabus
    ├── import_logs
    ├── password_reset_tokens
    └── conversations/messages (unused)
```

### 1.2 Migration State Unknown

⚠️ **CRITICAL:** There is no clear documentation of which migrations have been applied to the production database. Multiple SQL files may have conflicting changes.

**Recommended Action:** Create a migration status table to track applied migrations.

---

## 2. TARGET DATABASE SCHEMA

### 2.1 Core Tables (Required for Multi-Tenancy)

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONS (Tenants)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Pakistan',
    timezone TEXT DEFAULT 'Asia/Karachi',
    registration_number TEXT,
    institution_type TEXT CHECK (institution_type IN ('school', 'college', 'university', 'academy', 'training_center')),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTION PLANS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    max_campuses INTEGER DEFAULT 1,
    max_students INTEGER,
    max_teachers INTEGER,
    max_storage_gb INTEGER DEFAULT 5,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, billing_interval, price, max_campuses, max_students, max_teachers, features) VALUES
('Free', 'Perfect for small schools starting out', 'monthly', 0, 1, 50, 5, '{"lms": false, "finance": false, "reports": false}'),
('Basic', 'Essential features for growing schools', 'monthly', 5000, 2, 200, 20, '{"lms": true, "finance": false, "reports": false}'),
('Professional', 'Complete solution for medium schools', 'monthly', 15000, 5, 1000, 50, '{"lsm": true, "finance": true, "reports": true}'),
('Enterprise', 'Full-featured for large institutions', 'yearly', 150000, NULL, NULL, NULL, '{"lms": true, "finance": true, "reports": true, "api": true, "priority_support": true}');

-- ═══════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TYPE subscription_status AS ENUM ('pending', 'trialing', 'active', 'grace', 'expired', 'suspended', 'canceled');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'pending',
    trial_start_date DATE,
    trial_end_date DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    cancel_at_period_end BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- MANUAL PAYMENTS (Bank Transfer, Cash, etc.)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'jazzcash', 'easypaisa', 'card', 'other')),
    reference_number TEXT,
    transaction_id TEXT,
    payment_date DATE NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CAMPUSES
-- ══════════════════════════════════════════════════���════════════════════════
CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Karachi',
    campus_type TEXT DEFAULT 'main' CHECK (campus_type IN ('main', 'branch', 'online')),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    capacity INTEGER,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campuses_organization ON campuses(organization_id);
CREATE INDEX idx_campuses_is_active ON campuses(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- ACADEMIC YEARS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_current BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_academic_years_organization ON academic_years(organization_id);
CREATE UNIQUE INDEX idx_academic_years_year_org ON academic_years(year, organization_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT,
    head_id UUID REFERENCES profiles(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_organization ON departments(organization_id);
CREATE INDEX idx_departments_campus ON departments(campus_id);

-- Need to add organization_id to existing tables
```

### 2.2 Migration: Add Organization ID to Existing Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add organization_id to existing tables
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add organization_id to schools (rename to campuses after migration)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- 2. Add organization_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 3. Add organization_id to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- 4. Add organization_id to other tables
-- (Repeat for: subjects, teacher_profiles, student_profiles, teacher_subject,
--  timetable, exam_timetable, assignments, attendance, results, announcements,
--  notifications, holidays, syllabus, student_groups)
```

### 2.3 Finance Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- FEE CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FEE STRUCTURES (Templates)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT true,
    due_date DATE,
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FEE STRUCTURE ITEMS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- STUDENT FEE ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_reason TEXT,
    final_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waived', 'transferred')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_student_fee_student ON student_fee_assignments(student_id);
CREATE INDEX idx_student_fee_structure ON student_fee_assignments(fee_structure_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- INVOICES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'canceled', 'void');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES profiles(id),
    academic_year_id UUID REFERENCES academic_years(id),
    fee_structure_id UUID REFERENCES fee_structures(id),
    status invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_academic_year ON invoices(academic_year_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- INVOICE ITEMS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected', 'refunded', 'reversed');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'online', 'other')),
    reference_number TEXT,
    transaction_id TEXT,
    payment_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    receipt_url TEXT,
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYMENT ALLOCATIONS (Partial payment distribution)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- REFUNDS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- EXPENSE CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'operational' CHECK (type IN ('operational', 'salary', 'capital', 'other')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- EXPENSES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid', 'canceled');

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    vendor_name TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    status expense_status DEFAULT 'draft',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_expenses_campus ON expenses(campus_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category_id);
```

### 2.4 LMS Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- COURSES (LMS)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    enrollment_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LESSONS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    resource_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- COURSE ENROLLMENTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    UNIQUE(course_id, student_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEARNING PROGRESS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    time_spent_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, lesson_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUIZZES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 1,
    passing_percentage DECIMAL(5,2) DEFAULT 50,
    shuffle_questions BOOLEAN DEFAULT false,
    show_results TEXT DEFAULT 'after_submit' CHECK (show_results IN ('never', 'after_submit', 'after_deadline')),
    due_date TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUIZ QUESTIONS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'fill_blank');

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB, -- Array of options for multiple choice
    correct_answer TEXT NOT NULL,
    points DECIMAL(5,2) DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUIZ ATTEMPTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    passed BOOLEAN,
    answers JSONB,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES profiles(id),
    UNIQUE(quiz_id, student_id, attempt_number)
);
```

### 2.5 Audit & Logging Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION STATUS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE schema_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    rollback_sql TEXT
);
```

---

## 3. RLS POLICIES (Enhanced)

### 3.1 Core Helper Functions

```sql
-- Organization context functions
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULL::UUID; -- Override in application context
$$;

CREATE OR REPLACE FUNCTION public.current_campus_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULL::UUID;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULL::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT current_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT current_user_role() IN ('super_admin', 'org_admin');
$$;
```

### 3.2 Organization Isolation Policies

```sql
-- Example: Organization-based isolation for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organization isolation for classes" ON classes;
CREATE POLICY "Organization isolation for classes" ON classes
FOR ALL
TO authenticated
USING (
  organization_id = current_organization_id()
)
WITH CHECK (
  organization_id = current_organization_id()
);

-- Campus-specific policies (optional)
DROP POLICY IF EXISTS "Campus isolation for classes" ON classes;
CREATE POLICY "Campus isolation for classes" ON classes
FOR ALL
TO authenticated
USING (
  campus_id = current_campus_id() OR campus_id IS NULL
)
WITH CHECK (
  campus_id = current_campus_id() OR campus_id IS NULL
);
```

---

## 4. MIGRATION STRATEGY

### 4.1 Phase 1: Create New Tables

```sql
-- Run in order:
-- 1. organizations
-- 2. subscription_plans
-- 3. subscriptions
-- 4. subscription_payments
-- 5. campuses
-- 6. academic_years
-- 7. departments

-- After: Add organization_id to existing tables
```

### 4.2 Phase 2: Data Migration

```sql
-- 1. Create organizations from existing schools
INSERT INTO organizations (id, name, slug, address, phone, email, created_at)
SELECT gen_random_uuid(), name, LOWER(REPLACE(name, ' ', '-')), address, phone, email, created_at
FROM schools
ON CONFLICT (slug) DO NOTHING;

-- 2. Link schools to organizations
UPDATE schools
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE LOWER(REPLACE(o.name, ' ', '-')) = LOWER(REPLACE(schools.name, ' ', '-'))
  LIMIT 1
)
WHERE organization_id IS NULL;

-- 3. Add organization_id to profiles from schools
UPDATE profiles
SET organization_id = (
  SELECT school_id::UUID FROM schools WHERE id = profiles.school_id
)
WHERE organization_id IS NULL;
```

### 4.3 Phase 3: Enable RLS

```sql
-- Enable RLS on new tables with organization isolation
-- See section 3.2 above
```

---

## 5. IMPLEMENTATION CHECKLIST

### Pre-Migration
- [ ] Backup production database
- [ ] Test migration on staging
- [ ] Document current data
- [ ] Plan rollback procedure

### Migration Execution
- [ ] Create new tables (organizations, subscriptions, campuses, etc.)
- [ ] Create finance tables
- [ ] Create LMS tables
- [ ] Create audit tables
- [ ] Add organization_id to existing tables
- [ ] Run data migration scripts
- [ ] Enable RLS on all new tables
- [ ] Test organization isolation

### Post-Migration
- [ ] Verify data integrity
- [ ] Test all user roles
- [ ] Update application code
- [ ] Update server actions
- [ ] Clear application cache
- [ ] Monitor error logs

---

## 6. ROLLBACK PROCEDURE

If migration fails:

1. **Restore from backup** - Supabase automatic backups
2. **Do NOT drop new tables** - Just disable if needed
3. **Application-level rollback** - Redirect to maintenance page
4. **Investigate logs** - Check audit_logs table
5. **Fix and re-run** - Apply specific failed statements

---

**Document Status:** Database Schema Design Complete  
**Next Document:** `SECURITY_PLAN.md` → Security implementation details  
**Dependencies:** Requires ARCHITECTURE.md approval  
**Estimated Implementation Time:** 2-3 weeks for Phase 1 database changes