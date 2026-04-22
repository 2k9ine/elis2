import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrinityApplications, useTrinityStats } from '../../hooks/useTrinity';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  ChevronRight,
  Plus
} from 'lucide-react';
import { TRINITY_STATUS_LABELS, TRINITY_STATUS, TRINITY_RESULTS_CONFIG, TRINITY_GRADES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

function Trinity() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const { applications, loading, approveApplication, markSubmitted, recordFeePayment, recordResult } = useTrinityApplications();
  const { stats, loading: statsLoading } = useTrinityStats();

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  const statusColors = {
    [TRINITY_STATUS.PREPARING]: 'info',
    [TRINITY_STATUS.TEACHER_RECOMMENDED]: 'warning',
    [TRINITY_STATUS.ADMIN_APPROVED]: 'success',
    [TRINITY_STATUS.APPLICATION_SUBMITTED]: 'info',
    [TRINITY_STATUS.FEE_PAID]: 'success',
    [TRINITY_STATUS.EXAM_COMPLETED]: 'purple',
    [TRINITY_STATUS.RESULT_RECEIVED]: 'success'
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
      key: 'grade',
      title: 'Grade',
      render: (value) => TRINITY_GRADES.find(g => g.value === value)?.label || value
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge variant={statusColors[value] || 'default'}>
          {TRINITY_STATUS_LABELS[value]}
        </Badge>
      )
    },
    {
      key: 'teacher_recommended_date',
      title: 'Date',
      render: (value) => value ? formatDate(value, 'short') : '-'
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedApplication(row);
            setModalMode('view');
            setModalOpen(true);
          }}
        >
          View
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )
    }
  ];

  // Filter applications by status
  const pendingApprovals = applications.filter(a => a.status === TRINITY_STATUS.TEACHER_RECOMMENDED);
  const inProgress = applications.filter(a =>
    [TRINITY_STATUS.ADMIN_APPROVED, TRINITY_STATUS.APPLICATION_SUBMITTED, TRINITY_STATUS.FEE_PAID].includes(a.status)
  );
  const completed = applications.filter(a =>
    [TRINITY_STATUS.EXAM_COMPLETED, TRINITY_STATUS.RESULT_RECEIVED].includes(a.status)
  );

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trinity Exams</h1>
          <p className="text-text-muted">Manage Trinity College London exam applications.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Preparing</p>
            <p className="text-2xl font-bold text-text-primary">{stats.preparing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.teacherRecommended}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">In Progress</p>
            <p className="text-2xl font-bold text-blue-400">{stats.applicationSubmitted + stats.feePaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.resultReceived}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals (Admin only) */}
      {isAdmin() && pendingApprovals.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <p className="font-medium text-text-primary">{app.students?.name}</p>
                    <p className="text-sm text-text-muted">
                      {TRINITY_GRADES.find(g => g.value === app.grade)?.label} • Recommended by {app.students?.teachers?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/students/${app.student_id}`)}
                    >
                      View Student
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await approveApplication(app.id);
                        success('Application approved');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Applications */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={applications}
            loading={loading}
            emptyMessage="No Trinity applications found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Trinity;
