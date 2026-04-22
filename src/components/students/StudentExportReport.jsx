import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { FileDown, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

/**
 * Generates a full printable/PDF student report to hand to parents.
 * Pulls all related data fresh from Supabase then opens a styled print window.
 */
export default function StudentExportReport({ studentId, studentName }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Fetch everything in parallel
      const [
        { data: student },
        { data: attendance },
        { data: pieces },
        { data: assessments },
        { data: trinity },
        { data: fees },
      ] = await Promise.all([
        supabase.from('students').select('*, teachers(name)').eq('id', studentId).single(),
        supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(60),
        supabase.from('music_pieces').select('*').eq('student_id', studentId).order('date_started', { ascending: false }),
        supabase.from('internal_assessments').select('*, teachers(name)').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('trinity_applications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('fees').select('*').eq('student_id', studentId).order('year', { ascending: false }).order('month', { ascending: false }).limit(12),
      ]);

      if (!student) { setLoading(false); return; }

      // Build stats
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
      const lateCount = attendance?.filter(a => a.status === 'late').length || 0;
      const totalAtt = (attendance?.length || 0);
      const attRate = totalAtt ? Math.round(((presentCount + lateCount) / totalAtt) * 100) : 0;
      const completedPieces = pieces?.filter(p => p.status === 'completed').length || 0;
      const latestTrinity = trinity?.[0];
      const discountedFee = (student.monthly_fee || 0) * (1 - (student.discount_percent || 0) / 100);

      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Status badge helper for inline HTML
      function statusBadge(status) {
        const colors = {
          present: '#166534,#dcfce7',
          Paid: '#166534,#dcfce7',
          Pass: '#166534,#dcfce7',
          Merit: '#1e40af,#dbeafe',
          Distinction: '#581c87,#f3e8ff',
          Completed: '#166534,#dcfce7',
          absent: '#991b1b,#fee2e2',
          Unpaid: '#991b1b,#fee2e2',
          Fail: '#991b1b,#fee2e2',
          late: '#92400e,#fef3c7',
          Partial: '#92400e,#fef3c7',
          'In Progress': '#1e3a8a,#dbeafe',
          'Needs Review': '#92400e,#fef3c7',
        };
        const [textColor, bgColor] = (colors[status] || '#374151,#f3f4f6').split(',');
        return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${bgColor};color:${textColor}">${status}</span>`;
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Student Report — ${student.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; font-size: 13px; line-height: 1.5; }
  .page { max-width: 780px; margin: 0 auto; padding: 32px 40px; }

  /* Header */
  .school-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 3px solid #2563eb; margin-bottom: 24px; }
  .school-name { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px; }
  .school-meta { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .report-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .report-date { font-size: 12px; color: #374151; margin-top: 2px; }

  /* Student card */
  .student-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
  .student-name { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 6px; grid-column: 1/-1; }
  .info-item { margin-bottom: 6px; }
  .info-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
  .info-value { font-size: 13px; color: #111; font-weight: 500; margin-top: 1px; }

  /* Stats row */
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; color: #1e40af; }
  .stat-lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }

  /* Sections */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f1f5f9; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; font-size: 10px; padding: 7px 10px; text-align: left; border: 1px solid #e2e8f0; }
  tbody td { padding: 7px 10px; border: 1px solid #e2e8f0; color: #374151; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }

  /* Attendance bar */
  .att-bar { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; display: flex; margin-top: 6px; }
  .att-present { background: #22c55e; }
  .att-late { background: #f59e0b; }
  .att-absent { background: #ef4444; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }

  @media print {
    .no-print { display: none; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 20px 24px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Print button -->
  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">
      Print / Save as PDF
    </button>
  </div>

  <!-- School Header -->
  <div class="school-header">
    <div>
      <div class="school-name">Eli's Learning</div>
      <div class="school-meta">Music &amp; Arts School · Sharjah, UAE · Trinity Centre 71550</div>
    </div>
    <div style="text-align:right">
      <div class="report-label">Student Report</div>
      <div class="report-date">Generated: ${today}</div>
    </div>
  </div>

  <!-- Student Card -->
  <div class="student-card">
    <div class="student-name">${student.name}</div>
    <div>
      <div class="info-item"><div class="info-label">Course</div><div class="info-value">${student.course}</div></div>
      <div class="info-item"><div class="info-label">Level</div><div class="info-value">${student.level || '—'}</div></div>
      <div class="info-item"><div class="info-label">Teacher</div><div class="info-value">${student.teachers?.name || 'Unassigned'}</div></div>
    </div>
    <div>
      <div class="info-item"><div class="info-label">Parent / Guardian</div><div class="info-value">${student.parent_name || '—'}</div></div>
      <div class="info-item"><div class="info-label">Parent Phone</div><div class="info-value">${student.parent_phone || '—'}</div></div>
      <div class="info-item"><div class="info-label">Parent Email</div><div class="info-value">${student.parent_email || '—'}</div></div>
    </div>
    <div>
      <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">${student.dob ? formatDate(student.dob, 'short') : '—'}</div></div>
      <div class="info-item"><div class="info-label">Nationality</div><div class="info-value">${student.nationality || '—'}</div></div>
      <div class="info-item"><div class="info-label">Enrolled</div><div class="info-value">${student.enrolled_date ? formatDate(student.enrolled_date, 'short') : '—'}</div></div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-num">${attRate}%</div>
      <div class="stat-lbl">Attendance Rate</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${completedPieces}</div>
      <div class="stat-lbl">Pieces Completed</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${assessments?.length || 0}</div>
      <div class="stat-lbl">Assessments</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${student.trinity_grade_current || '—'}</div>
      <div class="stat-lbl">Trinity Grade</div>
    </div>
  </div>

  <!-- Attendance -->
  <div class="section">
    <div class="section-title">Attendance Summary (Last ${totalAtt} Sessions)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:10px">
      <div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#22c55e">${presentCount}</div><div style="font-size:11px;color:#6b7280">Present</div></div>
      <div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#f59e0b">${lateCount}</div><div style="font-size:11px;color:#6b7280">Late</div></div>
      <div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#ef4444">${absentCount}</div><div style="font-size:11px;color:#6b7280">Absent</div></div>
    </div>
    <div class="att-bar">
      <div class="att-present" style="width:${totalAtt ? (presentCount/totalAtt*100).toFixed(1) : 0}%"></div>
      <div class="att-late" style="width:${totalAtt ? (lateCount/totalAtt*100).toFixed(1) : 0}%"></div>
      <div class="att-absent" style="width:${totalAtt ? (absentCount/totalAtt*100).toFixed(1) : 0}%"></div>
    </div>
    ${attendance && attendance.length > 0 ? `
    <table style="margin-top:12px">
      <thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead>
      <tbody>
        ${attendance.slice(0, 20).map(a => `
          <tr>
            <td>${formatDate(a.date, 'short')}</td>
            <td>${statusBadge(a.status)}</td>
            <td style="color:#6b7280">${a.note || '—'}</td>
          </tr>
        `).join('')}
        ${attendance.length > 20 ? `<tr><td colspan="3" style="text-align:center;color:#9ca3af;font-style:italic">+${attendance.length - 20} more records not shown</td></tr>` : ''}
      </tbody>
    </table>` : '<p style="color:#9ca3af;font-size:12px;margin-top:8px">No attendance records yet.</p>'}
  </div>

  <!-- Music Pieces -->
  <div class="section">
    <div class="section-title">Music Piece Progress (${pieces?.length || 0} pieces)</div>
    ${pieces && pieces.length > 0 ? `
    <table>
      <thead><tr><th>Piece</th><th>Started</th><th>Completed</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>
        ${pieces.map(p => `
          <tr>
            <td style="font-weight:600">${p.piece_name}</td>
            <td>${p.date_started ? formatDate(p.date_started, 'short') : '—'}</td>
            <td>${p.date_completed ? formatDate(p.date_completed, 'short') : '—'}</td>
            <td>${statusBadge(p.status)}</td>
            <td style="color:#6b7280;font-size:11px">${p.teacher_notes || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : '<p style="color:#9ca3af;font-size:12px">No music pieces logged yet.</p>'}
  </div>

  <!-- Internal Assessments -->
  <div class="section">
    <div class="section-title">Internal Assessments</div>
    ${assessments && assessments.length > 0 ? `
    <table>
      <thead><tr><th>Date</th><th>Piece / Subject</th><th>Score</th><th>%</th><th>Grade</th><th>Examiner</th></tr></thead>
      <tbody>
        ${assessments.map(a => `
          <tr>
            <td>${formatDate(a.date, 'short')}</td>
            <td style="font-weight:500">${a.piece_assessed || '—'}</td>
            <td>${a.score}/${a.max_score}</td>
            <td>${a.max_score ? Math.round((a.score/a.max_score)*100) + '%' : '—'}</td>
            <td style="font-weight:600">${a.grade || '—'}</td>
            <td>${a.teachers?.name || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : '<p style="color:#9ca3af;font-size:12px">No assessments recorded.</p>'}
  </div>

  <!-- Trinity -->
  ${trinity && trinity.length > 0 ? `
  <div class="section">
    <div class="section-title">Trinity College London Examinations</div>
    <table>
      <thead><tr><th>Grade</th><th>Status</th><th>Exam Date</th><th>Result</th><th>Certificate No.</th></tr></thead>
      <tbody>
        ${trinity.map(t => `
          <tr>
            <td style="font-weight:600">${t.grade}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.exam_date ? formatDate(t.exam_date, 'short') : '—'}</td>
            <td>${t.result ? statusBadge(t.result) : '—'}</td>
            <td style="font-family:monospace;font-size:11px">${t.certificate_number || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Fees -->
  ${fees && fees.length > 0 ? `
  <div class="section">
    <div class="section-title">Fee History (Last 12 Months)</div>
    <table>
      <thead><tr><th>Month</th><th>Amount Due</th><th>Amount Paid</th><th>Status</th><th>Method</th><th>Receipt</th></tr></thead>
      <tbody>
        ${fees.map(f => `
          <tr>
            <td style="font-family:monospace;font-size:11px">${String(f.month).padStart(2,'0')}/${f.year}</td>
            <td>${formatCurrency(f.amount_due)}</td>
            <td>${formatCurrency(f.amount_paid)}</td>
            <td>${statusBadge(f.status)}</td>
            <td>${f.payment_method ? f.payment_method.replace('-',' ') : '—'}</td>
            <td style="font-family:monospace;font-size:10px;color:#6b7280">${f.receipt_number || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Teacher Notes -->
  ${student.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:13px;color:#374151;line-height:1.6">
      ${student.notes}
    </div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>Eli's Learning · Music &amp; Arts School · Sharjah, UAE · Trinity Centre 71550</span>
    <span>Report generated ${today}</span>
  </div>

</div>
</body>
</html>`;

      const w = window.open('', '_blank', 'width=900,height=750');
      w.document.write(html);
      w.document.close();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={loading}>
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
        : <><FileDown className="w-4 h-4" /> Export Report</>
      }
    </Button>
  );
}
