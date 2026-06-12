import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  leadingLabel?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  onLeadingPress?: () => void;
  trailingLabel?: string;
  onTrailingPress?: () => void;
  trailingDisabled?: boolean;
}

export function ScreenHeader({
  title,
  leadingLabel,
  leadingIcon,
  onLeadingPress,
  trailingLabel,
  onTrailingPress,
  trailingDisabled = false,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: colors.border }]} variant="card">
      {onLeadingPress ? (
        <TouchableOpacity onPress={onLeadingPress} style={styles.leadingButton}>
          {leadingIcon ? (
            <Ionicons name={leadingIcon} size={22} color={colors.textSecondary} />
          ) : (
            <ThemedText variant="button" tone="secondary">{leadingLabel}</ThemedText>
          )}
        </TouchableOpacity>
      ) : (
        <ThemedView style={styles.placeholder} variant="card" />
      )}
      <ThemedText variant="subtitle">{title}</ThemedText>
      {trailingLabel && onTrailingPress ? (
        <TouchableOpacity onPress={onTrailingPress} disabled={trailingDisabled}>
          <ThemedText variant="button" tone="primary" style={trailingDisabled && styles.disabled}>{trailingLabel}</ThemedText>
        </TouchableOpacity>
      ) : (
        <ThemedView style={styles.placeholder} variant="card" />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leadingButton: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  placeholder: {
    minWidth: 44,
  },
  disabled: {
    opacity: 0.5,
  },
});