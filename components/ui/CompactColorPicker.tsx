import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hsvToHex(h: number, s: number, v: number) {
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;
  const c = val * sat;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1)      { r = c; g = x; }
  else if (hh < 2) { r = x; g = c; }
  else if (hh < 3) { g = c; b = x; }
  else if (hh < 4) { g = x; b = c; }
  else if (hh < 5) { r = x; b = c; }
  else             { r = c; b = x; }
  const m = val - c;
  const toHex = (ch: number) => Math.round((ch + m) * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hexValue: string) {
  const hex = hexValue.replace('#', '');
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r)      hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else                hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

interface CompactColorPickerProps {
  value: string;
  onChangeValue: (hex: string) => void;
}

export function CompactColorPicker({ value, onChangeValue }: CompactColorPickerProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const initial = useMemo(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) return hexToHsv(value) ?? { h: 0, s: 80, v: 80 };
    return { h: 0, s: 80, v: 80 };
  }, []);

  const [hsv, setHsv] = useState(initial);
  const [spectrumLayout, setSpectrumLayout] = useState({ width: 1, height: 1 });
  const [hueLayout, setHueLayout] = useState({ width: 1 });

  const hueColor = useMemo(() => hsvToHex(hsv.h, 100, 100), [hsv.h]);
  const currentHex = useMemo(() => hsvToHex(hsv.h, hsv.s, hsv.v), [hsv]);

  const updateFromHsv = (next: { h: number; s: number; v: number }) => {
    const sanitized = { h: clamp(next.h, 0, 360), s: clamp(next.s, 0, 100), v: clamp(next.v, 0, 100) };
    setHsv(sanitized);
    onChangeValue(hsvToHex(sanitized.h, sanitized.s, sanitized.v));
  };

  const spectrumResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const sat = clamp((e.nativeEvent.locationX / Math.max(1, spectrumLayout.width)) * 100, 0, 100);
        const val = clamp(100 - (e.nativeEvent.locationY / Math.max(1, spectrumLayout.height)) * 100, 0, 100);
        updateFromHsv({ ...hsv, s: sat, v: val });
      },
      onPanResponderMove: (e) => {
        const sat = clamp((e.nativeEvent.locationX / Math.max(1, spectrumLayout.width)) * 100, 0, 100);
        const val = clamp(100 - (e.nativeEvent.locationY / Math.max(1, spectrumLayout.height)) * 100, 0, 100);
        updateFromHsv({ ...hsv, s: sat, v: val });
      },
    }),
  [hsv, spectrumLayout]);

  const hueResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        updateFromHsv({ ...hsv, h: clamp((e.nativeEvent.locationX / Math.max(1, hueLayout.width)) * 360, 0, 360) });
      },
      onPanResponderMove: (e) => {
        updateFromHsv({ ...hsv, h: clamp((e.nativeEvent.locationX / Math.max(1, hueLayout.width)) * 360, 0, 360) });
      },
    }),
  [hsv, hueLayout]);

  const selectorX = (hsv.s / 100) * spectrumLayout.width;
  const selectorY = ((100 - hsv.v) / 100) * spectrumLayout.height;
  const hueX = (hsv.h / 360) * hueLayout.width;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Saturation/value panel */}
        <View
          style={[styles.spectrum, { borderColor: colors.border, height: isMobile ? 140 : 160 }]}
          onLayout={(e) => setSpectrumLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
          {...spectrumResponder.panHandlers}
        >
          <LinearGradient
            colors={['#FFFFFF', hueColor]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', '#000000']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            pointerEvents="none"
            style={[
              styles.selector,
              {
                borderColor: colors.card,
                left: clamp(selectorX - 8, -2, Math.max(-2, spectrumLayout.width - 14)),
                top: clamp(selectorY - 8, -2, Math.max(-2, spectrumLayout.height - 14)),
              },
            ]}
          />
        </View>

        {/* Color preview swatch */}
        <View
          style={[styles.preview, { backgroundColor: currentHex, borderColor: colors.border }]}
        />
      </View>

      {/* Hue bar */}
      <View
        style={[styles.hueBar, { borderColor: colors.border }]}
        onLayout={(e) => setHueLayout({ width: e.nativeEvent.layout.width })}
        {...hueResponder.panHandlers}
      >
        <LinearGradient
          colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            styles.hueSelector,
            {
              borderColor: colors.card,
              left: clamp(hueX - 7, -2, Math.max(-2, hueLayout.width - 12)),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  spectrum: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  selector: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  preview: {
    width: 52,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  hueBar: {
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  hueSelector: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
