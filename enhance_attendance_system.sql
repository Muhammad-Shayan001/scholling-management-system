-- Add status to attendance table
ALTER TABLE attendance
ADD COLUMN status TEXT NOT NULL DEFAULT 'absent';

-- Create attendance_approval_requests table
CREATE TABLE attendance_approval_requests (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_id BIGINT REFERENCES attendance(id) ON DELETE CASCADE,
    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
    campus_id BIGINT REFERENCES campuses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    notes TEXT
);

-- Add indexes for faster queries
CREATE INDEX idx_attendance_approval_requests_student_id ON attendance_approval_requests(student_id);
CREATE INDEX idx_attendance_approval_requests_school_id ON attendance_approval_requests(school_id);
CREATE INDEX idx_attendance_approval_requests_campus_id ON attendance_approval_requests(campus_id);
CREATE INDEX idx_attendance_approval_requests_status ON attendance_approval_requests(status);

-- RLS for attendance_approval_requests
ALTER TABLE attendance_approval_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage requests for their schools
CREATE POLICY "Admins can manage attendance approval requests for their schools"
ON attendance_approval_requests
FOR ALL
USING (
  (get_my_claim('role'::text)) = '"admin"'::jsonb AND
  EXISTS (
    SELECT 1
    FROM school_permissions
    WHERE school_permissions.school_id = attendance_approval_requests.school_id
      AND school_permissions.user_id = auth.uid()
  )
);

-- Super Admins can manage all requests
CREATE POLICY "Super Admins can manage all attendance approval requests"
ON attendance_approval_requests
FOR ALL
USING (
  (get_my_claim('role'::text)) = '"super_admin"'::jsonb
);
