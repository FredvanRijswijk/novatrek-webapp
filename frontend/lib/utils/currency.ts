/**
 * Currency formatting utilities for Europe-based pricing
 */

export const CURRENCY = {
  code: 'EUR',
  symbol: '€',
  locale: 'en-EU'
} as const;

/**
 * Format a price in euros
 */
export function formatPrice(amount: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(amount);
}

/**
 * Format a price range in euros
 */
export function formatPriceRange(min: number, max: number): string {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Parse a price string to number (handles both $ and € formats)
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and thousands separators
  const cleaned = priceString.replace(/[€$,.\s]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Convert cents to euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Convert euros to cents
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}