import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useToast, type ToastType } from '@/context/ToastContext';
import { ThemedText } from './ThemedText';

function toastColors(type: ToastType, colors: ReturnType<typeof useTheme>['colors']) {
  switch (type) {
    case 'success': return { bg: colors.statusCompleted, text: colors.statusCompletedText, icon: 'checkmark-circle' as const };
    case 'error':   return { bg: colors.dangerMuted,     text: colors.danger,               icon: 'close-circle' as const };
    case 'info':    return { bg: colors.primaryMuted,    text: colors.primary,              icon: 'information-circle' as const };
  }
}

export function ToastRenderer() {
  const { toast, hideToast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [toast.visible]);

  const palette = toastColors(toast.type, colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 12,
          backgroundColor: palette.bg,
          borderColor: palette.text,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={toast.visible ? 'box-none' : 'none'}
    >
      <Ionicons name={palette.icon} size={20} color={palette.text} />
      <ThemedText style={[styles.message, { color: palette.text }]} numberOfLines={2}>
        {toast.message}
      </ThemedText>
      <TouchableOpacity onPress={hideToast} hitSlop={8}>
        <Ionicons name="close" size={18} color={palette.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
