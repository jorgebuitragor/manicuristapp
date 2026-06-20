import { useEffect, useRef } from 'react';
import { Animated, Platform, PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SwipeToDismissModalProps {
  children: React.ReactNode;
  onDismiss: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SwipeToDismissModal({ children, onDismiss, containerStyle }: SwipeToDismissModalProps) {
  // Start off-screen so the enter animation plays instead of the Modal's built-in slide
  const translateY = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      // Claim unclaimed touches (text, labels, empty areas) so move events are tracked.
      // Buttons/ScrollView claim first in bubble phase, so they are unaffected.
      onStartShouldSetPanResponder: () => true,
      // Claim gesture only when it's a clear downward swipe and no child claimed it
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      // Capture variant: fires before children (top-down), steals from TouchableOpacity on backdrop
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(onDismiss);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, containerStyle, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

/** Visual drag-handle pill shown only on Android at the top of a modal screen. */
export function ModalDragHandle() {
  const { colors } = useTheme();
  if (Platform.OS !== 'android') return null;
  return (
    <View style={styles.handleArea}>
      <View style={[styles.pill, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handleArea: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
