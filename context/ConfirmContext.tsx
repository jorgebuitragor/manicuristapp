import { createContext, useCallback, useContext, useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmContextValue {
  showConfirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
}

const HIDDEN: ConfirmState = {
  visible: false,
  title: '',
  onConfirm: () => {},
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>(HIDDEN);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, visible: true });
  }, []);

  const hide = useCallback(() => setState(HIDDEN), []);

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmRenderer state={state} onDismiss={hide} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

// Rendered inline inside the provider to avoid circular imports
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';

function ConfirmRenderer({ state, onDismiss }: { state: ConfirmState; onDismiss: () => void }) {
  const { colors } = useTheme();

  function handleConfirm() {
    onDismiss();
    state.onConfirm();
  }

  function handleCancel() {
    onDismiss();
    state.onCancel?.();
  }

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        >
          <ThemedText variant="subtitle" style={styles.title}>
            {state.title}
          </ThemedText>

          {state.message ? (
            <ThemedText tone="secondary" style={styles.message}>
              {state.message}
            </ThemedText>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.actions}>
            <ThemedButton
              label={state.cancelLabel ?? 'Cancelar'}
              variant="outline"
              onPress={handleCancel}
              style={styles.actionButton}
            />
            <ThemedButton
              label={state.confirmLabel ?? 'Confirmar'}
              variant={state.variant === 'danger' ? 'dangerOutline' : 'primary'}
              onPress={handleConfirm}
              style={styles.actionButton}
            />
          </View>
        </TouchableOpacity>
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
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 17,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
  },
});
