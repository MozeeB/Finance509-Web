/**
 * Format a number as currency
 * This function formats a number as currency without changing the sign.
 * The sign will be preserved in the formatted output.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  // Format the absolute value and then add the sign manually
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // Don't add the sign as part of the formatting
    signDisplay: 'never',
  }).format(Math.abs(amount));
  
  // Return the formatted value with the correct sign
  return amount >= 0 ? formatted : `-${formatted}`;
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
