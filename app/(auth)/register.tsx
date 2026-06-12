import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();

  async function handleRegister() {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Rellena todos los campos.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      showToast(error.message, 'error');
    } else if (data.session) {
      // Email confirmation disabled — session created immediately, navigate to app
      // (expo-router will redirect automatically via the auth listener)
    } else {
      // Email confirmation enabled — user must confirm before logging in
      showToast('Te hemos enviado un enlace de confirmación. Confírmalo y luego inicia sesión.', 'info');
      router.back();
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
        <ThemedText variant="title" style={styles.title}>{t('auth.register.title')}</ThemedText>
        <ThemedText tone="secondary" style={styles.subtitle}>{t('auth.register.subtitle')}</ThemedText>

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
          autoComplete="new-password"
        />

        <ThemedInput
          style={styles.input}
          placeholder={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <ThemedButton
          label={t('auth.register.button')}
          onPress={handleRegister}
          disabled={loading}
          style={styles.button}
        />

        <ThemedButton label={t('auth.hasAccount')} variant="ghost" onPress={() => router.back()} style={styles.backLink} />
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
  backLink: { marginTop: 20 },
});
