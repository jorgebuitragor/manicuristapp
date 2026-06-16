@AGENTS.md

# Manicurist App — Claude Code Guide

## Project overview

Mobile app (iOS/Android) for nail technicians to manage clients, appointments, nail polish inventory, and schedules. Built with Expo + React Native, Supabase backend, TanStack Query for server state, and expo-router for navigation.

## Tech stack

- **Expo** `~54.0.35` with expo-router `~6.0.24` (file-based routing)
- **React Native** `0.81.5` / **React** `19.1.0`
- **Supabase** — auth, postgres DB, storage
- **TanStack Query** `v5` — all server state / mutations
- **TypeScript** strict mode
- **pnpm** `10.25.0` — package manager (use `pnpm`, never `npm` or `yarn`)

## Commands

```bash
pnpm start          # Expo dev server (scan QR with Expo Go)
pnpm ios            # Run on iOS simulator
pnpm android        # Run on Android emulator
pnpm web            # Run in browser
```

## File structure

```text
app/                  # expo-router screens (file = route)
  _layout.tsx         # Root layout: auth guard, providers
  (auth)/             # Login / register (public)
  (tabs)/             # Main tab navigator (authenticated)
    index.tsx         # Home / dashboard
    calendar.tsx      # Appointment calendar
    clients/          # Client list
    polishes/         # Polish inventory
    settings.tsx
  appointments/
    new.tsx           # New appointment modal
    [id].tsx          # Appointment detail
  clients/
    new.tsx           # New client modal

components/ui/        # Shared themed components (ThemedButton, ThemedInput…)
context/              # ThemeContext, I18nContext
hooks/                # TanStack Query hooks (useAppointments, useClients…)
lib/                  # supabase.ts, queryClient.ts, theme.ts, i18n.ts
types/
  database.types.ts   # Supabase-generated types — DO NOT hand-edit
supabase/
  migration.sql       # DB schema
```

## Custom components

**Regla:** cada pieza de UI reutilizable vive en `components/ui/` con sus propios estilos. Las pantallas solo componen componentes — nunca definen colores, tipografía ni layout primitivo inline.

### Patrón de un componente

```tsx
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface MyCardProps {
  children: React.ReactNode;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export function MyCard({ children, style }: MyCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,                      // estático: tamaños, radios, padding
        { backgroundColor: colors.card,   // dinámico: viene del tema
          borderColor: colors.border },
        style,                            // override opcional del caller
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
});
```

### Reglas del patrón

| Qué | Dónde va |
| --- | --- |
| Tamaños, radios, padding, gap | `StyleSheet.create()` — estático, no cambia con el tema |
| Colores, fondos, bordes | Objeto inline `{ color: colors.X }` — reactivo al tema |
| Variantes visuales | Prop `variant?: 'primary' \| 'outline' \| ...` — nunca prop `color` libre |
| Tono de texto / icono | Prop `tone?: 'default' \| 'secondary' \| 'primary' \| 'danger' \| 'inverse'` |
| Override desde el caller | Prop `style?: StyleProp<ViewStyle>` siempre al final del array de estilos |
| Inputs nativos wrapeados | Usar `forwardRef` para que el caller pueda obtener la ref |

### Tokens de color disponibles (`ThemeColors`)

```
primary · onPrimary · primaryMuted
background · card
text · textSecondary · textTertiary
border · inputBackground · tabBar
shadow · overlay
statusPending/Text · statusCompleted/Text · statusCancelled/Text
danger · dangerMuted · dangerBorder
```

### Componentes existentes — usar antes de crear nuevos

| Componente | Cuándo usarlo |
| --- | --- |
| `ThemedText` | Todo texto — props `variant` y `tone` |
| `ThemedButton` | Botones — variants `primary`, `outline`, `ghost`, `dangerOutline` |
| `ThemedInput` | Campos de texto nativos |
| `ThemedView` | Contenedor con `backgroundColor: colors.background` |
| `ThemedIcon` | Íconos Ionicons con tono del tema |
| `ThemedField` | Label + input agrupados |
| `ThemedSection` | Sección con título y lista de items |
| `ThemedDropdown` | Selector de opción |
| `SelectableChip` | Chip seleccionable (servicios, filtros) |
| `ScreenHeader` | Cabecera de pantalla con título y acciones |

### Lo que NO va en una pantalla

```tsx
// ❌ MAL — colores hardcodeados, StyleSheet enorme en el screen
<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16 }}>
  <Text style={{ color: '#1a1a2e', fontSize: 22, fontWeight: '700' }}>Título</Text>
</View>

// ✅ BIEN — la pantalla solo compone
<ThemedView>
  <ThemedText variant="title">Título</ThemedText>
</ThemedView>
```

## Key conventions

- **Path alias**: `@/` maps to project root (e.g. `import { supabase } from '@/lib/supabase'`)
- **Typed DB access**: always use `Tables<'table_name'>`, `TablesInsert<>`, `TablesUpdate<>` from `@/types/database.types`
- **Server state**: every Supabase read/write lives in a hook under `hooks/`. No inline `supabase` calls inside screens.
- **Theming**: use `useTheme()` from `@/context/ThemeContext` for colors, never hardcode color values
- **Localization**: use `useI18n()` from `@/context/I18nContext` for all user-facing strings
- **Modals**: new/edit screens use `presentation: 'modal'` + `slide_from_bottom` animation (see `app/_layout.tsx`)

## Database schema (summary)

| Table | Key columns |
| --- | --- |
| `professionals` | id, name, email, color |
| `clients` | id, name, phone, notes, allergies |
| `services` | id, name, default_duration_min |
| `appointments` | id, client_id, professional_id, service_id, start_time, end_time, status, notes, design_photo_url |
| `appointment_services` | appointment_id, service_id (many-to-many) |
| `appointment_polishes` | appointment_id, nail_polish_id (many-to-many) |
| `nail_polishes` | id, brand_id, polish_code, color_name, hex_color, rack_id, rack_position, stock |
| `nail_polish_brands` | id, name |
| `nail_racks` | id, name |

Regenerate types: `npx supabase gen types typescript --project-id <id> > types/database.types.ts`

## Environment variables

Stored in `.env.local` (not committed). See `.env.example` for required keys:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Multi-tenancy (implementado)

La app es multi-tenant desde la raíz. Cada dato pertenece a una `organization`.

### Tablas clave

| Tabla | Rol |
| --- | --- |
| `organizations` | Tenant raíz. `type: 'home_studio' \| 'salon'` |
| `organization_members` | Liga `auth.users` ↔ `organizations` con `role: 'owner' \| 'member'` |

### Cómo funciona el aislamiento

- Función `get_my_org_id()` (SECURITY DEFINER): devuelve el `organization_id` del usuario autenticado consultando `organization_members`.
- Todas las tablas de datos (`clients`, `appointments`, `nail_polishes`, `services`, etc.) tienen `organization_id` y políticas RLS que usan `get_my_org_id()`.
- `OrganizationContext` (`context/OrganizationContext.tsx`) resuelve la org al hacer login y la provee a toda la app vía `useOrganization()`.
- Todos los hooks (`useClients`, `usePolishes`, `useAppointments`, etc.) filtran por `organizationId` en queries e inserts.

### Flujo de registro

1. Usuario se registra (email + password)
2. Sin organización → AuthGuard redirige a `/onboarding`
3. Onboarding: elige tipo (Home Studio / Salón) + nombre del estudio + su nombre
4. Se llama la función RPC `create_organization(org_name, org_type)` (SECURITY DEFINER) que crea `organizations` + `organization_members` atómicamente
5. Se crea el perfil en `professionals` ligado al usuario y la org
6. `OrganizationContext.refetch()` → AuthGuard redirige a `/(tabs)`

---

## Roadmap pendiente — Salón con múltiples profesionales

El tipo `salon` solo admite un usuario (el owner). Las demás profesionales no pueden unirse a la misma organización.

### Solución diseñada: sistema de invitaciones por código

### Flujo propuesto

```text
Owner crea el salón
  ↓
Genera código de invitación (ej: GLOW-4821) desde Ajustes
  ↓
Profesional instala la app → en onboarding elige "Unirme a un salón"
  ↓
Ingresa el código → queda ligada a la misma org con role 'member'
  ↓
Entra con SU propio correo y ve los datos compartidos del salón
```

### Piezas a implementar

| Pieza | Descripción |
| --- | --- |
| Tabla `org_invites` | `id, organization_id, code (unique), expires_at, max_uses, uses_count` |
| RPC `join_organization(code TEXT)` | Valida el código y hace INSERT en `organization_members` |
| Pantalla onboarding paso 1 | Agregar tercera opción: "Unirme a un salón existente" |
| Pantalla "Invitar profesional" | En Ajustes (solo visible para owners de salón): genera y comparte el código |
| RLS `org_invites` | Owner puede crear/ver, cualquier autenticado puede leer (para validar el código) |

### Notas de diseño

- Un usuario puede pertenecer a una sola org (LIMIT 1 en `get_my_org_id()`). Si en el futuro se necesita multi-org por usuario, se debe revisar esta función y el contexto.
- Las citas y clientes en un salón son compartidos por toda la org. Si se necesita aislamiento por profesional dentro del salón (cada una ve solo sus citas), agregar `professional_id` como filtro opcional en los hooks.
- El `professional_id` en `appointments` ya existe y apunta a `professionals.id`, que a su vez tiene `user_id`. Esto permite filtrar citas por profesional cuando sea necesario.
