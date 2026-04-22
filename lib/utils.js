import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conditional logic
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to display string
 */
export function formatDate(date, format = 'medium') {
  if (!date) return '-';

  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  if (format === 'month-year') {
    return d.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }

  // Default medium format
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format currency (AED)
 */
export function formatCurrency(amount, currency = 'AED') {
  if (amount === null || amount === undefined) return '-';

  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
  if (!phone) return '-';

  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If UAE number (starts with 971 or 0), format accordingly
  if (cleaned.startsWith('971')) {
    return `+971 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }

  if (cleaned.startsWith('0')) {
    return `+971 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Clean phone number for WhatsApp (remove leading 0, add country code)
 */
export function cleanPhoneForWhatsApp(phone) {
  if (!phone) return '';

  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 0 and add 971
  if (cleaned.startsWith('0')) {
    cleaned = '971' + cleaned.slice(1);
  }

  // If already has 971, keep as is
  if (cleaned.startsWith('971')) {
    return cleaned;
  }

  // Otherwise assume it needs 971
  return '971' + cleaned;
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ELI-${year}-${random}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get initial letters from name
 */
export function getInitials(name) {
  if (!name) return '?';

  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate UUID v4
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get month name from number (0-11)
 */
export function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || '';
}

/**
 * Get current month/year for fee tracking.
 * month is 1-indexed (1=January) to match PostgreSQL EXTRACT(MONTH FROM date).
 */
export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,           // 1–12, matching the DB
    year: now.getFullYear(),
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  };
}

/**
 * Check if fee is overdue (past 5th of month).
 * month is 1-indexed (1=January) matching the DB.
 */
export function isFeeOverdue(month, year) {
  const now = new Date();
  const feeDate = new Date(year, month - 1, 5); // JS Date uses 0-indexed month
  return now > feeDate;
}

/**
 * Calculate date difference in days
 */
export function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(date, 'short');
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (UAE format)
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}
