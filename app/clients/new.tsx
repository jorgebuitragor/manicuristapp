import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useCreateClient } from '@/hooks/useClients';
import { useToast } from '@/context/ToastContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ThemedField } from '@/components/ui/ThemedField';
import { ThemedSection } from '@/components/ui/ThemedSection';

export default function NewClientScreen() {
  const router = useRouter();
  const createClient = useCreateClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      showToast(t('client.error.nameRequired'), 'error');
      return;
    }
    await createClient.mutateAsync({
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      allergies: allergies.trim() || undefined,
    });
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
});
