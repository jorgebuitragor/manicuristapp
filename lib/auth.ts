import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Único punto de la app que habla con Supabase Auth.
 * Pantallas y contextos usan estas funciones, nunca `supabase.auth` directamente:
 * así cambiar de proveedor de autenticación solo afecta a este archivo.
 */

export type AuthSession = Session;

export type CurrentUser = { id: string; email: string | null };

/** Redirect del login con Google (debe estar registrado en Supabase → Auth → URL Configuration). */
export const OAUTH_REDIRECT_URL = 'manicuristapp://auth-callback';

export async function getSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Se suscribe a cambios de sesión (login, logout, refresco). Devuelve la función para desuscribirse. */
export function onSessionChange(callback: (session: AuthSession | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

/** Devuelve el mensaje de error, o null si fue bien. */
export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error?.message ?? null;
}

/**
 * Registro con email y contraseña.
 * `needsConfirmation` es true si el proyecto exige confirmar el email antes de entrar.
 */
export async function signUp(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { error: error.message, needsConfirmation: false };
  return { error: null, needsConfirmation: !data.session };
}

/** URL que hay que abrir en el navegador para iniciar sesión con Google. */
export async function getGoogleSignInUrl(): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: OAUTH_REDIRECT_URL, skipBrowserRedirect: true },
  });
  return { url: data?.url ?? null, error: error?.message ?? null };
}

/**
 * Completa el login OAuth a partir del deep link de vuelta
 * (tokens en el fragmento `#access_token=…&refresh_token=…`).
 * Devuelve true si la URL traía tokens y se abrió sesión.
 */
export async function completeSessionFromUrl(url: string): Promise<boolean> {
  const fragment = url.split('#')[1] ?? '';
  const params = Object.fromEntries(new URLSearchParams(fragment));
  if (!params.access_token) return false;
  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token ?? '',
  });
  return !error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
