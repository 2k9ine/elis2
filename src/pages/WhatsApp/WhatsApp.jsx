import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { MessageCircle, Send, Phone, User, DollarSign, Award, AlertCircle, ChevronDown } from 'lucide-react';
import { formatCurrency, cleanPhoneForWhatsApp, getCurrentMonthYear, getMonthName } from '../../lib/utils';
import {
  generateWhatsAppLink,
  generateFeeReminderMessage,
  generateTrinityMessage,
  generateAttendanceMessage,
  generateAnnouncementMessage,
  MESSAGE_TEMPLATES
} from '../../lib/whatsapp';

const MSG_TYPES = [
  { id: 'fee-reminder',        label: 'Fee Reminder',        icon: DollarSign,    color: 'text-yellow-400' },
  { id: 'trinity-notification',label: 'Trinity Exam Ready',  icon: Award,         color: 'text-brand-400'  },
  { id: 'attendance-alert',    label: 'Attendance Alert',    icon: AlertCircle,   color: 'text-red-400'    },
  { id: 'custom',              label: 'Custom Message',      icon: MessageCircle, color: 'text-green-400'  },
];

function StudentPicker({ students, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.parent_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white/5 border border-border rounded-md text-sm text-text-primary hover:bg-white/10 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <Avatar name={selected.name} size="sm" />
            <div className="text-left">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-text-muted">{selected.parent_name || 'No parent name'}</div>
            </div>
          </div>
        ) : (
          <span className="text-text-muted">Select a student…</span>
        )}
        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-background-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full bg-white/5 border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted text-center">No students found</div>
            ) : filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onSelect(s); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
              >
                <Avatar name={s.name} size="sm" />
                <div>
                  <div className="text-sm font-medium text-text-primary">{s.name}</div>
                  <div className="text-xs text-text-muted">{s.course} · {s.parent_name || '—'}</div>
                </div>
                {!s.parent_phone && (
                  <span className="ml-auto text-xs text-red-400">No phone</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsApp() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msgType, setMsgType] = useState('fee-reminder');
  const [preview, setPreview] = useState('');
  const [sent, setSent] = useState(false);

  // Message-specific fields
  const { month, year } = getCurrentMonthYear();
  const [feeAmount, setFeeAmount] = useState('');
  const [feeMonth, setFeeMonth] = useState(`${getMonthName(month - 1)} ${year}`);
  const [trinityGrade, setTrinityGrade] = useState('Grade 1');
  const [trinityFee, setTrinityFee] = useState('');
  const [trinityDate, setTrinityDate] = useState('');
  const [absenceCount, setAbsenceCount] = useState('3');
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    supabase
      .from('students')
      .select('id, name, course, parent_name, parent_phone, monthly_fee, trinity_grade_current')
      .eq('active', true)
      .order('name')
      .then(({ data }) => setStudents(data || []));
  }, []);

  // Rebuild preview whenever inputs change
  useEffect(() => {
    if (!selected) { setPreview(''); return; }
    const parentName = selected.parent_name || 'Parent';
    const studentName = selected.name;

    if (msgType === 'fee-reminder') {
      const amount = feeAmount ? Number(feeAmount) : (selected.monthly_fee || 0);
      setPreview(generateFeeReminderMessage(parentName, studentName, amount, feeMonth));
    } else if (msgType === 'trinity-notification') {
      const amount = trinityFee ? Number(trinityFee) : null;
      setPreview(generateTrinityMessage(parentName, studentName, trinityGrade, amount, trinityDate || 'soon'));
    } else if (msgType === 'attendance-alert') {
      setPreview(generateAttendanceMessage(parentName, studentName, absenceCount));
    } else if (msgType === 'custom') {
      setPreview(generateAnnouncementMessage(parentName, studentName, customText));
    }
  }, [selected, msgType, feeAmount, feeMonth, trinityGrade, trinityFee, trinityDate, absenceCount, customText]);

  function handleSend() {
    if (!selected?.parent_phone) return;
    const link = generateWhatsAppLink(selected.parent_phone, preview);
    window.open(link, '_blank');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  if (!isAdmin()) {
    return (
      <div className="p-4 lg:p-8">
        <Card><CardContent className="p-8 text-center text-text-muted">Admin access only</CardContent></Card>
      </div>
    );
  }

  const noPhone = selected && !selected.parent_phone;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">WhatsApp Communication</h1>
        <p className="text-text-muted mt-1">Send personalised messages to parents — one click opens WhatsApp with the message pre-filled.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Compose */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step 1 — Pick student */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-brand-400" />
                1. Select Student
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6">
              <StudentPicker students={students} selected={selected} onSelect={setSelected} />
            </CardContent>
          </Card>

          {/* Step 2 — Message type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-brand-400" />
                2. Message Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6">
              <div className="grid grid-cols-2 gap-2">
                {MSG_TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMsgType(id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      msgType === id
                        ? 'bg-brand-600/10 border-brand-500/40 text-brand-400'
                        : 'bg-white/5 border-border text-text-muted hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${msgType === id ? 'text-brand-400' : color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3 — Fill in details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="w-4 h-4 text-brand-400" />
                3. Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6 space-y-3">
              {msgType === 'fee-reminder' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Amount (AED)</label>
                      <input
                        type="number"
                        value={feeAmount}
                        onChange={e => setFeeAmount(e.target.value)}
                        placeholder={selected?.monthly_fee || '0'}
                        className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Month</label>
                      <input
                        value={feeMonth}
                        onChange={e => setFeeMonth(e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {msgType === 'trinity-notification' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Grade</label>
                      <select
                        value={trinityGrade}
                        onChange={e => setTrinityGrade(e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                      >
                        {['Initial','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'].map(g => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Exam Fee (AED)</label>
                      <input
                        type="number"
                        value={trinityFee}
                        onChange={e => setTrinityFee(e.target.value)}
                        placeholder="e.g. 350"
                        className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Payment Due By</label>
                    <input
                      value={trinityDate}
                      onChange={e => setTrinityDate(e.target.value)}
                      placeholder="e.g. 30 April 2025"
                      className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}

              {msgType === 'attendance-alert' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Number of Classes Missed</label>
                  <input
                    type="number"
                    min="1"
                    value={absenceCount}
                    onChange={e => setAbsenceCount(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {msgType === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Message — use <code className="text-brand-400">[Parent Name]</code> and <code className="text-brand-400">[Student Name]</code>
                  </label>
                  <textarea
                    rows={4}
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Hi [Parent Name], just a quick note about [Student Name]…"
                    className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y min-h-[100px]"
                  />
                </div>
              )}

              {/* Send button */}
              <div className="pt-2">
                {noPhone ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    No parent phone number on file for this student. Add one in their profile first.
                  </div>
                ) : (
                  <Button
                    className="w-full bg-[#25d366] hover:bg-[#1ebe5d] text-white border-transparent"
                    disabled={!selected || !preview}
                    onClick={handleSend}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {sent ? 'Opened in WhatsApp!' : 'Open in WhatsApp'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Preview + bulk actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Message preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6">
              {preview ? (
                <div className="relative">
                  {/* WhatsApp bubble style */}
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-[#025144] text-white text-sm leading-relaxed">
                    {preview}
                  </div>
                  <div className="mt-3 text-xs text-text-muted text-right">
                    {preview.length} characters
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-text-muted text-sm">
                  Select a student to preview the message
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact info */}
          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-5 px-6 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} size="md" />
                  <div>
                    <div className="font-medium text-text-primary">{selected.name}</div>
                    <div className="text-xs text-text-muted">{selected.course}</div>
                  </div>
                </div>
                <div className="pt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Parent</span>
                    <span className="text-text-primary font-medium">{selected.parent_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Phone</span>
                    <span className={`font-medium ${selected.parent_phone ? 'text-text-primary' : 'text-red-400'}`}>
                      {selected.parent_phone || 'Not set'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk: remind all overdue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6 space-y-3">
              <p className="text-xs text-text-muted">Opens one WhatsApp tab per family — browsers may ask for pop-up permission.</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  const { data } = await supabase
                    .from('fees')
                    .select('*, students(name, parent_name, parent_phone, monthly_fee)')
                    .in('status', ['unpaid', 'partial'])
                    .limit(20);
                  if (!data?.length) return alert('No overdue fees found.');
                  data.forEach((fee, i) => {
                    const s = fee.students;
                    if (!s?.parent_phone) return;
                    const msg = generateFeeReminderMessage(
                      s.parent_name || 'Parent',
                      s.name,
                      fee.amount_due - fee.amount_paid,
                      `Month ${fee.month}/${fee.year}`
                    );
                    setTimeout(() => window.open(generateWhatsAppLink(s.parent_phone, msg), '_blank'), i * 600);
                  });
                }}
              >
                <DollarSign className="w-4 h-4" />
                Remind All Overdue Families
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default WhatsApp;
