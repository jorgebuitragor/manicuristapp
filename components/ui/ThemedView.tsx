import { View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ViewVariant = 'background' | 'card' | 'muted' | 'transparent';

interface ThemedViewProps extends ViewProps {
  variant?: ViewVariant;
  style?: StyleProp<ViewStyle>;
}

export function ThemedView({ variant = 'transparent', style, ...props }: ThemedViewProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === 'background'
      ? colors.background
      : variant === 'card'
        ? colors.card
        : variant === 'muted'
          ? colors.inputBackground
          : 'transparent';

  return <View style={[{ backgroundColor }, style]} {...props} />;
}