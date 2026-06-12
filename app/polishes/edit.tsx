import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { usePolish } from '@/hooks/usePolishes';
import { PolishFormModal } from '@/components/ui/PolishFormModal';
import { SwipeToDismissModal, ModalDragHandle } from '@/components/ui/SwipeToDismissModal';

export default function EditPolishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: polish, isLoading } = usePolish(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SwipeToDismissModal onDismiss={() => router.back()}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ModalDragHandle />
        <PolishFormModal onClose={() => router.back()} polish={polish} />
      </SafeAreaView>
    </SwipeToDismissModal>
  );
}
