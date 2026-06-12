import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DrawingPadContextValue {
  drawingPadEnabled: boolean;
  setDrawingPadEnabled: (enabled: boolean) => void;
}

const DrawingPadContext = createContext<DrawingPadContextValue>({
  drawingPadEnabled: false,
  setDrawingPadEnabled: () => {},
});

const STORAGE_KEY = '@app_drawing_pad_enabled';

export function DrawingPadProvider({ children }: { children: ReactNode }) {
  const [drawingPadEnabled, setDrawingPadState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored !== null) {
        setDrawingPadState(stored === 'true');
      }
      setReady(true);
    });
  }, []);

  function setDrawingPadEnabled(enabled: boolean) {
    setDrawingPadState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  }

  if (!ready) return null;

  return (
    <DrawingPadContext.Provider value={{ drawingPadEnabled, setDrawingPadEnabled }}>
      {children}
    </DrawingPadContext.Provider>
  );
}

export const useDrawingPad = () => useContext(DrawingPadContext);
