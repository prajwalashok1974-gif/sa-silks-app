/*
  # SA Silks Business Management Schema

  ## Overview
  Complete database schema for managing saree manufacturing business including workers, inventory, production, and sales.

  ## New Tables
  
  ### `workers`
  - `id` (uuid, primary key)
  - `worker_id` (text, unique) - Custom worker ID
  - `name` (text) - Worker name
  - `phone` (text) - Contact number
  - `address` (text) - Worker address
  - `work_type` (text) - Type of work assigned
  - `created_at` (timestamptz) - Record creation time
  - `created_by` (uuid) - User who created the record
  
  ### `raw_materials`
  - `id` (uuid, primary key)
  - `material_name` (text) - Name of the material
  - `quantity` (decimal) - Current quantity in stock
  - `unit` (text) - Unit of measurement (kg, meters, pieces, etc.)
  - `cost_per_unit` (decimal) - Cost per unit
  - `total_cost` (decimal) - Total cost of purchase
  - `purchase_date` (date) - Date of purchase
  - `supplier` (text) - Supplier name
  - `created_at` (timestamptz) - Record creation time
  - `created_by` (uuid) - User who created the record
  
  ### `production`
  - `id` (uuid, primary key)
  - `production_date` (date) - Date of production
  - `worker_id` (uuid, foreign key) - Reference to workers table
  - `saree_type` (text) - Type of saree produced
  - `quantity` (integer) - Number of sarees produced
  - `created_at` (timestamptz) - Record creation time
  - `created_by` (uuid) - User who created the record
  
  ### `sales`
  - `id` (uuid, primary key)
  - `sale_date` (date) - Date of sale
  - `buyer_name` (text) - Name of the buyer
  - `location` (text) - Buyer location
  - `saree_type` (text) - Type of saree sold
  - `quantity` (integer) - Number of sarees sold
  - `price_per_unit` (decimal) - Price per saree
  - `total_amount` (decimal) - Total sale amount
  - `created_at` (timestamptz) - Record creation time
  - `created_by` (uuid) - User who created the record

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage all records
*/

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  work_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name text NOT NULL,
  quantity decimal NOT NULL DEFAULT 0,
  unit text NOT NULL,
  cost_per_unit decimal NOT NULL DEFAULT 0,
  total_cost decimal NOT NULL DEFAULT 0,
  purchase_date date NOT NULL,
  supplier text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create production table
CREATE TABLE IF NOT EXISTS production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date date NOT NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  saree_type text,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  buyer_name text NOT NULL,
  location text NOT NULL,
  saree_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  price_per_unit decimal NOT NULL DEFAULT 0,
  total_amount decimal NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view workers" ON workers;
DROP POLICY IF EXISTS "Authenticated users can insert workers" ON workers;
DROP POLICY IF EXISTS "Authenticated users can update workers" ON workers;
DROP POLICY IF EXISTS "Authenticated users can delete workers" ON workers;

DROP POLICY IF EXISTS "Authenticated users can view raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Authenticated users can insert raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Authenticated users can update raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Authenticated users can delete raw materials" ON raw_materials;

DROP POLICY IF EXISTS "Authenticated users can view production" ON production;
DROP POLICY IF EXISTS "Authenticated users can insert production" ON production;
DROP POLICY IF EXISTS "Authenticated users can update production" ON production;
DROP POLICY IF EXISTS "Authenticated users can delete production" ON production;

DROP POLICY IF EXISTS "Authenticated users can view sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

-- Workers policies
CREATE POLICY "Authenticated users can view workers"
  ON workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workers"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update workers"
  ON workers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete workers"
  ON workers FOR DELETE
  TO authenticated
  USING (true);

-- Raw materials policies
CREATE POLICY "Authenticated users can view raw materials"
  ON raw_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert raw materials"
  ON raw_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update raw materials"
  ON raw_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete raw materials"
  ON raw_materials FOR DELETE
  TO authenticated
  USING (true);

-- Production policies
CREATE POLICY "Authenticated users can view production"
  ON production FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert production"
  ON production FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update production"
  ON production FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete production"
  ON production FOR DELETE
  TO authenticated
  USING (true);

-- Sales policies
CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workers_worker_id ON workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_production_worker_id ON production(worker_id);
CREATE INDEX IF NOT EXISTS idx_production_date ON production(production_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

-- Create finished goods inventory table
CREATE TABLE IF NOT EXISTS finished_goods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_week date NOT NULL,
  total_produced integer NOT NULL DEFAULT 0,
  total_sold integer NOT NULL DEFAULT 0,
  remaining_inventory integer NOT NULL DEFAULT 0,
  cost_per_saree decimal DEFAULT 0,
  sale_price_per_saree decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create worker payments tracking table
CREATE TABLE IF NOT EXISTS worker_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  payment_week date NOT NULL,
  weekly_amount decimal NOT NULL DEFAULT 0,
  amount_paid decimal NOT NULL DEFAULT 0,
  amount_remaining decimal NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(worker_id, payment_week)
);

-- Create payment advances table
CREATE TABLE IF NOT EXISTS payment_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_payment_id uuid NOT NULL REFERENCES worker_payments(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  advance_amount decimal NOT NULL,
  advance_date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_advances ENABLE ROW LEVEL SECURITY;

-- Finished goods policies
CREATE POLICY "Authenticated users can view finished goods"
  ON finished_goods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert finished goods"
  ON finished_goods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update finished goods"
  ON finished_goods FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete finished goods"
  ON finished_goods FOR DELETE
  TO authenticated
  USING (true);

-- Worker payments policies
CREATE POLICY "Authenticated users can view worker payments"
  ON worker_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert worker payments"
  ON worker_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update worker payments"
  ON worker_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete worker payments"
  ON worker_payments FOR DELETE
  TO authenticated
  USING (true);

-- Payment advances policies
CREATE POLICY "Authenticated users can view payment advances"
  ON payment_advances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payment advances"
  ON payment_advances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update payment advances"
  ON payment_advances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payment advances"
  ON payment_advances FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for payment tables
CREATE INDEX IF NOT EXISTS idx_worker_payments_worker_id ON worker_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_week ON worker_payments(payment_week);
CREATE INDEX IF NOT EXISTS idx_payment_advances_worker ON payment_advances(worker_id);
CREATE INDEX IF NOT EXISTS idx_payment_advances_date ON payment_advances(advance_date);