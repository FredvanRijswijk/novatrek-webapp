import { format, parseISO } from 'date-fns';

/**
 * Normalize any date format to a consistent ISO date string (YYYY-MM-DD)
 */
export function normalizeDate(date: any): string {
  if (!date) return '';
  
  try {
    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      return format(date.toDate(), 'yyyy-MM-dd');
    }
    
    // Handle JavaScript Date
    if (date instanceof Date) {
      return format(date, 'yyyy-MM-dd');
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Otherwise parse and format
      const parsed = parseISO(date);
      return format(parsed, 'yyyy-MM-dd');
    }
    
    // Handle objects with seconds (Firestore Timestamp-like)
    if (date._seconds || date.seconds) {
      const seconds = date._seconds || date.seconds;
      const millis = seconds * 1000;
      return format(new Date(millis), 'yyyy-MM-dd');
    }
    
    // Fallback: try to convert to string
    return String(date);
  } catch (error) {
    console.error('Error normalizing date:', error, date);
    return '';
  }
}

/**
 * Parse any date format to a JavaScript Date object
 */
export function parseDate(date: any): Date {
  if (!date) return new Date();
  
  try {
    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    // Handle JavaScript Date
    if (date instanceof Date) {
      return date;
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      // If it's just a date string (YYYY-MM-DD), add time to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Date(date + 'T00:00:00');
      }
      return new Date(date);
    }
    
    // Handle objects with seconds (Firestore Timestamp-like)
    if (date._seconds || date.seconds) {
      const seconds = date._seconds || date.seconds;
      const millis = seconds * 1000;
      return new Date(millis);
    }
    
    // Fallback
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error, date);
    return new Date();
  }
}

/**
 * Format a date for display
 */
export function formatDate(date: any, formatStr: string = 'EEEE, MMMM d, yyyy'): string {
  const parsed = parseDate(date);
  return format(parsed, formatStr);
}

/**
 * Compare two dates (handles all date formats)
 */
export function isSameDateAny(date1: any, date2: any): boolean {
  const normalized1 = normalizeDate(date1);
  const normalized2 = normalizeDate(date2);
  return normalized1 === normalized2;
}