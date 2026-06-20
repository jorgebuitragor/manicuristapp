-- ============================================================
-- MANICURIST APP — Supabase SQL migration
-- Ejecutar en: https://supabase.com > SQL Editor > New query
-- ============================================================

-- 1. PROFESIONALES
CREATE TABLE IF NOT EXISTS professionals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#c084fc',  -- color HEX para el calendario
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT,
  allergies  TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SERVICIOS
CREATE TABLE IF NOT EXISTS services (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  duration   INTEGER NOT NULL DEFAULT 60,      -- duración por defecto en minutos
  price      NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed de servicios base
INSERT INTO services (name, duration, price) VALUES
  ('Manicura básica',            30, 15.00),
  ('Semipermanente manos',       60, 25.00),
  ('Semipermanente pies',        60, 25.00),
  ('Nail Art (diseño simple)',   75, 35.00),
  ('Nail Art (diseño complejo)', 90, 50.00),
  ('Pedicura básica',            45, 20.00),
  ('Retirada esmalte',           20, 10.00),
  ('Reconstrucción acrílico',   120, 60.00)
ON CONFLICT DO NOTHING;

-- 4. ESMALTES
CREATE TABLE IF NOT EXISTS nail_polish_brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nail_racks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nail_polishes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand      TEXT NOT NULL,
  brand_id   UUID REFERENCES nail_polish_brands(id) ON DELETE SET NULL,
  polish_code TEXT NOT NULL,
  rack_id    UUID REFERENCES nail_racks(id) ON DELETE SET NULL,
  rack_position INTEGER,
  color_name TEXT NOT NULL,
  hex_color  TEXT,                             -- HEX, ej: '#FF69B4'
  base_color TEXT,                             -- color padre: red, pink, nude, etc.
  tone_family TEXT,                            -- familia/tono: classic, pastel, neon, nude...
  photo_url  TEXT,
  stock      INTEGER NOT NULL DEFAULT 1,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS base_color TEXT;
ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS tone_family TEXT;
ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS polish_code TEXT;
ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS rack_id UUID;
ALTER TABLE IF EXISTS nail_polishes ADD COLUMN IF NOT EXISTS rack_position INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nail_polishes_brand_id_fkey'
  ) THEN
    ALTER TABLE nail_polishes
      ADD CONSTRAINT nail_polishes_brand_id_fkey
      FOREIGN KEY (brand_id)
      REFERENCES nail_polish_brands(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nail_polishes_rack_id_fkey'
  ) THEN
    ALTER TABLE nail_polishes
      ADD CONSTRAINT nail_polishes_rack_id_fkey
      FOREIGN KEY (rack_id)
      REFERENCES nail_racks(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nail_polishes_base_color ON nail_polishes (base_color);
CREATE INDEX IF NOT EXISTS idx_nail_polishes_tone_family ON nail_polishes (tone_family);
CREATE INDEX IF NOT EXISTS idx_nail_polishes_brand_id ON nail_polishes (brand_id);
CREATE INDEX IF NOT EXISTS idx_nail_polishes_rack_id ON nail_polishes (rack_id);
CREATE INDEX IF NOT EXISTS idx_nail_polishes_polish_code ON nail_polishes (polish_code);

-- 5. CITAS
CREATE TABLE IF NOT EXISTS appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  professional_id   UUID REFERENCES professionals(id) ON DELETE RESTRICT,
  service_id        UUID REFERENCES services(id) ON DELETE SET NULL,
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','completed','cancelled')),
  notes             TEXT,
  design_photo_url  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'professional_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE appointments
      ALTER COLUMN professional_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_start   ON appointments (start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_client  ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments (status);

-- 6. JUNCTION: cita ↔ servicios
CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id     UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON appointment_services (appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service ON appointment_services (service_id);

-- 7. JUNCTION: cita ↔ esmaltes usados (legacy)
CREATE TABLE IF NOT EXISTS appointment_polishes (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  nail_polish_id UUID NOT NULL REFERENCES nail_polishes(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, nail_polish_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Política simple: cualquier usuario autenticado puede leer/escribir todo.
-- Ajustar si en el futuro se añade multi-tenant o roles.
-- ============================================================

ALTER TABLE professionals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE nail_polish_brands  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nail_racks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nail_polishes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_polishes ENABLE ROW LEVEL SECURITY;

-- Política: sólo usuarios autenticados
CREATE POLICY "auth_all" ON professionals        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON clients             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON services            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON nail_polish_brands  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON nail_racks          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON nail_polishes       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON appointments        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON appointment_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON appointment_polishes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS
-- Crear en: Supabase Dashboard > Storage > New bucket
-- O ejecutar a través de la API de Management (no disponible en SQL Editor).
--
-- Pasos manuales en el Dashboard:
--   1. Bucket "design-photos"  → Public ON
--   2. Bucket "polish-photos"  → Public ON
--
-- RLS para Storage (si quieres hacerlo por SQL, ejecutar esto):
-- ============================================================

-- Permitir a usuarios autenticados subir a design-photos
INSERT INTO storage.buckets (id, name, public) VALUES
  ('design-photos', 'design-photos', true),
  ('polish-photos', 'polish-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_design" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-photos');

CREATE POLICY "auth_update_design" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'design-photos');

CREATE POLICY "public_read_design" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'design-photos');

CREATE POLICY "auth_upload_polish" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'polish-photos');

CREATE POLICY "public_read_polish" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'polish-photos');

-- ============================================================
-- REALTIME
-- Habilitar Realtime en la tabla appointments:
--   Supabase Dashboard > Database > Replication > appointments ✓
-- O con SQL:
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- ============================================================
-- SERVICES — add photo_url column
-- ============================================================

ALTER TABLE IF EXISTS services ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- STORAGE — service-photos bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_service" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "auth_update_service" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'service-photos');

CREATE POLICY "public_read_service" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'service-photos');

-- ============================================================
-- INGRESOS
-- ============================================================

CREATE TABLE IF NOT EXISTS incomes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL,
  notes          TEXT,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes (date);
CREATE INDEX IF NOT EXISTS idx_incomes_appointment ON incomes (appointment_id);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ETIQUETAS DE ESMALTE — colores base y familias de tonos editables
-- ============================================================

CREATE TABLE IF NOT EXISTS polish_base_colors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key)
);

CREATE TABLE IF NOT EXISTS polish_tone_families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key)
);

ALTER TABLE polish_base_colors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE polish_tone_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON polish_base_colors  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON polish_tone_families FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ESMALTEROS — capacidad máxima y posición única de esmalte
-- ============================================================

ALTER TABLE IF EXISTS nail_racks ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Dos esmaltes no pueden ocupar la misma posición en el mismo esmaltero
CREATE UNIQUE INDEX IF NOT EXISTS uq_nail_polish_rack_position
  ON nail_polishes(rack_id, rack_position)
  WHERE rack_position IS NOT NULL AND rack_id IS NOT NULL;

-- ============================================================
-- EFECTOS DE ESMALTE
-- ============================================================

ALTER TABLE nail_polishes ADD COLUMN IF NOT EXISTS effect TEXT DEFAULT NULL
  CHECK (effect IS NULL OR effect IN ('matte', 'shimmer', 'glitter', 'cat_eye', 'holographic', 'duochrome', 'translucent', 'nude'));

-- Color por defecto para colores base personalizados
ALTER TABLE polish_base_colors ADD COLUMN IF NOT EXISTS hex_color TEXT DEFAULT NULL;

-- Ampliar check constraint para incluir translucent y nude
ALTER TABLE nail_polishes DROP CONSTRAINT IF EXISTS nail_polishes_effect_check;
ALTER TABLE nail_polishes ADD CONSTRAINT nail_polishes_effect_check
  CHECK (effect IS NULL OR effect IN ('matte', 'shimmer', 'glitter', 'cat_eye', 'holographic', 'duochrome', 'translucent', 'nude'));

-- ============================================================
-- MULTI-TENANCY: ORGANIZATIONS
-- ============================================================

-- Tabla raíz de tenants
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('home_studio', 'salon')),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membresías: liga usuarios a organizaciones
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Ligar professionals a auth.users y a su org
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_id en todas las tablas de datos
ALTER TABLE clients             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE services            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE nail_polish_brands  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE nail_racks          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE nail_polishes       ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE appointments        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE incomes             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE polish_base_colors  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE polish_tone_families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Índices para org queries
CREATE INDEX IF NOT EXISTS idx_org_members_user      ON organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_clients_org           ON clients (organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org          ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_nail_polishes_org     ON nail_polishes (organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org      ON appointments (organization_id);
CREATE INDEX IF NOT EXISTS idx_incomes_org           ON incomes (organization_id);
CREATE INDEX IF NOT EXISTS idx_professionals_org     ON professionals (organization_id);

-- Función helper: devuelve el organization_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS: ORGANIZATIONS
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member_select" ON organizations
  FOR SELECT TO authenticated
  USING (id = get_my_org_id());

CREATE POLICY "org_owner_insert" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_owner_update" ON organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- RLS: ORGANIZATION_MEMBERS
-- ============================================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_select_own_org" ON organization_members
  FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "member_self_insert" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RLS: Reemplazar políticas abiertas por aislamiento por org
-- ============================================================

-- professionals
DROP POLICY IF EXISTS "auth_all" ON professionals;
CREATE POLICY "org_all" ON professionals
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- clients
DROP POLICY IF EXISTS "auth_all" ON clients;
CREATE POLICY "org_all" ON clients
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- services
DROP POLICY IF EXISTS "auth_all" ON services;
CREATE POLICY "org_all" ON services
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- nail_polish_brands
DROP POLICY IF EXISTS "auth_all" ON nail_polish_brands;
CREATE POLICY "org_all" ON nail_polish_brands
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- nail_racks
DROP POLICY IF EXISTS "auth_all" ON nail_racks;
CREATE POLICY "org_all" ON nail_racks
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- nail_polishes
DROP POLICY IF EXISTS "auth_all" ON nail_polishes;
CREATE POLICY "org_all" ON nail_polishes
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- appointments
DROP POLICY IF EXISTS "auth_all" ON appointments;
CREATE POLICY "org_all" ON appointments
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- incomes
DROP POLICY IF EXISTS "auth_all" ON incomes;
CREATE POLICY "org_all" ON incomes
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- polish_base_colors
DROP POLICY IF EXISTS "auth_all" ON polish_base_colors;
CREATE POLICY "org_all" ON polish_base_colors
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- polish_tone_families
DROP POLICY IF EXISTS "auth_all" ON polish_tone_families;
CREATE POLICY "org_all" ON polish_tone_families
  FOR ALL TO authenticated
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

-- appointment_services: aislamiento vía appointment padre
DROP POLICY IF EXISTS "auth_all" ON appointment_services;
CREATE POLICY "org_all" ON appointment_services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND a.organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND a.organization_id = get_my_org_id()
    )
  );

-- appointment_polishes: aislamiento vía appointment padre
DROP POLICY IF EXISTS "auth_all" ON appointment_polishes;
CREATE POLICY "org_all" ON appointment_polishes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_polishes.appointment_id
        AND a.organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_polishes.appointment_id
        AND a.organization_id = get_my_org_id()
    )
  );

-- ============================================================
-- FIX: UNIQUE por org en marcas y esmalteros
-- Las tablas fueron creadas con UNIQUE(name) global antes del
-- multi-tenant. Reemplazar por UNIQUE(name, organization_id).
-- ============================================================

ALTER TABLE nail_polish_brands DROP CONSTRAINT IF EXISTS nail_polish_brands_name_key;
ALTER TABLE nail_racks         DROP CONSTRAINT IF EXISTS nail_racks_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_brand_name_org
  ON nail_polish_brands (name, organization_id)
  WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rack_name_org
  ON nail_racks (name, organization_id)
  WHERE organization_id IS NOT NULL;
