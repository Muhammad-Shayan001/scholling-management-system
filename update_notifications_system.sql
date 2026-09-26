-- ═══════════════════════════════════════════════════════════════════════════════
-- Update Notifications System Schema (Phase 10 & 11)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Alter notifications table to include new fields ───────────────────────
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS created_time TIME DEFAULT CURRENT_TIME,
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS device TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 2. Create trigger to sync is_read and read_status ────────────────────────
CREATE OR REPLACE FUNCTION sync_notification_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.read_status IS NULL AND NEW.is_read IS NOT NULL THEN
      NEW.read_status := NEW.is_read;
    ELSIF NEW.is_read IS NULL AND NEW.read_status IS NOT NULL THEN
      NEW.is_read := NEW.read_status;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent infinite recursion by only updating if there's a difference
    IF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
      NEW.read_status := NEW.is_read;
    ELSIF NEW.read_status IS DISTINCT FROM OLD.read_status THEN
      NEW.is_read := NEW.read_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_notification_read_status ON public.notifications;
CREATE TRIGGER trigger_sync_notification_read_status
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION sync_notification_read_status();

-- ─── 3. Create fcm_tokens table for device token management ──────────────────
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('web', 'android', 'ios')),
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. Configure Row-Level Security (RLS) ───────────────────────────────────
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own FCM tokens" ON public.fcm_tokens;
CREATE POLICY "Users can manage their own FCM tokens"
ON public.fcm_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS on notifications table has robust policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Admins and Teachers can insert notifications
DROP POLICY IF EXISTS "Authorized roles can insert notifications" ON public.notifications;
CREATE POLICY "Authorized roles can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin' OR role = 'super_admin')
  )
);

-- ─── 5. Enable Realtime Replication ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─── 6. Performance Optimization Indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_date ON public.notifications(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_platform ON public.notifications(platform);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_status ON public.notifications(user_id, read_status);
