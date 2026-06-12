// Auto-generated types para Supabase.
// Regenerar con: npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      professionals: {
        Row: {
          id: string;
          name: string;
          email: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          allergies: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          notes?: string | null;
          allergies?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          notes?: string | null;
          allergies?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          duration: number;
          price: number | null;
          photo_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          duration?: number;
          price?: number | null;
          photo_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          duration?: number;
          price?: number | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      incomes: {
        Row: {
          id: string;
          appointment_id: string | null;
          amount: number;
          notes: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          amount: number;
          notes?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string | null;
          amount?: number;
          notes?: string | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'incomes_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: true;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
        ];
      };
      nail_polish_brands: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      polish_base_colors: {
        Row: {
          id: string;
          key: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      polish_tone_families: {
        Row: {
          id: string;
          key: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      nail_racks: {
        Row: {
          id: string;
          name: string;
          max_capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          max_capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          max_capacity?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          professional_id: string | null;
          service_id: string | null;
          start_time: string;
          end_time: string;
          notes: string | null;
          status: 'pending' | 'completed' | 'cancelled';
          design_photo_url: string | null;
          google_event_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          professional_id?: string | null;
          service_id?: string | null;
          start_time: string;
          end_time: string;
          notes?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          design_photo_url?: string | null;
          google_event_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          professional_id?: string | null;
          service_id?: string | null;
          start_time?: string;
          end_time?: string;
          notes?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          design_photo_url?: string | null;
          google_event_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      nail_polishes: {
        Row: {
          id: string;
          brand: string;
          brand_id: string | null;
          polish_code: string;
          rack_id: string | null;
          rack_position: number | null;
          color_name: string;
          hex_color: string | null;
          base_color: string | null;
          tone_family: string | null;
          photo_url: string | null;
          stock: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          brand_id?: string | null;
          polish_code: string;
          rack_id?: string | null;
          rack_position?: number | null;
          color_name: string;
          hex_color?: string | null;
          base_color?: string | null;
          tone_family?: string | null;
          photo_url?: string | null;
          stock?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          brand_id?: string | null;
          polish_code?: string;
          rack_id?: string | null;
          rack_position?: number | null;
          color_name?: string;
          hex_color?: string | null;
          base_color?: string | null;
          tone_family?: string | null;
          photo_url?: string | null;
          stock?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nail_polishes_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'nail_polish_brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nail_polishes_rack_id_fkey';
            columns: ['rack_id'];
            isOneToOne: false;
            referencedRelation: 'nail_racks';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_polishes: {
        Row: {
          appointment_id: string;
          nail_polish_id: string;
        };
        Insert: {
          appointment_id: string;
          nail_polish_id: string;
        };
        Update: {
          appointment_id?: string;
          nail_polish_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_polishes_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointment_polishes_nail_polish_id_fkey';
            columns: ['nail_polish_id'];
            isOneToOne: false;
            referencedRelation: 'nail_polishes';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_services: {
        Row: {
          appointment_id: string;
          service_id: string;
        };
        Insert: {
          appointment_id: string;
          service_id: string;
        };
        Update: {
          appointment_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_services_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointment_services_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Professional = Tables<'professionals'>;
export type Client = Tables<'clients'>;
export type Service = Tables<'services'>;
export type PolishBrand = Tables<'nail_polish_brands'>;
export type NailRack = Tables<'nail_racks'>;
export type Appointment = Tables<'appointments'>;
export type NailPolish = Tables<'nail_polishes'>;
export type Income = Tables<'incomes'>;
export type PolishBaseColor = Tables<'polish_base_colors'>;
export type PolishToneFamily = Tables<'polish_tone_families'>;

export type AppointmentStatus = 'pending' | 'completed' | 'cancelled';

export type AppointmentPolishSummary = Pick<NailPolish, 'id' | 'color_name' | 'brand' | 'hex_color' | 'polish_code'>;

export type AppointmentWithRelations = Appointment & {
  client: Client;
  professional: Professional | null;
  service: Service | null;
  services: Service[];
  polishes: AppointmentPolishSummary[];
};
