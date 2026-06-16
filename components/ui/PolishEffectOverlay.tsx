import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type PolishEffect = 'matte' | 'shimmer' | 'glitter' | 'cat_eye' | 'holographic' | 'duochrome';

// Fixed sparkle positions — deterministic so no rerenders
const SPARKLES: { top: number; left: number; size: number }[] = [
  { top: 7,  left: 9,  size: 2.5 },
  { top: 13, left: 33, size: 2 },
  { top: 21, left: 19, size: 3 },
  { top: 29, left: 7,  size: 2 },
  { top: 34, left: 41, size: 2.5 },
  { top: 45, left: 14, size: 2 },
  { top: 53, left: 29, size: 3 },
  { top: 62, left: 11, size: 2 },
  { top: 17, left: 43, size: 2.5 },
  { top: 40, left: 25, size: 2 },
  { top: 58, left: 43, size: 2.5 },
  { top: 70, left: 21, size: 2 },
  { top: 9,  left: 24, size: 1.5 },
  { top: 48, left: 38, size: 1.5 },
];

function hueShift(hex: string, degrees: number): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  h = (h + degrees) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h < 60)       { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else              { r1 = c; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

interface Props {
  effect: PolishEffect;
  hexColor?: string | null;
}

export function PolishEffectOverlay({ effect, hexColor }: Props) {
  switch (effect) {
    case 'matte':
      // Flat finish: dark-to-transparent top layer, no shine
      return (
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );

    case 'shimmer':
      // Diagonal pearl-like sheen
      return (
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );

    case 'cat_eye':
      // Bright vertical stripe down the center, dark on both sides
      return (
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.30)',
            'rgba(0,0,0,0.10)',
            'rgba(255,255,255,0.80)',
            'rgba(0,0,0,0.10)',
            'rgba(0,0,0,0.30)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      );

    case 'glitter':
      return (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent', 'rgba(255,215,0,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {SPARKLES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.sparkle,
                {
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  borderRadius: s.size / 2,
                  // alternate gold / white sparkles
                  backgroundColor: i % 3 === 0
                    ? 'rgba(255,215,0,0.95)'
                    : 'rgba(255,255,255,0.92)',
                },
              ]}
            />
          ))}
        </View>
      );

    case 'holographic':
      return (
        <LinearGradient
          colors={[
            'rgba(255,80,80,0.30)',
            'rgba(255,160,0,0.25)',
            'rgba(255,255,60,0.22)',
            'rgba(60,220,60,0.22)',
            'rgba(60,100,255,0.28)',
            'rgba(180,0,220,0.25)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );

    case 'duochrome': {
      const safeHex = hexColor && /^#[0-9A-Fa-f]{6}$/.test(hexColor) ? hexColor : '#888888';
      const [r, g, b] = hueShift(safeHex, 60);
      return (
        <LinearGradient
          colors={[
            `rgba(${r},${g},${b},0.80)`,
            `rgba(${r},${g},${b},0.15)`,
            `rgba(${r},${g},${b},0.60)`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );
    }

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
  },
});
