import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for attendance marking and history
 */
export function useAttendance(date = new Date().toISOString().split('T')[0]) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId, profile } = useAuth();

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('attendance')
        .select('*, students!inner(name, course)')
        .eq('date', date);

      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAttendance(data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date, isAdmin, getTeacherId]);

  useEffect(() => {
    fetchAttendance();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `date=eq.${date}`
        },
        () => {
          fetchAttendance();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAttendance, date]);

  // Mark attendance for a student
  const markAttendance = async (studentId, status, note = '') => {
    try {
      const existingRecord = attendance.find(a => a.student_id === studentId);

      const payload = {
        student_id: studentId,
        teacher_id: getTeacherId(),
        date,
        status,
        note
      };

      let result;
      if (existingRecord) {
        result = await db.update('attendance', existingRecord.id, payload);
      } else {
        result = await db.insert('attendance', payload);
      }

      if (!result.error) {
        await fetchAttendance();
      }

      return result;
    } catch (err) {
      console.error('Error marking attendance:', err);
      return { data: null, error: err };
    }
  };

  // Bulk mark attendance
  const bulkMarkAttendance = async (records) => {
    try {
      const payload = records.map(record => ({
        student_id: record.student_id,
        teacher_id: getTeacherId(),
        date,
        status: record.status,
        note: record.note || ''
      }));

      // Delete existing records for these students on this date
      const studentIds = records.map(r => r.student_id);
      await supabase
        .from('attendance')
        .delete()
        .eq('date', date)
        .in('student_id', studentIds);

      // Insert new records
      const { data, error } = await supabase
        .from('attendance')
        .insert(payload)
        .select();

      if (error) throw error;

      await fetchAttendance();
      return { data, error: null };
    } catch (err) {
      console.error('Error bulk marking attendance:', err);
      return { data: null, error: err };
    }
  };

  // Update attendance record
  const updateAttendance = async (recordId, updates) => {
    const { data, error } = await db.update('attendance', recordId, updates);
    if (!error) await fetchAttendance();
    return { data, error };
  };

  // Get attendance stats
  const getStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const total = attendance.length;

    return {
      present,
      absent,
      late,
      total,
      rate: total > 0 ? Math.round((present + late) / total * 100) : 0
    };
  };

  return {
    attendance,
    loading,
    error,
    refetch: fetchAttendance,
    markAttendance,
    bulkMarkAttendance,
    updateAttendance,
    getStats
  };
}

/**
 * Hook for fetching students eligible for attendance marking
 */
export function useStudentsForAttendance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select('id, name, course, level, photo_url')
        .eq('active', true)
        .order('name');

      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
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
 * Hook for attendance history and analytics
 */
export function useAttendanceHistory(studentId, dateRange = null) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('attendance')
        .select('*, students(name)')
        .order('date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to);
      } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, dateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Get consecutive absences
  const getConsecutiveAbsences = () => {
    const absences = [];
    let currentStreak = 0;
    let lastStudentId = null;

    history.forEach(record => {
      if (record.status === 'absent') {
        if (record.student_id === lastStudentId) {
          currentStreak++;
        } else {
          currentStreak = 1;
          lastStudentId = record.student_id;
        }

        if (currentStreak >= 3) {
          absences.push({
            student_id: record.student_id,
            student_name: record.students?.name,
            count: currentStreak,
            lastAbsent: record.date
          });
        }
      } else {
        currentStreak = 0;
        lastStudentId = null;
      }
    });

    return absences;
  };

  // Get monthly stats
  const getMonthlyStats = () => {
    const stats = {};

    history.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!stats[month]) {
        stats[month] = { present: 0, absent: 0, late: 0, total: 0 };
      }

      stats[month][record.status]++;
      stats[month].total++;
    });

    return Object.entries(stats).map(([month, data]) => ({
      month,
      ...data,
      rate: data.total > 0 ? Math.round((data.present + data.late) / data.total * 100) : 0
    }));
  };

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    getConsecutiveAbsences,
    getMonthlyStats
  };
}
