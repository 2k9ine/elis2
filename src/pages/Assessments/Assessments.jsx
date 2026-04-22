import { useState } from 'react';
import { useAssessments, useAssessmentStats } from '../../hooks/useAssessments';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  FileText,
  Plus,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Assessments() {
  const { isAdmin, getTeacherId } = useAuth();
  const { success, error: showError } = useToast();

  const { assessments, loading, createAssessment, deleteAssessment } = useAssessments();
  const { stats, loading: statsLoading } = useAssessmentStats();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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
      key: 'piece_assessed',
      title: 'Piece/Assessment',
      render: (value) => <p className="text-text-primary">{value}</p>
    },
    {
      key: 'score',
      title: 'Score',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          <span className="text-text-muted">/ {row.max_score}</span>
          <span className="text-sm text-text-muted">
            ({Math.round((value / row.max_score) * 100)}%)
          </span>
        </div>
      )
    },
    {
      key: 'grade',
      title: 'Grade',
      render: (value) => <Badge variant="primary">{value}</Badge>
    },
    {
      key: 'date',
      title: 'Date',
      render: (value) => formatDate(value, 'short')
    },
    {
      key: 'teachers',
      title: 'Examiner',
      render: (value) => value?.name || '-'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const assessmentData = {
      student_id: formData.get('student_id'),
      piece_assessed: formData.get('piece_assessed'),
      score: parseFloat(formData.get('score')),
      max_score: parseFloat(formData.get('max_score')),
      grade: formData.get('grade'),
      notes: formData.get('notes'),
      date: formData.get('date'),
      teacher_id: getTeacherId()
    };

    const { data, error } = await createAssessment(assessmentData);
    if (error) {
      showError('Failed to create assessment');
    } else {
      success('Assessment created successfully');
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Internal Assessments</h1>
          <p className="text-text-muted">Track student progress through internal assessments.</p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-500/10">
              <FileText className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Assessments</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Average Score</p>
              <p className="text-2xl font-bold text-text-primary">{stats.averageScore}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">This Month</p>
              <p className="text-2xl font-bold text-text-primary">{stats.thisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={assessments}
            loading={loading}
            emptyMessage="No assessments found"
          />
        </CardContent>
      </Card>

      {/* Add Assessment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Assessment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="assessment-form">Create</Button>
          </>
        }
      >
        <form id="assessment-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Student ID"
            name="student_id"
            required
            placeholder="Enter student ID"
          />

          <Input
            label="Piece/Assessment Name"
            name="piece_assessed"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Score"
              name="score"
              type="number"
              required
              min="0"
            />

            <Input
              label="Max Score"
              name="max_score"
              type="number"
              required
              min="1"
              defaultValue="100"
            />
          </div>

          <Input
            label="Grade"
            name="grade"
            placeholder="e.g., A, B, C or Excellent, Good"
          />

          <Input
            label="Date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
          />

          <textarea
            name="notes"
            placeholder="Additional notes..."
            className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm min-h-[100px]"
          />
        </form>
      </Modal>
    </div>
  );
}

export default Assessments;
