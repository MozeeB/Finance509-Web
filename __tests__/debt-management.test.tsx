import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import '@testing-library/jest-dom';

// Mock the necessary dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/navigation');
jest.mock('react-hot-toast');
jest.mock('@/utils/auth-service', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ success: true, user: { id: 'test-user-id' } }),
}));

// Mock debt form component for testing
const MockDebtForm = ({ onSubmit, initialDebt = null, isEdit = false }) => {
  return (
    <form data-testid="debt-form" onSubmit={(e) => { 
      e.preventDefault(); 
      onSubmit({
        name: initialDebt?.name || 'Credit Card Debt',
        amount: initialDebt?.amount || 5000,
        interest_rate: initialDebt?.interest_rate || 18.99,
        min_payment: initialDebt?.min_payment || 150,
        due_date: initialDebt?.due_date || '2025-05-20',
        strategy: initialDebt?.strategy || 'avalanche'
      }); 
    }}>
      <label htmlFor="name">Debt Name</label>
      <input id="name" defaultValue={initialDebt?.name || 'Credit Card Debt'} />
      
      <label htmlFor="amount">Amount</label>
      <input id="amount" type="number" defaultValue={initialDebt?.amount || 5000} />
      
      <label htmlFor="interest_rate">Interest Rate (%)</label>
      <input id="interest_rate" type="number" step="0.01" defaultValue={initialDebt?.interest_rate || 18.99} />
      
      <label htmlFor="min_payment">Minimum Payment</label>
      <input id="min_payment" type="number" defaultValue={initialDebt?.min_payment || 150} />
      
      <label htmlFor="due_date">Due Date</label>
      <input id="due_date" type="date" defaultValue={initialDebt?.due_date || '2025-05-20'} />
      
      <label htmlFor="strategy">Repayment Strategy</label>
      <select id="strategy" defaultValue={initialDebt?.strategy || 'avalanche'}>
        <option value="avalanche">Avalanche (Highest Interest First)</option>
        <option value="snowball">Snowball (Smallest Balance First)</option>
      </select>
      
      <button type="submit">{isEdit ? 'Update Debt' : 'Add Debt'}</button>
      {isEdit && <button type="button" data-testid="delete-button">Delete Debt</button>}
    </form>
  );
};

describe('Debt Management', () => {
  const mockRouter = { push: jest.fn(), refresh: jest.fn() };
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('renders the add debt form', () => {
    render(<MockDebtForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/Debt Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interest Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum Payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Repayment Strategy/i)).toBeInTheDocument();
    expect(screen.getByText('Add Debt')).toBeInTheDocument();
  });

  test('renders the edit debt form with initial values', () => {
    const mockDebt = {
      id: 'test-debt-id',
      name: 'Student Loan',
      amount: 15000,
      interest_rate: 4.5,
      min_payment: 200,
      due_date: '2025-06-15',
      strategy: 'snowball'
    };

    render(<MockDebtForm onSubmit={jest.fn()} initialDebt={mockDebt} isEdit={true} />);
    
    expect(screen.getByLabelText(/Debt Name/i)).toHaveValue('Student Loan');
    expect(screen.getByLabelText(/Amount/i)).toHaveValue(15000);
    expect(screen.getByLabelText(/Interest Rate/i)).toHaveValue(4.5);
    expect(screen.getByLabelText(/Minimum Payment/i)).toHaveValue(200);
    expect(screen.getByLabelText(/Due Date/i)).toHaveValue('2025-06-15');
    expect(screen.getByLabelText(/Repayment Strategy/i)).toHaveValue('snowball');
    expect(screen.getByText('Update Debt')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  test('submits debt data when form is submitted', async () => {
    const mockOnSubmit = jest.fn();
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockReturnValue({ error: null, data: [{ id: 'new-debt-id' }] }),
    });

    render(<MockDebtForm onSubmit={mockOnSubmit} />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Add Debt'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Credit Card Debt',
        amount: 5000,
        interest_rate: 18.99,
        min_payment: 150,
        due_date: '2025-05-20',
        strategy: 'avalanche'
      });
    });
  });

  test('handles debt creation with Supabase', async () => {
    // This test simulates how the actual component would interact with Supabase
    const handleAddDebt = async (debtData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('debts')
        .insert({
          ...debtData
        })
        .select();
      
      if (error) {
        toast.error('Failed to add debt');
        return false;
      }
      
      toast.success('Debt added successfully!');
      return true;
    };
    
    // Mock successful insertion
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'new-debt-id' }] }),
    });
    
    const result = await handleAddDebt({
      name: 'Credit Card Debt',
      amount: 5000,
      interest_rate: 18.99,
      min_payment: 150,
      due_date: '2025-05-20',
      strategy: 'avalanche'
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('debts');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      name: 'Credit Card Debt',
      amount: 5000,
      interest_rate: 18.99,
      min_payment: 150,
      due_date: '2025-05-20',
      strategy: 'avalanche'
    });
    expect(toast.success).toHaveBeenCalledWith('Debt added successfully!');
  });

  test('handles debt update with Supabase', async () => {
    // This test simulates how the component would handle updates
    const handleUpdateDebt = async (debtId, debtData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('debts')
        .update(debtData)
        .eq('id', debtId);
      
      if (error) {
        toast.error('Failed to update debt');
        return false;
      }
      
      toast.success('Debt updated successfully!');
      return true;
    };
    
    // Set up the mock chain for this specific test
    const mockEq = jest.fn().mockReturnValue({ error: null });
    mockSupabase.update.mockReturnValue({ eq: mockEq });
    
    const result = await handleUpdateDebt('test-debt-id', {
      name: 'Updated Debt Name',
      amount: 4500,
      interest_rate: 17.99,
      min_payment: 175,
      due_date: '2025-06-20',
      strategy: 'snowball'
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('debts');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      name: 'Updated Debt Name',
      amount: 4500,
      interest_rate: 17.99,
      min_payment: 175,
      due_date: '2025-06-20',
      strategy: 'snowball'
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'test-debt-id');
    expect(toast.success).toHaveBeenCalledWith('Debt updated successfully!');
  });

  test('handles debt deletion with Supabase', async () => {
    // This test simulates how the component would handle deletion
    const handleDeleteDebt = async (debtId) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId);
      
      if (error) {
        toast.error('Failed to delete debt');
        return false;
      }
      
      toast.success('Debt deleted successfully!');
      return true;
    };
    
    // Set up the mock chain for this specific test
    const mockEq = jest.fn().mockReturnValue({ error: null });
    mockSupabase.delete.mockReturnValue({ eq: mockEq });
    
    const result = await handleDeleteDebt('test-debt-id');
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('debts');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'test-debt-id');
    expect(toast.success).toHaveBeenCalledWith('Debt deleted successfully!');
  });
});
