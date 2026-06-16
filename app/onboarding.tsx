import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useError } from '@/context/ErrorContext';
import { supabase } from '@/lib/supabase';
import type { OrgType } from '@/types/database.types';

type Step = 1 | 2;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { refetch } = useOrganization();
  const { showError } = useError();

  const [step, setStep] = useState<Step>(1);
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [studioName, setStudioName] = useState('');
  const [yourName, setYourName] = useState('');
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    if (!orgType) {
      showError(t('onboarding.error.selectType'));
      return;
    }
    setStep(2);
  }

  async function handleFinish() {
    if (!studioName.trim()) {
      showError(t('onboarding.error.studioName'));
      return;
    }
    if (!yourName.trim()) {
      showError(t('onboarding.error.yourName'));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // 1. Crear organización + membresía via función SECURITY DEFINER
      const { data: orgId, error: rpcError } = await (supabase as any)
        .rpc('create_organization', {
          org_name: studioName.trim(),
          org_type: orgType!,
        });
      if (rpcError) throw rpcError;

      // 2. Crear perfil de profesional
      const { error: profError } = await supabase
        .from('professionals')
        .insert({
          name: yourName.trim(),
          color: '#c084fc',
          user_id: user.id,
          organization_id: orgId as string,
        });
      if (profError) throw profError;

      // 3. Actualizar contexto → AuthGuard redirige a (tabs)
      refetch();
    } catch (err: any) {
      console.error('[Onboarding] error:', JSON.stringify(err, null, 2));
      showError(err?.message ?? t('onboarding.error.create'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons
              name={step === 1 ? 'business-outline' : 'sparkles-outline'}
              size={32}
              color={colors.primary}
            />
          </View>

          <ThemedText variant="title" style={styles.title}>
            {t('onboarding.title')}
          </ThemedText>

          {/* Indicador de pasos */}
          <View style={styles.steps}>
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
            <View style={[styles.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
          </View>

          {step === 1 ? (
            <StepOne
              orgType={orgType}
              onSelect={setOrgType}
              colors={colors}
              t={t}
            />
          ) : (
            <StepTwo
              studioName={studioName}
              yourName={yourName}
              onStudioName={setStudioName}
              onYourName={setYourName}
              colors={colors}
              t={t}
            />
          )}

          {step === 1 ? (
            <ThemedButton
              label={t('onboarding.continue')}
              onPress={handleContinue}
              style={styles.button}
            />
          ) : (
            <>
              <ThemedButton
                label={t('onboarding.finish')}
                onPress={handleFinish}
                disabled={loading}
                style={styles.button}
              />
              <ThemedButton
                label={t('onboarding.back')}
                variant="ghost"
                onPress={() => setStep(1)}
                style={styles.backButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepOne({
  orgType,
  onSelect,
  colors,
  t,
}: {
  orgType: OrgType | null;
  onSelect: (t: OrgType) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  t: (key: string) => string;
}) {
  return (
    <View style={styles.stepContent}>
      <ThemedText tone="secondary" style={styles.subtitle}>
        {t('onboarding.subtitle')}
      </ThemedText>

      <TypeCard
        icon="home-outline"
        title={t('onboarding.homeStudio.title')}
        desc={t('onboarding.homeStudio.desc')}
        selected={orgType === 'home_studio'}
        onPress={() => onSelect('home_studio')}
        colors={colors}
      />

      <TypeCard
        icon="storefront-outline"
        title={t('onboarding.salon.title')}
        desc={t('onboarding.salon.desc')}
        selected={orgType === 'salon'}
        onPress={() => onSelect('salon')}
        colors={colors}
      />
    </View>
  );
}

function TypeCard({
  icon,
  title,
  desc,
  selected,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      style={[
        styles.typeCard,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryMuted : colors.inputBackground,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.typeIcon, { backgroundColor: selected ? colors.primary : colors.border }]}>
        <Ionicons name={icon} size={22} color={selected ? colors.onPrimary : colors.textSecondary} />
      </View>
      <View style={styles.typeText}>
        <ThemedText variant="label" style={{ color: selected ? colors.primary : colors.text }}>
          {title}
        </ThemedText>
        <ThemedText tone="secondary" style={styles.typeDesc}>{desc}</ThemedText>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

function StepTwo({
  studioName,
  yourName,
  onStudioName,
  onYourName,
  colors,
  t,
}: {
  studioName: string;
  yourName: string;
  onStudioName: (v: string) => void;
  onYourName: (v: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  t: (key: string) => string;
}) {
  return (
    <View style={styles.stepContent}>
      <ThemedText tone="secondary" style={styles.subtitle}>
        {t('onboarding.step2.title')}
      </ThemedText>

      <ThemedText variant="label" style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {t('onboarding.studioName.label')}
      </ThemedText>
      <ThemedInput
        style={styles.input}
        placeholder={t('onboarding.studioName.placeholder')}
        value={studioName}
        onChangeText={onStudioName}
        autoFocus
      />

      <ThemedText variant="label" style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {t('onboarding.yourName.label')}
      </ThemedText>
      <ThemedInput
        style={styles.input}
        placeholder={t('onboarding.yourName.placeholder')}
        value={yourName}
        onChangeText={onYourName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
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
  title: { marginBottom: 12 },
  subtitle: { marginBottom: 16, textAlign: 'center' },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    maxWidth: 60,
  },
  stepContent: {
    width: '100%',
    marginBottom: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { flex: 1 },
  typeDesc: { fontSize: 13, marginTop: 2 },
  fieldLabel: { marginBottom: 6, fontSize: 13, fontWeight: '600' },
  input: { width: '100%', marginBottom: 16 },
  button: { width: '100%', marginTop: 8 },
  backButton: { marginTop: 4 },
});
