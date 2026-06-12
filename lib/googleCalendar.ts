import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'gcal_access_token',
  REFRESH_TOKEN: 'gcal_refresh_token',
  EXPIRES_AT: 'gcal_expires_at',
} as const;

const GCAL_API = 'https://www.googleapis.com/calendar/v3';

export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const GOOGLE_CLIENT_ID =
  Platform.OS === 'android' ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_IOS_CLIENT_ID;

export type GCalTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export async function storeTokens(tokens: GCalTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
    SecureStore.setItemAsync(KEYS.EXPIRES_AT, String(tokens.expiresAt)),
  ]);
}

export async function getStoredTokens(): Promise<GCalTokens | null> {
  const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(KEYS.EXPIRES_AT),
  ]);
  if (!accessToken || !refreshToken || !expiresAtStr) return null;
  return { accessToken, refreshToken, expiresAt: Number(expiresAtStr) };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.EXPIRES_AT),
  ]);
}

async function doRefreshTokens(clientId: string, refreshToken: string): Promise<GCalTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!res.ok) throw new Error('Google token refresh failed');
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

// Returns a valid access token, refreshing if needed. Returns null if not connected.
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() > tokens.expiresAt - fiveMinutes) {
    try {
      const fresh = await doRefreshTokens(GOOGLE_CLIENT_ID, tokens.refreshToken);
      await storeTokens(fresh);
      return fresh.accessToken;
    } catch {
      return null;
    }
  }
  return tokens.accessToken;
}

export type CalendarEventPayload = {
  clientName: string;
  serviceNames: string[];
  startTime: string;
  endTime: string;
  notes?: string | null;
};

function buildEventBody(payload: CalendarEventPayload) {
  const summary =
    payload.serviceNames.length > 0
      ? `${payload.clientName} · ${payload.serviceNames.join(', ')}`
      : payload.clientName;
  return {
    summary,
    description: payload.notes ?? undefined,
    start: { dateTime: payload.startTime },
    end: { dateTime: payload.endTime },
  };
}

export async function createCalendarEvent(
  accessToken: string,
  payload: CalendarEventPayload,
): Promise<string> {
  const res = await fetch(`${GCAL_API}/calendars/primary/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventBody(payload)),
  });
  if (!res.ok) throw new Error('Failed to create Google Calendar event');
  const data = await res.json();
  return data.id as string;
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  payload: CalendarEventPayload,
): Promise<void> {
  const res = await fetch(`${GCAL_API}/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventBody(payload)),
  });
  if (!res.ok) throw new Error('Failed to update Google Calendar event');
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(`${GCAL_API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 404 = already deleted, that's fine
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error('Failed to delete Google Calendar event');
  }
}
