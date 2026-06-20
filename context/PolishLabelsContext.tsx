import { createContext, useContext, type ReactNode } from 'react';
import { useI18n } from '@/context/I18nContext';
import {
  usePolishBaseColors,
  usePolishToneFamilies,
  useCreatePolishBaseColor,
  useDeletePolishBaseColor,
  useCreatePolishToneFamily,
  useDeletePolishToneFamily,
} from '@/hooks/usePolishLabels';
import type { PolishBaseColor, PolishToneFamily } from '@/types/database.types';

export interface PolishLabel {
  id: string;
  key: string;
  label: string;
  isBuiltIn: boolean;
  hex_color?: string | null;
}

// Built-in keys — resolved from i18n, always present as fallback when DB is empty
const BUILT_IN_BASE_KEYS = [
  'red', 'orange', 'yellow', 'green', 'mint', 'turquoise',
  'blue', 'navy', 'purple', 'pink', 'brown', 'gray',
];
const BUILT_IN_TONE_KEYS = ['classic', 'pastel', 'neon', 'nude', 'deep'];

export { BUILT_IN_BASE_KEYS, BUILT_IN_TONE_KEYS };

export function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

interface PolishLabelsContextValue {
  baseColors: PolishLabel[];
  toneFamilies: PolishLabel[];
  isLoading: boolean;
  addBaseColor: (key: string, label: string, hexColor?: string | null) => Promise<void>;
  removeBaseColor: (id: string) => Promise<void>;
  addToneFamily: (key: string, label: string) => Promise<void>;
  removeToneFamily: (id: string) => Promise<void>;
}

const PolishLabelsContext = createContext<PolishLabelsContextValue>({
  baseColors: [],
  toneFamilies: [],
  isLoading: true,
  addBaseColor: async () => {},
  removeBaseColor: async () => {},
  addToneFamily: async () => {},
  removeToneFamily: async () => {},
});

function useBuiltInBaseColors(t: (k: string) => string): PolishLabel[] {
  return BUILT_IN_BASE_KEYS.map((key, i) => ({
    id: `builtin_${key}`,
    key,
    label: t(`polishes.colorFamilies.${key}`),
    isBuiltIn: true,
    sort_order: i,
  }));
}

function useBuiltInToneFamilies(t: (k: string) => string): PolishLabel[] {
  return BUILT_IN_TONE_KEYS.map((key, i) => ({
    id: `builtin_${key}`,
    key,
    label: t(`polishes.tones.${key}`),
    isBuiltIn: true,
    sort_order: i,
  }));
}

function toPolishLabel(row: PolishBaseColor | PolishToneFamily): PolishLabel {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    isBuiltIn: false,
    hex_color: 'hex_color' in row ? row.hex_color : null,
  };
}

export function PolishLabelsProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { data: dbBaseColors, isLoading: loadingBase } = usePolishBaseColors();
  const { data: dbToneFamilies, isLoading: loadingTone } = usePolishToneFamilies();

  const createBaseColor = useCreatePolishBaseColor();
  const deleteBaseColor = useDeletePolishBaseColor();
  const createToneFamily = useCreatePolishToneFamily();
  const deleteToneFamily = useDeletePolishToneFamily();

  const builtInBaseColors = useBuiltInBaseColors(t);
  const builtInToneFamilies = useBuiltInToneFamilies(t);

  // Merge: built-in first (unless overridden by DB), then custom DB entries
  const dbBaseKeys = new Set((dbBaseColors ?? []).map((r) => r.key));
  const dbToneKeys = new Set((dbToneFamilies ?? []).map((r) => r.key));

  const baseColors: PolishLabel[] = [
    ...builtInBaseColors.filter((b) => !dbBaseKeys.has(b.key) || dbBaseColors?.some((r) => r.key === b.key && r.label === t(`polishes.colorFamilies.${b.key}`))),
    ...(dbBaseColors ?? []).filter((r) => !BUILT_IN_BASE_KEYS.includes(r.key)).map(toPolishLabel),
  ];

  const toneFamilies: PolishLabel[] = [
    ...builtInToneFamilies.filter((b) => !dbToneKeys.has(b.key) || dbToneFamilies?.some((r) => r.key === b.key && r.label === t(`polishes.tones.${b.key}`))),
    ...(dbToneFamilies ?? []).filter((r) => !BUILT_IN_TONE_KEYS.includes(r.key)).map(toPolishLabel),
  ];

  async function addBaseColor(key: string, label: string, hexColor?: string | null) {
    await createBaseColor.mutateAsync({ key, label, sort_order: (dbBaseColors?.length ?? 0), hex_color: hexColor });
  }

  async function removeBaseColor(id: string) {
    await deleteBaseColor.mutateAsync(id);
  }

  async function addToneFamily(key: string, label: string) {
    await createToneFamily.mutateAsync({ key, label, sort_order: (dbToneFamilies?.length ?? 0) });
  }

  async function removeToneFamily(id: string) {
    await deleteToneFamily.mutateAsync(id);
  }

  return (
    <PolishLabelsContext.Provider value={{
      baseColors,
      toneFamilies,
      isLoading: loadingBase || loadingTone,
      addBaseColor,
      removeBaseColor,
      addToneFamily,
      removeToneFamily,
    }}>
      {children}
    </PolishLabelsContext.Provider>
  );
}

export const usePolishLabels = () => useContext(PolishLabelsContext);
