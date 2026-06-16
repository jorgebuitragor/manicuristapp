import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { PolishFormModal } from '@/components/ui/PolishFormModal';

export default function NewPolishScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { rackId, position } = useLocalSearchParams<{ rackId?: string; position?: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <PolishFormModal
        onClose={() => router.back()}
        initialRackId={rackId}
        initialPosition={position ? parseInt(position, 10) : undefined}
      />
    </SafeAreaView>
  );
}
