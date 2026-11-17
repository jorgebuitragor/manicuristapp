import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLocales } from 'expo-localization';
import type { ErrorBoundaryProps } from 'expo-router';
import { lightColors, darkColors } from '@/lib/theme';
import { translate, type LangCode } from '@/lib/i18n';

/**
 * Pantalla de error para fallos al renderizar (se exporta como `ErrorBoundary`
 * desde app/_layout.tsx). Sin esto, un error de render deja la app en blanco
 * y bloqueada en builds de producción.
 *
 * Se muestra FUERA de los providers (tema, idioma…), por eso usa directamente
 * los tokens de lib/theme según el esquema del sistema y translate().
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = useColorScheme() === 'dark' ? darkColors : lightColors;
  const lang: LangCode = getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';

  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerMuted }]}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{translate(lang, 'errorBoundary.title')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{translate(lang, 'errorBoundary.message')}</Text>
      {__DEV__ && (
        <Text style={[styles.detail, { color: colors.textTertiary }]} numberOfLines={4}>
          {error.message}
        </Text>
      )}
      <Pressable
        onPress={retry}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>{translate(lang, 'errorBoundary.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  detail: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
