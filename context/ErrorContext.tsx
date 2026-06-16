import { createContext, useCallback, useContext, useState } from 'react';

export interface ErrorOptions {
  title: string;
  detail?: string;
}

interface ErrorContextValue {
  showError: (title: string, detail?: string) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

interface ErrorState extends ErrorOptions {
  visible: boolean;
}

const HIDDEN: ErrorState = { visible: false, title: '' };

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ErrorState>(HIDDEN);

  const showError = useCallback((title: string, detail?: string) => {
    setState({ visible: true, title, detail });
  }, []);

  const hide = useCallback(() => setState(HIDDEN), []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorRenderer state={state} onDismiss={hide} />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useError must be used within ErrorProvider');
  return ctx;
}

// ─── Renderer ────────────────────────────────────────────────────────────────

import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { SwipeToDismissModal } from '@/components/ui/SwipeToDismissModal';

function ErrorRenderer({ state, onDismiss }: { state: ErrorState; onDismiss: () => void }) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <SwipeToDismissModal onDismiss={onDismiss} containerStyle={styles.swipeSurface}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.dangerMuted, borderColor: colors.dangerBorder }]}>
              <Ionicons name="alert-circle" size={32} color={colors.danger} />
            </View>

            <ThemedText variant="subtitle" style={styles.title}>
              {state.title}
            </ThemedText>

            {state.detail ? (
              <View style={[styles.detailBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <ThemedText tone="secondary" style={styles.detail}>
                  {state.detail}
                </ThemedText>
              </View>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ThemedButton
              label="Entendido"
              variant="primary"
              onPress={onDismiss}
            />
          </TouchableOpacity>
        </SwipeToDismissModal>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  swipeSurface: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 17,
  },
  detailBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  detail: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 4,
  },
});
