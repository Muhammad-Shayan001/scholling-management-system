# SKOLIC ENTERPRISE V3 - IMPLEMENTATION ROADMAP
**Document Version:** 1.0  
**Date:** September 20, 2026  
**Status:** Implementation Plan

---

## EXECUTIVE SUMMARY

This roadmap transforms the existing school management system into **SKOLIC Enterprise V3** - a production-ready, secure, scalable multi-tenant SaaS platform.

### Current State
- **Codebase:** 180 source files, ~15,000 LOC
- **Database:** 40+ tables (single-tenant design)
- **Deployment:** Vercel + Supabase
- **Maturity:** Beta/early production

### Target State
- **Architecture:** Multi-tenant SaaS with organization hierarchy
- **Security:** Enterprise-grade (RLS, audit logging, encryption)
- **Features:** Complete ERP + LMS with finance, subscriptions
- **Scale:** Unlimited organizations, campus per org

### Total Implementation Time
| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | 1 week | Audit & Planning (CURRENT) |
| Phase 1 | 2-3 weeks | Foundation (Security fixes + DB schema) |
| Phase 2 | 2-3 weeks | Super Admin Portal |
| Phase 3 | 4-5 weeks | ERP Core (Students, Teachers, Attendance) |
| Phase 4 | 4-5 weeks | Finance System |
| Phase 5 | 4-6 weeks | LMS Enhancement |
| Phase 6 | 3-4 weeks | Examinations |
| Phase 7 | 2-3 weeks | Reports & Notifications |
| Phase 8 | 2-3 weeks | Production Readiness |

**Total Estimated: 22-31 weeks (5.5 - 7.75 months)**

---

## PHASE 0: AUDIT & PLANNING
**Duration:** 1 week (COMPLETED)
**Status:** In Progress

### Deliverables ✅
- [x] docs/AUDIT.md - Repository analysis
- [x] docs/ARCHITECTURE.md - System architecture
- [x] docs/DATABASE_PLAN.md - Schema design
- [x] docs/SECURITY_PLAN.md - Security implementation

### Critical Findings
| Issue | Severity | Action |
|-------|----------|--------|
| Exposed credentials in repo | CRITICAL | Rotate immediately |
| Plain password storage | CRITICAL | Remove column |
| Weak RLS policies | HIGH | Rewrite policies |
| No multi-tenancy | HIGH | Implement org layer |
| No subscription system | HIGH | Build from scratch |

---

## PHASE 1: FOUNDATION
**Duration:** 2-3 weeks
**Priority:** CRITICAL

### Objectives
1. Fix critical security vulnerabilities
2. Establish multi-tenant database schema
3. Set up organization context
4. Enable proper authentication

### Week 1: Security Emergency Fixes

#### Task 1.1: Credential Rotation (Day 1-2)
```
Actions:
- Generate new Supabase service role key
- Generate new Firebase service account key
- Generate new SMTP credentials
- Update Vercel environment variables
- Remove .env.local from git history

Files Affected:
- .env.local
- Vercel project settings

Verification:
- Confirm old keys no longer work
- Test authentication flows
```

#### Task 1.2: Remove Plain Passwords (Day 2-3)
```
Actions:
- Drop plain_password column from profiles
- Update auth.ts to remove storage
- Delete all stored plaintext passwords

Files:
- src/app/_lib/actions/auth.ts
- Database: profiles table

SQL:
ALTER TABLE profiles DROP COLUMN IF EXISTS plain_password;
```

#### Task 1.3: Secure Environment Setup (Day 3-4)
```
Actions:
- Add .env.local to .gitignore
- Create .env.example with placeholder values
- Document required environment variables

Files:
- .gitignore
- .env.example
- docs/ENVIRONMENT.md (new)
```

#### Task 1.4: Rate Limiting Implementation (Day 4-5)
```
Actions:
- Implement auth rate limiting middleware
- Add account lockout after failed attempts
- Add password complexity requirements

Files:
- src/middleware.ts (new)
- src/app/_lib/actions/auth.ts

Verification:
- Test 6 failed logins → account locked
- Test rate limiting on auth endpoints
```

### Week 2: Database Foundation

#### Task 1.5: Create Organization Tables (Day 6-8)
```
SQL Files to Create:
- migrations/001_create_organizations.sql
- migrations/002_create_campuses.sql
- migrations/003_create_academic_years.sql

Tables:
- organizations
- campuses
- academic_years
- departments
```

#### Task 1.6: Create Subscription Tables (Day 8-10)
```
SQL Files:
- migrations/004_create_subscription_plans.sql
- migrations/005_create_subscriptions.sql

Tables:
- subscription_plans
- subscriptions
- subscription_payments
```

#### Task 1.7: Add Organization ID to Existing Tables (Day 10-12)
```
Migration Script:
- Add organization_id to: profiles, classes, subjects,
  teacher_profiles, student_profiles, attendance,
  results, announcements, notifications, etc.

Data Migration:
- Create organizations from existing schools
- Link all records to organizations
```

### Week 3: Organization Context

#### Task 1.8: JWT Custom Claims (Day 13-15)
```
Actions:
- Update signup/login to add custom claims
- Include: organization_id, role, campus_ids

Files:
- src/app/_lib/actions/auth.ts
- src/app/_lib/supabase/server.ts

Claims Structure:
{
  "sub": "user-uuid",
  "organization_id": "org-uuid",
  "role": "org_admin",
  "campus_ids": ["campus-uuid"],
  "exp": 1234567890
}
```

#### Task 1.9: RLS Helper Functions (Day 15-17)
```
SQL Functions:
- current_organization_id()
- current_campus_ids()
- current_user_role()
- is_platform_admin()
- is_organization_member()
- is_campus_member()

Files:
- database/helpers/organization-functions.sql
```

#### Task 1.10: Update RLS Policies (Day 17-19)
```
Actions:
- Rewrite policies to use organization_id
- Add campus-level policies
- Test cross-organization isolation

Tables to Update:
- All tenant-owned tables

Verification:
- Test: Org A cannot read Org B data
- Test: Campus manager sees only assigned campus
```

### Phase 1 Deliverables
- [ ] All exposed credentials rotated
- [ ] No plaintext passwords in database
- [ ] Organization, campus, academic_year tables created
- [ ] Subscription tables created
- [ ] Organization context implemented
- [ ] RLS policies enforce organization isolation
- [ ] Rate limiting active

---

## PHASE 2: SUPER ADMIN PORTAL
**Duration:** 2-3 weeks
**Priority:** HIGH

### Objectives
1. Build platform administration interface
2. Organization management
3. Subscription management
4. Platform analytics

### Week 4: Platform Dashboard

#### Task 2.1: Super Admin Layout
```
Pages:
- src/app/(platform)/layout.tsx
- src/app/(platform)/super-admin/page.tsx

Components:
- PlatformSidebar
- PlatformHeader
- PlatformStats

Features:
- Dashboard with platform metrics
- Quick actions panel
```

#### Task 2.2: Organization Management
```
Pages:
- src/app/(platform)/organizations/page.tsx
- src/app/(platform)/organizations/new/page.tsx
- src/app/(platform)/organizations/[id]/page.tsx
- src/app/(platform)/organizations/[id]/edit/page.tsx

Features:
- List all organizations
- Create new organization
- View organization details
- Edit organization settings
- Activate/suspend organization
- Assign subscription
```

#### Task 2.3: Organization Approval Workflow
```
Server Actions:
- src/app/_lib/actions/platform/approve-organization.ts
- src/app/_lib/actions/platform/suspend-organization.ts
- src/app/_lib/actions/platform/delete-organization.ts

Features:
- Pending organization queue
- Approval with default subscription
- Rejection with reason
- Deletion with data export
```

### Week 5: Subscription Management

#### Task 2.4: Subscription Plans UI
```
Pages:
- src/app/(platform)/subscription-plans/page.tsx

Features:
- List all plans
- Create/edit plan
- Set pricing and limits
- Toggle features
- Set as default trial plan
```

#### Task 2.5: Subscription Lifecycle
```
Server Actions:
- src/app/_lib/actions/platform/create-subscription.ts
- src/app/_lib/actions/platform/renew-subscription.ts
- src/app/_lib/actions/platform/upgrade-subscription.ts
- src/app/_lib/actions/platform/cancel-subscription.ts
- src/app/_lib/actions/platform/extend-trial.ts

Features:
- Create trial subscription
- Manual renewal
- Upgrade/downgrade plan
- Cancel at period end
- Extend grace period
```

#### Task 2.6: Manual Payment Recording
```
Pages:
- src/app/(platform)/payments/page.tsx

Features:
- Record bank transfer
- Record cash payment
- Record JazzCash/Easypaisa
- Verify payment
- Generate receipt
- Reject payment
```

### Week 6: Analytics & Reports

#### Task 2.7: Platform Analytics Dashboard
```
Metrics to Display:
- Total organizations
- Active organizations
- Trial organizations
- Expired subscriptions
- MRR (Monthly Recurring Revenue)
- New organizations this month
- Churn rate

Charts:
- Organization growth chart
- Revenue chart
- Subscription status distribution
```

#### Task 2.8: Feature Usage Analytics
```
Metrics:
- Organizations using LMS
- Organizations using Finance
- Total students across platform
- Total teachers across platform
- Attendance submission rate
- Assignment completion rate
```

### Phase 2 Deliverables
- [ ] Super admin dashboard
- [ ] Organization CRUD
- [ ] Subscription management
- [ ] Manual payment recording
- [ ] Platform analytics
- [ ] Feature usage tracking

---

## PHASE 3: ERP CORE
**Duration:** 4-5 weeks
**Priority:** HIGH

### Objectives
1. Complete student management
2. Complete teacher/staff management
3. Academic structure (classes, sections, subjects)
4. Attendance system enhancement

### Week 7: Student Management

#### Task 3.1: Student Profile Enhancement
```
New Fields:
- admission_number (unique)
- roll_number
- date_of_birth
- gender
- blood_group
- emergency_contact
- guardian_name
- guardian_phone
- guardian_relation
- address
- profile_photo

Database:
- Add columns to student_profiles
- Add to profiles table
```

#### Task 3.2: Student CRUD Operations
```
Server Actions:
- createStudent
- updateStudent
- getStudent
- archiveStudent
- transferStudent
- promoteStudent

Pages:
- src/app/(dashboard)/admin/students/page.tsx
- src/app/(dashboard)/admin/students/new/page.tsx
- src/app/(dashboard)/admin/students/[id]/page.tsx
- src/app/(dashboard)/admin/students/[id]/edit/page.tsx
```

#### Task 3.3: Student Bulk Import
```
Features:
- CSV upload with validation
- Excel upload with validation
- Preview before import
- Error reporting
- Duplicate detection
- Roll number assignment

Server Actions:
- importStudents (existing - enhance)
- validateStudentImport
- processStudentImport
```

### Week 8: Teacher & Staff Management

#### Task 3.4: Teacher Profiles
```
New Fields:
- employee_id
- designation
- department_id
- qualification
- experience_years
- joining_date
- salary
- emergency_contact
- profile_photo

Database:
- Add columns to teacher_profiles
```

#### Task 3.5: Staff Management (Non-Teaching)
```
New Table:
- staff_profiles

Fields:
- user_id
- employee_id
- designation
- department_id
- staff_type (admin, support, security, etc.)
- joining_date
- salary
```

#### Task 3.6: Teacher/Staff CRUD
```
Pages:
- src/app/(dashboard)/admin/teachers/page.tsx
- src/app/(dashboard)/admin/staff/page.tsx (new)
- src/app/(dashboard)/admin/teachers/new/page.tsx

Features:
- List all teachers/staff
- Create new teacher/staff
- Edit teacher/staff
- Archive teacher/staff
- Assign to subjects/classes
- Assign to departments
```

### Week 9: Academic Structure

#### Task 3.7: Academic Year Management
```
Server Actions:
- createAcademicYear
- activateAcademicYear
- closeAcademicYear
- getAcademicYears

Features:
- Create new academic year
- Set start/end dates
- Activate year (only one active at a time)
- View historical years
```

#### Task 3.8: Class & Section Management
```
Server Actions:
- createClass
- updateClass
- createSection
- assignClassTeacher
- getClassesByYear

Database Updates:
- Add academic_year_id
- Add campus_id
- Add capacity
- Add status (active/archived)
```

#### Task 3.9: Subject Management
```
Server Actions:
- createSubject
- assignSubjectToClass
- getSubjectsByClass
- getTeacherSubjects

Database:
- Add subject_code
- Add subject_type (core/elective)
- Add class_subjects junction
```

### Week 10: Attendance Enhancement

#### Task 3.10: Attendance Features
```
Enhancements:
- Multiple attendance statuses (present, absent, late, leave, excused)
- Subject-wise attendance
- Attendance reports by date range
- Attendance percentage calculation
- Auto-absent for unmark students
- Attendance correction workflow

Server Actions:
- markAttendance (enhanced)
- getAttendanceReport
- requestAttendanceCorrection
- approveAttendanceCorrection

Pages:
- src/app/(dashboard)/admin/attendance/page.tsx
- src/app/(dashboard)/teacher/attendance/register/page.tsx
- src/app/(dashboard)/student/attendance/page.tsx
```

### Phase 3 Deliverables
- [ ] Enhanced student profiles
- [ ] Student CRUD with bulk import
- [ ] Teacher management
- [ ] Staff management
- [ ] Academic year management
- [ ] Class/section management
- [ ] Subject management
- [ ] Enhanced attendance system
- [ ] Attendance reports

---

## PHASE 4: FINANCE SYSTEM
**Duration:** 4-5 weeks
**Priority:** HIGH

### Objectives
1. Complete fee management
2. Invoice generation
3. Payment recording
4. Expense tracking
5. Financial reports

### Week 11: Fee Structure

#### Task 4.1: Fee Categories
```
Database:
- fee_categories table

Actions:
- createFeeCategory
- updateFeeCategory
- listFeeCategories
- toggleFeeCategory

Default Categories:
- Tuition Fee
- Admission Fee
- Transport Fee
- Examination Fee
- Library Fee
- Lab Fee
- Sports Fee
- Annual Charges
```

#### Task 4.2: Fee Structures
```
Database:
- fee_structures table
- fee_structure_items table

Features:
- Create fee structure for academic year
- Add multiple fee items
- Set due dates
- Calculate late fees
- Apply to specific classes/campuses
```

#### Task 4.3: Student Fee Assignment
```
Database:
- student_fee_assignments table

Features:
- Auto-assign fee structure to students
- Apply discounts (percentage/fixed)
- Waiver handling
- Transfer student fees
```

### Week 12: Invoicing

#### Task 4.4: Invoice Generation
```
Database:
- invoices table
- invoice_items table

Server Actions:
- generateInvoice
- generateBulkInvoices
- cancelInvoice
- voidInvoice

Features:
- Auto-generate from fee structure
- Manual invoice creation
- Invoice numbering (auto)
- Send invoice via email
```

#### Task 4.5: Invoice Management UI
```
Pages:
- src/app/(dashboard)/admin/fees/invoices/page.tsx
- src/app/(dashboard)/admin/fees/invoices/[id]/page.tsx

Features:
- List all invoices
- Filter by status, date, student
- View invoice details
- Download PDF invoice
- Send invoice email
- Cancel/void invoice
```

### Week 13: Payments

#### Task 4.6: Payment Recording
```
Database:
- payments table
- payment_allocations table

Server Actions:
- recordPayment
- verifyPayment
- rejectPayment
- allocatePayment

Features:
- Record cash payment
- Record bank transfer
- Record JazzCash/Easypaisa
- Partial payment handling
- Payment allocation to invoices
- Generate receipt
```

#### Task 4.7: Payment Management UI
```
Pages:
- src/app/(dashboard)/admin/fees/payments/page.tsx

Features:
- List all payments
- Filter by date, status, method
- Verify/reject payments
- Print receipts
- Export payment reports
```

#### Task 4.8: Refund Management
```
Database:
- refunds table

Server Actions:
- createRefund
- approveRefund
- processRefund

Features:
- Partial refunds
- Full refunds
- Refund approval workflow
- Refund receipt
```

### Week 14: Expenses & Reports

#### Task 4.9: Expense Management
```
Database:
- expense_categories table
- expenses table

Server Actions:
- createExpense
- approveExpense
- rejectExpense
- getExpenses

Features:
- Create expense with category
- Upload receipt
- Approval workflow
- Expense reports by category
```

#### Task 4.10: Financial Reports
```
Reports:
- Fee Collection Report
- Outstanding Fees Report
- Expense Report
- Income vs Expense Report
- Profit/Loss Report
- Student Fee Statement
- Payment Receipt

Export:
- PDF export
- Excel export
- Print
```

### Phase 4 Deliverables
- [ ] Fee categories management
- [ ] Fee structures
- [ ] Student fee assignments
- [ ] Invoice generation
- [ ] Invoice management
- [ ] Payment recording
- [ ] Payment verification
- [ ] Refund management
- [ ] Expense management
- [ ] Financial reports

---

## PHASE 5: LMS ENHANCEMENT
**Duration:** 4-6 weeks
**Priority:** MEDIUM

### Objectives
1. Course management
2. Lesson content
3. Assignments (existing - enhance)
4. Quizzes and assessments
5. Learning progress tracking

### Week 15-16: Course & Lessons

#### Task 5.1: Course Management
```
Database:
- courses table (enhanced)

Features:
- Create course (link to class/subject)
- Publish/unpublish course
- Set enrollment limit
- Course thumbnail
- Course description
```

#### Task 5.2: Lessons
```
Database:
- lessons table

Features:
- Create lesson with title, description
- Add video URL (YouTube, Vimeo, direct)
- Add document resources
- Reorder lessons
- Mark as draft/published
```

#### Task 5.3: Course Enrollment
```
Database:
- course_enrollments table

Features:
- Auto-enroll class students
- Manual enrollment
- View enrolled students
- Drop student
```

### Week 17-18: Assignments

#### Task 5.4: Assignment Enhancements
```
Existing: Basic assignment creation

Enhancements:
- Rich text description
- File attachments
- Late submission handling
- Submission status tracking
- Automatic grading (if applicable)
- Rubric-based grading
- Feedback with suggestions
```

#### Task 5.5: Submission Management
```
Database:
- assignment_submissions (existing)

Enhancements:
- File upload for submissions
- Text submission
- Plagiarism check (future)
- Grade submission
- Request re-grade
```

### Week 19-20: Quizzes

#### Task 5.6: Quiz System
```
Database:
- quizzes table
- quiz_questions table

Features:
- Create quiz
- Multiple question types:
  - Multiple choice
  - True/False
  - Short answer
- Time limit
- Attempt limits
- Randomize questions
- Show results setting
```

#### Task 5.7: Quiz Attempts
```
Database:
- quiz_attempts table

Features:
- Start quiz attempt
- Submit quiz
- Auto-grade (MCQ, T/F)
- Manual grading (short answer)
- View results
- Retry handling
```

#### Task 5.8: Learning Progress
```
Database:
- learning_progress table

Features:
- Track lesson completion
- Track video watch time
- Track quiz scores
- Course progress percentage
- Achievement badges (future)
```

### Phase 5 Deliverables
- [ ] Course management
- [ ] Lesson content
- [ ] Course enrollment
- [ ] Enhanced assignments
- [ ] Submission management
- [ ] Quiz system
- [ ] Quiz attempts
- [ ] Learning progress tracking

---

## PHASE 6: EXAMINATIONS
**Duration:** 3-4 weeks
**Priority:** MEDIUM

### Objectives
1. Exam scheduling
2. Marks entry
3. Grade calculation
4. Result publication
5. Report cards

### Week 21: Exam Management

#### Task 6.1: Exam Schedule
```
Existing: exam_timetable

Enhancements:
- Room assignment
- Invigilator assignment
- Seating plan
- Exam notes
- Reschedule handling
```

#### Task 6.2: Marks Entry
```
Server Actions:
- enterMarks
- bulkEnterMarks
- updateMarks
- submitMarksForApproval

Features:
- Per subject marks entry
- Bulk marks entry (Excel)
- Validation (total marks, passing marks)
- Draft vs submitted
- Teacher can edit own entries only
```

### Week 22: Results

#### Task 6.3: Grade Calculation
```
Features:
- Configure grading system:
  - Letter grades (A, B, C, D, F)
  - Grade points
  - Percentage ranges
- Auto-calculate grades
- Weighted average for subjects
- Calculate GPA
```

#### Task 6.4: Result Publication
```
Server Actions:
- submitResults
- publishResults
- unpublishResults

Features:
- Draft results
- Submit for approval
- Principal approval required
- Publish to students
- View-only after publication
```

#### Task 6.5: Report Cards
```
Features:
- Generate PDF report card
- Include:
  - Student info
  - Subject-wise marks
  - Total marks
  - Grade
  - Attendance percentage
  - Teacher comments
- Print individual
- Print class-wise
- Email to parents
```

### Phase 6 Deliverables
- [ ] Enhanced exam scheduling
- [ ] Marks entry system
- [ ] Bulk marks entry
- [ ] Grade configuration
- [ ] Result publication workflow
- [ ] Report card generation

---

## PHASE 7: REPORTS & NOTIFICATIONS
**Duration:** 2-3 weeks
**Priority:** MEDIUM

### Week 23: Reports

#### Task 7.1: Report Engine
```
Reports:
- Student List Report
- Teacher List Report
- Attendance Summary Report
- Fee Collection Report
- Exam Result Report
- Class-wise Performance Report
- Student Profile Report

Features:
- Filter by class, section, date range
- Export to PDF, Excel
- Print
- Schedule automated reports
```

#### Task 7.2: Dashboard Reports
```
Admin Dashboard:
- Today's attendance
- Fee collection summary
- Recent activities
- Upcoming events

Teacher Dashboard:
- My classes
- Pending assignments to grade
- Attendance to mark

Student Dashboard:
- My attendance
- My assignments
- My results
- Upcoming exams
```

### Week 24: Notifications

#### Task 7.3: Notification System Enhancement
```
Existing: Basic notifications

Enhancements:
- Notification preferences
- Email notifications (scheduled)
- SMS notifications (future)
- Push notifications (existing)
- Bulk notifications
- Scheduled notifications
- Read/unread tracking
```

#### Task 7.4: Announcement System
```
Features:
- Create announcement
- Target audience:
  - All users
  - By role
  - By class
  - By campus
- Schedule announcement
- Rich text content
- Attachments
```

### Phase 7 Deliverables
- [ ] Comprehensive reports
- [ ] Dashboard analytics
- [ ] Enhanced notifications
- [ ] Announcement system

---

## PHASE 8: PRODUCTION READINESS
**Duration:** 2-3 weeks
**Priority:** HIGH

### Week 25: Testing

#### Task 8.1: Security Testing
```
Tests:
- Cross-tenant access tests
- Permission escalation tests
- RLS policy tests
- SQL injection tests
- XSS tests
- CSRF tests

Tools:
- Manual penetration testing
- Automated security scans
```

#### Task 8.2: Functional Testing
```
Tests:
- User acceptance testing
- Integration tests
- API tests
- Database tests
- Performance tests

Coverage:
- All user roles
- All major features
- Edge cases
- Error handling
```

### Week 26: Deployment

#### Task 8.3: Environment Setup
```
Production:
- Vercel production deployment
- Supabase production project
- Custom domain (optional)
- SSL certificates

Staging:
- Vercel preview deployments
- Supabase staging project
```

#### Task 8.4: Monitoring Setup
```
Monitoring:
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring
- Log aggregation

Alerts:
- Error rate threshold
- Response time threshold
- Payment failures
- Subscription expirations
```

#### Task 8.5: Backup & Recovery
```
Backup:
- Supabase automatic backups (verify)
- Point-in-time recovery test

Recovery:
- Document recovery procedures
- Test restore from backup
- Document RTO/RPO
```

### Week 27: Documentation & Launch

#### Task 8.6: Documentation
```
Documentation:
- User manuals (admin, teacher, student)
- API documentation
- Deployment guide
- Troubleshooting guide
- Security policy
```

#### Task 8.7: Launch
```
Launch Steps:
- Final smoke tests
- Deploy to production
- Monitor for 24 hours
- Address issues
- Announce launch
- Gather feedback
```

### Phase 8 Deliverables
- [ ] Security testing complete
- [ ] Functional testing complete
- [ ] Production environment ready
- [ ] Monitoring active
- [ ] Backup tested
- [ ] Documentation complete
- [ ] Production launch

---

## IMPLEMENTATION PRIORITY MATRIX

| Priority | Phase | Key Deliverables | Business Impact |
|----------|-------|------------------|-----------------|
| P0 | 1 | Security fixes, Multi-tenancy | Critical |
| P1 | 2 | Super Admin, Subscriptions | Revenue |
| P2 | 3 | Students, Teachers, Attendance | Core ERP |
| P3 | 4 | Finance, Payments | Revenue |
| P4 | 5 | LMS Enhancement | Differentiation |
| P5 | 6 | Examinations | Core ERP |
| P6 | 7 | Reports, Notifications | User Experience |
| P7 | 8 | Production Ready | Launch |

---

## RESOURCE REQUIREMENTS

### Team Composition
| Role | Allocation | Phases |
|------|------------|--------|
| Principal Engineer | 100% | All |
| Frontend Developer | 100% | 2-7 |
| Backend Developer | 100% | 1-6 |
| QA Engineer | 50% | 5-8 |
| DevOps Engineer | 25% | 1, 8 |

### Budget Estimates
| Item | Estimate |
|------|----------|
| Supabase (Pro) | $599/month |
| Vercel (Pro) | $20/month |
| Domain & SSL | $50/year |
| Monitoring (Sentry) | $0-100/month |
| Development Tools | $50/month |

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database migration failures | High | High | Test on staging, have rollback plan |
| Feature scope creep | High | Medium | Strict change control |
| Performance issues | Medium | High | Plan for scale from day 1 |
| Security vulnerabilities | Medium | Critical | Regular security audits |
| Team availability | Medium | High | Prioritize core features |
| Integration failures | Low | High | Comprehensive testing |

---

## SUCCESS CRITERIA

### Phase 1 Success
- [ ] No exposed credentials
- [ ] Organization isolation working
- [ ] RLS policies verified

### Phase 2 Success
- [ ] Can create and manage organizations
- [ ] Subscription lifecycle working
- [ ] Payment recording functional

### Phase 3 Success
- [ ] Complete student management
- [ ] Complete teacher management
- [ ] Attendance working for all roles

### Phase 4 Success
- [ ] Invoices can be generated
- [ ] Payments can be recorded
- [ ] Financial reports accurate

### Phase 5 Success
- [ ] Courses can be created
- [ ] Quizzes work end-to-end
- [ ] Progress tracking functional

### Phase 8 Success
- [ ] All tests passing
- [ ] Production ready
- [ ] Documentation complete

---

**Document Status:** Implementation Roadmap Complete

**Next Steps:**
1. Review and approve roadmap
2. Begin Phase 1: Security Emergency Fixes
3. Rotate all exposed credentials immediately
4. Set up staging environment for testing

**Blocking Items Before Phase 1:**
- [ ] Approve ARCHITECTURE.md
- [ ] Approve DATABASE_PLAN.md
- [ ] Approve SECURITY_PLAN.md
- [ ] Rotate exposed credentials (CRITICAL)
- [ ] Set up development workflow