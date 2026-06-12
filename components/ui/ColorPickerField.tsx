import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedText } from '@/components/ui/ThemedText';
import { useI18n } from '@/context/I18nContext';
import { ThemedDropdown, type DropdownOption } from '@/components/ui/ThemedDropdown';
import { usePolishLabels } from '@/context/PolishLabelsContext';

const BASE_COLOR_HUES = {
  red: 0,
  orange: 28,
  yellow: 52,
  green: 120,
  mint: 156,
  turquoise: 174,
  blue: 214,
  navy: 236,
  purple: 270,
  pink: 330,
  brown: 24,
  gray: 0,
} as const;


const TONE_MODELS = {
  classic: { saturation: 72, value: 78 },
  pastel: { saturation: 38, value: 96 },
  neon: { saturation: 98, value: 100 },
  nude: { saturation: 24, value: 88 },
  deep: { saturation: 62, value: 52 },
} as const;

const TONE_KEYS = Object.keys(TONE_MODELS) as Array<keyof typeof TONE_MODELS>;

interface ColorPickerFieldProps {
  value: string;
  onChangeValue: (value: string) => void;
  baseColor: string;
  onChangeBaseColor: (value: string) => void;
  toneFamily: string;
  onChangeToneFamily: (value: string) => void;
  label: string;
  placeholder: string;
  hint?: string;
}

function normalizeHexInput(value: string) {
  const cleaned = value.replace(/[^#0-9a-fA-F]/g, '').toUpperCase();
  if (!cleaned) return '';
  if (cleaned.startsWith('#')) return cleaned;
  return `#${cleaned}`;
}

function isHexLike(value: string) {
  return /^#([0-9A-F]{6})$/i.test(value.trim());
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hsvToHex(h: number, s: number, v: number) {
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;
  const c = val * sat;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hh >= 0 && hh < 1) {
    r = c;
    g = x;
  } else if (hh < 2) {
    r = x;
    g = c;
  } else if (hh < 3) {
    g = c;
    b = x;
  } else if (hh < 4) {
    g = x;
    b = c;
  } else if (hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = val - c;
  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0').toUpperCase();
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
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }

  if (hue < 0) hue += 360;
  const saturation = max === 0 ? 0 : (delta / max) * 100;
  const value = max * 100;

  return {
    h: hue,
    s: saturation,
    v: value,
  };
}

export function ColorPickerField({
  value,
  onChangeValue,
  baseColor,
  onChangeBaseColor,
  toneFamily,
  onChangeToneFamily,
  label,
  placeholder,
  hint,
}: ColorPickerFieldProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const normalized = normalizeHexInput(value);
  const hasPreview = isHexLike(normalized);
  const [hsv, setHsv] = useState({ h: 330, s: 72, v: 78 });
  const [spectrumLayout, setSpectrumLayout] = useState({ width: 1, height: 1 });
  const [hueLayout, setHueLayout] = useState({ width: 1 });

  const { baseColors, toneFamilies } = usePolishLabels();

  const selectedTone = TONE_KEYS.includes(toneFamily as keyof typeof TONE_MODELS)
    ? (toneFamily as keyof typeof TONE_MODELS)
    : 'classic';

  useEffect(() => {
    if (hasPreview) {
      const parsed = hexToHsv(normalized);
      if (parsed) setHsv(parsed);
    }
  }, [hasPreview, normalized]);

  const tonePreset = useMemo(() => TONE_MODELS[selectedTone], [selectedTone]);

  const currentColorHex = useMemo(
    () => hsvToHex(hsv.h, hsv.s, hsv.v),
    [hsv.h, hsv.s, hsv.v]
  );

  const hueColor = useMemo(() => hsvToHex(hsv.h, 100, 100), [hsv.h]);

  const updateColorFromHsv = (next: { h: number; s: number; v: number }) => {
    const sanitized = {
      h: clamp(next.h, 0, 360),
      s: clamp(next.s, 0, 100),
      v: clamp(next.v, 0, 100),
    };
    setHsv(sanitized);
    onChangeValue(hsvToHex(sanitized.h, sanitized.s, sanitized.v));
  };

  const updateSatValByPoint = (x: number, y: number) => {
    const safeWidth = Math.max(1, spectrumLayout.width);
    const safeHeight = Math.max(1, spectrumLayout.height);
    const sat = clamp((x / safeWidth) * 100, 0, 100);
    const val = clamp(100 - (y / safeHeight) * 100, 0, 100);
    updateColorFromHsv({ ...hsv, s: sat, v: val });
  };

  const updateHueByPoint = (x: number) => {
    const safeWidth = Math.max(1, hueLayout.width);
    const nextHue = clamp((x / safeWidth) * 360, 0, 360);
    updateColorFromHsv({ ...hsv, h: nextHue });
  };

  const spectrumResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateSatValByPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
        onPanResponderMove: (event) => {
          updateSatValByPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
      }),
    [hsv, spectrumLayout.height, spectrumLayout.width]
  );

  const hueResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateHueByPoint(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateHueByPoint(event.nativeEvent.locationX);
        },
      }),
    [hsv, hueLayout.width]
  );

  const handleBaseColorPress = (key: string) => {
    onChangeBaseColor(key);
    const knownHue = BASE_COLOR_HUES[key as keyof typeof BASE_COLOR_HUES];
    if (knownHue !== undefined) {
      updateColorFromHsv({ h: knownHue, s: tonePreset.saturation, v: tonePreset.value });
    }
  };

  const handleTonePress = (key: string) => {
    onChangeToneFamily(key);
    const model = TONE_MODELS[key as keyof typeof TONE_MODELS];
    if (model) {
      updateColorFromHsv({ h: hsv.h, s: model.saturation, v: model.value });
    }
  };

  const handleHexInput = (text: string) => {
    const next = normalizeHexInput(text);
    onChangeValue(next);
    if (isHexLike(next)) {
      const parsed = hexToHsv(next);
      if (parsed) setHsv(parsed);
    }
  };

  const selectorX = (hsv.s / 100) * spectrumLayout.width;
  const selectorY = ((100 - hsv.v) / 100) * spectrumLayout.height;
  const hueX = (hsv.h / 360) * hueLayout.width;

  const baseColorOptions: DropdownOption[] = useMemo(
    () => baseColors.map((entry) => {
      const i18nLabel = t(`polishes.colorFamilies.${entry.key}`);
      return {
        value: entry.key,
        label: entry.label ?? (i18nLabel !== `polishes.colorFamilies.${entry.key}` ? i18nLabel : entry.key),
      };
    }),
    [baseColors, t]
  );

  const toneOptions: DropdownOption[] = useMemo(
    () => toneFamilies.map((entry) => {
      const i18nLabel = t(`polishes.tones.${entry.key}`);
      return {
        value: entry.key,
        label: entry.label ?? (i18nLabel !== `polishes.tones.${entry.key}` ? i18nLabel : entry.key),
      };
    }),
    [toneFamilies, t]
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      <View style={styles.metaSection}>
        <ThemedDropdown
          label={t('polishes.baseColor')}
          value={baseColor}
          options={baseColorOptions}
          onChange={handleBaseColorPress}
        />
      </View>

      <View style={styles.metaSection}>
        <ThemedDropdown
          label={t('polishes.toneFamily')}
          value={selectedTone}
          options={toneOptions}
          onChange={handleTonePress}
        />
      </View>

      <View style={styles.metaSection}>
        <ThemedText variant="caption" tone="tertiary">{t('polishes.spectrum')}</ThemedText>

        <View
          style={[
            styles.spectrumPanel,
            { borderColor: colors.border, height: isMobile ? 160 : 190 },
          ]}
          onLayout={(event) => {
            setSpectrumLayout({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            });
          }}
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
            style={[
              styles.selector,
              {
                borderColor: colors.card,
                left: clamp(selectorX - 8, -2, Math.max(-2, spectrumLayout.width - 14)),
                top: clamp(selectorY - 8, -2, Math.max(-2, spectrumLayout.height - 14)),
              },
            ]}
            pointerEvents="none"
          />
        </View>

        <View
          style={[styles.hueBar, { borderColor: colors.border }]}
          onLayout={(event) => {
            setHueLayout({ width: event.nativeEvent.layout.width });
          }}
          {...hueResponder.panHandlers}
        >
          <LinearGradient
            colors={[
              '#FF0000',
              '#FFFF00',
              '#00FF00',
              '#00FFFF',
              '#0000FF',
              '#FF00FF',
              '#FF0000',
            ]}
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

      <View style={styles.inputRow}>
        <ThemedInput
          style={styles.input}
          placeholder={placeholder}
          value={normalized}
          onChangeText={handleHexInput}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <View
          style={[
            styles.preview,
            {
              backgroundColor: hasPreview ? normalized : currentColorHex,
              borderColor: colors.border,
            },
          ]}
        />
      </View>

      {hint ? <ThemedText variant="caption" tone="tertiary">{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaSection: {
    gap: 8,
  },
  spectrumPanel: {
    borderRadius: 12,
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
  hueBar: {
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 10,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
  },
  preview: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});