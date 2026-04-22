import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent, useMusicPieces } from '../../hooks/useStudents';
import { useAssessments } from '../../hooks/useAssessments';
import { useFees } from '../../hooks/useFees';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Music,
  Award,
  FileText,
  DollarSign
} from 'lucide-react';
import { LEVELS, COURSES, TRINITY_GRADES } from '../../lib/constants';
import { formatDate, formatPhone, calculateAge } from '../../lib/utils';
import MusicPieceTracker from '../../components/students/MusicPieceTracker';
import AttendanceHeatmap from '../../components/students/AttendanceHeatmap';
import ExamResults from '../../components/students/ExamResults';
import StudentExportReport from '../../components/students/StudentExportReport';

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const { student, loading, refetch } = useStudent(id);
  const { pieces, loading: piecesLoading } = useMusicPieces(id);
  const { assessments, loading: assessmentsLoading } = useAssessments({ studentId: id });

  const [activeTab, setActiveTab] = useState('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <Skeleton variant="text" className="w-48 h-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="lg:col-span-1" />
          <Skeleton variant="card" className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-muted">Student not found</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => navigate('/students')}
            >
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'music', label: 'Music Pieces', icon: Music },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'exams', label: 'Exams', icon: Award },
    { id: 'fees', label: 'Fees', icon: DollarSign }
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        <div className="flex gap-2">
          <StudentExportReport studentId={id} studentName={student?.name} />
          {isAdmin() && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/students/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar
              src={student.photo_url}
              name={student.name}
              size="2xl"
              className="mx-auto sm:mx-0"
            />

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-bold text-text-primary">{student.name}</h1>
                <Badge variant={student.active ? 'success' : 'muted'}>
                  {student.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-text-muted mt-1">
                {COURSES.find(c => c.value === student.course)?.label || student.course}
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <User className="w-4 h-4" />
                  {LEVELS.find(l => l.value === student.level)?.label || 'Unknown Level'}
                </div>

                {student.trinity_grade_current && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Award className="w-4 h-4" />
                    {TRINITY_GRADES.find(g => g.value === student.trinity_grade_current)?.label}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  Enrolled {formatDate(student.enrolled_date, 'short')}
                </div>
              </div>

              {student.teachers && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 inline-block">
                  <p className="text-xs text-text-muted">Assigned Teacher</p>
                  <p className="font-medium text-text-primary">{student.teachers.name}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Phone Number</p>
                    <p className="text-sm text-text-primary">{formatPhone(student.phone)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-text-muted">Date of Birth</p>
                    <p className="text-sm text-text-primary">
                      {student.dob ? `${formatDate(student.dob)} (${calculateAge(student.dob)} years)` : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-text-muted">Nationality</p>
                    <p className="text-sm text-text-primary">{student.nationality || '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-text-muted">Monthly Fee</p>
                    <p className="text-sm text-text-primary">
                      AED {student.monthly_fee}
                      {student.discount_percent > 0 && (
                        <span className="text-green-400 ml-1">(-{student.discount_percent}%)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parent/Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted">Name</p>
                  <p className="text-sm font-medium text-text-primary">{student.parent_name || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-text-muted" />
                      <p className="text-sm text-text-primary">{formatPhone(student.parent_phone)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-text-muted">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <p className="text-sm text-text-primary">{student.parent_email || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Music Pieces */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Music Pieces</CardTitle>
              </CardHeader>
              <CardContent>
                {piecesLoading ? (
                  <Skeleton variant="text" count={3} />
                ) : pieces.length === 0 ? (
                  <p className="text-text-muted">No music pieces recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pieces.slice(0, 5).map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div>
                          <p className="font-medium text-text-primary">{piece.piece_name}</p>
                          <p className="text-xs text-text-muted">
                            Started {formatDate(piece.date_started, 'short')}
                          </p>
                        </div>
                        <Badge
                          variant={piece.status === 'completed' ? 'success' : 'primary'}
                        >
                          {piece.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <Skeleton variant="text" count={3} />
                ) : assessments.length === 0 ? (
                  <p className="text-text-muted">No assessments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assessments.slice(0, 5).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div>
                          <p className="font-medium text-text-primary">{assessment.piece_assessed}</p>
                          <p className="text-xs text-text-muted">
                            {formatDate(assessment.date, 'short')} • {assessment.grade}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-text-primary">
                            {assessment.score}/{assessment.max_score}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'music' && (
          <MusicPieceTracker studentId={id} />
        )}

        {activeTab === 'attendance' && (
          <AttendanceHeatmap studentId={id} />
        )}

        {activeTab === 'exams' && (
          <ExamResults studentId={id} />
        )}

        {activeTab === 'fees' && (
          <FeeHistory studentId={id} />
        )}
      </div>
    </div>
  );
}

// Fee History component
function FeeHistory({ studentId }) {
  const { fees, loading } = useFees({ studentId });

  if (loading) return <Skeleton variant="card" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee History</CardTitle>
      </CardHeader>
      <CardContent>
        {fees.length === 0 ? (
          <p className="text-text-muted">No fee records found.</p>
        ) : (
          <div className="space-y-2">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {new Date(fee.year, fee.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-text-muted">
                    {fee.payment_method && `Paid via ${fee.payment_method}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-text-primary">AED {fee.amount_paid}</p>
                  <Badge
                    variant={fee.status === 'paid' ? 'success' : fee.status === 'partial' ? 'warning' : 'danger'}
                  >
                    {fee.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentProfile;
