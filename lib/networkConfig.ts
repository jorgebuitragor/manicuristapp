import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Conecta el onlineManager de TanStack Query con NetInfo.
 * Llamar una vez al arrancar la app. A partir de ahí, React Query
 * sabe cuándo hay conexión y pausa/reanuda mutaciones automáticamente.
 */
export function configureNetworkManager() {
  onlineManager.setEventListener((setOnline) => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return unsub;
  });
}
