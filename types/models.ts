// Tipos de dominio escritos a mano, construidos sobre los tipos generados.
// `database.types.ts` se puede regenerar sin perder nada de este archivo.
//
// El generador de Supabase tipa las columnas con CHECK como `string`;
// aquí se acotan a sus valores válidos.

import type { Tables } from './database.types';

export type OrgType = 'home_studio' | 'salon';
export type MemberRole = 'owner' | 'member';
export type AppointmentStatus = 'pending' | 'completed' | 'cancelled';
export type PolishEffect =
  | 'matte'
  | 'shimmer'
  | 'glitter'
  | 'cat_eye'
  | 'holographic'
  | 'duochrome'
  | 'translucent'
  | 'nude';

export type Organization = Omit<Tables<'organizations'>, 'type'> & { type: OrgType };
export type OrganizationMember = Omit<Tables<'organization_members'>, 'role'> & { role: MemberRole };
export type Professional = Tables<'professionals'>;
export type Client = Tables<'clients'>; // birthday: 'YYYY-MM-DD'
export type Service = Tables<'services'>;
export type PolishBrand = Tables<'nail_polish_brands'>;
export type NailRack = Tables<'nail_racks'>;
export type Appointment = Omit<Tables<'appointments'>, 'status'> & { status: AppointmentStatus };
export type NailPolish = Omit<Tables<'nail_polishes'>, 'effect'> & { effect: PolishEffect | null };
export type Income = Tables<'incomes'>;
export type PolishBaseColor = Tables<'polish_base_colors'>;
export type PolishToneFamily = Tables<'polish_tone_families'>;

export type AppointmentPolishSummary = Pick<NailPolish, 'id' | 'color_name' | 'brand' | 'hex_color' | 'polish_code'>;

export type AppointmentWithRelations = Appointment & {
  client: Client;
  professional: Professional | null;
  service: Service | null;
  services: Service[];
  polishes: AppointmentPolishSummary[];
};
