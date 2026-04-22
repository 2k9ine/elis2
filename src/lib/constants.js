// App Constants

// Courses offered at Eli's Learning
export const COURSES = [
  { value: 'keyboard', label: 'Keyboard', icon: 'Piano' },
  { value: 'western-vocal', label: 'Western Vocal', icon: 'Mic' },
  { value: 'pop-vocal', label: 'Pop Vocal', icon: 'Mic2' },
  { value: 'art', label: 'Art', icon: 'Palette' },
  { value: 'dance', label: 'Dance', icon: 'Music' },
  { value: 'classical-dance', label: 'Classical Dance', icon: 'Music2' }
];

// Student levels
export const LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', color: 'blue' },
  { value: 'advanced', label: 'Advanced', color: 'purple' }
];

// Trinity grades
export const TRINITY_GRADES = [
  { value: 'initial', label: 'Initial' },
  { value: 'grade-1', label: 'Grade 1' },
  { value: 'grade-2', label: 'Grade 2' },
  { value: 'grade-3', label: 'Grade 3' },
  { value: 'grade-4', label: 'Grade 4' },
  { value: 'grade-5', label: 'Grade 5' },
  { value: 'grade-6', label: 'Grade 6' },
  { value: 'grade-7', label: 'Grade 7' },
  { value: 'grade-8', label: 'Grade 8' }
];

// Trinity status pipeline
export const TRINITY_STATUS = {
  PREPARING: 'preparing',
  TEACHER_RECOMMENDED: 'teacher-recommended',
  ADMIN_APPROVED: 'admin-approved',
  APPLICATION_SUBMITTED: 'application-submitted',
  FEE_PAID: 'fee-paid',
  EXAM_COMPLETED: 'exam-completed',
  RESULT_RECEIVED: 'result-received'
};

export const TRINITY_STATUS_LABELS = {
  [TRINITY_STATUS.PREPARING]: 'Preparing',
  [TRINITY_STATUS.TEACHER_RECOMMENDED]: 'Teacher Recommended',
  [TRINITY_STATUS.ADMIN_APPROVED]: 'Admin Approved',
  [TRINITY_STATUS.APPLICATION_SUBMITTED]: 'Application Submitted',
  [TRINITY_STATUS.FEE_PAID]: 'Fee Paid',
  [TRINITY_STATUS.EXAM_COMPLETED]: 'Exam Completed',
  [TRINITY_STATUS.RESULT_RECEIVED]: 'Result Received'
};

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

export const ATTENDANCE_STATUS_CONFIG = {
  [ATTENDANCE_STATUS.PRESENT]: { label: 'Present', color: 'green', icon: 'CheckCircle' },
  [ATTENDANCE_STATUS.ABSENT]: { label: 'Absent', color: 'red', icon: 'XCircle' },
  [ATTENDANCE_STATUS.LATE]: { label: 'Late', color: 'yellow', icon: 'Clock' }
};

// Fee statuses
export const FEE_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial'
};

export const FEE_STATUS_CONFIG = {
  [FEE_STATUS.PAID]: { label: 'Paid', color: 'green' },
  [FEE_STATUS.UNPAID]: { label: 'Unpaid', color: 'red' },
  [FEE_STATUS.PARTIAL]: { label: 'Partial', color: 'yellow' }
};

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'bank-transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' }
];

// Music piece statuses
export const PIECE_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  NEEDS_REVIEW: 'needs-review'
};

export const PIECE_STATUS_CONFIG = {
  [PIECE_STATUS.IN_PROGRESS]: { label: 'In Progress', color: 'blue' },
  [PIECE_STATUS.COMPLETED]: { label: 'Completed', color: 'green' },
  [PIECE_STATUS.NEEDS_REVIEW]: { label: 'Needs Review', color: 'orange' }
};

// Trinity results
export const TRINITY_RESULTS = {
  PASS: 'pass',
  MERIT: 'merit',
  DISTINCTION: 'distinction',
  FAIL: 'fail'
};

export const TRINITY_RESULTS_CONFIG = {
  [TRINITY_RESULTS.PASS]: { label: 'Pass', color: 'green' },
  [TRINITY_RESULTS.MERIT]: { label: 'Merit', color: 'blue' },
  [TRINITY_RESULTS.DISTINCTION]: { label: 'Distinction', color: 'purple' },
  [TRINITY_RESULTS.FAIL]: { label: 'Fail', color: 'red' }
};

// Event types
export const EVENT_TYPES = [
  { value: 'recital', label: 'Recital' },
  { value: 'concert', label: 'Concert' },
  { value: 'trinity-exam', label: 'Trinity Exam' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'other', label: 'Other' }
];

// Nationalities (common ones for UAE)
export const NATIONALITIES = [
  'UAE', 'India', 'Pakistan', 'Philippines', 'Egypt', 'Jordan', 'Lebanon', 'Syria',
  'Saudi Arabia', 'Kuwait', 'Bahrain', 'Qatar', 'Oman', 'Sudan', 'Morocco', 'Tunisia',
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'
];

// User roles
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

// Months for fee tracking
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Trinity Center Reference
export const TRINITY_CENTER_REF = '71550';

// App settings
export const APP_NAME = "Eli's Learning";
export const APP_TAGLINE = "Music & Arts School";
export const APP_LOCATION = "Sharjah, UAE";
