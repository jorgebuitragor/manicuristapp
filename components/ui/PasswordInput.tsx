import { useState, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedInput } from './ThemedInput';
import { useTheme } from '@/context/ThemeContext';

export const PasswordInput = forwardRef<TextInput, Omit<TextInputProps, 'secureTextEntry'>>(
  function PasswordInput({ style, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const { colors } = useTheme();

    return (
      <View style={[styles.container, style]}>
        <ThemedInput
          ref={ref}
          {...props}
          secureTextEntry={!visible}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    paddingRight: 44,
  },
  toggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
});
