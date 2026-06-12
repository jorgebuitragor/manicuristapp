import { useEffect, useRef, useState } from 'react';
import { Alert, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedSection } from '@/components/ui/ThemedSection';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedIcon } from '@/components/ui/ThemedIcon';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';

const NOTE_KEY_PREFIX = '@calendar_notes:';
const DRAWING_KEY_PREFIX = '@calendar_notes_drawing:';
const THIN_PEN_SIZE = 2;
const THICK_PEN_SIZE = 5;

type PenWidth = 'thin' | 'thick';

type Stroke = {
  path: string;
  size: number;
};

interface CalendarNotesPadProps {
  date: string;
  expanded?: boolean;
  readOnly?: boolean;
  allowDrawing?: boolean;
}

export function CalendarNotesPad({
  date,
  expanded = false,
  readOnly = false,
  allowDrawing = true,
}: CalendarNotesPadProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [paths, setPaths] = useState<Stroke[]>([]);
  const [redoPaths, setRedoPaths] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [penWidth, setPenWidth] = useState<PenWidth>('thin');
  const [isLoading, setIsLoading] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPathRef = useRef('');
  const drawingEnabled = allowDrawing && !readOnly;

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      setIsLoading(true);
      const [savedText, savedDrawing] = await Promise.all([
        AsyncStorage.getItem(`${NOTE_KEY_PREFIX}${date}`),
        AsyncStorage.getItem(`${DRAWING_KEY_PREFIX}${date}`),
      ]);

      let parsedPaths: Stroke[] = [];
      if (savedDrawing) {
        try {
          const parsed = JSON.parse(savedDrawing);
          if (Array.isArray(parsed)) {
            parsedPaths = parsed.flatMap((item) => {
              if (typeof item === 'string') {
                return [{ path: item, size: THIN_PEN_SIZE }];
              }

              if (
                item &&
                typeof item === 'object' &&
                typeof item.path === 'string' &&
                typeof item.size === 'number'
              ) {
                return [{ path: item.path, size: item.size }];
              }

              return [];
            });
          }
        } catch {
          parsedPaths = [];
        }
      }

      if (!cancelled) {
        setText(savedText ?? '');
        setPaths(parsedPaths);
        setRedoPaths([]);
        setCurrentPath('');
        currentPathRef.current = '';
        setIsLoading(false);
      }
    }

    loadNote();

    return () => {
      cancelled = true;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      if (drawSaveTimeout.current) {
        clearTimeout(drawSaveTimeout.current);
      }
    };
  }, [date]);

  function handleChange(next: string) {
    if (readOnly) return;
    setText(next);

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      AsyncStorage.setItem(`${NOTE_KEY_PREFIX}${date}`, next);
    }, 250);
  }

    function currentPenSize() {
      return penWidth === 'thick' ? THICK_PEN_SIZE : THIN_PEN_SIZE;
    }

    function scheduleDrawingSave(nextPaths: Stroke[]) {
      if (drawSaveTimeout.current) {
        clearTimeout(drawSaveTimeout.current);
    }

      drawSaveTimeout.current = setTimeout(() => {
        AsyncStorage.setItem(`${DRAWING_KEY_PREFIX}${date}`, JSON.stringify(nextPaths));
      }, 250);
    }

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const start = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          currentPathRef.current = start;
          setCurrentPath(start);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const next = `${currentPathRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          currentPathRef.current = next;
          setCurrentPath(next);
        },
        onPanResponderRelease: () => {
          if (!drawingEnabled) return;
          const finalPath = currentPathRef.current;
          if (!finalPath) return;

          setPaths((prev) => {
            const next: Stroke[] = [...prev, { path: finalPath, size: currentPenSize() }];
            scheduleDrawingSave(next);
            return next;
          });
          setRedoPaths([]);

          currentPathRef.current = '';
          setCurrentPath('');
        },
        onPanResponderTerminate: () => {
          currentPathRef.current = '';
          setCurrentPath('');
        },
      })
    ).current;

    function handleUndoStroke() {
      setPaths((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const next = prev.slice(0, -1);
        setRedoPaths((redoPrev) => [...redoPrev, last]);
        scheduleDrawingSave(next);
        return next;
      });
    }

    function handleRedoStroke() {
      setRedoPaths((redoPrev) => {
        if (redoPrev.length === 0) return redoPrev;
        const last = redoPrev[redoPrev.length - 1];
        const nextRedo = redoPrev.slice(0, -1);

        setPaths((prev) => {
          const nextPaths = [...prev, last];
          scheduleDrawingSave(nextPaths);
          return nextPaths;
        });

        return nextRedo;
      });
    }

  async function handleClear() {
    Alert.alert(t('calendar.notes.clearTitle'), t('calendar.notes.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('calendar.notes.clearCta'),
        style: 'destructive',
        onPress: async () => {
          setText('');
            setPaths([]);
            setCurrentPath('');
            currentPathRef.current = '';
            await Promise.all([
              AsyncStorage.removeItem(`${NOTE_KEY_PREFIX}${date}`),
              AsyncStorage.removeItem(`${DRAWING_KEY_PREFIX}${date}`),
            ]);
        },
      },
    ]);
  }

  return (
    <ThemedSection style={[styles.section, expanded && styles.expandedSection]}>
      <View style={styles.header}>
        <ThemedText variant="sectionTitle">{t('calendar.notes.title')}</ThemedText>
        {!readOnly ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: colors.inputBackground, borderColor: colors.border }, paths.length === 0 && styles.iconActionDisabled]}
              onPress={handleUndoStroke}
              disabled={paths.length === 0}
              accessibilityLabel={t('calendar.notes.undoCta')}
            >
              <ThemedIcon name="arrow-undo" size={16} tone="primary" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: colors.inputBackground, borderColor: colors.border }, redoPaths.length === 0 && styles.iconActionDisabled]}
              onPress={handleRedoStroke}
              disabled={redoPaths.length === 0}
              accessibilityLabel={t('calendar.notes.redoCta')}
            >
              <ThemedIcon name="arrow-redo" size={16} tone="primary" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={handleClear}
              accessibilityLabel={t('calendar.notes.clearCta')}
            >
              <ThemedIcon name="trash-outline" size={16} tone="danger" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ThemedText variant="caption" tone="tertiary">
        {readOnly ? t('calendar.notes.readOnlyHint') : t('calendar.notes.hint')}
      </ThemedText>

      <ThemedInput
        value={text}
        onChangeText={handleChange}
        multiline
        editable={!isLoading && !readOnly}
        style={[styles.pad, expanded && styles.expandedPad]}
        placeholder={t('calendar.notes.placeholder')}
        textAlignVertical="top"
      />

      {drawingEnabled ? (
        <View>
          <ThemedText variant="caption" tone="tertiary" style={styles.canvasLabel}>
            {t('calendar.notes.canvasHint')}
          </ThemedText>

          <View style={styles.penSelector}>
            <ThemedButton
              label={t('calendar.notes.penThin')}
              variant={penWidth === 'thin' ? 'primary' : 'outline'}
              onPress={() => setPenWidth('thin')}
            />
            <ThemedButton
              label={t('calendar.notes.penThick')}
              variant={penWidth === 'thick' ? 'primary' : 'outline'}
              onPress={() => setPenWidth('thick')}
            />
          </View>

          <View
            style={[
              styles.canvas,
              expanded && styles.expandedCanvas,
              { borderColor: colors.border, backgroundColor: colors.inputBackground },
            ]}
            {...panResponder.panHandlers}
          >
            {[...paths, { path: currentPath, size: currentPenSize() }]
              .filter((stroke) => stroke.path)
              .map((stroke, idx) => (
                <View
                  key={`${idx}-${stroke.path.length}`}
                  style={[styles.stroke, { borderColor: colors.primary }]}
                >
                  {stroke.path.split(' L ').map((segment, segmentIdx) => {
                    const normalized = segment.replace('M ', '').trim();
                    const [xRaw, yRaw] = normalized.split(' ');
                    const x = Number(xRaw);
                    const y = Number(yRaw);

                    if (Number.isNaN(x) || Number.isNaN(y)) return null;

                    return (
                      <View
                        key={`${idx}-${segmentIdx}`}
                        style={[
                          styles.point,
                          {
                            backgroundColor: colors.primary,
                            width: stroke.size,
                            height: stroke.size,
                            marginLeft: -stroke.size / 2,
                            marginTop: -stroke.size / 2,
                            left: x,
                            top: y,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
          </View>
        </View>
      ) : null}
    </ThemedSection>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
  },
  expandedSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionDisabled: {
    opacity: 0.45,
  },
  pad: {
    minHeight: 120,
  },
  expandedPad: {
    minHeight: 240,
    flex: 1,
  },
  canvasLabel: {
    marginTop: 4,
    marginBottom: 8,
  },
  penSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  canvas: {
    minHeight: 140,
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  expandedCanvas: {
    minHeight: 260,
  },
  stroke: {
    ...StyleSheet.absoluteFillObject,
  },
  point: {
    position: 'absolute',
    borderRadius: 99,
  },
});
