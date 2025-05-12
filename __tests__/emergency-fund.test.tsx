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

// Mock emergency fund form component for testing
const MockEmergencyFundForm = ({ onSubmit, initialFund = null }) => {
  return (
    <form data-testid="emergency-fund-form" onSubmit={(e) => { 
      e.preventDefault(); 
      onSubmit({
        current_amount: initialFund?.current_amount || 2500,
        target_amount: initialFund?.target_amount || 10000,
        monthly_contribution: initialFund?.monthly_contribution || 500
      }); 
    }}>
      <h2>Emergency Fund</h2>
      
      <label htmlFor="current_amount">Current Amount</label>
      <input 
        id="current_amount" 
        type="number" 
        data-testid="current-amount"
        defaultValue={initialFund?.current_amount || 2500} 
      />
      
      <label htmlFor="target_amount">Target Amount</label>
      <input 
        id="target_amount" 
        type="number" 
        data-testid="target-amount"
        defaultValue={initialFund?.target_amount || 10000} 
      />
      
      <label htmlFor="monthly_contribution">Monthly Contribution</label>
      <input 
        id="monthly_contribution" 
        type="number" 
        data-testid="monthly-contribution"
        defaultValue={initialFund?.monthly_contribution || 500} 
      />
      
      <button type="submit">
        {initialFund ? 'Update Emergency Fund' : 'Create Emergency Fund'}
      </button>
    </form>
  );
};

// Mock emergency fund dashboard component for testing
const MockEmergencyFundDashboard = ({ fund }) => {
  return (
    <div data-testid="emergency-fund-dashboard">
      <h2>Emergency Fund Dashboard</h2>
      <div data-testid="progress-bar" style={{ width: `${(fund.current_amount / fund.target_amount) * 100}%` }}></div>
      <p data-testid="current-amount">Current: ${fund.current_amount}</p>
      <p data-testid="target-amount">Target: ${fund.target_amount}</p>
      <p data-testid="progress-percentage">
        {Math.round((fund.current_amount / fund.target_amount) * 100)}% Complete
      </p>
      <p data-testid="monthly-contribution">
        Monthly Contribution: ${fund.monthly_contribution}
      </p>
      <p data-testid="months-remaining">
        {Math.ceil((fund.target_amount - fund.current_amount) / fund.monthly_contribution)} months to reach goal
      </p>
    </div>
  );
};

describe('Emergency Fund Management', () => {
  const mockRouter = { push: jest.fn(), refresh: jest.fn() };
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('renders the emergency fund form', () => {
    render(<MockEmergencyFundForm onSubmit={jest.fn()} />);
    
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Contribution/i)).toBeInTheDocument();
    expect(screen.getByText('Create Emergency Fund')).toBeInTheDocument();
  });

  test('renders the form with initial values when editing', () => {
    const mockFund = {
      id: 'test-fund-id',
      current_amount: 3500,
      target_amount: 15000,
      monthly_contribution: 750
    };

    render(<MockEmergencyFundForm onSubmit={jest.fn()} initialFund={mockFund} />);
    
    expect(screen.getByTestId('current-amount')).toHaveValue(3500);
    expect(screen.getByTestId('target-amount')).toHaveValue(15000);
    expect(screen.getByTestId('monthly-contribution')).toHaveValue(750);
    expect(screen.getByText('Update Emergency Fund')).toBeInTheDocument();
  });

  test('submits emergency fund data when form is submitted', async () => {
    const mockOnSubmit = jest.fn();

    render(<MockEmergencyFundForm onSubmit={mockOnSubmit} />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Emergency Fund'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        current_amount: 2500,
        target_amount: 10000,
        monthly_contribution: 500
      });
    });
  });

  test('handles emergency fund creation with Supabase', async () => {
    // This test simulates how the actual component would interact with Supabase
    const handleCreateFund = async (fundData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('emergency_funds')
        .insert({
          ...fundData,
          user_id: 'test-user-id'
        })
        .select();
      
      if (error) {
        toast.error('Failed to create emergency fund');
        return false;
      }
      
      toast.success('Emergency fund created successfully!');
      return true;
    };
    
    // Mock successful insertion
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockReturnValue({ error: null, data: [{ id: 'new-fund-id' }] }),
    });
    
    const result = await handleCreateFund({
      current_amount: 2500,
      target_amount: 10000,
      monthly_contribution: 500
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('emergency_funds');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      current_amount: 2500,
      target_amount: 10000,
      monthly_contribution: 500,
      user_id: 'test-user-id'
    });
    expect(toast.success).toHaveBeenCalledWith('Emergency fund created successfully!');
  });

  test('handles emergency fund update with Supabase', async () => {
    // This test simulates how the component would handle updates
    const handleUpdateFund = async (fundId, fundData) => {
      const supabase = createClientComponentClient();
      
      const { error } = await supabase
        .from('emergency_funds')
        .update(fundData)
        .eq('id', fundId);
      
      if (error) {
        toast.error('Failed to update emergency fund');
        return false;
      }
      
      toast.success('Emergency fund updated successfully!');
      return true;
    };
    
    // Set up the mock chain for this specific test
    const mockEq = jest.fn().mockReturnValue({ error: null });
    mockSupabase.update.mockReturnValue({ eq: mockEq });
    
    const result = await handleUpdateFund('test-fund-id', {
      current_amount: 3000,
      target_amount: 12000,
      monthly_contribution: 600
    });
    
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('emergency_funds');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      current_amount: 3000,
      target_amount: 12000,
      monthly_contribution: 600
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'test-fund-id');
    expect(toast.success).toHaveBeenCalledWith('Emergency fund updated successfully!');
  });

  test('renders the emergency fund dashboard with correct calculations', () => {
    const mockFund = {
      id: 'test-fund-id',
      current_amount: 4000,
      target_amount: 12000,
      monthly_contribution: 500
    };

    render(<MockEmergencyFundDashboard fund={mockFund} />);
    
    expect(screen.getByText('Emergency Fund Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('current-amount')).toHaveTextContent('Current: $4000');
    expect(screen.getByTestId('target-amount')).toHaveTextContent('Target: $12000');
    expect(screen.getByTestId('progress-percentage')).toHaveTextContent('33% Complete');
    expect(screen.getByTestId('monthly-contribution')).toHaveTextContent('Monthly Contribution: $500');
    expect(screen.getByTestId('months-remaining')).toHaveTextContent('16 months to reach goal');
    
    // Check progress bar width (should be 33% of container)
    const progressBar = screen.getByTestId('progress-bar');
    // Use a more flexible approach to handle floating point precision issues
    expect(parseFloat(progressBar.style.width)).toBeCloseTo(33.33, 2);
  });
});
