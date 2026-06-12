import { forwardRef } from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export const ThemedInput = forwardRef<TextInput, TextInputProps>(function ThemedInput(
  { style, placeholderTextColor, ...props },
  ref
) {
  const { colors } = useTheme();

  return (
    <TextInput
      ref={ref}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          color: colors.text,
          backgroundColor: colors.inputBackground,
        },
        style,
      ]}
      placeholderTextColor={placeholderTextColor ?? colors.textTertiary}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});