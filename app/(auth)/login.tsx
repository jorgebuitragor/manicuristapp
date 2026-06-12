import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showToast('Introduce tu email y contraseña.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const redirectTo = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        showToast(error?.message ?? 'No se pudo iniciar sesión con Google.', 'error');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const { params, errorCode } = QueryParams.getQueryParams(result.url);
        if (errorCode) {
          showToast(errorCode, 'error');
          return;
        }
        const { access_token, refresh_token } = params;
        if (access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) showToast(sessionError.message, 'error');
        }
      }
    } catch (e) {
      showToast('Ocurrió un error al iniciar sesión con Google.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
        <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="color-palette" size={32} color={colors.primary} />
        </View>
        <ThemedText variant="title" style={styles.title}>{t('auth.appName')}</ThemedText>
        <ThemedText tone="secondary" style={styles.subtitle}>{t('auth.login.subtitle')}</ThemedText>

        <ThemedInput
          style={styles.input}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <ThemedInput
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <ThemedButton
          label={t('auth.login.button')}
          onPress={handleLogin}
          disabled={loading || googleLoading}
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <ThemedText tone="tertiary" style={styles.dividerText}>{t('common.or')}</ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.card }, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <ThemedText style={[styles.googleIcon, { color: colors.primary }]}>G</ThemedText>
              <ThemedText style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
          <ThemedText tone="primary" style={styles.registerLinkText}>{t('auth.noAccount')}</ThemedText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 32 },
  input: {
    width: '100%',
    marginBottom: 12,
  },
  button: { width: '100%', marginTop: 8 },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  registerLink: {
    marginTop: 20,
  },
  registerLinkText: { fontSize: 14, fontWeight: '600' },
});
