-- ==========================================
-- ADD SCHOOL ENHANCED SCHEMA
-- ==========================================

-- 1. Add new columns to the existing 'schools' table
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS school_type TEXT DEFAULT 'Secondary School',
ADD COLUMN IF NOT EXISTS education_board TEXT DEFAULT 'Federal Board',
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS ntn_number TEXT,
ADD COLUMN IF NOT EXISTS school_motto TEXT,

ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#4f46e5',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#818cf8',

ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS map_url TEXT,

ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,

ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "academic_year": "2026-2027",
  "session_start_date": null,
  "session_end_date": null,
  "result_system_type": "GPA",
  "passing_percentage": 40,
  "qr_attendance_enabled": true,
  "manual_attendance_enabled": true,
  "late_time_limit": "08:15",
  "auto_absent_time": "09:00",
  "currency": "PKR",
  "monthly_fee": 0,
  "fine_rules": "None",
  "discount_settings": "None",
  "period_duration": 45,
  "total_periods": 8,
  "break_timing": "11:00"
}'::jsonb;

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
