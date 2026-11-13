import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { signUp } from '@/lib/auth';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { useError } from '@/context/ErrorContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showError } = useError();

  async function handleRegister() {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError(t('auth.error.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      showError(t('auth.error.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      showError(t('auth.error.passwordTooShort'));
      return;
    }

    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password);
    setLoading(false);

    if (error) {
      showError(error);
    } else if (!needsConfirmation) {
      // Email confirmation disabled — session created immediately, navigate to app
      // (expo-router will redirect automatically via the auth listener)
    } else {
      // Email confirmation enabled — user must confirm before logging in
      showToast(t('auth.confirmEmail.message'), 'info');
      router.back();
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
        <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="person-add-outline" size={32} color={colors.primary} />
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

        <PasswordInput
          ref={passwordRef}
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          submitBehavior="submit"
          editable={!loading}
        />

        <PasswordInput
          ref={confirmPasswordRef}
          style={styles.input}
          placeholder={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          editable={!loading}
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
