import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DrawingPadContextValue {
  drawingPadEnabled: boolean;
  setDrawingPadEnabled: (enabled: boolean) => void;
  showEmptyPositions: boolean;
  setShowEmptyPositions: (enabled: boolean) => void;
}

const DrawingPadContext = createContext<DrawingPadContextValue>({
  drawingPadEnabled: false,
  setDrawingPadEnabled: () => {},
  showEmptyPositions: true,
  setShowEmptyPositions: () => {},
});

const STORAGE_KEY          = '@app_drawing_pad_enabled';
const EMPTY_POSITIONS_KEY  = '@app_show_empty_positions';

export function DrawingPadProvider({ children }: { children: ReactNode }) {
  const [drawingPadEnabled,   setDrawingPadState]     = useState(false);
  const [showEmptyPositions,  setShowEmptyState]       = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, EMPTY_POSITIONS_KEY]).then(([[, pad], [, empty]]) => {
      if (pad   !== null) setDrawingPadState(pad   === 'true');
      if (empty !== null) setShowEmptyState(empty  === 'true');
      setReady(true);
    });
  }, []);

  function setDrawingPadEnabled(enabled: boolean) {
    setDrawingPadState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  }

  function setShowEmptyPositions(enabled: boolean) {
    setShowEmptyState(enabled);
    AsyncStorage.setItem(EMPTY_POSITIONS_KEY, String(enabled));
  }

  if (!ready) return null;

  return (
    <DrawingPadContext.Provider value={{ drawingPadEnabled, setDrawingPadEnabled, showEmptyPositions, setShowEmptyPositions }}>
      {children}
    </DrawingPadContext.Provider>
  );
}

export const useDrawingPad = () => useContext(DrawingPadContext);
