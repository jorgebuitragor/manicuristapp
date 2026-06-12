import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { configureNetworkManager } from '@/lib/networkConfig';
import { StatusBar } from 'expo-status-bar';

configureNetworkManager();
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import { ToastProvider } from '@/context/ToastContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { PolishLabelsProvider } from '@/context/PolishLabelsContext';
import { DrawingPadProvider } from '@/context/DrawingPadContext';
import { TimeFormatProvider } from '@/context/TimeFormatContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ToastRenderer } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

function AuthGuard({ session, isLoading }: { session: Session | null; isLoading: boolean }) {
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  const modalOptions = {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
    animationMatchesGesture: true,
    contentStyle: { backgroundColor: colors.background },
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'default' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'default' }} />
        <Stack.Screen name="appointments/new" options={modalOptions} />
        <Stack.Screen name="clients/new" options={modalOptions} />
        <Stack.Screen name="polishes/new" options={modalOptions} />
        <Stack.Screen name="polishes/[id]" options={modalOptions} />
        <Stack.Screen name="polishes/edit" options={modalOptions} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ThemeProvider>
        <I18nProvider>
          <CurrencyProvider>
            <PolishLabelsProvider>
              <TimeFormatProvider>
                <DrawingPadProvider>
                  <ToastProvider>
                    <ConfirmProvider>
                      <AppContent session={session} isLoading={isLoading} />
                    </ConfirmProvider>
                  </ToastProvider>
                </DrawingPadProvider>
              </TimeFormatProvider>
            </PolishLabelsProvider>
          </CurrencyProvider>
        </I18nProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

function AppContent({ session, isLoading }: { session: Session | null; isLoading: boolean }) {
  const { isDark } = useTheme();
  return (
    <>
      <AuthGuard session={session} isLoading={isLoading} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastRenderer />
      <OfflineBanner />
    </>
  );
}
