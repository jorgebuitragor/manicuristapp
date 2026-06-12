import { View, StyleSheet, type TextInputProps } from 'react-native';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedText } from '@/components/ui/ThemedText';

interface ThemedFieldProps extends TextInputProps {
  label: string;
}

export function ThemedField({ label, style, placeholderTextColor, ...props }: ThemedFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText variant="label" tone="secondary">{label}</ThemedText>
      <ThemedInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});