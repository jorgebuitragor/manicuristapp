import { useEffect, useState } from 'react';
import {
  Modal, View, KeyboardAvoidingView, Platform,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ThemedText } from './ThemedText';
import { ThemedInput } from './ThemedInput';

interface IncomeConfirmModalProps {
  visible: boolean;
  suggestedAmount: number;
  onConfirm: (amount: number, notes: string) => Promise<void>;
  onSkip: () => void;
}

export function IncomeConfirmModal({
  visible,
  suggestedAmount,
  onConfirm,
  onSkip,
}: IncomeConfirmModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { symbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
      setNotes('');
    }
  }, [visible, suggestedAmount]);

  async function handleConfirm() {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setLoading(true);
    try {
      await onConfirm(parsed, notes.trim());
    } finally {
      setLoading(false);
    }
  }

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const canConfirm = !isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']} onRequestClose={onSkip}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onSkip} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconRow, { backgroundColor: colors.primaryMuted }]}>
            <ThemedText style={styles.icon}>💰</ThemedText>
          </View>

          <ThemedText variant="subtitle" style={styles.title}>{t('incomes.confirm.title')}</ThemedText>
          <ThemedText tone="secondary" style={styles.subtitle}>{t('incomes.confirm.subtitle')}</ThemedText>

          <ThemedInput
            placeholder={`${t('incomes.confirm.amount')} (${symbol})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={[styles.input, { borderColor: colors.border }]}
          />
          <ThemedInput
            placeholder={t('incomes.confirm.notes')}
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, { borderColor: colors.border }]}
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSkip, { borderColor: colors.border }]}
              onPress={onSkip}
              disabled={loading}
            >
              <ThemedText tone="secondary">{t('incomes.confirm.skip')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn, styles.btnConfirm,
                { backgroundColor: canConfirm ? colors.primary : colors.primaryMuted },
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <ThemedText style={{ color: colors.onPrimary, fontWeight: '600' }}>
                  {t('incomes.confirm.register')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  iconRow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: { fontSize: 26 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSkip: {
    borderWidth: 1.5,
  },
  btnConfirm: {},
});
