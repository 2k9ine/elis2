import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for fetching and managing students
 */
export function useStudents(options = {}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0
  });

  const { isAdmin, getTeacherId } = useAuth();
  const { search, filters, sort } = options;

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('students')
        .select('*, teachers(id, name)', { count: 'exact' })
        .eq('active', true);

      // Apply teacher filter
      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,parent_name.ilike.%${search}%`);
      }

      // Apply filters
      if (filters) {
        if (filters.course) query = query.eq('course', filters.course);
        if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
        if (filters.level) query = query.eq('level', filters.level);
        if (filters.trinity_grade) query = query.eq('trinity_grade_current', filters.trinity_grade);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.perPage;
      const to = from + pagination.perPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setStudents(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getTeacherId, search, filters, sort, pagination.page, pagination.perPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Create student
  const createStudent = async (studentData) => {
    const { data, error } = await db.insert('students', studentData);
    if (!error) await fetchStudents();
    return { data, error };
  };

  // Update student
  const updateStudent = async (id, updates) => {
    const { data, error } = await db.update('students', id, updates);
    if (!error) await fetchStudents();
    return { data, error };
  };

  // Delete (deactivate) student
  const deleteStudent = async (id) => {
    const { data, error } = await db.update('students', id, { active: false });
    if (!error) await fetchStudents();
    return { data, error };
  };

  // Set page
  const setPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return {
    students,
    loading,
    error,
    pagination: { ...pagination, setPage },
    refetch: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent
  };
}

/**
 * Hook for fetching a single student with all related data
 */
export function useStudent(studentId) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getTeacherId } = useAuth();

  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      setStudent(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('students')
        .select(`
          id, name, phone, parent_name, parent_phone, parent_email, dob, nationality, enrolled_date, course, level, teacher_id, trinity_grade_current, trinity_status, monthly_fee, discount_percent, notes, photo_url, active,
          teachers(id, name, phone, email),
          music_pieces(*),
          attendance(*),
          fees(*),
          internal_assessments(*),
          trinity_applications(*)
        `)
        .eq('id', studentId)
        .order('date', { foreignTable: 'attendance', ascending: false })
        .order('year', { foreignTable: 'fees', ascending: false })
        .order('month', { foreignTable: 'fees', ascending: false })
        .single();

      if (fetchError) throw fetchError;

      setStudent(data);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // Add music piece — must include created_by so the RLS policy
  // `created_by = get_teacher_id(auth.uid())` allows the insert
  const addMusicPiece = async (pieceData) => {
    const teacherId = getTeacherId();
    const { data, error } = await db.insert('music_pieces', {
      ...pieceData,
      student_id: studentId,
      created_by: teacherId   // required by RLS for teacher inserts
    });
    if (!error) await fetchStudent();
    return { data, error };
  };

  // Update music piece
  const updateMusicPiece = async (pieceId, updates) => {
    const { data, error } = await db.update('music_pieces', pieceId, updates);
    if (!error) await fetchStudent();
    return { data, error };
  };

  // Add assessment
  const addAssessment = async (assessmentData) => {
    const { data, error } = await db.insert('internal_assessments', {
      ...assessmentData,
      student_id: studentId
    });
    if (!error) await fetchStudent();
    return { data, error };
  };

  // Update assessment
  const updateAssessment = async (assessmentId, updates) => {
    const { data, error } = await db.update('internal_assessments', assessmentId, updates);
    if (!error) await fetchStudent();
    return { data, error };
  };

  return {
    student,
    loading,
    error,
    refetch: fetchStudent,
    addMusicPiece,
    updateMusicPiece,
    addAssessment,
    updateAssessment
  };
}

/**
 * Hook for fetching music pieces for a student
 */
export function useMusicPieces(studentId) {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPieces = useCallback(async () => {
    if (!studentId) {
      setPieces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('music_pieces')
        .select('*')
        .eq('student_id', studentId)
        .order('date_started', { ascending: false });

      if (fetchError) throw fetchError;

      setPieces(data || []);
    } catch (err) {
      console.error('Error fetching music pieces:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);

  const addPiece = async (pieceData) => {
    // created_by is required by the RLS policy for teacher inserts
    const { data: { user } } = await supabase.auth.getUser();
    const { data: roleRow } = await supabase
      .from('user_roles').select('teacher_id').eq('user_id', user?.id).single();
    const teacherId = roleRow?.teacher_id || null;

    const { data, error } = await db.insert('music_pieces', {
      ...pieceData,
      student_id: studentId,
      created_by: teacherId
    });
    if (!error) await fetchPieces();
    return { data, error };
  };

  const updatePiece = async (pieceId, updates) => {
    const { data, error } = await db.update('music_pieces', pieceId, updates);
    if (!error) await fetchPieces();
    return { data, error };
  };

  const deletePiece = async (pieceId) => {
    const { success, error } = await db.remove('music_pieces', pieceId);
    if (success) await fetchPieces();
    return { success, error };
  };

  return {
    pieces,
    loading,
    error,
    refetch: fetchPieces,
    addPiece,
    updatePiece,
    deletePiece
  };
}
