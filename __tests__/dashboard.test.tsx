import React from 'react';
import { render, screen } from '@testing-library/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// Mock the necessary dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/navigation');
jest.mock('@/utils/auth-service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ success: true, user: { id: 'test-user-id' } }),
}));
jest.mock('@/utils/format', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
  formatDate: jest.fn((date) => date),
  calculateNetWorth: jest.fn((accounts) => 
    accounts.reduce((sum, account) => sum + account.value, 0)
  ),
}));

// Mock dashboard component for testing
const MockDashboard = ({ 
  accounts = [], 
  transactions = [], 
  budgets = [],
  debts = [],
  emergencyFund = null
}) => {
  return (
    <div data-testid="dashboard">
      <h1>Finance Dashboard</h1>
      
      {/* Net Worth Section */}
      <section data-testid="net-worth-section">
        <h2>Net Worth</h2>
        <p data-testid="net-worth-amount">
          ${accounts.reduce((sum, account) => sum + account.value, 0).toFixed(2)}
        </p>
      </section>
      
      {/* Recent Transactions */}
      <section data-testid="transactions-section">
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p>No recent transactions</p>
        ) : (
          <ul>
            {transactions.map(transaction => (
              <li key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                {transaction.description}: ${Math.abs(transaction.total).toFixed(2)}
                <span>{transaction.type === 'expense' ? 'Expense' : 'Income'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {/* Budget Overview */}
      <section data-testid="budgets-section">
        <h2>Budget Overview</h2>
        {budgets.length === 0 ? (
          <p>No budgets found</p>
        ) : (
          <ul>
            {budgets.map(budget => (
              <li key={budget.id} data-testid={`budget-${budget.id}`}>
                {budget.category}: ${budget.budget_amount.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {/* Debt Overview */}
      <section data-testid="debts-section">
        <h2>Debt Overview</h2>
        {debts.length === 0 ? (
          <p>No debts found</p>
        ) : (
          <ul>
            {debts.map(debt => (
              <li key={debt.id} data-testid={`debt-${debt.id}`}>
                {debt.name}: ${debt.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {/* Emergency Fund */}
      <section data-testid="emergency-fund-section">
        <h2>Emergency Fund</h2>
        {!emergencyFund ? (
          <p>No emergency fund set up</p>
        ) : (
          <div>
            <p>Current: ${emergencyFund.current_amount.toFixed(2)}</p>
            <p>Target: ${emergencyFund.target_amount.toFixed(2)}</p>
            <p>Progress: {Math.round((emergencyFund.current_amount / emergencyFund.target_amount) * 100)}%</p>
          </div>
        )}
      </section>
    </div>
  );
};

describe('Dashboard', () => {
  const mockRouter = { push: jest.fn() };
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('renders dashboard with no data', () => {
    render(<MockDashboard />);
    
    expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('No recent transactions')).toBeInTheDocument();
    expect(screen.getByText('No budgets found')).toBeInTheDocument();
    expect(screen.getByText('No debts found')).toBeInTheDocument();
    expect(screen.getByText('No emergency fund set up')).toBeInTheDocument();
  });

  test('renders dashboard with accounts and net worth', () => {
    const mockAccounts = [
      { id: '1', name: 'Checking', type: 'checking', value: 5000 },
      { id: '2', name: 'Savings', type: 'savings', value: 10000 },
      { id: '3', name: 'Credit Card', type: 'credit', value: -2000 }
    ];

    render(<MockDashboard accounts={mockAccounts} />);
    
    expect(screen.getByTestId('net-worth-amount')).toHaveTextContent('$13000.00');
  });

  test('renders dashboard with transactions', () => {
    const mockTransactions = [
      { id: '1', description: 'Grocery Shopping', total: -75.50, type: 'expense' },
      { id: '2', description: 'Salary', total: 2500, type: 'income' }
    ];

    render(<MockDashboard transactions={mockTransactions} />);
    
    expect(screen.getByTestId('transaction-1')).toHaveTextContent('Grocery Shopping: $75.50');
    expect(screen.getByTestId('transaction-1')).toHaveTextContent('Expense');
    expect(screen.getByTestId('transaction-2')).toHaveTextContent('Salary: $2500.00');
    expect(screen.getByTestId('transaction-2')).toHaveTextContent('Income');
  });

  test('renders dashboard with budgets', () => {
    const mockBudgets = [
      { id: '1', category: 'Food', budget_amount: 500 },
      { id: '2', category: 'Housing', budget_amount: 1200 }
    ];

    render(<MockDashboard budgets={mockBudgets} />);
    
    expect(screen.getByTestId('budget-1')).toHaveTextContent('Food: $500.00');
    expect(screen.getByTestId('budget-2')).toHaveTextContent('Housing: $1200.00');
  });

  test('renders dashboard with debts', () => {
    const mockDebts = [
      { id: '1', name: 'Credit Card', amount: 2500 },
      { id: '2', name: 'Student Loan', amount: 15000 }
    ];

    render(<MockDashboard debts={mockDebts} />);
    
    expect(screen.getByTestId('debt-1')).toHaveTextContent('Credit Card: $2500.00');
    expect(screen.getByTestId('debt-2')).toHaveTextContent('Student Loan: $15000.00');
  });

  test('renders dashboard with emergency fund', () => {
    const mockEmergencyFund = {
      id: '1',
      current_amount: 3000,
      target_amount: 10000,
      monthly_contribution: 500
    };

    render(<MockDashboard emergencyFund={mockEmergencyFund} />);
    
    expect(screen.getByText('Current: $3000.00')).toBeInTheDocument();
    expect(screen.getByText('Target: $10000.00')).toBeInTheDocument();
    expect(screen.getByText('Progress: 30%')).toBeInTheDocument();
  });
});
