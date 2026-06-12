import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type IconTone = 'default' | 'secondary' | 'tertiary' | 'primary' | 'danger' | 'inverse';

interface ThemedIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  tone?: IconTone;
}

export function ThemedIcon({ name, size = 20, tone = 'default' }: ThemedIconProps) {
  const { colors } = useTheme();

  const color =
    tone === 'secondary'
      ? colors.textSecondary
      : tone === 'tertiary'
        ? colors.textTertiary
        : tone === 'primary'
          ? colors.primary
          : tone === 'danger'
            ? colors.danger
            : tone === 'inverse'
              ? colors.onPrimary
              : colors.text;

  return <Ionicons name={name} size={size} color={color} />;
}