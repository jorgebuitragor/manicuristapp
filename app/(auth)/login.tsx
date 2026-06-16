import { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useError } from '@/context/ErrorContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showError } = useError();

  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showError(t('auth.error.fillFields'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) showError(error.message);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const redirectTo = 'manicuristapp://auth-callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error || !data.url) {
        showError(error?.message ?? t('auth.error.googleFailed'));
        return;
      }

      // Abre el browser sin interceptar — el deep link handler en _layout.tsx
      // procesa los tokens cuando Supabase redirige de vuelta a exp://...
      await WebBrowser.openBrowserAsync(data.url);
    } catch {
      showError(t('auth.error.googleError'));
    } finally {
      setGoogleLoading(false);
    }
  }

  const isLoading = loading || googleLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Image
          source={require('@/assets/manicuristapp-icon.png')}
          style={styles.logo}
        />
        <View style={styles.appName}>
          <ThemedText variant="title" style={styles.title}>Manicurist</ThemedText>
          <ThemedText variant="title" style={[styles.title, { color: colors.primary }]}>App</ThemedText>
        </View>
        <ThemedText tone="secondary" style={styles.subtitle}>{t('auth.login.subtitle')}</ThemedText>

        <ThemedInput
          style={styles.field}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
          editable={!isLoading}
        />

        <PasswordInput
          ref={passwordRef}
          style={styles.field}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          editable={!isLoading}
        />

        <ThemedButton
          label={loading ? t('common.loading') : t('auth.login.button')}
          onPress={handleLogin}
          disabled={isLoading}
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <ThemedText tone="tertiary" style={styles.dividerText}>{t('common.or')}</ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            { borderColor: colors.border, backgroundColor: colors.card },
            isLoading && styles.disabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#4285F4" />
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
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 12,
  },
  appName: { flexDirection: 'row', marginBottom: 4 },
  title: {},
  subtitle: { marginBottom: 32 },
  field: {
    width: '100%',
    marginBottom: 12,
  },
  button: { width: '100%', marginTop: 8 },
  disabled: { opacity: 0.6 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 14 },
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
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  registerLink: { marginTop: 20 },
  registerLinkText: { fontSize: 14, fontWeight: '600' },
});
