import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const url = await Linking.getInitialURL();
      if (!url) return;

      const fragment = url.split('#')[1] ?? '';
      const params = Object.fromEntries(new URLSearchParams(fragment));

      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? '',
        });
      }
      // AuthGuard en _layout.tsx detecta la sesión y redirige automáticamente
    }

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
