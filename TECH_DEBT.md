# Deuda Técnica

## Google Calendar — OAuth en iOS con Expo Go

**Estado:** Pendiente  
**Prioridad:** Baja  
**Área:** `hooks/useGoogleCalendar.ts`

### Contexto

Las credenciales iOS ya están configuradas (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` en `.env.local`, URL scheme en `app.json`). La integración funcionará correctamente en builds nativos (`pnpm ios` o TestFlight).

### Problema pendiente

Expo Go no puede interceptar el redirect OAuth con esquemas custom (`com.googleusercontent.apps.XXXX://`). El botón "Conectar" en Settings abre el browser de Google pero al volver no completa el flujo. No hay crash.

### Resolución

Probar con `pnpm ios` en simulador o distribuir vía TestFlight. No requiere ningún cambio de código — todo está implementado.
