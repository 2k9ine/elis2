import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats, useStudentsWithoutAttendance, useTrinityCandidates } from '../../hooks/useDashboard';
import { useRecentActivity } from '../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton, { SkeletonStatCards } from '../../components/ui/Skeleton';
import { SkeletonCards } from '../../components/ui/Skeleton';
import {
  Users,
  ClipboardCheck,
  DollarSign,
  Award,
  Plus,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Calendar,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

function StatCard({ title, value, icon: Icon, trend, trendValue, loading, onClick, color = 'blue' }) {
  const colors = {
    blue: 'text-brand-400 bg-brand-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-16 h-8" />
            </div>
            <Skeleton variant="circle" className="w-12 h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('card-hover cursor-pointer', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted">{title}</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-2',
                trend === 'up' ? 'text-green-400' : 'text-red-400'
              )}>
                {trend === 'up' ? '+' : ''}{trendValue} from last month
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick, color = 'blue' }) {
  const colors = {
    blue: 'hover:bg-brand-500/10 hover:text-brand-400',
    green: 'hover:bg-green-500/10 hover:text-green-400',
    red: 'hover:bg-red-500/10 hover:text-red-400',
    purple: 'hover:bg-purple-500/10 hover:text-purple-400'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg border border-border',
        'transition-all duration-150 text-text-muted',
        colors[color]
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function ActivityItem({ activity }) {
  const icons = {
    student_added: UserPlus,
    attendance_marked: CheckCircle,
    fee_paid: DollarSign,
    assessment_created: ClipboardCheck,
    default: Clock
  };

  const Icon = icons[activity.type] || icons.default;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="p-2 rounded-lg bg-white/5">
        <Icon className="w-4 h-4 text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{activity.description}</p>
        <p className="text-xs text-text-muted mt-0.5">{activity.time}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const dashboardStats = useDashboardStats();
  const statsLoading = dashboardStats.loading;
  const stats = {
    totalStudents: dashboardStats.totalStudents,
    todayAttendance: dashboardStats.todayAttendance,
    overdueFees: dashboardStats.overdueFees,
    pendingTrinity: dashboardStats.pendingTrinity
  };
  const { activities, loading: activityLoading } = useRecentActivity(10);
  const { students: noAttendance, loading: noAttendanceLoading } = useStudentsWithoutAttendance();
  const { candidates, loading: candidatesLoading } = useTrinityCandidates();

  const quickActions = [
    { icon: UserPlus, label: 'Add Student', onClick: () => navigate('/students/new'), color: 'blue' },
    { icon: CheckCircle, label: 'Mark Attendance', onClick: () => navigate('/attendance'), color: 'green' },
    { icon: DollarSign, label: 'Log Payment', onClick: () => navigate('/fees'), color: 'purple' },
    ...(isAdmin() ? [{ icon: Award, label: 'Trinity Apps', onClick: () => navigate('/trinity'), color: 'red' }] : [])
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/attendance')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Today's Attendance
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          loading={statsLoading}
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats.todayAttendance.rate}%`}
          icon={ClipboardCheck}
          color="green"
          loading={statsLoading}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Overdue Fees"
          value={stats.overdueFees}
          icon={DollarSign}
          color="red"
          loading={statsLoading}
          onClick={() => navigate('/fees')}
        />
        <StatCard
          title="Pending Trinity"
          value={stats.pendingTrinity}
          icon={Award}
          color="purple"
          loading={statsLoading}
          onClick={() => navigate('/trinity')}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickAction key={action.label} {...action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Students with no attendance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <CardTitle>No Attendance This Week</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {noAttendanceLoading ? (
                <SkeletonCards count={3} />
              ) : noAttendance.length === 0 ? (
                <p className="text-text-muted text-center py-4">
                  All students have attendance recorded this week.
                </p>
              ) : (
                <div className="space-y-2">
                  {noAttendance.slice(0, 5).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <div>
                        <p className="font-medium text-text-primary">{student.name}</p>
                        <p className="text-sm text-text-muted">{student.course}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/attendance');
                        }}
                      >
                        Mark
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trinity Candidates */}
          {isAdmin() && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-400" />
                  <CardTitle>Ready for Trinity Exam</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <SkeletonCards count={3} />
                ) : candidates.length === 0 ? (
                  <p className="text-text-muted text-center py-4">
                    No students ready for Trinity exam at the moment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {candidates.slice(0, 5).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <div>
                          <p className="font-medium text-text-primary">{student.name}</p>
                          <p className="text-sm text-text-muted">
                            {student.course} • {student.trinity_grade_current}
                          </p>
                        </div>
                        <Badge variant="primary">Recommend</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {<Skeleton variant="text" />}
                {<Skeleton variant="text" />}
                {<Skeleton variant="text" />}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-text-muted text-center py-4">
                No recent activity to show.
              </p>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
