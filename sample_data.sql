-- Sample data for Finance509 application
-- This script inserts sample data into all tables except users

-- Sample user ID (replace with an actual user ID from your auth.users table)
-- You'll need to replace this with an actual user ID after a user signs up
DO $$
DECLARE
  sample_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with actual user ID
BEGIN

-- Sample data for accounts table
INSERT INTO accounts (id, name, type, value, currency, notes, created_at, user_id) VALUES
  (gen_random_uuid(), 'Checking Account', 'Checking', 5000.00, 'USD', 'Primary checking account', NOW(), sample_user_id),
  (gen_random_uuid(), 'Savings Account', 'Savings', 15000.00, 'USD', 'Emergency fund savings', NOW(), sample_user_id),
  (gen_random_uuid(), 'Investment Account', 'Investment', 25000.00, 'USD', 'Stock portfolio', NOW(), sample_user_id),
  (gen_random_uuid(), 'Retirement 401(k)', 'Retirement', 75000.00, 'USD', 'Employer 401(k) plan', NOW(), sample_user_id),
  (gen_random_uuid(), 'Credit Card', 'Credit', -2500.00, 'USD', 'Main credit card', NOW(), sample_user_id);

-- Sample data for account_balances table
-- First, get the account IDs we just created
WITH account_data AS (
  SELECT id, name, type, value
  FROM accounts
  WHERE user_id = sample_user_id
  ORDER BY created_at
  LIMIT 5
)
INSERT INTO account_balances (account_id, account_name, account_type, transaction_total, account_initial_value, current_value)
SELECT 
  id,
  name,
  type,
  CASE 
    WHEN type = 'Checking' THEN -500.00
    WHEN type = 'Savings' THEN 1000.00
    WHEN type = 'Investment' THEN 2500.00
    WHEN type = 'Retirement' THEN 5000.00
    WHEN type = 'Credit' THEN -500.00
  END as transaction_total,
  value as account_initial_value,
  value + 
  CASE 
    WHEN type = 'Checking' THEN -500.00
    WHEN type = 'Savings' THEN 1000.00
    WHEN type = 'Investment' THEN 2500.00
    WHEN type = 'Retirement' THEN 5000.00
    WHEN type = 'Credit' THEN -500.00
  END as current_value
FROM account_data;

-- Sample data for transactions table
WITH account_data AS (
  SELECT id, type
  FROM accounts
  WHERE user_id = sample_user_id
  ORDER BY created_at
  LIMIT 5
)
INSERT INTO transactions (id, date, month, account_id, type, category, description, total, created_at)
SELECT 
  gen_random_uuid(),
  CURRENT_DATE - (i * INTERVAL '1 day'),
  to_char(CURRENT_DATE - (i * INTERVAL '1 day'), 'Month'),
  (SELECT id FROM account_data WHERE type = 
    CASE 
      WHEN i % 5 = 0 THEN 'Checking'
      WHEN i % 5 = 1 THEN 'Savings'
      WHEN i % 5 = 2 THEN 'Investment'
      WHEN i % 5 = 3 THEN 'Retirement'
      ELSE 'Credit'
    END
  ),
  CASE 
    WHEN i % 2 = 0 THEN 'Expense'
    ELSE 'Income'
  END,
  CASE 
    WHEN i % 7 = 0 THEN 'Food'
    WHEN i % 7 = 1 THEN 'Transportation'
    WHEN i % 7 = 2 THEN 'Housing'
    WHEN i % 7 = 3 THEN 'Utilities'
    WHEN i % 7 = 4 THEN 'Entertainment'
    WHEN i % 7 = 5 THEN 'Healthcare'
    ELSE 'Miscellaneous'
  END,
  CASE 
    WHEN i % 7 = 0 THEN 'Grocery shopping'
    WHEN i % 7 = 1 THEN 'Gas station'
    WHEN i % 7 = 2 THEN 'Rent payment'
    WHEN i % 7 = 3 THEN 'Electricity bill'
    WHEN i % 7 = 4 THEN 'Movie tickets'
    WHEN i % 7 = 5 THEN 'Pharmacy'
    ELSE 'Other expense'
  END,
  CASE 
    WHEN i % 2 = 0 THEN (random() * 200)::numeric(10,2) * -1
    ELSE (random() * 1000 + 500)::numeric(10,2)
  END,
  NOW() - (i * INTERVAL '1 day')
FROM generate_series(0, 30) AS i;

-- Sample data for budgets table
INSERT INTO budgets (id, category, budget_amount, start_date, end_date, created_at) VALUES
  (gen_random_uuid(), 'Food', 500.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Transportation', 300.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Housing', 1500.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Utilities', 200.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Entertainment', 250.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Healthcare', 150.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'Miscellaneous', 200.00, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', NOW());

-- Sample data for debts table
INSERT INTO debts (id, name, amount, interest_rate, min_payment, due_date, strategy, notes, created_at) VALUES
  (gen_random_uuid(), 'Student Loan', 25000.00, 4.5, 250.00, date_trunc('month', CURRENT_DATE) + INTERVAL '15 days', 'Avalanche', 'Federal student loan', NOW()),
  (gen_random_uuid(), 'Car Loan', 15000.00, 3.9, 350.00, date_trunc('month', CURRENT_DATE) + INTERVAL '10 days', 'Snowball', 'Auto loan for Honda Civic', NOW()),
  (gen_random_uuid(), 'Credit Card 1', 3500.00, 18.99, 100.00, date_trunc('month', CURRENT_DATE) + INTERVAL '20 days', 'Avalanche', 'High interest credit card', NOW()),
  (gen_random_uuid(), 'Credit Card 2', 1200.00, 15.99, 50.00, date_trunc('month', CURRENT_DATE) + INTERVAL '25 days', 'Avalanche', 'Department store card', NOW()),
  (gen_random_uuid(), 'Personal Loan', 5000.00, 8.5, 150.00, date_trunc('month', CURRENT_DATE) + INTERVAL '5 days', 'Snowball', 'Consolidation loan', NOW());

-- Sample data for emergency_fund table
INSERT INTO emergency_fund (id, goal_amount, current_amount, target_months, notes, created_at) VALUES
  (gen_random_uuid(), 15000.00, 7500.00, 6, 'Building emergency fund for 6 months of expenses', NOW());

-- Sample data for net_worth table
INSERT INTO net_worth (total_assets, total_debts, net_worth) VALUES
  (120000.00, 49700.00, 70300.00);

END $$;
