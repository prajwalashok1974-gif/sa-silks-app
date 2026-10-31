-- Keep shared reads for authenticated staff while restricting writes to record owners.
-- Run after the canonical database/schema.sql.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'workers',
    'production',
    'sales',
    'factories',
    'material_types',
    'cone_colors',
    'material_inventory',
    'material_transactions',
    'worker_payments',
    'payment_advances'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Owners can write %s" ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY "Authenticated users can read %s" ON public.%I FOR SELECT TO authenticated USING (true)',
      table_name, table_name
    );
    EXECUTE format(
      'CREATE POLICY "Owners can write %s" ON public.%I FOR ALL TO authenticated USING (created_by = (select auth.uid())) WITH CHECK (created_by = (select auth.uid()))',
      table_name, table_name
    );
  END LOOP;
END $$;
