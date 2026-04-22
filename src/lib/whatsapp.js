import { formatCurrency, cleanPhoneForWhatsApp } from './utils';

/**
 * Generate WhatsApp wa.me link
 */
export function generateWhatsAppLink(phone, message) {
  const cleanedPhone = cleanPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

/**
 * Generate fee reminder message
 */
export function generateFeeReminderMessage(parentName, studentName, amount, month) {
  return `Hi ${parentName}, this is Eli's Learning. A friendly reminder that ${studentName}'s fee of ${formatCurrency(amount)} for ${month} is due. Kindly arrange payment at your earliest. Thank you!`;
}

/**
 * Generate Trinity exam notification message
 */
export function generateTrinityMessage(parentName, studentName, grade, amount, dueDate) {
  const formattedAmount = amount ? formatCurrency(amount) : 'TBD';
  const formattedDate = dueDate || 'soon';

  return `Dear ${parentName}, we're pleased to inform you that ${studentName} is ready to appear for Trinity College London ${grade} exam. The exam fee is ${formattedAmount}. Please arrange payment to the school by ${formattedDate}. For queries, contact us anytime. — Eli's Learning`;
}

/**
 * Generate attendance alert message
 */
export function generateAttendanceMessage(parentName, studentName, absenceCount) {
  return `Hi ${parentName}, we noticed ${studentName} has been absent for the past ${absenceCount} classes. We'd love to see them back! Please let us know if everything is okay. — Eli's Learning`;
}

/**
 * Generate general announcement message
 */
export function generateAnnouncementMessage(parentName, studentName, message) {
  return message
    .replace(/\[Parent Name\]/g, parentName)
    .replace(/\[Student Name\]/g, studentName);
}

/**
 * Generate event notification message
 */
export function generateEventMessage(parentName, studentName, eventTitle, eventDate, eventTime) {
  return `Hi ${parentName}, ${studentName} has been selected to perform at ${eventTitle} on ${eventDate}${eventTime ? ` at ${eventTime}` : ''}. Please confirm attendance. More details will follow. — Eli's Learning`;
}

/**
 * Generate payment receipt confirmation message
 */
export function generatePaymentConfirmationMessage(parentName, studentName, amount, month, receiptNumber) {
  return `Hi ${parentName}, we've received ${formatCurrency(amount)} as fee payment for ${studentName} for ${month}. Receipt No: ${receiptNumber}. Thank you! — Eli's Learning`;
}

/**
 * Generate welcome message for new students
 */
export function generateWelcomeMessage(parentName, studentName, course) {
  return `Welcome to Eli's Learning, ${parentName}! ${studentName} has been enrolled in ${course}. We're excited to begin this musical journey together. For any questions, feel free to reach out. — Eli's Learning Team`;
}

/**
 * Open WhatsApp with pre-filled message
 */
export function openWhatsApp(phone, message) {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
}

// Message templates for UI display
export const MESSAGE_TEMPLATES = [
  {
    id: 'fee-reminder',
    label: 'Fee Reminder',
    description: 'Send a friendly reminder about pending fees',
    icon: 'DollarSign',
    template: 'Hi [Parent Name], this is Eli\'s Learning. A friendly reminder that [Student Name]\'s fee of [Amount] for [Month] is due. Kindly arrange payment at your earliest. Thank you!'
  },
  {
    id: 'trinity-notification',
    label: 'Trinity Exam Ready',
    description: 'Notify parent that student is ready for Trinity exam',
    icon: 'Award',
    template: 'Dear [Parent Name], we\'re pleased to inform you that [Student Name] is ready to appear for Trinity College London [Grade] exam. The exam fee is [Amount]. Please arrange payment to the school by [Date]. For queries, contact us anytime. — Eli\'s Learning'
  },
  {
    id: 'attendance-alert',
    label: 'Attendance Alert',
    description: 'Follow up on multiple absences',
    icon: 'AlertCircle',
    template: 'Hi [Parent Name], we noticed [Student Name] has been absent for the past [X] classes. We\'d love to see them back! Please let us know if everything is okay. — Eli\'s Learning'
  },
  {
    id: 'event-invitation',
    label: 'Event Invitation',
    description: 'Invite to school events and recitals',
    icon: 'Calendar',
    template: 'Hi [Parent Name], [Student Name] has been selected to perform at [Event Title] on [Date]. Please confirm attendance. More details will follow. — Eli\'s Learning'
  },
  {
    id: 'custom',
    label: 'Custom Message',
    description: 'Write your own message',
    icon: 'MessageSquare',
    template: ''
  }
];
