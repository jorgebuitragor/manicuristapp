import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useCreateClient } from '@/hooks/useClients';
import { useError } from '@/context/ErrorContext';
import { useNotificationSettings } from '@/context/NotificationContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedField } from '@/components/ui/ThemedField';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedText } from '@/components/ui/ThemedText';
import { BirthdayPickerField } from '@/components/ui/AppDatePicker';
import { scheduleBirthdayNotification } from '@/lib/notifications';

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function NewClientScreen() {
  const router = useRouter();
  const createClient = useCreateClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showError } = useError();
  const { birthdayNotificationsEnabled } = useNotificationSettings();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      showError(t('client.error.nameRequired'));
      return;
    }
    const created = await createClient.mutateAsync({
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      allergies: allergies.trim() || undefined,
      birthday: birthday ? toISODate(birthday) : null,
    });

    if (birthday && birthdayNotificationsEnabled) {
      scheduleBirthdayNotification(created.id, name.trim(), toISODate(birthday));
    }

    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        leadingLabel={t('common.cancel')}
        onLeadingPress={() => router.back()}
        title={t('client.new.title')}
        trailingLabel={t('common.save')}
        onTrailingPress={handleCreate}
        trailingDisabled={createClient.isPending}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedSection>
            <ThemedField
              label={`${t('client.name')} *`}
              value={name}
              onChangeText={setName}
              placeholder={t('client.fullName')}
              autoFocus
            />
            <ThemedField
              label={t('client.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="612 345 678"
              keyboardType="phone-pad"
            />
            <ThemedField
              label={t('client.allergies')}
              value={allergies}
              onChangeText={setAllergies}
              placeholder={t('client.allergiesPlaceholder')}
              multiline
              style={styles.inputMultiline}
            />
            <ThemedField
              label={t('client.notes')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('client.notesPlaceholder')}
              multiline
              style={styles.inputMultiline}
            />

            {showBirthdayPicker ? (
              <View>
                <BirthdayPickerField
                  label={t('client.birthday')}
                  value={birthday}
                  onChange={(d) => setBirthday(d)}
                />
                <TouchableOpacity
                  onPress={() => { setBirthday(null); setShowBirthdayPicker(false); }}
                  style={styles.removeRow}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                  <ThemedText variant="caption" tone="danger"> {t('common.delete')}</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => { setShowBirthdayPicker(true); setBirthday(new Date(new Date().getFullYear() - 30, 0, 1)); }}
                style={styles.addRow}
                activeOpacity={0.7}
              >
                <Ionicons name="gift-outline" size={16} color={colors.primary} />
                <ThemedText variant="caption" tone="primary"> {t('client.birthdayAdd')}</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 4 },
  removeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 4 },
});
