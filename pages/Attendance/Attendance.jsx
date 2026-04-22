import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance, useStudentsForAttendance } from '../../hooks/useAttendance';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

function Attendance() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { isAdmin, getTeacherId } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({});
  const [saving, setSaving] = useState(false);

  const { attendance, loading, getStats, markAttendance, bulkMarkAttendance } = useAttendance(selectedDate);
  const { students, loading: studentsLoading } = useStudentsForAttendance();

  // Sync local attendance state whenever the fetched records change
  useEffect(() => {
    const state = {};
    attendance.forEach(record => {
      state[record.student_id] = {
        status: record.status,
        note: record.note || ''
      };
    });
    setAttendanceState(state);
  }, [attendance]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNoteChange = (studentId, note) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    const records = Object.entries(attendanceState)
      .filter(([_, data]) => data.status)
      .map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        note: data.note
      }));

    const { data, error } = await bulkMarkAttendance(records);

    if (error) {
      showError('Failed to save attendance');
    } else {
      success('Attendance saved successfully');
    }

    setSaving(false);
  };

  const stats = getStats();

  const handleDateChange = (direction) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-muted">Mark and track student attendance.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/attendance/history')}
          >
            View History
          </Button>
        </div>
      </div>

      {/* Date Picker & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
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
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Present</p>
              <p className="text-2xl font-bold text-green-400">{stats.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Absent</p>
              <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400/50" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Attendance Rate</p>
              <p className="text-3xl font-bold text-text-primary">{stats.rate}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Total</p>
              <p className="text-xl font-bold text-text-primary">{stats.total} students</p>
            </div>
          </div>

          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Mark Attendance</CardTitle>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={Object.keys(attendanceState).length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Attendance
          </Button>
        </CardHeader>

        <CardContent>
          {studentsLoading ? (
            <div className="space-y-3">
              {<Skeleton variant="text" />}
              {<Skeleton variant="text" />}
              {<Skeleton variant="text" />}
            </div>
          ) : students.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No students assigned to you.
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-white/5"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{student.name}</p>
                    <p className="text-sm text-text-muted">{student.course}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        attendanceState[student.id]?.status === 'present'
                          ? 'bg-green-500 text-white'
                          : 'bg-white/5 text-text-muted hover:bg-white/10'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Present
                    </button>

                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        attendanceState[student.id]?.status === 'absent'
                          ? 'bg-red-500 text-white'
                          : 'bg-white/5 text-text-muted hover:bg-white/10'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                    </button>

                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        attendanceState[student.id]?.status === 'late'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white/5 text-text-muted hover:bg-white/10'
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Late
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Add note..."
                    value={attendanceState[student.id]?.note || ''}
                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                    className="sm:w-48 bg-white/5 border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Attendance;
