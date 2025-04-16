/**
 * Sanitize a string to prevent potential injection attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove any HTML/script tags
  let sanitized = input.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  return sanitized;
}

/**
 * Create a session ID with current timestamp and random string
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if a string is a valid UPI ID
 * Format: username@provider
 */
export function isValidUpiId(upiId: string): boolean {
  // UPI ID format validation
  const upiRegex = /^[a-zA-Z0-9\.\-\_]{3,}@[a-zA-Z0-9]{3,}$/;
  return upiRegex.test(upiId);
}

/**
 * Format currency amount with Indian Rupee symbol
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Truncate long strings with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Generate a random OTP code
 */
export function generateOtpCode(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

/**
 * Get current date in human-readable format
 */
export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get readable time from timestamp
 */
export function getReadableTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}