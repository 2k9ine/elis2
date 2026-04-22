import { useAttendanceHistory } from '../../hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate, getDaysDifference } from '../../lib/utils';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

function AttendanceHeatmap({ studentId }) {
  const { history, loading, getMonthlyStats } = useAttendanceHistory(studentId);

  const monthlyStats = getMonthlyStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400';
      case 'absent':
        return 'bg-red-500/20 text-red-400';
      case 'late':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-white/5 text-text-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Attendance History</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Present</p>
              <p className="text-2xl font-bold text-text-primary">
                {history.filter(h => h.status === 'present').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Absent</p>
              <p className="text-2xl font-bold text-text-primary">
                {history.filter(h => h.status === 'absent').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Late</p>
              <p className="text-2xl font-bold text-text-primary">
                {history.filter(h => h.status === 'late').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10">
              <Calendar className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total</p>
              <p className="text-2xl font-bold text-text-primary">{history.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      {monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-text-muted">{stat.month}</div>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden flex">
                    <div
                      className="bg-green-500/50 h-full"
                      style={{ width: `${(stat.present / stat.total) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500/50 h-full"
                      style={{ width: `${(stat.late / stat.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500/50 h-full"
                      style={{ width: `${(stat.absent / stat.total) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{stat.rate}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-text-muted text-center py-8">No attendance records found.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 20).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {formatDate(record.date, 'long')}
                      </p>
                      {record.note && (
                        <p className="text-sm text-text-muted">{record.note}</p>
                      )}
                    </div>
                  </div>

                  <Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceHeatmap;
