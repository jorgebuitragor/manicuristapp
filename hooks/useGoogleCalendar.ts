import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  storeTokens,
  getStoredTokens,
  clearTokens,
  getValidAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_CLIENT_ID,
  type CalendarEventPayload,
} from '@/lib/googleCalendar';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function useGoogleCalendarConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  useEffect(() => {
    getStoredTokens().then((tokens) => {
      setIsConnected(!!tokens);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const code = response.params.code;
    const codeVerifier = request?.codeVerifier;
    const redirectUri = request?.redirectUri;
    if (!code || !codeVerifier || !redirectUri) return;

    setIsConnecting(true);
    AuthSession.exchangeCodeAsync(
      { clientId: GOOGLE_CLIENT_ID, code, redirectUri, extraParams: { code_verifier: codeVerifier } },
      GOOGLE_DISCOVERY,
    )
      .then(async (tokenResponse) => {
        if (!tokenResponse.accessToken || !tokenResponse.refreshToken) return;
        await storeTokens({
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
        });
        setIsConnected(true);
      })
      .catch(console.error)
      .finally(() => setIsConnecting(false));
  }, [response]);

  async function connect() {
    await promptAsync();
  }

  async function disconnect() {
    await clearTokens();
    setIsConnected(false);
  }

  return { isConnected, isLoading, isConnecting, connect, disconnect, ready: !!request };
}

export type SyncPayload = CalendarEventPayload & {
  appointmentId: string;
  googleEventId?: string | null;
};

// Fire-and-forget: syncs an appointment to Google Calendar.
// If googleEventId exists → update; otherwise → create and save the new event ID.
export async function syncAppointmentToCalendar(payload: SyncPayload): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return;

    if (payload.googleEventId) {
      await updateCalendarEvent(accessToken, payload.googleEventId, payload);
    } else {
      const eventId = await createCalendarEvent(accessToken, payload);
      await supabase
        .from('appointments')
        .update({ google_event_id: eventId })
        .eq('id', payload.appointmentId);
    }
  } catch {
    // Sync is best-effort; never throw
  }
}

export async function deleteAppointmentFromCalendar(googleEventId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return;
    await deleteCalendarEvent(accessToken, googleEventId);
  } catch {
    // Best-effort
  }
}
