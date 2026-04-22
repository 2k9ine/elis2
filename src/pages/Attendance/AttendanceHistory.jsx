import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { Table, Pagination } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useTeachers } from '../../hooks/useTeachers';
import { formatDate, cn } from '../../lib/utils';
import { ATTENDANCE_STATUS_CONFIG } from '../../lib/constants';

function AttendanceHistory() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const { teachers } = useTeachers();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [consecutiveAbsences, setConsecutiveAbsences] = useState([]);

  useEffect(() => {
    loadAttendance();
    if (isAdmin()) {
      loadConsecutiveAbsences();
    }
  }, [currentDate, selectedTeacher, viewMode]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (name, course, teacher_id, teachers:teacher_id (name))
        `)
        .eq('date', currentDate);

      if (selectedTeacher) {
        query = query.eq('teacher_id', selectedTeacher);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceData(data || []);

      // Calculate summary
      const present = data?.filter(r => r.status === 'present').length || 0;
      const absent = data?.filter(r => r.status === 'absent').length || 0;
      const late = data?.filter(r => r.status === 'late').length || 0;
      setSummary({ present, absent, late, total: data?.length || 0 });
    } catch (err) {
      showError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadConsecutiveAbsences = async () => {
    try {
      // Get students with 3+ consecutive absences
      const { data: students, error } = await supabase
        .from('students')
        .select('id, name, course, teacher_id')
        .eq('active', true);

      if (error) throw error;

      const absentStudents = [];

      for (const student of students || []) {
        const { data: records } = await supabase
          .from('attendance')
          .select('date, status')
          .eq('student_id', student.id)
          .order('date', { ascending: false })
          .limit(10);

        if (records) {
          let consecutiveCount = 0;
          for (const record of records) {
            if (record.status === 'absent') {
              consecutiveCount++;
            } else {
              break;
            }
          }

          if (consecutiveCount >= 3) {
            absentStudents.push({
              ...student,
              consecutiveAbsences: consecutiveCount
            });
          }
        }
      }

      setConsecutiveAbsences(absentStudents);
    } catch (err) {
      console.error('Failed to load consecutive absences:', err);
    }
  };

  const handleDateChange = (direction) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Date', 'Student', 'Course', 'Status', 'Teacher', 'Note'].join(','),
      ...attendanceData.map(record => [
        record.date,
        record.students?.name,
        record.students?.course,
        record.status,
        record.students?.teachers?.name || '-',
        record.note || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${currentDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    success('Attendance exported');
  };

  const handleUpdateAttendance = async (recordId, newStatus) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;
      success('Attendance updated');
      loadAttendance();
    } catch (err) {
      showError('Failed to update attendance');
    }
  };

  const handleDeleteAttendance = async (recordId) => {
    if (!confirm('Delete this attendance record?')) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      success('Attendance record deleted');
      loadAttendance();
    } catch (err) {
      showError('Failed to delete attendance');
    }
  };

  const columns = [
    {
      key: 'students',
      title: 'Student',
      render: (value) => (
        <div>
          <p className="font-medium text-text-primary">{value?.name}</p>
          <p className="text-sm text-text-muted">{value?.course}</p>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge
          variant={
            value === 'present' ? 'success' :
            value === 'absent' ? 'danger' : 'warning'
          }
        >
          {ATTENDANCE_STATUS_CONFIG[value]?.label || value}
        </Badge>
      )
    },
    {
      key: 'teachers',
      title: 'Marked By',
      render: (value, row) => row.students?.teachers?.name || '-'
    },
    {
      key: 'note',
      title: 'Note',
      render: (value) => value || '-'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {isAdmin() && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateAttendance(row.id, 'present')}
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateAttendance(row.id, 'absent')}
              >
                <XCircle className="w-4 h-4 text-red-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAttendance(row.id)}
              >
                <Trash2 className="w-4 h-4 text-text-muted" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const rate = summary.total > 0
    ? Math.round((summary.present / summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/attendance')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance History</h1>
          <p className="text-text-muted">View and manage attendance records</p>
        </div>

        <Button variant="secondary" onClick={exportAttendance}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="bg-transparent border-none text-center font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleDateChange('next')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {isAdmin() && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Filter by Teacher:</span>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total</p>
              <p className="text-2xl font-bold text-text-primary">{summary.total}</p>
            </div>
            <Users className="w-8 h-8 text-text-muted/50" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Present</p>
              <p className="text-2xl font-bold text-green-400">{summary.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Absent</p>
              <p className="text-2xl font-bold text-red-400">{summary.absent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400/50" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Attendance Rate</p>
            <p className="text-2xl font-bold text-text-primary">{rate}%</p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${rate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={attendanceData}
            loading={loading}
            emptyMessage="No attendance records for this date"
          />
        </CardContent>
      </Card>

      {/* Consecutive Absences (Admin only) */}
      {isAdmin() && consecutiveAbsences.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Consecutive Absences (3+ days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {consecutiveAbsences.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="font-medium text-text-primary">{student.name}</p>
                      <p className="text-sm text-text-muted">{student.course}</p>
                    </div>
                  </div>
                  <Badge variant="danger">
                    {student.consecutiveAbsences} days absent
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AttendanceHistory;
