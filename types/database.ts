export type Account = {
  id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  notes?: string;
  created_at: string;
  user_id: string;
};

export type AccountBalance = {
  account_id: string;
  account_name: string;
  account_type: string;
  transaction_total: number;
  account_initial_value: number;
  current_value: number;
};

export type Budget = {
  id: string;
  category: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  user_id?: string;
};

export type Debt = {
  id: string;
  name: string;
  amount: number;
  interest_rate: number;
  min_payment: number;
  due_date: string;
  strategy: 'Avalanche' | 'Snowball';
  notes?: string;
  created_at: string;
  user_id?: string;
};

export type EmergencyFund = {
  id: string;
  goal_amount: number;
  current_amount: number;
  target_months: number;
  notes?: string;
  created_at: string;
  user_id?: string;
};

export type NetWorth = {
  total_assets: number;
  total_debts: number;
  net_worth: number;
  user_id?: string;
};

export type Transaction = {
  id: string;
  date: string;
  month: string;
  account_id: string;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  total: number;
  created_at: string;
  user_id?: string;
  account_name?: string; // For UI display
  notes?: string;
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name?: string;
  currency?: string;
  preferences?: {
    darkMode?: boolean;
    notifications?: boolean;
  };
  updated_at?: string;
};
