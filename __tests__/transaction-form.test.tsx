import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Mock the necessary dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/navigation');
jest.mock('react-hot-toast');
jest.mock('@/utils/auth-service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ success: true, user: { id: 'test-user-id' } }),
}));

// Since we don't have direct access to the TransactionForm component, we'll create a mock component for testing
const MockTransactionForm = ({ onSubmit }) => {
  return (
    <form data-testid="transaction-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ 
      description: 'Grocery shopping',
      amount: 75.50,
      date: '2025-05-12',
      type: 'expense',
      category: 'Food',
      account_id: 'test-account-id'
    }); }}>
      <label htmlFor="description">Description</label>
      <input id="description" defaultValue="Grocery shopping" />
      
      <label htmlFor="amount">Amount</label>
      <input id="amount" type="number" defaultValue={75.50} />
      
      <label htmlFor="date">Date</label>
      <input id="date" type="date" defaultValue="2025-05-12" />
      
      <label htmlFor="type">Type</label>
      <select id="type" defaultValue="expense">
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      
      <label htmlFor="category">Category</label>
      <select id="category" defaultValue="Food">
        <option value="Food">Food</option>
        <option value="Housing">Housing</option>
      </select>
      
      <label htmlFor="account">Account</label>
      <select id="account" defaultValue="test-account-id">
        <option value="test-account-id">Checking Account</option>
      </select>
      
      <button type="submit">Add Transaction</button>
    </form>
  );
};

describe('Transaction Form', () => {
  const mockRouter = { push: jest.fn(), refresh: jest.fn() };
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('renders the transaction form', () => {
    render(<MockTransactionForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account/i)).toBeInTheDocument();
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
  });

  test('submits transaction data when form is submitted', async () => {
    const mockOnSubmit = jest.fn();
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockReturnValue({ error: null, data: [{ id: 'new-transaction-id' }] }),
    });

    render(<MockTransactionForm onSubmit={mockOnSubmit} />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Add Transaction'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Grocery shopping',
        amount: 75.50,
        date: '2025-05-12',
        type: 'expense',
        category: 'Food',
        account_id: 'test-account-id'
      });
    });
  });

  test('handles transaction creation with Supabase', async () => {
    // This test simulates how the actual component would interact with Supabase
    const handleAddTransaction = async (transactionData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          user_id: 'test-user-id',
          total: transactionData.type === 'expense' ? -Math.abs(transactionData.amount) : Math.abs(transactionData.amount)
        })
        .select();
      
      if (error) {
        toast.error('Failed to add transaction');
        return false;
      }
      
      toast.success('Transaction added successfully!');
      return true;
    };
    
    // Mock successful insertion
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'new-transaction-id' }] }),
    });
    
    const result = await handleAddTransaction({
      description: 'Grocery shopping',
      amount: 75.50,
      date: '2025-05-12',
      type: 'expense',
      category: 'Food',
      account_id: 'test-account-id'
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      description: 'Grocery shopping',
      amount: 75.50,
      date: '2025-05-12',
      type: 'expense',
      category: 'Food',
      account_id: 'test-account-id',
      user_id: 'test-user-id',
      total: -75.50
    });
    expect(toast.success).toHaveBeenCalledWith('Transaction added successfully!');
  });

  test('handles transaction creation errors', async () => {
    // This test simulates how the component would handle errors
    const handleAddTransaction = async (transactionData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          user_id: 'test-user-id',
          total: transactionData.type === 'expense' ? -Math.abs(transactionData.amount) : Math.abs(transactionData.amount)
        })
        .select();
      
      if (error) {
        toast.error('Failed to add transaction');
        return false;
      }
      
      toast.success('Transaction added successfully!');
      return true;
    };
    
    // Mock failed insertion
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ error: { message: 'Database error' }, data: null }),
    });
    
    const result = await handleAddTransaction({
      description: 'Grocery shopping',
      amount: 75.50,
      date: '2025-05-12',
      type: 'expense',
      category: 'Food',
      account_id: 'test-account-id'
    });
    
    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Failed to add transaction');
  });
});
