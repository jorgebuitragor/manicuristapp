import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useMutationState } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useI18n } from '@/context/I18nContext';

type BannerState = 'hidden' | 'offline' | 'syncing' | 'reconnected';

export function OfflineBanner() {
  const { t } = useI18n();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const translateY = useRef(new Animated.Value(-60)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  // Mutaciones pausadas = en cola esperando conexión
  const pausedMutations = useMutationState({ filters: { predicate: (m) => m.state.isPaused === true } });
  const hasPaused = pausedMutations.length > 0;

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && state.isInternetReachable !== false;
      if (!connected) {
        wasOfflineRef.current = true;
        show('offline');
      } else if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        show('reconnected');
        scheduleHide(2500);
      }
    });
    return () => { unsub(); clearHideTimer(); };
  }, []);

  // Cuando hay mutaciones pausadas (y estamos online de nuevo), mostrar "sincronizando"
  useEffect(() => {
    if (hasPaused && bannerState === 'hidden') {
      show('syncing');
    } else if (!hasPaused && bannerState === 'syncing') {
      show('reconnected');
      scheduleHide(2000);
    }
  }, [hasPaused]);

  function show(state: BannerState) {
    clearHideTimer();
    setBannerState(state);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }

  function hide() {
    Animated.timing(translateY, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBannerState('hidden'));
  }

  function scheduleHide(ms: number) {
    clearHideTimer();
    hideTimerRef.current = setTimeout(hide, ms);
  }

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  if (bannerState === 'hidden') return null;

  const config: Record<Exclude<BannerState, 'hidden'>, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
    offline:     { bg: '#c0392b', icon: 'cloud-offline-outline',  label: t('offline.banner') },
    syncing:     { bg: '#e67e22', icon: 'sync-outline',           label: t('offline.syncing') },
    reconnected: { bg: '#27ae60', icon: 'cloud-done-outline',     label: t('offline.reconnected') },
  };

  const { bg, icon, label } = config[bannerState];

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg, transform: [{ translateY }] }]}>
      <Ionicons name={icon} size={16} color="#fff" />
      <ThemedText variant="caption" style={styles.label}>{label}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: { color: '#fff', fontWeight: '600' },
});
