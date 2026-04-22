import { useAssessments } from '../../hooks/useAssessments';
import { useTrinityApplications } from '../../hooks/useTrinity';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import {
  Award,
  FileText,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { TRINITY_GRADES, TRINITY_RESULTS_CONFIG } from '../../lib/constants';
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

function ExamResults({ studentId }) {
  const { assessments, loading: assessmentsLoading, getProgressData } = useAssessments({ studentId });
  const { applications: trinityApps, loading: trinityLoading } = useTrinityApplications({ studentId });

  const progressData = getProgressData(studentId);

  const chartData = {
    labels: progressData.map(d => formatDate(d.date, 'short')),
    datasets: [
      {
        label: 'Score %',
        data: progressData.map(d => d.percentage),
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-text-primary">Exam Results</h2>

      {/* Progress Chart */}
      {progressData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trinity Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Trinity College London Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trinityLoading ? (
            <div className="space-y-2">
              {<Skeleton variant="text" />}
              {<Skeleton variant="text" />}
            </div>
          ) : trinityApps.length === 0 ? (
            <p className="text-text-muted text-center py-4">No Trinity exam records.</p>
          ) : (
            <div className="space-y-3">
              {trinityApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-lg bg-white/5 border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">
                        {TRINITY_GRADES.find(g => g.value === app.grade)?.label}
                      </p>
                      <p className="text-sm text-text-muted">
                        Status: <span className="capitalize">{app.status.replace(/-/g, ' ')}</span>
                      </p>
                    </div>

                    {app.result && (
                      <Badge variant={
                        { green: 'success', blue: 'info', purple: 'purple', red: 'danger' }[TRINITY_RESULTS_CONFIG[app.result]?.color] || 'default'
                      }>
                        {TRINITY_RESULTS_CONFIG[app.result]?.label}
                      </Badge>
                    )}
                  </div>

                  {app.result && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-text-muted">Certificate: {app.certificate_number || 'Pending'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Internal Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessmentsLoading ? (
            <div className="space-y-2">
              {<Skeleton variant="text" />}
              {<Skeleton variant="text" />}
            </div>
          ) : assessments.length === 0 ? (
            <p className="text-text-muted text-center py-4">No internal assessments recorded.</p>
          ) : (
            <div className="space-y-2">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <p className="font-medium text-text-primary">{assessment.piece_assessed}</p>
                    <p className="text-sm text-text-muted">
                      {formatDate(assessment.date, 'short')} • {assessment.teachers?.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-text-primary">
                      {assessment.score}/{assessment.max_score}
                    </p>
                    <Badge variant="primary">{assessment.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExamResults;
