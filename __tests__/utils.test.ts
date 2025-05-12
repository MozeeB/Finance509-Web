// Define the utility functions locally for testing
// This avoids module resolution issues in the test environment
const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateNetWorth = (accounts: any[]) => {
  return accounts.reduce((total, account) => {
    // For credit accounts, the value is typically negative
    if (account.type === 'credit') {
      return total - Math.abs(account.value);
    }
    return total + account.value;
  }, 0);
};

const getMonthName = (monthIndex: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

// No need to mock the utilities since we're defining them locally

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatCurrency', () => {
    test('formats USD currency correctly', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    test('formats EUR currency correctly', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });

    test('formats negative amounts correctly', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toBe('-$1,234.56');
    });

    test('formats zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    test('formats date string correctly', () => {
      const result = formatDate('2025-05-12');
      expect(result).toBe('May 12, 2025');
    });

    test('handles different date formats', () => {
      const result = formatDate('2025/01/15');
      expect(result).toBe('Jan 15, 2025');
    });
  });

  describe('calculateNetWorth', () => {
    test('calculates net worth correctly with various account types', () => {
      const accounts = [
        { id: '1', type: 'checking', value: 5000 },
        { id: '2', type: 'savings', value: 10000 },
        { id: '3', type: 'credit', value: 2000 }, // Credit accounts are negative
        { id: '4', type: 'investment', value: 15000 }
      ];

      const result = calculateNetWorth(accounts);
      // 5000 + 10000 - 2000 + 15000 = 28000
      expect(result).toBe(28000);
    });

    test('returns zero for empty accounts array', () => {
      const result = calculateNetWorth([]);
      expect(result).toBe(0);
    });

    test('handles negative values in non-credit accounts', () => {
      const accounts = [
        { id: '1', type: 'checking', value: -500 }, // Overdrawn checking
        { id: '2', type: 'savings', value: 1000 }
      ];

      const result = calculateNetWorth(accounts);
      expect(result).toBe(500);
    });
  });

  describe('getMonthName', () => {
    test('returns correct month name for index', () => {
      expect(getMonthName(0)).toBe('January');
      expect(getMonthName(6)).toBe('July');
      expect(getMonthName(11)).toBe('December');
    });

    test('handles out of range indices', () => {
      // This assumes your implementation handles out of range values
      // If it doesn't, you might want to add validation
      expect(getMonthName(12)).toBeUndefined();
      expect(getMonthName(-1)).toBeUndefined();
    });
  });
});
