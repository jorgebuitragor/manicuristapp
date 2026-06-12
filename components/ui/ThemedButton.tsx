import { TouchableOpacity, StyleSheet, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedIcon } from '@/components/ui/ThemedIcon';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dangerOutline';

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  textStyle,
}: ThemedButtonProps) {
  const { colors } = useTheme();

  const buttonStyle =
    variant === 'primary'
      ? { backgroundColor: colors.primary, borderColor: colors.primary }
      : variant === 'outline'
        ? { backgroundColor: colors.primaryMuted, borderColor: colors.primary }
        : variant === 'dangerOutline'
          ? { backgroundColor: colors.dangerMuted, borderColor: colors.dangerBorder }
          : { backgroundColor: 'transparent', borderColor: 'transparent' };

  const tone =
    variant === 'primary' ? 'inverse' : variant === 'dangerOutline' ? 'danger' : variant === 'ghost' ? 'primary' : 'primary';

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, variant !== 'ghost' && styles.bordered, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {icon ? <ThemedIcon name={icon} size={16} tone={tone} /> : null}
        <ThemedText variant="buttonSmall" tone={tone} style={textStyle}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bordered: {
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});