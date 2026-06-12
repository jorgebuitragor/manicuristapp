import { Text, StyleSheet, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type TextVariant =
  | 'body'
  | 'title'
  | 'subtitle'
  | 'sectionTitle'
  | 'label'
  | 'caption'
  | 'button'
  | 'buttonSmall';

type TextTone =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'primary'
  | 'danger'
  | 'inverse';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
}

export function ThemedText({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme();

  const toneStyle = {
    color:
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
                : colors.text,
  };

  return <Text style={[variantStyles[variant], toneStyle, style]} {...props} />;
}

const variantStyles = StyleSheet.create<Record<TextVariant, TextStyle>>({
  body: {
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '700',
  },
});