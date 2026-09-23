/**
 * Formats a number to Indian Rupee representation (en-IN)
 * e.g. 120000 -> ₹1,20,000
 */
export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Checks if a phone number is valid (not empty and not '— none listed')
 */
export function isPhoneAvailable(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const p = phone.trim().toLowerCase();
  return !(p === '— none listed' || p.includes('none') || p === '—' || p === '-' || p === '');
}

/**
 * Clean phone for WhatsApp:
 * "https://wa.me/91 + 10-digit number with spaces and leading 0 removed"
 */
export function getWhatsAppUrl(phone: string): string | null {
  if (!isPhoneAvailable(phone)) return null;
  // Extract all digits
  const rawDigits = phone.replace(/\D/g, '');
  // Preserve explicitly international dialling prefixes; do not turn overseas numbers into +91.
  if (phone.trim().startsWith('+')) {
    return rawDigits.length >= 8 && rawDigits.length <= 15 ? `https://wa.me/${rawDigits}` : null;
  }
  
  // If 11 digits starting with 0 (e.g. 09877962254), remove leading 0 -> 10 digits
  let tenDigits = rawDigits;
  if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
    tenDigits = rawDigits.substring(1);
  } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
    tenDigits = rawDigits.substring(2);
  } else if (rawDigits.length > 10) {
    tenDigits = rawDigits.slice(-10);
  }

  if (tenDigits.length !== 10) {
    return null;
  }

  return `https://wa.me/91${tenDigits}`;
}

/**
 * Clean phone for tel: link
 */
export function getTelUrl(phone: string): string | null {
  if (!isPhoneAvailable(phone)) return null;
  const digits = phone.replace(/[^0-9+]/g, '');
  if (!digits) return null;
  return `tel:${digits}`;
}

/**
 * Truncate long strings safely
 */
export function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
}
