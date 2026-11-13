import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { completeSessionFromUrl } from '@/lib/auth';
import { useTheme } from '@/context/ThemeContext';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const url = await Linking.getInitialURL();
      if (!url) return;

      await completeSessionFromUrl(url);
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
