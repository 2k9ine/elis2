import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';

/**
 * Hook for fetching and managing teachers
 */
export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('teachers')
        .select(`
          *,
          students(count)
        `)
        .order('name');

      if (fetchError) throw fetchError;

      // Process data to include student count
      const processed = data?.map(teacher => ({
        ...teacher,
        student_count: teacher.students?.[0]?.count || 0
      })) || [];

      setTeachers(processed);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Create teacher
  const createTeacher = async (teacherData) => {
    const { data, error } = await db.insert('teachers', teacherData);
    if (!error) await fetchTeachers();
    return { data, error };
  };

  // Update teacher
  const updateTeacher = async (id, updates) => {
    const { data, error } = await db.update('teachers', id, updates);
    if (!error) await fetchTeachers();
    return { data, error };
  };

  // Delete teacher
  const deleteTeacher = async (id) => {
    const { success, error } = await db.remove('teachers', id);
    if (success) await fetchTeachers();
    return { success, error };
  };

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher
  };
}

/**
 * Hook for fetching a single teacher with their students
 */
export function useTeacher(teacherId) {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeacher = useCallback(async () => {
    if (!teacherId) {
      setTeacher(null);
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, course, level, active, photo_url')
        .eq('teacher_id', teacherId)
        .order('name');

      if (studentsError) throw studentsError;

      setTeacher(teacherData);
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error fetching teacher:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  return { teacher, students, loading, error, refetch: fetchTeacher };
}

/**
 * Hook for teacher analytics
 */
export function useTeacherAnalytics(teacherId) {
  const [analytics, setAnalytics] = useState({
    attendanceRate: 0,
    totalStudents: 0,
    averageProgress: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get student count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('teacher_id', teacherId)
        .eq('active', true);

      // Get attendance rate for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('teacher_id', teacherId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      const total = attendanceData?.length || 0;
      const present = attendanceData?.filter(a => a.status === 'present').length || 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      // Get recent activity
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalytics({
        attendanceRate: rate,
        totalStudents: studentCount || 0,
        averageProgress: 0, // Would require calculating from music_pieces
        recentActivity: activityData || []
      });
    } catch (err) {
      console.error('Error fetching teacher analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { ...analytics, loading, error, refetch: fetchAnalytics };
}
