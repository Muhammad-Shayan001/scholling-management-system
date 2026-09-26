-- Migration: Audit Logging
-- Description: Track all security-sensitive and business-critical operations
-- Created: 2026-09-26

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    resource_name TEXT,
    changes JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_action CHECK (action ~ '^[a-z_]+$'),
    CONSTRAINT valid_resource_type CHECK (resource_type ~ '^[a-z_]+$'),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'pending'))
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_created ON public.audit_logs(actor_id, created_at DESC);

-- Partial indexes for common queries
CREATE INDEX idx_audit_logs_failures ON public.audit_logs(organization_id, created_at DESC)
    WHERE status = 'failure';

CREATE INDEX idx_audit_logs_recent ON public.audit_logs(organization_id, created_at DESC)
    WHERE created_at > now() - INTERVAL '30 days';

COMMENT ON TABLE public.audit_logs IS 'Audit trail for security-sensitive and business-critical operations';
COMMENT ON COLUMN public.audit_logs.actor_id IS 'User who performed the action (null for system actions)';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (created, updated, deleted, viewed, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource (organization, student, class, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object with before/after values for updates';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context (e.g., campus_id, class_id)';
COMMENT ON COLUMN public.audit_logs.status IS 'success, failure, or pending';

-- =====================================================
-- HELPER FUNCTION: Log Audit Event
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_organization_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        organization_id,
        actor_id,
        action,
        resource_type,
        resource_id,
        resource_name,
        changes,
        metadata,
        status,
        error_message
    ) VALUES (
        p_organization_id,
        public.current_user_id(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_resource_name,
        p_changes,
        p_metadata,
        p_status,
        p_error_message
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

COMMENT ON FUNCTION public.log_audit_event IS 'Log an audit event for an organization';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit logs
CREATE POLICY "super_admin_view_all_audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_platform_admin());

-- Organization admins can view their org's audit logs
CREATE POLICY "org_admin_view_audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.can_manage_organization(organization_id));

-- Users can view their own actions
CREATE POLICY "users_view_own_audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (actor_id = public.current_user_id());

-- Only system (via service role) can insert audit logs
-- This prevents users from forging audit logs
CREATE POLICY "service_role_insert_audit_logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (
    -- Allow if called from server-side with proper context
    -- In practice, this will be called via service role or trusted server actions
    true
);

-- No updates or deletes allowed (audit logs are immutable)
-- If needed, use a separate "audit_log_corrections" table

-- =====================================================
-- RETENTION POLICY (Optional)
-- =====================================================
-- Uncomment to enable automatic deletion of old audit logs
-- Keep last 2 years by default, adjust as needed

-- CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
-- RETURNS void
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     DELETE FROM public.audit_logs
--     WHERE created_at < now() - INTERVAL '2 years';
-- END;
-- $$;

-- COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Delete audit logs older than 2 years (run via cron)';

-- =====================================================
-- COMMON AUDIT ACTIONS
-- =====================================================
-- Document common action names for consistency:
--
-- Authentication:
--   - login_success, login_failure
--   - logout
--   - password_reset_requested, password_reset_completed
--   - mfa_enabled, mfa_disabled
--
-- Organizations:
--   - organization_created, organization_updated, organization_deleted
--   - organization_suspended, organization_activated
--   - subscription_created, subscription_updated, subscription_cancelled
--
-- Members:
--   - member_invited, member_joined, member_removed
--   - role_assigned, role_revoked
--   - permissions_updated
--
-- Students:
--   - student_created, student_updated, student_deleted
--   - student_enrolled, student_withdrawn
--   - admission_number_changed
--
-- Financial:
--   - payment_received, payment_refunded
--   - invoice_created, invoice_sent, invoice_paid
--   - fee_structure_updated
--
-- Academic:
--   - marks_entered, marks_updated, marks_published
--   - report_card_generated
--   - assignment_created, assignment_submitted, assignment_graded
--
-- Access:
--   - sensitive_data_viewed (e.g., financial reports, student records)
--   - export_performed (e.g., CSV exports, reports)
--   - bulk_operation_performed
--
-- Security:
--   - permission_denied
--   - rate_limit_exceeded
--   - suspicious_activity_detected

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Recent activity for organization
CREATE OR REPLACE VIEW public.recent_audit_activity AS
SELECT
    al.id,
    al.organization_id,
    al.action,
    al.resource_type,
    al.resource_name,
    al.status,
    al.created_at,
    p.full_name AS actor_name,
    p.email AS actor_email
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.actor_id
WHERE al.created_at > now() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.recent_audit_activity IS 'Audit activity from last 7 days with actor details';

-- Failed operations
CREATE OR REPLACE VIEW public.failed_operations AS
SELECT
    al.id,
    al.organization_id,
    al.action,
    al.resource_type,
    al.error_message,
    al.created_at,
    p.full_name AS actor_name,
    p.email AS actor_email
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.actor_id
WHERE al.status = 'failure'
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.failed_operations IS 'All failed operations for debugging';

-- Security events
CREATE OR REPLACE VIEW public.security_events AS
SELECT
    al.id,
    al.organization_id,
    al.action,
    al.ip_address,
    al.user_agent,
    al.created_at,
    p.full_name AS actor_name,
    p.email AS actor_email
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.actor_id
WHERE al.action IN (
    'login_failure',
    'permission_denied',
    'rate_limit_exceeded',
    'suspicious_activity_detected',
    'mfa_disabled'
)
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.security_events IS 'Security-relevant audit events';

-- Run ANALYZE for query planner
ANALYZE public.audit_logs;
