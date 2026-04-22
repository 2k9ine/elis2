import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TRINITY_STATUS } from '../lib/constants';

/**
 * Hook for Trinity exam applications
 */
export function useTrinityApplications(options = {}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();
  const { status, studentId } = options;

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('trinity_applications')
        .select(`
          *,
          students!inner(id, name, course, parent_name, parent_phone, teacher_id, teachers(name))
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      // Apply teacher filter
      if (!isAdmin()) {
        query = query.eq('students.teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching Trinity applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, studentId, isAdmin, getTeacherId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Create new application
  const createApplication = async (applicationData) => {
    const { data, error } = await db.insert('trinity_applications', {
      ...applicationData,
      status: TRINITY_STATUS.PREPARING
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Update application
  const updateApplication = async (id, updates) => {
    const { data, error } = await db.update('trinity_applications', id, updates);
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Teacher recommends student for Trinity
  const recommendForTrinity = async (studentId, grade) => {
    const { data, error } = await db.insert('trinity_applications', {
      student_id: studentId,
      grade,
      status: TRINITY_STATUS.TEACHER_RECOMMENDED,
      teacher_recommended_date: new Date().toISOString()
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Admin approves application
  const approveApplication = async (id) => {
    const { data, error } = await db.update('trinity_applications', id, {
      status: TRINITY_STATUS.ADMIN_APPROVED,
      admin_approved_date: new Date().toISOString()
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Mark as submitted
  const markSubmitted = async (id) => {
    const { data, error } = await db.update('trinity_applications', id, {
      status: TRINITY_STATUS.APPLICATION_SUBMITTED,
      submitted_date: new Date().toISOString()
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Record fee payment
  const recordFeePayment = async (id, parentFee, schoolFee) => {
    const updates = {
      parent_fee_paid: parentFee,
      school_fee_paid_to_trinity: schoolFee
    };

    if (parentFee && schoolFee) {
      updates.status = TRINITY_STATUS.FEE_PAID;
    }

    const { data, error } = await db.update('trinity_applications', id, updates);
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Mark exam as completed
  const markExamCompleted = async (id, examDate) => {
    const { data, error } = await db.update('trinity_applications', id, {
      status: TRINITY_STATUS.EXAM_COMPLETED,
      exam_date: examDate
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  // Record result
  const recordResult = async (id, result, certificateNumber) => {
    const { data, error } = await db.update('trinity_applications', id, {
      status: TRINITY_STATUS.RESULT_RECEIVED,
      result,
      certificate_number: certificateNumber
    });
    if (!error) await fetchApplications();
    return { data, error };
  };

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    createApplication,
    updateApplication,
    recommendForTrinity,
    approveApplication,
    markSubmitted,
    recordFeePayment,
    markExamCompleted,
    recordResult
  };
}

/**
 * Hook for Trinity application pipeline stats
 */
export function useTrinityStats() {
  const [stats, setStats] = useState({
    preparing: 0,
    teacherRecommended: 0,
    adminApproved: 0,
    applicationSubmitted: 0,
    feePaid: 0,
    examCompleted: 0,
    resultReceived: 0,
    byGrade: {},
    byResult: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('trinity_applications').select('*');

      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const apps = data || [];

      // Count by status
      const counts = {
        preparing: apps.filter(a => a.status === TRINITY_STATUS.PREPARING).length,
        teacherRecommended: apps.filter(a => a.status === TRINITY_STATUS.TEACHER_RECOMMENDED).length,
        adminApproved: apps.filter(a => a.status === TRINITY_STATUS.ADMIN_APPROVED).length,
        applicationSubmitted: apps.filter(a => a.status === TRINITY_STATUS.APPLICATION_SUBMITTED).length,
        feePaid: apps.filter(a => a.status === TRINITY_STATUS.FEE_PAID).length,
        examCompleted: apps.filter(a => a.status === TRINITY_STATUS.EXAM_COMPLETED).length,
        resultReceived: apps.filter(a => a.status === TRINITY_STATUS.RESULT_RECEIVED).length
      };

      // Count by grade
      const byGrade = {};
      apps.forEach(app => {
        byGrade[app.grade] = (byGrade[app.grade] || 0) + 1;
      });

      // Count by result
      const byResult = {};
      apps.filter(a => a.result).forEach(app => {
        byResult[app.result] = (byResult[app.result] || 0) + 1;
      });

      setStats({
        ...counts,
        byGrade,
        byResult
      });
    } catch (err) {
      console.error('Error fetching Trinity stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getTeacherId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, loading, error, refetch: fetchStats };
}

/**
 * Hook for student's Trinity history
 */
export function useStudentTrinityHistory(studentId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!studentId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trinity_applications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching Trinity history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
