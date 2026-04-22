import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import {
  Upload, Download, CheckCircle, XCircle, AlertCircle, FileText, X
} from 'lucide-react';

/**
 * Expected CSV columns (order doesn't matter, headers must match exactly):
 * name, phone, parent_name, parent_phone, parent_email,
 * dob, nationality, course, level, monthly_fee, discount_percent,
 * trinity_grade_current, notes
 *
 * Only 'name' and 'course' are required.
 */

const REQUIRED = ['name', 'course'];
const ALL_COLS = [
  'name','phone','parent_name','parent_phone','parent_email',
  'dob','nationality','course','level','monthly_fee',
  'discount_percent','trinity_grade_current','notes'
];

const SAMPLE_CSV = [
  ALL_COLS.join(','),
  'Sara Ahmed,+971501234567,Ahmed Al Rashid,+971509876543,ahmed@email.com,2015-03-12,UAE,Keyboard,Beginner,350,0,Initial,Keen learner',
  'Liam O\'Brien,+971551234567,Patrick O\'Brien,+971551112222,patrick@email.com,2013-07-22,Irish,Western Vocal,Intermediate,400,10,Grade 2,',
  'Priya Nair,,Mrs Nair,+971561234567,,2016-01-01,Indian,Art,Beginner,300,0,Initial,'
].join('\n');

function parseCSV(text) {
  // Split lines and handle potential \r from Windows
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Handle quoted fields more robustly
  function splitLine(line) {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Handle escaped quotes ""
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function validateRow(row, index) {
  const errors = [];
  REQUIRED.forEach(col => {
    if (!row[col]?.trim()) errors.push(`Row ${index + 1}: "${col}" is required`);
  });
  
  if (row.dob) {
    // Basic date format check (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.dob.trim()) && isNaN(Date.parse(row.dob))) {
      errors.push(`Row ${index + 1}: Invalid date format for dob (expected YYYY-MM-DD)`);
    }
  }

  if (row.monthly_fee && isNaN(parseFloat(row.monthly_fee.toString().replace(/[^\d.]/g, '')))) {
    errors.push(`Row ${index + 1}: Invalid monthly_fee (must be a number)`);
  }

  return errors;
}

export default function CSVImport({ onImportComplete }) {
  const { success, error: showError, warning } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState({ ok: 0, failed: 0, failures: [] });
  const fileRef = useRef();

  function reset() {
    setStep('upload');
    setRows([]);
    setHeaders([]);
    setErrors([]);
    setResults({ ok: 0, failed: 0, failures: [] });
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elis_students_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      showError('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { headers: h, rows: r } = parseCSV(text);

      // Check required columns exist in file
      const missing = REQUIRED.filter(col => !h.includes(col));
      if (missing.length > 0) {
        showError(`CSV is missing required columns: ${missing.join(', ')}`);
        return;
      }

      // Validate each row
      const allErrors = r.flatMap((row, i) => validateRow(row, i));
      setHeaders(h);
      setRows(r);
      setErrors(allErrors);
      setStep('preview');
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-selected
  }

  async function handleImport() {
    if (rows.length === 0) return;
    
    setImporting(true);
    setStep('importing');

    let ok = 0, failed = 0;
    const failures = [];

    // Process in larger batches for efficiency
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batchData = rows.slice(i, i + BATCH).map(row => ({
        name: row.name?.trim(),
        phone: row.phone?.trim() || null,
        parent_name: row.parent_name?.trim() || null,
        parent_phone: row.parent_phone?.trim() || null,
        parent_email: row.parent_email?.trim() || null,
        dob: row.dob?.trim() || null,
        nationality: row.nationality?.trim() || null,
        enrolled_date: new Date().toISOString().split('T')[0],
        course: row.course?.trim(),
        level: row.level?.trim() || 'Beginner',
        monthly_fee: parseFloat(row.monthly_fee?.toString().replace(/[^\d.]/g, '')) || 0,
        discount_percent: parseFloat(row.discount_percent?.toString().replace(/[^\d.]/g, '')) || 0,
        trinity_grade_current: row.trinity_grade_current?.trim() || 'Initial',
        trinity_status: 'Preparing',
        notes: row.notes?.trim() || null,
        active: true,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(batchData)
        .select('name');

      if (error) {
        console.error('Batch import error:', error);
        
        // If it's a permission error (RLS), stop immediately
        if (error.code === '42501') {
          failed += (rows.length - ok);
          failures.push("Permission Denied: You do not have permission to insert students. Please contact an administrator.");
          break; 
        }

        // Otherwise try row-by-row for this batch only
        for (const student of batchData) {
          const { error: singleErr } = await supabase.from('students').insert(student);
          if (singleErr) {
            failed++;
            failures.push(`${student.name}: ${singleErr.message}`);
          } else {
            ok++;
          }
        }
      } else {
        ok += data?.length || batchData.length;
      }
    }

    setResults({ ok, failed, failures });
    setImporting(false);
    setStep('done');

    if (ok > 0) {
      success(`Imported ${ok} student${ok > 1 ? 's' : ''} successfully`);
      onImportComplete?.();
    }
    if (failed > 0) {
      warning(`${failed} row${failed > 1 ? 's' : ''} failed to import`);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title="Import Students from CSV"
        size="lg"
      >
        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="p-4 rounded-lg bg-brand-500/5 border border-brand-500/20 text-sm text-text-muted">
              <p className="font-medium text-text-primary mb-1">How it works</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Download the template, fill in your students, save as CSV</li>
                <li>Required columns: <code className="text-brand-400">name</code>, <code className="text-brand-400">course</code></li>
                <li>All other columns are optional — leave blank if unknown</li>
                <li>Existing students are not overwritten — this only adds new rows</li>
              </ul>
            </div>

            <Button variant="secondary" onClick={downloadSample} className="w-full">
              <Download className="w-4 h-4" />
              Download Sample Template
            </Button>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
            >
              <FileText className="w-10 h-10 mx-auto mb-3 text-text-muted" />
              <p className="font-medium text-text-primary">Click to select your CSV file</p>
              <p className="text-sm text-text-muted mt-1">or drag and drop</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                <span className="text-brand-400 font-semibold">{rows.length}</span>
                <span className="text-sm text-text-muted">rows found</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 font-semibold">{errors.length}</span>
                  <span className="text-sm text-text-muted">validation errors</span>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 max-h-28 overflow-y-auto">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400 py-0.5">{e}</p>
                ))}
              </div>
            )}

            {/* Preview table - first 5 rows */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5">
                    {['name','course','level','parent_name','monthly_fee'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 text-text-primary font-medium">{row.name || '—'}</td>
                      <td className="px-3 py-2">{row.course || '—'}</td>
                      <td className="px-3 py-2">{row.level || 'Beginner'}</td>
                      <td className="px-3 py-2">{row.parent_name || '—'}</td>
                      <td className="px-3 py-2">{row.monthly_fee ? `AED ${row.monthly_fee}` : '—'}</td>
                    </tr>
                  ))}
                  {rows.length > 8 && (
                    <tr className="border-t border-border">
                      <td colSpan={5} className="px-3 py-2 text-center text-text-muted">
                        +{rows.length - 8} more rows…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={reset}>
                <X className="w-4 h-4" />
                Start Over
              </Button>
              <Button
                className="flex-1"
                onClick={handleImport}
                disabled={rows.length === 0}
              >
                <Upload className="w-4 h-4" />
                Import {rows.length} Student{rows.length > 1 ? 's' : ''}
                {errors.length > 0 && ' (with warnings)'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: IMPORTING */}
        {step === 'importing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
            <p className="font-medium text-text-primary">Importing students…</p>
            <p className="text-sm text-text-muted">Please wait, do not close this window</p>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-400">{results.ok}</div>
                <div className="text-xs text-text-muted">Imported successfully</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                <div className="text-xs text-text-muted">Failed</div>
              </div>
            </div>

            {results.failures.length > 0 && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-red-400 mb-2">Failed rows:</p>
                {results.failures.map((f, i) => (
                  <p key={i} className="text-xs text-text-muted py-0.5">{f}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {results.failed > 0 && (
                <Button variant="secondary" onClick={reset}>Import Again</Button>
              )}
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
