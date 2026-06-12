import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // datos frescos 5 min
      gcTime: 1000 * 60 * 60 * 24,    // cache vive 24 h (necesario para persistencia)
      retry: 2,
      networkMode: 'offlineFirst',     // usa cache si no hay red en lugar de error
    },
    mutations: {
      networkMode: 'online',           // pausa si no hay red y reintenta al reconectar
      retry: 2,
    },
  },
});

// Persiste el cache en AsyncStorage para que sobreviva reinicios de la app
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'manicurist-rq-cache-v1',
  throttleTime: 1000,
});
