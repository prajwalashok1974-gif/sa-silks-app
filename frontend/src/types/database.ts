export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type AnyTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export interface Database {
  public: {
    Tables: {
      workers: {
        Row: {
          id: string;
          created_at: string;
          worker_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          work_type: string | null;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workers']['Insert']>;
      };
      production: {
        Row: {
          id: string;
          created_at: string;
          production_date: string;
          worker_id: string;
          saree_type: string;
          quantity: number;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['production']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['production']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          created_at: string;
          sale_date: string;
          buyer_name: string;
          location: string | null;
          saree_type: string;
          quantity: number;
          price_per_unit: number;
          total_amount: number;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      material_inventory: {
        Row: {
          id: string;
          created_at: string;
          factory_id: string;
          material_id: string;
          color_id: string | null;
          week_date: string;
          purchased_quantity: number;
          used_quantity: number;
          remaining_quantity: number;
          reorder_point: number | null;
          supplier: string | null;
          cost_per_unit: number | null;
          total_cost: number | null;
          notes: string | null;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['material_inventory']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['material_inventory']['Insert']>;
      };
      factories: AnyTable;
      material_types: {
        Row: { id: string; material_name: string; category: string; unit: string; cost_per_unit: number | null };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      cone_colors: AnyTable;
      material_transactions: AnyTable;
      worker_payments: AnyTable;
      payment_advances: AnyTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
