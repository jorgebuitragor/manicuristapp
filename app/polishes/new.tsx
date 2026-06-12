import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { PolishFormModal } from '@/components/ui/PolishFormModal';

export default function NewPolishScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <PolishFormModal onClose={() => router.back()} />
    </SafeAreaView>
  );
}
