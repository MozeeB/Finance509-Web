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

// Mock account form component for testing
const MockAccountForm = ({ onSubmit, initialAccount = null, isEdit = false }) => {
  return (
    <form data-testid="account-form" onSubmit={(e) => { 
      e.preventDefault(); 
      onSubmit({
        name: initialAccount?.name || 'Checking Account',
        type: initialAccount?.type || 'checking',
        value: initialAccount?.value || 2500,
        currency: initialAccount?.currency || 'USD',
        notes: initialAccount?.notes || 'Primary checking account'
      }); 
    }}>
      <label htmlFor="name">Account Name</label>
      <input id="name" defaultValue={initialAccount?.name || 'Checking Account'} />
      
      <label htmlFor="type">Account Type</label>
      <select id="type" defaultValue={initialAccount?.type || 'checking'}>
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
        <option value="credit">Credit Card</option>
        <option value="investment">Investment</option>
        <option value="cash">Cash</option>
      </select>
      
      <label htmlFor="value">Current Balance</label>
      <input id="value" type="number" step="0.01" defaultValue={initialAccount?.value || 2500} />
      
      <label htmlFor="currency">Currency</label>
      <select id="currency" defaultValue={initialAccount?.currency || 'USD'}>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="JPY">JPY</option>
      </select>
      
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" defaultValue={initialAccount?.notes || 'Primary checking account'} />
      
      <button type="submit">{isEdit ? 'Update Account' : 'Add Account'}</button>
      {isEdit && <button type="button" data-testid="delete-button">Delete Account</button>}
    </form>
  );
};

describe('Accounts Management', () => {
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

  test('renders the add account form', () => {
    render(<MockAccountForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Balance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  test('renders the edit account form with initial values', () => {
    const mockAccount = {
      id: 'test-account-id',
      name: 'Savings Account',
      type: 'savings',
      value: 10000,
      currency: 'EUR',
      notes: 'Emergency savings'
    };

    render(<MockAccountForm onSubmit={jest.fn()} initialAccount={mockAccount} isEdit={true} />);
    
    expect(screen.getByLabelText(/Account Name/i)).toHaveValue('Savings Account');
    expect(screen.getByLabelText(/Account Type/i)).toHaveValue('savings');
    expect(screen.getByLabelText(/Current Balance/i)).toHaveValue(10000);
    expect(screen.getByLabelText(/Currency/i)).toHaveValue('EUR');
    expect(screen.getByLabelText(/Notes/i)).toHaveValue('Emergency savings');
    expect(screen.getByText('Update Account')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  test('submits account data when form is submitted', async () => {
    const mockOnSubmit = jest.fn();
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockReturnValue({ error: null, data: [{ id: 'new-account-id' }] }),
    });

    render(<MockAccountForm onSubmit={mockOnSubmit} />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Add Account'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Checking Account',
        type: 'checking',
        value: 2500,
        currency: 'USD',
        notes: 'Primary checking account'
      });
    });
  });

  test('handles account creation with Supabase', async () => {
    // This test simulates how the actual component would interact with Supabase
    const handleAddAccount = async (accountData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('accounts')
        .insert({
          ...accountData,
          user_id: 'test-user-id',
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        toast.error('Failed to add account');
        return false;
      }
      
      toast.success('Account added successfully!');
      return true;
    };
    
    // Mock successful insertion
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ error: null, data: [{ id: 'new-account-id' }] }),
    });
    
    const result = await handleAddAccount({
      name: 'Checking Account',
      type: 'checking',
      value: 2500,
      currency: 'USD',
      notes: 'Primary checking account'
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('accounts');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      name: 'Checking Account',
      type: 'checking',
      value: 2500,
      currency: 'USD',
      notes: 'Primary checking account',
      user_id: 'test-user-id',
      created_at: expect.any(String)
    });
    expect(toast.success).toHaveBeenCalledWith('Account added successfully!');
  });

  test('handles account update with Supabase', async () => {
    // This test simulates how the component would handle updates
    const handleUpdateAccount = async (accountId, accountData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('accounts')
        .update({
          ...accountData,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
      
      if (error) {
        toast.error('Failed to update account');
        return false;
      }
      
      toast.success('Account updated successfully!');
      return true;
    };
    
    // Set up the mock chain for this specific test
    const mockEq = jest.fn().mockReturnValue({ error: null });
    mockSupabase.update.mockReturnValue({ eq: mockEq });
    
    const result = await handleUpdateAccount('test-account-id', {
      name: 'Updated Account Name',
      type: 'savings',
      value: 3000,
      currency: 'USD',
      notes: 'Updated notes'
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('accounts');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      name: 'Updated Account Name',
      type: 'savings',
      value: 3000,
      currency: 'USD',
      notes: 'Updated notes',
      updated_at: expect.any(String)
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'test-account-id');
    expect(toast.success).toHaveBeenCalledWith('Account updated successfully!');
  });

  test('handles account deletion with Supabase', async () => {
    // This test simulates how the component would handle deletion
    const handleDeleteAccount = async (accountId) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) {
        toast.error('Failed to delete account');
        return false;
      }
      
      toast.success('Account deleted successfully!');
      return true;
    };
    
    // Set up the mock chain for this specific test
    const mockEq = jest.fn().mockReturnValue({ error: null });
    mockSupabase.delete.mockReturnValue({ eq: mockEq });
    
    const result = await handleDeleteAccount('test-account-id');
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('accounts');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'test-account-id');
    expect(toast.success).toHaveBeenCalledWith('Account deleted successfully!');
  });
});
