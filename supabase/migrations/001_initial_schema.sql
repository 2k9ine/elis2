-- Eli's Learning School Management System - Database Schema
-- Created for Supabase PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    specialization TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    photo_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    dob DATE,
    nationality TEXT,
    enrolled_date DATE DEFAULT CURRENT_DATE,
    course TEXT NOT NULL,
    level TEXT DEFAULT 'beginner',
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    trinity_grade_current TEXT,
    trinity_status TEXT DEFAULT 'preparing',
    monthly_fee DECIMAL(10, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    photo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Music pieces table
CREATE TABLE IF NOT EXISTS music_pieces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    piece_name TEXT NOT NULL,
    date_started DATE DEFAULT CURRENT_DATE,
    date_completed DATE,
    status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'needs-review')),
    teacher_notes TEXT,
    created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
    payment_method TEXT CHECK (payment_method IN ('bank-transfer', 'card', 'cash')),
    payment_date DATE,
    reference_number TEXT,
    receipt_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, year, month)
);

-- Trinity applications table
CREATE TABLE IF NOT EXISTS trinity_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,
    status TEXT DEFAULT 'preparing' CHECK (status IN ('preparing', 'teacher-recommended', 'admin-approved', 'application-submitted', 'fee-paid', 'exam-completed', 'result-received')),
    teacher_recommended_date DATE,
    teacher_recommended_by UUID REFERENCES teachers(id),
    admin_approved_date DATE,
    admin_approved_by UUID REFERENCES teachers(id),
    submitted_date DATE,
    parent_fee_paid DECIMAL(10, 2),
    parent_fee_paid_date DATE,
    school_fee_paid_to_trinity DECIMAL(10, 2),
    school_fee_paid_date DATE,
    exam_date DATE,
    result TEXT CHECK (result IN ('pass', 'merit', 'distinction', 'fail')),
    certificate_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internal assessments table
CREATE TABLE IF NOT EXISTS internal_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    piece_assessed TEXT,
    score INTEGER,
    max_score INTEGER DEFAULT 100,
    grade TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recital', 'concert', 'trinity-exam', 'workshop', 'other')),
    date DATE NOT NULL,
    time TIME,
    description TEXT,
    location TEXT,
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event students table (participation)
CREATE TABLE IF NOT EXISTS event_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    repertoire TEXT,
    confirmed BOOLEAN DEFAULT false,
    attended BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users metadata table for roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_music_pieces_student ON music_pieces(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_year_month ON fees(year, month);
CREATE INDEX IF NOT EXISTS idx_trinity_student ON trinity_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_trinity_status ON trinity_applications(status);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON internal_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_event_students_event ON event_students(event_id);
CREATE INDEX IF NOT EXISTS idx_event_students_student ON event_students(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE trinity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher_id from user_id
CREATE OR REPLACE FUNCTION get_teacher_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    t_id UUID;
BEGIN
    SELECT teacher_id INTO t_id FROM user_roles WHERE user_id = user_uuid;
    RETURN t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Teachers table policies
DROP POLICY IF EXISTS teachers_select ON teachers;
CREATE POLICY teachers_select ON teachers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS teachers_insert ON teachers;
CREATE POLICY teachers_insert ON teachers
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS teachers_update ON teachers;
CREATE POLICY teachers_update ON teachers
    FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS teachers_delete ON teachers;
CREATE POLICY teachers_delete ON teachers
    FOR DELETE USING (is_admin(auth.uid()));

-- Students table policies
DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students
    FOR SELECT USING (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS students_insert ON students;
CREATE POLICY students_insert ON students
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS students_update ON students;
CREATE POLICY students_update ON students
    FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS students_delete ON students;
CREATE POLICY students_delete ON students
    FOR DELETE USING (is_admin(auth.uid()));

-- Attendance table policies
DROP POLICY IF EXISTS attendance_select ON attendance;
CREATE POLICY attendance_select ON attendance
    FOR SELECT USING (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.teacher_id = get_teacher_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS attendance_insert ON attendance;
CREATE POLICY attendance_insert ON attendance
    FOR INSERT WITH CHECK (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS attendance_update ON attendance;
CREATE POLICY attendance_update ON attendance
    FOR UPDATE USING (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS attendance_delete ON attendance;
CREATE POLICY attendance_delete ON attendance
    FOR DELETE USING (is_admin(auth.uid()));

-- Music pieces table policies
DROP POLICY IF EXISTS music_pieces_select ON music_pieces;
CREATE POLICY music_pieces_select ON music_pieces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND (s.teacher_id = get_teacher_id(auth.uid()) OR is_admin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS music_pieces_insert ON music_pieces;
CREATE POLICY music_pieces_insert ON music_pieces
    FOR INSERT WITH CHECK (
        is_admin(auth.uid()) OR
        created_by = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS music_pieces_update ON music_pieces;
CREATE POLICY music_pieces_update ON music_pieces
    FOR UPDATE USING (
        is_admin(auth.uid()) OR
        created_by = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS music_pieces_delete ON music_pieces;
CREATE POLICY music_pieces_delete ON music_pieces
    FOR DELETE USING (is_admin(auth.uid()));

-- Fees table policies (admin only)
DROP POLICY IF EXISTS fees_select ON fees;
CREATE POLICY fees_select ON fees
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS fees_insert ON fees;
CREATE POLICY fees_insert ON fees
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS fees_update ON fees;
CREATE POLICY fees_update ON fees
    FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS fees_delete ON fees;
CREATE POLICY fees_delete ON fees
    FOR DELETE USING (is_admin(auth.uid()));

-- Trinity applications table policies
DROP POLICY IF EXISTS trinity_select ON trinity_applications;
CREATE POLICY trinity_select ON trinity_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND (s.teacher_id = get_teacher_id(auth.uid()) OR is_admin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS trinity_insert ON trinity_applications;
CREATE POLICY trinity_insert ON trinity_applications
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS trinity_update ON trinity_applications;
CREATE POLICY trinity_update ON trinity_applications
    FOR UPDATE USING (
        is_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.teacher_id = get_teacher_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS trinity_delete ON trinity_applications;
CREATE POLICY trinity_delete ON trinity_applications
    FOR DELETE USING (is_admin(auth.uid()));

-- Internal assessments table policies
DROP POLICY IF EXISTS assessments_select ON internal_assessments;
CREATE POLICY assessments_select ON internal_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND (s.teacher_id = get_teacher_id(auth.uid()) OR is_admin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS assessments_insert ON internal_assessments;
CREATE POLICY assessments_insert ON internal_assessments
    FOR INSERT WITH CHECK (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS assessments_update ON internal_assessments;
CREATE POLICY assessments_update ON internal_assessments
    FOR UPDATE USING (
        is_admin(auth.uid()) OR
        teacher_id = get_teacher_id(auth.uid())
    );

DROP POLICY IF EXISTS assessments_delete ON internal_assessments;
CREATE POLICY assessments_delete ON internal_assessments
    FOR DELETE USING (is_admin(auth.uid()));

-- Events table policies
DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS events_insert ON events;
CREATE POLICY events_insert ON events
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS events_update ON events;
CREATE POLICY events_update ON events
    FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS events_delete ON events;
CREATE POLICY events_delete ON events
    FOR DELETE USING (is_admin(auth.uid()));

-- Event students table policies
DROP POLICY IF EXISTS event_students_select ON event_students;
CREATE POLICY event_students_select ON event_students
    FOR SELECT USING (
        is_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.teacher_id = get_teacher_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS event_students_insert ON event_students;
CREATE POLICY event_students_insert ON event_students
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS event_students_update ON event_students;
CREATE POLICY event_students_update ON event_students
    FOR UPDATE USING (
        is_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.teacher_id = get_teacher_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS event_students_delete ON event_students;
CREATE POLICY event_students_delete ON event_students
    FOR DELETE USING (is_admin(auth.uid()));

-- User roles table policies
DROP POLICY IF EXISTS user_roles_select ON user_roles;
CREATE POLICY user_roles_select ON user_roles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS user_roles_insert ON user_roles;
CREATE POLICY user_roles_insert ON user_roles
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS user_roles_update ON user_roles;
CREATE POLICY user_roles_update ON user_roles
    FOR UPDATE USING (is_admin(auth.uid()));

-- Activity log table policies
DROP POLICY IF EXISTS activity_select ON activity_log;
CREATE POLICY activity_select ON activity_log
    FOR SELECT USING (is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS activity_insert ON activity_log;
CREATE POLICY activity_insert ON activity_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at ON students;
CREATE TRIGGER students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS teachers_updated_at ON teachers;
CREATE TRIGGER teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS attendance_updated_at ON attendance;
CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS music_pieces_updated_at ON music_pieces;
CREATE TRIGGER music_pieces_updated_at BEFORE UPDATE ON music_pieces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS fees_updated_at ON fees;
CREATE TRIGGER fees_updated_at BEFORE UPDATE ON fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trinity_applications_updated_at ON trinity_applications;
CREATE TRIGGER trinity_applications_updated_at BEFORE UPDATE ON trinity_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS internal_assessments_updated_at ON internal_assessments;
CREATE TRIGGER internal_assessments_updated_at BEFORE UPDATE ON internal_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default admin (you'll need to update this with the actual user ID after signup)
-- INSERT INTO user_roles (user_id, role) VALUES ('your-auth-user-id', 'admin');

-- ============================================
-- STORAGE BUCKET SETUP (run in Supabase dashboard or via API)
-- ============================================
-- Create buckets: student-photos, teacher-photos
-- Enable public read access, restrict write to authenticated users
