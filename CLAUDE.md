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
  _layout.tsx         # Root layout: AuthGuard, árbol de providers, splash
  (auth)/             # login / register (públicas)
  auth-callback.tsx   # Redirect OAuth (Google) → setSession
  onboarding.tsx      # Crear organización (RPC create_organization)
  (tabs)/             # Tab navigator (autenticado; sidebar en tablet)
    index.tsx         # Inicio: citas del día
    calendar.tsx      # Calendario semanal, búsqueda, notas, realtime
    clients/          # index.tsx (lista) · [id].tsx (ficha, oculta en tabs)
    polishes/         # index.tsx (inventario, filtros, mapa de esmaltero)
    incomes.tsx       # Ingresos y estadísticas
    settings.tsx
  appointments/
    new.tsx           # Modal nueva cita
    [id].tsx          # Detalle de cita
  clients/
    new.tsx           # Modal nuevo cliente
  polishes/
    new.tsx · [id].tsx · edit.tsx
  settings/
    services.tsx · brands.tsx · racks.tsx · labels.tsx

components/ui/        # Componentes temáticos compartidos (ver tabla abajo)
context/              # Theme, I18n, Organization, Currency, TimeFormat, PolishLabels,
                      # DrawingPad, Notification, Toast, Confirm, Error
hooks/                # Hooks TanStack Query (useAppointments, useClients, usePolishes,
                      # useIncomes, useServices, useNailRacks, usePolishBrands,
                      # usePolishLabels, useProfessionals, usePhotoStorage, useGoogleCalendar)
lib/                  # supabase, auth, queryClient, networkConfig, theme, i18n, dates,
                      # appointmentStateMachine, notifications, googleCalendar
types/
  database.types.ts   # Tipos GENERADOS de Supabase — no editar a mano
  models.ts           # Tipos de dominio (Client, AppointmentWithRelations, OrgType…)
supabase/
  migration.sql       # Esquema completo, acumulativo e idempotente por secciones
vault/                # Wiki de conocimiento del proyecto (ver final de este archivo)
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
danger · dangerMuted · dangerBorder · dangerStrong
warning · success · backdrop · birthday · birthdayMuted
```

**Excepciones aceptadas** a "nunca hardcodear colores": paletas del selector de color, efectos dibujados sobre el swatch de un esmalte (`PolishEffectOverlay`, brillos blancos/negros con alpha), colores de marca de terceros (Google, WhatsApp), el visor de fotos a pantalla completa (siempre negro) y la animación de splash. Todo lo que dependa del modo claro/oscuro va en `lib/theme.ts`.

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
| `ThemedCalendar` | Calendario mensual temático |
| `AppDatePicker` | Selector de fecha/hora |
| `PasswordInput` | Input de contraseña con mostrar/ocultar |
| `ColorPickerField` / `CompactColorPicker` | Selección de color HEX |
| `PhotoPickerField` / `PhotoPreviewModal` | Subir (vía `usePhotoStorage`) y ver fotos |
| `SwipeToDismissModal` | Bottom sheet que se cierra deslizando |
| `PolishFormModal` / `PolishDetailModal` / `PolishEffectOverlay` | Esmaltes |
| `IncomeConfirmModal` | Confirmar ingreso al completar una cita |
| `CalendarNotesPad` | Notas y dibujo por día en el calendario |
| `Toast` · `OfflineBanner` · `SplashAnimation` · `TabletQuickActionFab` | Infraestructura de UI |

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
- **Typed DB access**: entidades desde `@/types/models` (`Client`, `NailPolish`, `AppointmentWithRelations`…); `TablesInsert<>` / `TablesUpdate<>` / `Database` desde `@/types/database.types`
- **Server state**: every Supabase read/write lives in a hook under `hooks/`. No inline `supabase` calls inside screens, components or contexts.
- **Auth**: siempre vía `@/lib/auth` (`getSession`, `onSessionChange`, `signInWithPassword`, `signUp`, `getGoogleSignInUrl`, `completeSessionFromUrl`, `getCurrentUser`, `signOut`). Nunca `supabase.auth` fuera de ese archivo.
- **Fechas de calendario** (`YYYY-MM-DD`): usar `@/lib/dates` (`toLocalISODate`, `startOfWeekLocalISODate`…). Nunca `toISOString().slice(0, 10)`: da la fecha en UTC (día equivocado de noche en América o de madrugada en Europa).
- **Formato de fechas/horas**: `toLocaleDateString(locale, …)` con `locale` de `useI18n()`, nunca `'es-ES'` fijo. Fuera de React: `translate(lang, key, vars)` de `@/lib/i18n`.
- **Theming**: use `useTheme()` from `@/context/ThemeContext` for colors, never hardcode color values
- **Localization**: use `useI18n()` from `@/context/I18nContext` for all user-facing strings
- **Modals**: new/edit screens use `presentation: 'modal'` + `slide_from_bottom` animation (see `app/_layout.tsx`)

## Database schema (summary)

| Table | Key columns |
| --- | --- |
| `organizations` | id, name, type (`home_studio` \| `salon`), owner_id |
| `organization_members` | organization_id, user_id, role (`owner` \| `member`) |
| `professionals` | id, name, color, user_id, organization_id |
| `clients` | id, name, phone, notes, allergies, birthday |
| `services` | id, name, duration (min), price, photo_url |
| `appointments` | id, client_id, professional_id, service_id (legacy), start_time, end_time, status, notes, design_photo_url, google_event_id |
| `appointment_services` | appointment_id, service_id (many-to-many, fuente real de servicios) |
| `appointment_polishes` | appointment_id, nail_polish_id (many-to-many) |
| `incomes` | id, appointment_id (unique), amount, notes, date |
| `nail_polishes` | id, brand (texto legacy), brand_id, polish_code, color_name, hex_color, base_color, tone_family, effect, rack_id, rack_position, stock, photo_url, notes |
| `nail_polish_brands` | id, name |
| `nail_racks` | id, name, max_capacity |
| `polish_base_colors` / `polish_tone_families` | id, key (única por org), label, sort_order (+ hex_color en base) |

Todas las tablas de datos tienen además `organization_id` (ver Multi-tenancy).

Funciones RPC: `get_my_org_id()`, `create_organization(org_name, org_type, org_lang = 'es')`. Interna (no expuesta a la API): `seed_default_services(org_id, lang)`.

Storage (buckets públicos `design-photos`, `polish-photos`, `service-photos`): las rutas **deben** empezar por `<organization_id>/` — las políticas rechazan cualquier otra. Usar siempre `usePhotoStorage`.

**Cambios de esquema**: añadir una sección nueva e idempotente al final de `supabase/migration.sql` (con fecha) y ejecutarla en el SQL Editor de Supabase. Nunca crear objetos solo desde el dashboard.

Regenerate types: `npx supabase gen types typescript --project-id <id> > types/database.types.ts`

Regenerar es seguro: los tipos escritos a mano viven en `types/models.ts`, que además acota las columnas con CHECK (`status`, `type`, `role`, `effect`) que el generador tipa como `string`.

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
4. Se llama la función RPC `create_organization(org_name, org_type)` (SECURITY DEFINER) que crea `organizations` + `organization_members` atómicamente. Es la **única** vía de alta: no hay políticas INSERT en esas tablas. También crea los 8 servicios por defecto (en el idioma de la app, sin precio). Si el usuario ya tiene org, devuelve la existente sin crear nada (reintento seguro)
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
| RPC `join_organization(code TEXT)` | SECURITY DEFINER: valida el código y hace INSERT en `organization_members` (es la única vía, no hay política INSERT) |
| Pantalla onboarding paso 1 | Agregar tercera opción: "Unirme a un salón existente" |
| Pantalla "Invitar profesional" | En Ajustes (solo visible para owners de salón): genera y comparte el código |
| RLS `org_invites` | Owner puede crear/ver. La validación del código se hace dentro de la RPC (no dar SELECT general, expondría todos los códigos) |

### Notas de diseño

- Un usuario puede pertenecer a una sola org (LIMIT 1 en `get_my_org_id()`). Si en el futuro se necesita multi-org por usuario, se debe revisar esta función y el contexto.
- Las citas y clientes en un salón son compartidos por toda la org. Si se necesita aislamiento por profesional dentro del salón (cada una ve solo sus citas), agregar `professional_id` como filtro opcional en los hooks.
- El `professional_id` en `appointments` ya existe y apunta a `professionals.id`, que a su vez tiene `user_id`. Esto permite filtrar citas por profesional cuando sea necesario.

---

## Vault de conocimiento (`vault/`)

Wiki del proyecto mantenido por el LLM (patrón *LLM Wiki*, se abre con Obsidian). Reglas completas en `vault/CLAUDE.md`.

- **Antes de trabajar en un área**, lee `vault/wiki/index.md` y las páginas relevantes.
- **Después de un cambio de código** que altere comportamiento, esquema o convenciones, haz un `sync` del vault (actualiza las páginas afectadas y añade una entrada en `vault/wiki/log.md`).
- `vault/raw/` son fuentes del usuario: **nunca editarlas**.
- Contradicciones conocidas entre código, docs y BD: `vault/wiki/pendientes/discrepancias.md`.
