import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app_time_format';

interface TimeFormatContextValue {
  is24Hour: boolean;
  setIs24Hour: (v: boolean) => void;
}

const TimeFormatContext = createContext<TimeFormatContextValue>({
  is24Hour: false,
  setIs24Hour: () => {},
});

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [is24Hour, setIs24HourState] = useState(false); // AM/PM por defecto

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) setIs24HourState(val === '24h');
    });
  }, []);

  function setIs24Hour(v: boolean) {
    setIs24HourState(v);
    AsyncStorage.setItem(STORAGE_KEY, v ? '24h' : '12h');
  }

  return (
    <TimeFormatContext.Provider value={{ is24Hour, setIs24Hour }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  return useContext(TimeFormatContext);
}

/** Formatea un Date o ISO string a hora, respetando la preferencia 12/24h. */
export function formatTimeStr(date: Date | string, is24Hour: boolean, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour,
  });
}
