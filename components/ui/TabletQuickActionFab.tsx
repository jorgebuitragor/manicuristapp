import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';

interface TabletQuickActionFabProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export function TabletQuickActionFab({
  label,
  onPress,
  icon = 'add',
  style,
}: TabletQuickActionFabProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Ionicons name={icon} size={20} color={colors.onPrimary} />
      <ThemedText tone="inverse" style={styles.fabLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});