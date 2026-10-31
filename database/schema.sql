-- 1. Workers Table
-- Stores information about each worker.
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  worker_id character varying NOT NULL,
  name character varying NOT NULL,
  phone character varying NULL,
  address text NULL,
  work_type character varying NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT workers_pkey PRIMARY KEY (id),
  CONSTRAINT workers_worker_id_key UNIQUE (worker_id)
);

-- 2. Production Table
-- Tracks saree production records, linked to a worker.
CREATE TABLE IF NOT EXISTS public.production (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  production_date date NOT NULL,
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  saree_type character varying NOT NULL,
  quantity integer NOT NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT production_pkey PRIMARY KEY (id)
);

-- 3. Sales Table
-- Tracks all sales records.
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sale_date date NOT NULL,
  buyer_name character varying NOT NULL,
  location character varying NULL,
  saree_type character varying NOT NULL,
  quantity integer NOT NULL,
  price_per_unit numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT sales_pkey PRIMARY KEY (id)
);

-- 4. Factories Table
-- Stores information about your factories
CREATE TABLE IF NOT EXISTS public.factories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  factory_name character varying NOT NULL,
  location character varying NULL,
  contact_person character varying NULL,
  phone character varying NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT factories_pkey PRIMARY KEY (id)
);

-- 5. Material Types Table
-- Stores material types (cones, warps, pagadi, etc.)
CREATE TABLE IF NOT EXISTS public.material_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  material_name character varying NOT NULL,
  category character varying NOT NULL, -- 'cone', 'warp', 'other'
  unit character varying NOT NULL, -- 'pieces', 'kg', 'box'
  cost_per_unit numeric NULL DEFAULT 0,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT material_types_pkey PRIMARY KEY (id),
  CONSTRAINT material_types_name_key UNIQUE (material_name)
);

-- 6. Cone Colors Table
-- Stores all cone color variants with their sections
CREATE TABLE IF NOT EXISTS public.cone_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  color_name character varying NOT NULL,
  section character varying NOT NULL, -- 'section_1', 'section_2', 'section_3'
  color_code character varying NULL, -- hex color for UI
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT cone_colors_pkey PRIMARY KEY (id),
  CONSTRAINT cone_colors_color_key UNIQUE (color_name)
);

-- 7. Material Inventory Tracking Table
-- Weekly tracking of material purchases, usage, and remaining stock
CREATE TABLE IF NOT EXISTS public.material_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  factory_id uuid NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  color_id uuid NULL REFERENCES public.cone_colors(id) ON DELETE SET NULL,
  week_date date NOT NULL,
  purchased_quantity numeric NOT NULL DEFAULT 0,
  used_quantity numeric NOT NULL DEFAULT 0,
  remaining_quantity numeric NOT NULL DEFAULT 0,
  reorder_point numeric NULL, -- threshold to know when to buy
  supplier character varying NULL,
  cost_per_unit numeric NULL,
  total_cost numeric NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT material_inventory_pkey PRIMARY KEY (id)
);

-- 8. Material Transactions Table (for detailed usage tracking)
-- Tracks each usage/purchase of materials
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  factory_id uuid NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  color_id uuid NULL REFERENCES public.cone_colors(id) ON DELETE SET NULL,
  transaction_type character varying NOT NULL, -- 'purchase', 'usage'
  quantity numeric NOT NULL,
  transaction_date date NOT NULL,
  supplier character varying NULL,
  cost_per_unit numeric NULL,
  total_cost numeric NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT material_transactions_pkey PRIMARY KEY (id)
);

-- 5. Worker Payments Table
-- Tracks weekly payments to workers based on production.
CREATE TABLE IF NOT EXISTS public.worker_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  payment_week date NOT NULL,
  sarees_produced integer NOT NULL DEFAULT 0,
  rate_per_saree numeric NOT NULL DEFAULT 220,
  weekly_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_remaining numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'pending', -- pending, partial, paid
  payment_date timestamp with time zone NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT worker_payments_pkey PRIMARY KEY (id)
);

-- 6. Payment Advances Table
-- Tracks advance payments given to workers.
CREATE TABLE IF NOT EXISTS public.payment_advances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  worker_payment_id uuid NOT NULL REFERENCES public.worker_payments(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  advance_amount numeric NOT NULL,
  advance_date timestamp with time zone NOT NULL DEFAULT now(),
  notes character varying NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  CONSTRAINT payment_advances_pkey PRIMARY KEY (id)
);


-- 9. Enable Row Level Security (RLS)
-- This is a security best practice for all tables.
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cone_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_advances ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies
-- These policies allow any logged-in user to read/write all data.
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.workers;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.production;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.factories;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.material_types;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.cone_colors;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.material_inventory;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.material_transactions;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.worker_payments;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.payment_advances;

-- Create policies
CREATE POLICY "Allow all access to authenticated users"
ON public.workers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.production
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.sales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.factories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.material_types
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.cone_colors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.material_inventory
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.material_transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.worker_payments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users"
ON public.payment_advances
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. Insert Default Factories
INSERT INTO public.factories (factory_name, location) VALUES
('Factory 1', 'Location 1'),
('Factory 2', 'Location 2')
ON CONFLICT DO NOTHING;

-- 12. Insert Default Material Types
INSERT INTO public.material_types (material_name, category, unit) VALUES
('Cones', 'cone', 'pieces'),
('Warps', 'warp', 'pieces'),
('Pagadi', 'other', 'pieces'),
('Kalabat', 'other', 'pieces')
ON CONFLICT DO NOTHING;

-- 13. Insert Default Cone Colors
-- Section 1: Basic colors
INSERT INTO public.cone_colors (color_name, section, color_code) VALUES
('Green', 'section_1', '#22c55e'),
('Ananda', 'section_1', '#f59e0b'),
('Light Gold', 'section_1', '#fbbf24'),
('Magantha', 'section_1', '#d946ef'),
('Violet', 'section_1', '#8b5cf6'),
('Red Zero', 'section_1', '#ef4444'),
('Rani Zero', 'section_1', '#ec4899'),
('Rama', 'section_1', '#6366f1')
ON CONFLICT DO NOTHING;

-- Section 2: Premium variants
INSERT INTO public.cone_colors (color_name, section, color_code) VALUES
('Red 110', 'section_2', '#dc2626'),
('Red 150', 'section_2', '#b91c1c'),
('Rama 110', 'section_2', '#4f46e5'),
('Rama 150', 'section_2', '#4338ca'),
('Rani 110', 'section_2', '#be185d'),
('Rani 150', 'section_2', '#9d174d')
ON CONFLICT DO NOTHING;

-- Section 3: Special
INSERT INTO public.cone_colors (color_name, section, color_code) VALUES
('Kalabat', 'section_3', '#1f2937')
ON CONFLICT DO NOTHING;

-- Harden writes while keeping shared read access for authenticated staff.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'workers', 'production', 'sales', 'factories', 'material_types',
    'cone_colors', 'material_inventory', 'material_transactions',
    'worker_payments', 'payment_advances'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Authenticated users can read %s" ON public.%I FOR SELECT TO authenticated USING (true)', table_name, table_name);
    EXECUTE format('CREATE POLICY "Owners can write %s" ON public.%I FOR ALL TO authenticated USING (created_by = (select auth.uid())) WITH CHECK (created_by = (select auth.uid()))', table_name, table_name);
  END LOOP;
END $$;