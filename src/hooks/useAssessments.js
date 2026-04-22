import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for internal assessments
 */
export function useAssessments(options = {}) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();
  const { studentId, teacherId } = options;

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('internal_assessments')
        .select(`
          *,
          students!inner(id, name, course),
          teachers(name)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      } else if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssessments(data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, teacherId, isAdmin, getTeacherId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Create assessment
  const createAssessment = async (assessmentData) => {
    const { data, error } = await db.insert('internal_assessments', assessmentData);
    if (!error) await fetchAssessments();
    return { data, error };
  };

  // Update assessment
  const updateAssessment = async (id, updates) => {
    const { data, error } = await db.update('internal_assessments', id, updates);
    if (!error) await fetchAssessments();
    return { data, error };
  };

  // Delete assessment
  const deleteAssessment = async (id) => {
    const { success, error } = await db.remove('internal_assessments', id);
    if (success) await fetchAssessments();
    return { success, error };
  };

  // Get progress data for charts
  const getProgressData = (studentId) => {
    const studentAssessments = assessments
      .filter(a => a.student_id === studentId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return studentAssessments.map(a => ({
      date: a.date,
      score: a.score,
      maxScore: a.max_score,
      percentage: Math.round((a.score / a.max_score) * 100),
      piece: a.piece_assessed
    }));
  };

  // Get average scores by student
  const getAverages = () => {
    const byStudent = {};

    assessments.forEach(assessment => {
      const studentId = assessment.student_id;
      if (!byStudent[studentId]) {
        byStudent[studentId] = {
          name: assessment.students?.name,
          scores: [],
          total: 0
        };
      }

      const percentage = (assessment.score / assessment.max_score) * 100;
      byStudent[studentId].scores.push(percentage);
      byStudent[studentId].total++;
    });

    return Object.entries(byStudent).map(([id, data]) => ({
      studentId: id,
      name: data.name,
      average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      count: data.total
    }));
  };

  return {
    assessments,
    loading,
    error,
    refetch: fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getProgressData,
    getAverages
  };
}

/**
 * Hook for assessment statistics
 */
export function useAssessmentStats() {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    averageScore: 0,
    byGrade: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAdmin, getTeacherId } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('internal_assessments').select('*');

      if (!isAdmin()) {
        query = query.eq('teacher_id', getTeacherId());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const assessments = data || [];

      // This month's assessments
      const now = new Date();
      const thisMonth = assessments.filter(a => {
        const date = new Date(a.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });

      // Average score
      const avgScore = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / assessments.length)
        : 0;

      // By grade
      const byGrade = {};
      assessments.forEach(a => {
        if (!byGrade[a.grade]) {
          byGrade[a.grade] = { count: 0, total: 0 };
        }
        byGrade[a.grade].count++;
        byGrade[a.grade].total += (a.score / a.max_score) * 100;
      });

      const byGradeAvg = {};
      Object.entries(byGrade).forEach(([grade, data]) => {
        byGradeAvg[grade] = Math.round(data.total / data.count);
      });

      setStats({
        total: assessments.length,
        thisMonth: thisMonth.length,
        averageScore: avgScore,
        byGrade: byGradeAvg
      });
    } catch (err) {
      console.error('Error fetching assessment stats:', err);
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
