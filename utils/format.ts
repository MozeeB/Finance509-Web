/**
 * Format a number as currency
 * This function formats a number as currency without adding any sign.
 * The caller is responsible for adding signs if needed.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  // Format the absolute value without any sign
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // Never display signs
    signDisplay: 'never',
  }).format(Math.abs(amount));
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format a date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
}
