import { useState } from 'react';
import { useFeeReports } from '../../hooks/useFees';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import {
  BarChart3,
  FileText,
  Download,
  DollarSign,
  Users,
  Calendar,
  Printer
} from 'lucide-react';
import { formatCurrency, getMonthName, formatDate } from '../../lib/utils';
import { Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Reports() {
  const { isAdmin } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());

  const { byMonth, byCourse, byTeacher, yearly, loading } = useFeeReports(year);

  const handleExportPDF = async () => {
    const reportElement = document.getElementById('financial-report');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0f'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFillColor(10, 10, 15);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`financial-report-${year}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-muted">You don't have permission to view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyData = {
    labels: byMonth.map(m => getMonthName(m.month - 1)), // getMonthName expects 0-indexed
    datasets: [
      {
        label: 'Total Due',
        data: byMonth.map(m => m.totalDue),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Total Paid',
        data: byMonth.map(m => m.totalPaid),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      }
    }
  };

  return (
    <div id="financial-report" className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-text-muted">View and export school reports.</p>
        </div>

        <div className="flex gap-2 print:hidden">
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-24"
          />
          <Button variant="secondary" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Yearly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            {year} Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-text-muted">Total Due</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(yearly?.totalDue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5">
              <p className="text-sm text-text-muted">Total Paid</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(yearly?.totalPaid)}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-text-muted">Collection Rate</p>
              <p className="text-2xl font-bold text-text-primary">
                {yearly?.totalDue ? Math.round((yearly.totalPaid / yearly.totalDue) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-text-muted">Total Records</p>
              <p className="text-2xl font-bold text-text-primary">{yearly?.totalCount}</p>
            </div>
          </div>

          <div className="h-80">
            <Bar data={monthlyData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* By Course */}
      <Card>
        <CardHeader>
          <CardTitle>By Course</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={[
              { key: 'course', title: 'Course' },
              { key: 'count', title: 'Students' },
              { key: 'totalDue', title: 'Total Due', render: (v) => formatCurrency(v) },
              { key: 'totalPaid', title: 'Total Paid', render: (v) => formatCurrency(v) },
              {
                key: 'rate',
                title: 'Rate',
                render: (_, row) => (
                  <Badge variant={row.totalPaid / row.totalDue >= 0.8 ? 'success' : 'warning'}>
                    {Math.round((row.totalPaid / row.totalDue) * 100)}%
                  </Badge>
                )
              }
            ]}
            data={byCourse}
            emptyMessage="No data available"
          />
        </CardContent>
      </Card>

      {/* By Teacher */}
      <Card>
        <CardHeader>
          <CardTitle>By Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={[
              { key: 'teacher', title: 'Teacher' },
              { key: 'count', title: 'Students' },
              { key: 'totalDue', title: 'Total Due', render: (v) => formatCurrency(v) },
              { key: 'totalPaid', title: 'Total Paid', render: (v) => formatCurrency(v) },
              {
                key: 'rate',
                title: 'Rate',
                render: (_, row) => (
                  <Badge variant={row.totalPaid / row.totalDue >= 0.8 ? 'success' : 'warning'}>
                    {Math.round((row.totalPaid / row.totalDue) * 100)}%
                  </Badge>
                )
              }
            ]}
            data={byTeacher}
            emptyMessage="No data available"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Reports;
