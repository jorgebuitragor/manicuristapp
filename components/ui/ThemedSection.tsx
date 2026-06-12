import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function ThemedSection({ style, ...props }: ViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
});