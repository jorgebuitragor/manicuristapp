import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SplashAnimation } from '@/components/ui/SplashAnimation';

SplashScreen.preventAutoHideAsync();
import { Stack, useRouter, useSegments } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Linking from 'expo-linking';
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
import { ErrorProvider } from '@/context/ErrorContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import { ToastRenderer } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { isNotificationsSupported, setupNotifications, requestNotificationPermissions } from '@/lib/notifications';

function AuthGuard({ session, isLoading }: { session: Session | null; isLoading: boolean }) {
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const { organizationId, isLoading: orgLoading } = useOrganization();

  useEffect(() => {
    if (isLoading || orgLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace(organizationId ? '/(tabs)' : '/onboarding');
    } else if (session && !organizationId && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && organizationId && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, orgLoading, organizationId, segments]);

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
        <Stack.Screen name="auth-callback" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'default' }} />
        <Stack.Screen name="appointments/new" options={modalOptions} />
        <Stack.Screen name="clients/new" options={modalOptions} />
        <Stack.Screen name="polishes/new" options={modalOptions} />
        <Stack.Screen name="polishes/[id]" options={modalOptions} />
        <Stack.Screen name="polishes/edit" options={{ animation: 'fade_from_bottom' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Handle OAuth deep link redirect (e.g. Google login via Expo Go)
    async function handleDeepLink(url: string) {
      const fragment = url.split('#')[1] ?? '';
      const params = Object.fromEntries(new URLSearchParams(fragment));
      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? '',
        });
      }
    }

    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    SplashScreen.hideAsync();

    if (isNotificationsSupported()) {
      setupNotifications();
      requestNotificationPermissions();
    }

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  if (showSplash) {
    return <SplashAnimation onFinish={() => setShowSplash(false)} />;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ThemeProvider>
        <I18nProvider>
          <CurrencyProvider>
            <OrganizationProvider>
              <PolishLabelsProvider>
                <TimeFormatProvider>
                  <DrawingPadProvider>
                    <ToastProvider>
                      <ConfirmProvider>
                        <ErrorProvider>
                          <NotificationProvider>
                            <AppContent session={session} isLoading={isLoading} />
                          </NotificationProvider>
                        </ErrorProvider>
                      </ConfirmProvider>
                    </ToastProvider>
                  </DrawingPadProvider>
                </TimeFormatProvider>
              </PolishLabelsProvider>
            </OrganizationProvider>
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
