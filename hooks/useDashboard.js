import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentMonthYear, isFeeOverdue, getRelativeTime, getMonthName } from '../lib/utils';

/**
 * Hook for fetching dashboard statistics
 */
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: { present: 0, absent: 0, late: 0, rate: 0 },
    overdueFees: 0,
    pendingTrinity: 0,
    loading: true,
    error: null
  });

  const { isAdmin, getTeacherId } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      const today = new Date().toISOString().split('T')[0];
      const { month, year } = getCurrentMonthYear();

      // Build base queries
      let studentsQuery = supabase.from('students').select('id', { count: 'exact', head: true }).eq('active', true);
      let attendanceQuery = supabase.from('attendance').select('status').eq('date', today);
      let feesQuery = supabase.from('fees').select('year, month, students!inner(active)').eq('status', 'unpaid');
      let trinityQuery = supabase.from('trinity_applications').select('id').in('status', ['teacher-recommended', 'admin-approved']);

      // Apply teacher filter if not admin
      if (!isAdmin()) {
        const teacherId = getTeacherId();
        studentsQuery = studentsQuery.eq('teacher_id', teacherId);
        attendanceQuery = attendanceQuery.eq('teacher_id', teacherId);
        feesQuery = feesQuery.eq('students.teacher_id', teacherId);
        trinityQuery = trinityQuery.eq('teacher_id', teacherId);
      }

      // Execute queries
      const [
        { count: studentCount },
        { data: attendanceData },
        { data: feesData },
        { data: trinityData }
      ] = await Promise.all([
        studentsQuery,
        attendanceQuery,
        feesQuery,
        trinityQuery
      ]);

      // Calculate attendance rate
      const present = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absent = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const late = attendanceData?.filter(a => a.status === 'late').length || 0;
      const total = present + absent + late;
      const rate = total > 0 ? Math.round((present + late) / total * 100) : 0;

      // Calculate overdue fees (past 5th of month)
      const overdue = feesData?.filter(fee => {
        const feeMonth = new Date(fee.year, fee.month - 1, 5);
        return new Date() > feeMonth;
      }).length || 0;

      setStats({
        totalStudents: studentCount || 0,
        todayAttendance: { present, absent, late, rate },
        overdueFees: overdue,
        pendingTrinity: trinityData?.length || 0,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  }, [isAdmin, getTeacherId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
}

/**
 * Hook for recent activity feed.
 * Pulls from attendance + fees tables since activity_log has no auto-writers.
 * Combines the two streams and sorts by date descending.
 */
export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin, getTeacherId } = useAuth();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Recent attendance records
      let attQuery = supabase
        .from('attendance')
        .select('id, date, status, created_at, students(name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!isAdmin()) attQuery = attQuery.eq('teacher_id', getTeacherId());

      // Parallelize fetching attendance and fees
      const [attRes, feeRes] = await Promise.all([
        attQuery,
        isAdmin() ? supabase
          .from('fees')
          .select('id, month, year, amount_paid, status, payment_date, created_at, students(name)')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(limit) : Promise.resolve({ data: [] })
      ]);

      const attData = attRes.data || [];
      const feeData = feeRes.data || [];

      // Shape into a unified activity list
      const attActivities = (attData || []).map(a => ({
        id: `att-${a.id}`,
        type: 'attendance_marked',
        description: `${a.students?.name} marked ${a.status} on ${
          new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        }`,
        time: getRelativeTime(a.created_at),
        created_at: a.created_at
      }));

      const feeActivities = feeData.map(f => ({
        id: `fee-${f.id}`,
        type: 'fee_paid',
        description: `Fee payment received — ${f.students?.name} (${getMonthName(f.month - 1)} ${f.year})`,
        time: getRelativeTime(f.created_at),
        created_at: f.created_at
      }));

      // Merge, sort newest first, cap at limit
      const merged = [...attActivities, ...feeActivities]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      setActivities(merged);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit, isAdmin, getTeacherId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  return { activities, loading, error, refetch: fetchActivities };
}

/**
 * Hook for fetching students with no attendance this week
 */
export function useStudentsWithoutAttendance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get start of week (Sunday)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weekStart = startOfWeek.toISOString().split('T')[0];

      // Get all active students
      let studentsQuery = supabase
        .from('students')
        .select('id, name, course, teacher_id, teachers(name)')
        .eq('active', true);

      if (!isAdmin()) {
        studentsQuery = studentsQuery.eq('teacher_id', getTeacherId());
      }

      const [studentsRes, attendanceRes] = await Promise.all([
        studentsQuery,
        supabase
          .from('attendance')
          .select('student_id')
          .gte('date', weekStart)
      ]);

      const { data: allStudents, error: studentsError } = studentsRes;
      const { data: attendedStudents, error: attendanceError } = attendanceRes;

      if (attendanceError) throw attendanceError;

      const attendedIds = new Set(attendedStudents?.map(a => a.student_id) || []);

      // Filter students without attendance
      const noAttendance = allStudents?.filter(s => !attendedIds.has(s.id)) || [];

      setStudents(noAttendance);
    } catch (err) {
      console.error('Error fetching students without attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getTeacherId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}

/**
 * Hook for fetching upcoming Trinity candidates
 */
export function useTrinityCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get students with music pieces in progress who don't have a pending Trinity application
      let query = supabase
        .from('students')
        .select(`
          id,
          name,
          course,
          trinity_grade_current,
          teachers(name),
          music_pieces!inner(status)
        `)
        .eq('active', true)
        .eq('music_pieces.status', 'completed');

      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Filter out students who already have a Trinity application
      const studentIds = data?.map(s => s.id) || [];

      const { data: existingApps } = await supabase
        .from('trinity_applications')
        .select('student_id')
        .in('student_id', studentIds)
        .not('status', 'eq', 'result-received');

      const existingIds = new Set(existingApps?.map(a => a.student_id) || []);

      const candidates = data?.filter(s => !existingIds.has(s.id)) || [];

      setCandidates(candidates);
    } catch (err) {
      console.error('Error fetching Trinity candidates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getTeacherId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { candidates, loading, error, refetch: fetchCandidates };
}
