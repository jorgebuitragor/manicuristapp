import { useEffect, useRef } from 'react';
import {
  View, Image, Text, StyleSheet, Dimensions, Platform,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Design canvas 402×874 → scale to real screen
const SX = width / 402;
const SY = height / 874;
const S  = Math.min(SX, SY);

const ICON_SIZE = Math.round(160 * S);
const ICON_TOP  = height * 0.38;
const NAME_TOP  = height * 0.52;

interface Props {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: Props) {
  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale   = useRef(new Animated.Value(0.5 * 1.45)).current;
  const floatY      = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameY       = useRef(new Animated.Value(22)).current;
  const spkOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = (val: Animated.Value, toValue: number, duration: number, delay = 0, easing = Easing.out(Easing.cubic)) =>
      Animated.timing(val, { toValue, duration, delay, easing, useNativeDriver: true });

    Animated.parallel([
      // Background bloom 0–350ms
      t(bgOpacity, 1, 350),
      // Icon fade 100–480ms
      t(iconOpacity, 1, 380, 100),
      // Icon scale easeOutBack 100–800ms
      t(iconScale, 1, 700, 100, Easing.out(Easing.back(1.70158))),
      // Glow follows icon
      t(glowOpacity, 0.55, 380, 100),
      t(glowScale, 1.45, 700, 100, Easing.out(Easing.back(1.70158))),
      // App name 700–1200ms
      t(nameOpacity, 1, 500, 700),
      t(nameY, 0, 500, 700),
      // Sparkles 1100–1550ms
      t(spkOpacity, 1, 450, 1100),
    ]).start();

    // Floating loop after 1.3s
    const floatTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -5, duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 5,  duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    }, 1300);

    const doneTimer = setTimeout(onFinish, 2400);

    return () => {
      clearTimeout(floatTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const iconTransform = [{ translateY: floatY }, { scale: iconScale }];
  const glowTransform = [{ translateY: floatY }, { scale: glowScale }];

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#fff9fc', '#fde8ff', '#f0d0f8', '#e8bcf0']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative blobs */}
        <View style={styles.blobBL} />
        <View style={styles.blobTR} />

        {/* Glow ring behind icon */}
        <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: glowTransform }]} />

        {/* App icon */}
        <Animated.View style={[styles.iconWrapper, { opacity: iconOpacity, transform: iconTransform }]}>
          <Image source={require('@/assets/manicuristapp-icon.png')} style={styles.icon} />
        </Animated.View>

        {/* Sparkles */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: spkOpacity }]} pointerEvents="none">
          <Sparkle left={295 * SX} top={385 * SY} size={22 * S} color="#bf7ef5" />
          <Sparkle left={106 * SX} top={210 * SY} size={12 * S} color="#d9aeff" />
          <Sparkle left={289 * SX} top={193 * SY} size={17 * S} color="#b07ae8" />
          <Sparkle left={100 * SX} top={370 * SY} size={9  * S} color="#cc8cf7" />
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.nameContainer, { opacity: nameOpacity, transform: [{ translateY: nameY }] }]}>
          <Text style={styles.appName}>
            <Text style={styles.nameMain}>Manicurist</Text>
            <Text style={styles.nameAccent}>App</Text>
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Sparkle({ left, top, size, color }: { left: number; top: number; size: number; color: string }) {
  return (
    <Text style={{ position: 'absolute', left, top, fontSize: size, color, lineHeight: size * 1.2 }}>✦</Text>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff9fc',
  },
  blobBL: {
    position: 'absolute',
    bottom: -100 * SY, left: -120 * SX,
    width: 440 * SX, height: 380 * SY,
    borderRadius: 9999,
    backgroundColor: 'rgba(192,132,252,0.20)',
  },
  blobTR: {
    position: 'absolute',
    top: -50 * SY, right: -100 * SX,
    width: 360 * SX, height: 310 * SY,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,180,255,0.16)',
  },
  glow: {
    position: 'absolute',
    left: width / 2 - 80 * S,
    top: ICON_TOP - 80 * S,
    width: 160 * S,
    height: 160 * S,
    borderRadius: 9999,
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
  iconWrapper: {
    position: 'absolute',
    left: width / 2 - ICON_SIZE / 2,
    top: ICON_TOP - ICON_SIZE / 2,
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Math.round(36 * S),
    overflow: 'hidden',
    shadowColor: '#8c3cdc',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.32,
    shadowRadius: 32,
    elevation: 20,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    position: 'absolute',
    left: 0, right: 0,
    top: NAME_TOP,
    alignItems: 'center',
  },
  appName: {
    fontSize: Math.round(27 * S),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  nameMain:   { color: '#4c1d95' },
  nameAccent: { color: '#9333ea' },
});
