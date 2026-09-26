# SKOLIC ENTERPRISE V3 - SECURITY PLAN
**Document Version:** 1.0  
**Date:** September 20, 2026  
**Status:** Security Implementation Design

---

## 1. EXECUTIVE SUMMARY

### Security Posture Assessment

| Category | Current Status | Target Status | Gap |
|----------|----------------|---------------|-----|
| Authentication | Basic | Enterprise | Medium |
| Authorization | Role-based | RBAC + ABAC | High |
| Data Isolation | School-level | Organization-level | High |
| Encryption | Partial | Full | Medium |
| Key Management | Exposed | Secure | Critical |
| Audit Logging | Minimal | Comprehensive | High |
| Incident Response | None | Documented | High |

---

## 2. CRITICAL VULNERABILITIES (IMMEDIATE ACTION REQUIRED)

### 🔴 CRITICAL: Exposed Credentials

#### Issue 1: Service Role Key Exposed
**Location:** `.env.local` (COMMITTED TO REPOSITORY)

```env
# CURRENT (INSECURE)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Impact:** Full database access bypassing ALL security controls  
**Risk Level:** CRITICAL - Data breach, data destruction, privilege escalation

**Remediation:**
```bash
# 1. ROTATE THE KEY IMMEDIATELY
# Generate new key in Supabase Dashboard > Settings > API

# 2. Add to .gitignore
echo ".env.local" >> .gitignore

# 3. Never commit secrets again
# Use: npx git-secrets or similar hook
```

#### Issue 2: Firebase Private Key Exposed
**Location:** `.env.local`

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"private_key": "-----BEGIN PRIVATE KEY-----..."}'
```

**Impact:** Send push notifications as the application, access Firebase services  
**Remediation:** Rotate key, use environment variable injection

#### Issue 3: SMTP Credentials Exposed
**Location:** `.env.local`

```env
SMTP_USER=skolic.official@gmail.com
SMTP_PASS=vnfojlxtztczntem
```

**Impact:** Send emails as the organization  
**Remediation:** Use App Password or OAuth2, rotate credentials

#### Issue 4: Plain Password Storage
**Location:** `src/app/_lib/actions/auth.ts:73`

```typescript
// INSECURE - Stores plaintext password
const profilePromise = adminClient.from('profiles').insert({
  // ...
  plain_password: password, // ⚠️ SECURITY VIOLATION
});
```

**Impact:** User credentials readable in database, compliance violation  
**Remediation:**
```sql
-- 1. Drop the column
ALTER TABLE profiles DROP COLUMN IF EXISTS plain_password;

-- 2. Delete all existing plaintext passwords
UPDATE profiles SET plain_password = NULL WHERE plain_password IS NOT NULL;
```

#### Issue 5: Super Admin Password in Code
**Location:** `.env.local`

```env
SUPER_ADMIN_PASSWORD=Superadmin123@
```

**Impact:** Anyone with repo access can access super admin  
**Remediation:** Remove from repo, force password change

---

## 3. AUTHENTICATION SECURITY

### 3.1 Current Authentication Flow

```
User Login
    │
    ▼
┌─────────────────┐
│  Email/Password │ ──► Supabase Auth
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ JWT    │ ──► Profile Lookup ──► Dashboard
    │ Token  │
    └────────┘
```

### 3.2 Enhanced Authentication Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENHANCED AUTH FLOW                           │
│                                                                  │
│  ┌──────────┐    ┌───────────┐    ┌────────────────────────┐   │
│  │  User    │───▶│  Login    │───▶│   Supabase Auth        │   │
│  │  Entry   │    │  Form     │    │   Verify Credentials   │   │
│  └──────────┘    └───────────┘    └───────────┬────────────┘   │
│                                                 │                │
│                                                 ▼                │
│                                          ┌───────────┐          │
│                                          │ MFA Check │          │
│                                          │ (Optional)│          │
│                                          └─────┬─────┘          │
│                                                │                │
│                     ┌──────────────────────────┘                 │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │   Custom Claims      │                               │
│          │  - organization_id   │                               │
│          │  - role              │                               │
│          │  - campus_ids[]      │                               │
│          │  - permissions       │                               │
│          └──────────┬───────────┘                               │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │  Session with        │                               │
│          │  Organization Context│                               │
│          └──────────┬───────────┘                               │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │  Permission Check    │                               │
│          │  (Client + Server)   │                               │
│          └──────────┬───────────┘                               │
│                     │                                            │
│                     ▼                                            │
│          ┌──────────────────────┐                               │
│          │  Redirect to         │                               │
│          │  Role Dashboard      │                               │
│          └──────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Authentication Security Controls

| Control | Implementation | Priority |
|---------|----------------|----------|
| MFA | Optional TOTP via Supabase | High |
| Password Policy | Min 8 chars, uppercase, lowercase, number, special | High |
| Rate Limiting | 5 attempts per 15 minutes | Critical |
| Account Lockout | 30 min lockout after 10 failed attempts | High |
| Session Timeout | 24 hours idle, 7 days max | Medium |
| Secure Cookies | HttpOnly, Secure, SameSite=strict | High |
| CSRF Protection | Supabase CSRF tokens | High |
| Email Verification | Required before login | High |

### 3.4 Implementation: Rate Limiting Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, entry);
  }
  
  // Check rate limit
  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  // Increment counter
  entry.count++;
  
  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - entry.count).toString());
  response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 4. AUTHORIZATION SECURITY

### 4.1 Current Authorization Issues

**Problem 1: Client-Side Role Trust**
```typescript
// INSECURE - Attacker can modify this
if (user.role === 'admin') {
  showAdminPanel();
}
```

**Problem 2: No Resource-Level Permissions**
```typescript
// Any teacher can edit ANY assignment
// Should check: teacher_id = auth.uid()
```

**Problem 3: Missing Permission Checks in Actions**
```typescript
// Many server actions don't verify permissions
export async function createClass(formData: FormData) {
  // No permission check!
  // Any authenticated user can create a class
}
```

### 4.2 Enhanced Authorization Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYERS                         │
│                                                                  │
│  Layer 1: Route Protection (Next.js Middleware)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/admin/*     → require(role = admin)               │  │
│  │  /admin/*         → require(role = admin)               │  │
│  │  /teacher/*       → require(role = teacher)             │  │
│  │  /student/*       → require(role = student)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│  Layer 2: Server Action Permission Checks                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  createInvoice()  → require(can_create_invoice)         │  │
│  │  markAttendance() → require(can_mark_attendance)        │  │
│  │  publishResults() → require(can_publish_results)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│  Layer 3: Database RLS Policies                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  organization_id = current_organization_id()            │  │
│  │  campus_id IN current_campus_ids()                      │  │
│  │  role = required_role                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Permission System Implementation

```typescript
// src/app/_lib/permissions/index.ts

export type Permission =
  // Organization
  | 'organization.manage'
  | 'organization.view'
  // Campus
  | 'campus.manage'
  | 'campus.view'
  // Students
  | 'students.create'
  | 'students.read'
  | 'students.update'
  | 'students.delete'
  | 'students.import'
  | 'students.export'
  // Teachers
  | 'teachers.create'
  | 'teachers.read'
  | 'teachers.update'
  | 'teachers.delete'
  // Classes
  | 'classes.create'
  | 'classes.read'
  | 'classes.update'
  | 'classes.delete'
  // Attendance
  | 'attendance.mark'
  | 'attendance.view'
  | 'attendance.correct'
  // Finance
  | 'finance.create_invoice'
  | 'finance.view_invoices'
  | 'finance.manage_payments'
  | 'finance.view_reports'
  // Results
  | 'results.enter'
  | 'results.publish'
  | 'results.view'
  // LMS
  | 'lms.create_course'
  | 'lms.manage_content'
  | 'lms.view_progress'
  // etc.
;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ['*'], // All permissions
  
  org_admin: [
    'organization.manage',
    'organization.view',
    'campus.manage',
    'campus.view',
    'students.create', 'students.read', 'students.update', 'students.delete', 'students.import', 'students.export',
    'teachers.create', 'teachers.read', 'teachers.update', 'teachers.delete',
    'classes.create', 'classes.read', 'classes.update', 'classes.delete',
    'attendance.mark', 'attendance.view', 'attendance.correct',
    'finance.create_invoice', 'finance.view_invoices', 'finance.manage_payments', 'finance.view_reports',
    'results.enter', 'results.publish', 'results.view',
    'lms.create_course', 'lms.manage_content', 'lms.view_progress',
  ],
  
  principal: [
    'campus.view',
    'students.read', 'students.update',
    'teachers.read',
    'classes.read', 'classes.update',
    'attendance.mark', 'attendance.view', 'attendance.correct',
    'results.enter', 'results.publish', 'results.view',
  ],
  
  teacher: [
    'classes.read',
    'attendance.mark', 'attendance.view',
    'results.enter',
    'lms.manage_content',
  ],
  
  student: [
    'students.read', // Own profile only
    'attendance.view', // Own attendance only
    'results.view', // Own results only
    'lms.view_progress',
  ],
};

// Permission check function
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes('*' as any) || permissions.includes(permission);
}

// Check with organization context
export async function checkPermission(
  permission: Permission,
  organizationId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) return false;
  
  // Check role permission
  if (!hasPermission(profile.role, permission)) return false;
  
  // Check organization
  if (profile.organization_id !== organizationId) return false;
  
  return true;
}
```

### 4.4 Server Action Permission Decorator

```typescript
// src/app/_lib/actions/decorators/require-permission.ts

type Permission = 'students.create' | 'students.read' | // ...

export function requirePermission(permission: Permission) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: T
  ): T {
    return (async (...args: any[]) => {
      // Get current user
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }
      
      // Get profile with role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        throw new Error('Profile not found');
      }
      
      // Check permission
      if (!hasPermission(profile.role, permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
      
      // Execute original function
      return target(...args);
    }) as T;
  };
}

// Usage
@requirePermission('students.create')
export async function createStudent(formData: FormData) {
  // Function body
}
```

---

## 5. DATA ISOLATION SECURITY

### 5.1 Current Multi-Tenancy Issues

**Problem 1: Organization ID Not Universally Enforced**
```sql
-- Current: RLS checks school_id, but some queries bypass it
SELECT * FROM students; -- May return students from other schools!
```

**Problem 2: No Campus-Level Isolation**
```sql
-- Admin can see ALL students in their organization
-- Cannot restrict to specific campus
```

**Problem 3: Super Admin Sees Everything**
```sql
-- Super admin bypasses all RLS with role check
-- But no audit trail of what they accessed
```

### 5.2 Enhanced Multi-Tenancy Design

```
┌─────────────────────────────────────────────────────────────────┐
│                  MULTI-TENANT ISOLATION                         │
│                                                                  │
│  Organization Level                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Every table has:                                        │    │
│  │  - organization_id (NOT NULL for tenant data)           │    │
│  │  - RLS enforces: organization_id = current_org_id()     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Campus Level (Optional)                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Sensitive tables have:                                  │    │
│  │  - campus_id (nullable)                                  │    │
│  │  - RLS: campus_id IN current_campus_ids()               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  User Level (For Student/Teacher)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Personal data:                                          │    │
│  │  - user_id = auth.uid()                                  │    │
│  │  - Students see own records only                         │    │
│  │  - Teachers see assigned classes only                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 RLS Helper Functions

```sql
-- ═══════════════════════════════════════════════════════════════════
-- ORGANIZATION CONTEXT FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- Get current organization ID from JWT claims
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    (auth.jwt_token_attributes())->>'organization_id'::UUID
  WHERE 
    (auth.jwt_token_attributes())->>'organization_id' IS NOT NULL
$$;

-- Get current campus IDs (array)
CREATE OR REPLACE FUNCTION public.current_campus_ids()
RETURNS UUID[]
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    ARRAY(
      SELECT jsonb_array_elements_text(
        (auth.jwt_token_attributes())->>'campus_ids'
      )::UUID
    )
  WHERE 
    (auth.jwt_token_attributes())->>'campus_ids' IS NOT NULL
$$;

-- Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT (auth.jwt_token_attributes())->>'role'
$$;

-- Check if platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT current_user_role() = 'super_admin'
$$;

-- Check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.organization_id = org_id
  )
$$;

-- Check campus assignment
CREATE OR REPLACE FUNCTION public.is_campus_member(campus_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT campus_id = ANY(public.current_campus_ids())
     OR public.is_platform_admin()
$$;
```

### 5.4 Secure RLS Policies

```sql
-- ═══════════════════════════════════════════════════════════════════
-- EXAMPLE: Secure Organization Isolation for Students
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Platform admin sees all
DROP POLICY IF EXISTS "Platform admin can view all profiles" ON profiles;
CREATE POLICY "Platform admin can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin()
);

-- 2. Organization members can view profiles in their org
DROP POLICY IF EXISTS "Org members can view profiles" ON profiles;
CREATE POLICY "Org members can view profiles" ON profiles
FOR SELECT
TO authenticated
USING (
  organization_id = public.current_organization_id()
);

-- 3. Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- 4. Only org admins can insert new profiles
DROP POLICY IF EXISTS "Org admins can insert profiles" ON profiles;
CREATE POLICY "Org admins can insert profiles" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_organization_id()
  AND (
    public.current_user_role() IN ('super_admin', 'org_admin')
    OR id = auth.uid()  -- Users can create their own profile
  )
);

-- 5. Only org admins can update profiles
DROP POLICY IF EXISTS "Org admins can update profiles" ON profiles;
CREATE POLICY "Org admins can update profiles" ON profiles
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_organization_id()
)
WITH CHECK (
  organization_id = public.current_organization_id()
  AND public.current_user_role() IN ('super_admin', 'org_admin')
);
```

---

## 6. DATA PROTECTION

### 6.1 Encryption Requirements

| Data Type | At Rest | In Transit | Application Level |
|-----------|---------|------------|-------------------|
| Database | Supabase | TLS 1.3 | Not required |
| Backups | Supabase | TLS 1.3 | Not required |
| Storage | Supabase | TLS 1.3 | Not required |
| API Calls | N/A | TLS 1.3 | Not required |
| JWT Tokens | Not stored | Cookie/Header | Not required |
| Sensitive PII | - | - | Encrypt |
| Passwords | Hash (bcrypt) | - | Supabase handles |
| Payment Info | - | - | Stripe handles |

### 6.2 Sensitive Data Handling

```sql
-- Example: Encrypt sensitive columns using pgcrypto

-- Enable extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(
    gen_random_bytes(32),
    'hex'
  ) || ':' || encode(
    pg_catalog.encrypt(data, current_setting('app.encryption_key'), 'aes'),
    'base64'
  );
END;
$$;

-- Note: This requires app.encryption_key to be set
-- In production, use Supabase Vault or external key management
```

### 6.3 Data Retention Policy

```sql
-- Example: Soft delete pattern for compliance

-- Add deleted_at column to sensitive tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Soft delete policy
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER profiles_soft_delete
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION soft_delete();

-- Views that exclude deleted records
CREATE OR REPLACE VIEW active_profiles AS
SELECT * FROM profiles
WHERE deleted_at IS NULL;
```

---

## 7. STORAGE SECURITY

### 7.1 Storage Buckets

| Bucket | Public Access | Purpose |
|--------|---------------|---------|
| organization-logos | Yes (authenticated) | Organization branding |
| campus-images | Yes (authenticated) | Campus photos |
| student-documents | No (private) | Admission docs, ID cards |
| teacher-documents | No (private) | Certificates, IDs |
| payment-receipts | No (private) | Payment proof |
| assignments | Yes (role-based) | Teacher uploads |
| lesson-resources | Yes (enrolled) | Course materials |

### 7.2 Storage Policies

```sql
-- ═══════════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Organization logos: Anyone in org can upload, public read
CREATE POLICY "Org members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Student documents: Only org admins can access
CREATE POLICY "Admins can access student docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Payment receipts: Only finance team
CREATE POLICY "Finance can access receipts"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND role IN ('super_admin', 'org_admin')
  )
);
```

---

## 8. API SECURITY

### 8.1 Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 | 15 min |
| Password Reset | 3 | 1 hour |
| API General | 100 | 1 min |
| File Upload | 10 | 1 min |
| Bulk Import | 5 | 1 hour |

### 8.2 Input Validation

```typescript
// Using Zod for validation
import { z } from 'zod';

export const studentSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  date_of_birth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().max(500).optional(),
  parent_name: z.string().max(100).optional(),
  parent_phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
});

// Server action with validation
export async function createStudent(formData: FormData) {
  const rawData = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    // ...
  };
  
  const validated = studentSchema.safeParse(rawData);
  
  if (!validated.success) {
    return { error: validated.error.errors };
  }
  
  // Proceed with validated data
}
```

### 8.3 SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries via Supabase client
// ❌ NEVER do this:
const query = `SELECT * FROM students WHERE name = '${userInput}'`;

// ✅ ALWAYS do this:
const { data } = await supabase
  .from('students')
  .select('*')
  .ilike('name', `%${userInput}%`);  // Safely escaped

// For raw SQL, use parameterized queries:
const { data } = await supabase.rpc('search_students', {
  search_term: userInput
});
```

---

## 9. AUDIT & COMPLIANCE

### 9.1 Audit Log Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
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

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

### 9.2 Audit Events to Track

| Category | Events |
|----------|--------|
| Authentication | Login, Logout, Failed Login, Password Change, Password Reset |
| Authorization | Permission Denied, Role Change |
| Data Access | View Sensitive Data, Export Data |
| Data Modification | Create, Update, Delete Records |
| Financial | Invoice Created, Payment Verified, Refund Issued |
| Security | Suspicious Activity, Rate Limit Exceeded |
| Compliance | Data Export Request, Account Deletion |

### 9.3 Audit Log Function

```typescript
// src/app/_lib/actions/audit.ts

export async function logAuditEvent(params: {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get IP from headers (in production, use request context)
  // This is simplified - real implementation needs proper request context
  
  await supabase.from('audit_logs').insert({
    organization_id: (await getCurrentOrganizationId()),
    user_id: user?.id,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues,
    new_values: params.newValues,
    metadata: params.metadata,
    // ip_address: request.headers.get('x-forwarded-for'),
    // user_agent: request.headers.get('user-agent'),
  });
}

// Usage
await logAuditEvent({
  action: 'invoice_created',
  entityType: 'invoices',
  entityId: invoice.id,
  newValues: { amount: invoice.total_amount }
});
```

---

## 10. INCIDENT RESPONSE

### 10.1 Security Incident Types

| Severity | Type | Response Time |
|----------|------|---------------|
| Critical | Data Breach, Full System Compromise | 1 hour |
| High | Unauthorized Access, Injection Attack | 4 hours |
| Medium | Policy Violation, Suspicious Activity | 24 hours |
| Low | Failed Login Attempts, Minor Issues | 48 hours |

### 10.2 Incident Response Plan

```
1. DETECTION
   - Monitor: Error logs, audit logs, rate limits
   - Alert: PagerDuty, email, SMS
   
2. CONTAINMENT
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs
   
3. INVESTIGATION
   - Analyze logs
   - Identify root cause
   - Assess scope of breach
   
4. REMEDIATION
   - Fix vulnerability
   - Restore data from backup if needed
   - Reset all potentially compromised credentials
   
5. NOTIFICATION
   - Internal stakeholders: 24 hours
   - Affected users: Per data protection laws
   - Regulatory bodies: If required
   
6. POST-INCIDENT
   - Document lessons learned
   - Update security controls
   - Review and improve detection
```

---

## 11. SECURITY CHECKLIST

### Pre-Production
- [ ] Rotate all exposed credentials
- [ ] Enable RLS on all tenant tables
- [ ] Implement organization context functions
- [ ] Add rate limiting to authentication
- [ ] Implement password policy
- [ ] Set up audit logging
- [ ] Configure storage policies
- [ ] Enable encryption at rest (Supabase)
- [ ] Configure TLS 1.3 (Supabase)
- [ ] Test cross-tenant isolation
- [ ] Test permission enforcement

### Production Monitoring
- [ ] Set up error monitoring (Sentry)
- [ ] Configure log aggregation
- [ ] Set up alerting for anomalies
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency vulnerability scanning
- [ ] Backup restoration testing

---

## 12. SECURITY TESTING

### 12.1 Security Test Cases

| Test | Description | Automated |
|------|-------------|-----------|
| Cross-Tenant Access | Verify Org A cannot access Org B data | Yes |
| Role Escalation | Verify student cannot access admin features | Yes |
| SQL Injection | Test all user inputs | Yes |
| XSS Prevention | Test output encoding | Manual |
| CSRF Protection | Verify token validation | Yes |
| Rate Limiting | Verify limits are enforced | Yes |
| Session Management | Verify timeout and logout | Manual |
| Password Policy | Verify complexity requirements | Yes |
| File Upload | Verify file type and size limits | Yes |
| API Authorization | Verify all endpoints enforce permissions | Yes |

### 12.2 Cross-Tenant Test Script

```typescript
// test/security/cross-tenant.test.ts

describe('Cross-Tenant Isolation', () => {
  const org1 = { id: uuid(), name: 'Org 1' };
  const org2 = { id: uuid(), name: 'Org 2' };
  const user1 = { email: 'user1@org1.com', org: org1 };
  const user2 = { email: 'user2@org2.com', org: org2 };
  
  test('User 1 cannot read Org 2 students', async () => {
    // Login as user1
    await login(user1);
    
    // Try to read Org 2 students
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', org2.id);
    
    // Should return empty or error
    expect(data).toHaveLength(0);
  });
  
  test('User 1 cannot update Org 2 records', async () => {
    await login(user1);
    
    // Try to update Org 2 student
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: 'Hacked Name' })
      .eq('organization_id', org2.id);
    
    // Should fail due to RLS
    expect(error).toBeDefined();
  });
});
```

---

**Document Status:** Security Plan Complete  
**Next Document:** `IMPLEMENTATION_ROADMAP.md` → Phase-by-phase implementation  
**Priority:** CRITICAL - Fix exposed credentials BEFORE any other work  
**Estimated Security Implementation:** 4-6 weeks