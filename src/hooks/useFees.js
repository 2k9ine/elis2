import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentMonthYear, isFeeOverdue, generateReceiptNumber } from '../lib/utils';

/**
 * Hook for fee management
 */
export function useFees(options = {}) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueCount: 0
  });

  const { isAdmin, getTeacherId } = useAuth();
  const { studentId, status, month, year } = options;

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('fees')
        .select(`
          *,
          students!inner(id, name, course, teacher_id, monthly_fee, discount_percent, teachers(name))
        `);

      // Apply filters
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (month !== undefined) {
        query = query.eq('month', month);
      }

      if (year) {
        query = query.eq('year', year);
      }

      // Apply teacher filter
      if (!isAdmin() && !studentId) {
        query = query.eq('students.teacher_id', getTeacherId());
      }

      query = query.order('year', { ascending: false }).order('month', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFees(data || []);

      // Calculate summary
      const totalDue = data?.reduce((sum, fee) => sum + (fee.amount_due || 0), 0) || 0;
      const totalPaid = data?.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0) || 0;
      const overdue = data?.filter(fee =>
        fee.status === 'unpaid' && isFeeOverdue(fee.month, fee.year)
      ).length || 0;

      setSummary({
        totalDue,
        totalPaid,
        totalOutstanding: totalDue - totalPaid,
        overdueCount: overdue
      });
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, status, month, year, isAdmin, getTeacherId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // Record payment
  const recordPayment = async (feeId, paymentData) => {
    const updates = {
      amount_paid: paymentData.amount,
      status: paymentData.amount >= paymentData.totalDue ? 'paid' : 'partial',
      payment_method: paymentData.method,
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: paymentData.reference || null,
      receipt_number: generateReceiptNumber()
    };

    const { data, error } = await db.update('fees', feeId, updates);
    if (!error) await fetchFees();
    return { data, error };
  };

  // Create new fee record
  const createFee = async (feeData) => {
    const { data, error } = await db.insert('fees', feeData);
    if (!error) await fetchFees();
    return { data, error };
  };

  // Generate monthly fees for all active students
  const generateMonthlyFees = async (targetMonth, targetYear) => {
    try {
      // Get all active students
      let studentsQuery = supabase
        .from('students')
        .select('id, monthly_fee, discount_percent')
        .eq('active', true);

      if (!isAdmin()) {
        studentsQuery = studentsQuery.eq('teacher_id', getTeacherId());
      }

      const { data: students, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;

      // Check existing fees for this month
      const { data: existingFees } = await supabase
        .from('fees')
        .select('student_id')
        .eq('month', targetMonth)
        .eq('year', targetYear);

      const existingStudentIds = new Set(existingFees?.map(f => f.student_id) || []);

      // Create fees for students who don't have one
      const newFees = students
        ?.filter(s => !existingStudentIds.has(s.id))
        .map(student => {
          const discount = (student.monthly_fee * (student.discount_percent || 0)) / 100;
          return {
            student_id: student.id,
            month: targetMonth,
            year: targetYear,
            amount_due: student.monthly_fee - discount,
            amount_paid: 0,
            status: 'unpaid'
          };
        }) || [];

      if (newFees.length > 0) {
        const { error } = await supabase.from('fees').insert(newFees);
        if (error) throw error;
      }

      await fetchFees();
      return { count: newFees.length, error: null };
    } catch (err) {
      console.error('Error generating monthly fees:', err);
      return { count: 0, error: err };
    }
  };

  // Update fee
  const updateFee = async (feeId, updates) => {
    const { data, error } = await db.update('fees', feeId, updates);
    if (!error) await fetchFees();
    return { data, error };
  };

  return {
    fees,
    loading,
    error,
    summary,
    refetch: fetchFees,
    recordPayment,
    createFee,
    generateMonthlyFees,
    updateFee
  };
}

/**
 * Hook for a single fee record with receipt generation
 */
export function useFeeReceipt(feeId) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReceipt = useCallback(async () => {
    if (!feeId) {
      setReceipt(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fees')
        .select(`
          *,
          students(name, course, parent_name, parent_phone)
        `)
        .eq('id', feeId)
        .single();

      if (fetchError) throw fetchError;

      setReceipt(data);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [feeId]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  return { receipt, loading, error, refetch: fetchReceipt };
}

/**
 * Hook for fee reports and analytics
 */
export function useFeeReports(year = new Date().getFullYear()) {
  const [reports, setReports] = useState({
    byMonth: [],
    byCourse: [],
    byTeacher: [],
    yearly: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin } = useAuth();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fees')
        .select(`
          *,
          students(course, teacher_id, teachers(name))
        `)
        .eq('year', year);

      if (fetchError) throw fetchError;

      const fees = data || [];

      // byMonth: iterate months 1–12 to match DB's 1-indexed month column
      const byMonth = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1; // 1=January … 12=December
        const monthFees = fees.filter(f => f.month === monthNum);
        return {
          month: monthNum,
          totalDue: monthFees.reduce((s, f) => s + f.amount_due, 0),
          totalPaid: monthFees.reduce((s, f) => s + f.amount_paid, 0),
          count: monthFees.length
        };
      });

      // Group by course
      const courseGroups = {};
      fees.forEach(fee => {
        const course = fee.students?.course || 'Unknown';
        if (!courseGroups[course]) {
          courseGroups[course] = { totalDue: 0, totalPaid: 0, count: 0 };
        }
        courseGroups[course].totalDue += fee.amount_due;
        courseGroups[course].totalPaid += fee.amount_paid;
        courseGroups[course].count++;
      });

      // Group by teacher (admin only)
      const teacherGroups = {};
      if (isAdmin()) {
        fees.forEach(fee => {
          const teacher = fee.students?.teachers?.name || 'Unknown';
          if (!teacherGroups[teacher]) {
            teacherGroups[teacher] = { totalDue: 0, totalPaid: 0, count: 0 };
          }
          teacherGroups[teacher].totalDue += fee.amount_due;
          teacherGroups[teacher].totalPaid += fee.amount_paid;
          teacherGroups[teacher].count++;
        });
      }

      // Yearly summary
      const yearly = {
        totalDue: fees.reduce((s, f) => s + f.amount_due, 0),
        totalPaid: fees.reduce((s, f) => s + f.amount_paid, 0),
        totalCount: fees.length,
        paidCount: fees.filter(f => f.status === 'paid').length,
        unpaidCount: fees.filter(f => f.status === 'unpaid').length,
        partialCount: fees.filter(f => f.status === 'partial').length
      };

      setReports({
        byMonth,
        byCourse: Object.entries(courseGroups).map(([course, data]) => ({
          course,
          ...data
        })),
        byTeacher: Object.entries(teacherGroups).map(([teacher, data]) => ({
          teacher,
          ...data
        })),
        yearly
      });
    } catch (err) {
      console.error('Error fetching fee reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, isAdmin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { ...reports, loading, error, refetch: fetchReports };
}
