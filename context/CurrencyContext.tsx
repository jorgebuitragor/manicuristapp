import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencySymbol = '€' | '$' | '£' | 'COP' | 'MXN' | 'ARS' | 'CLP' | 'PEN';

export const CURRENCIES: { symbol: CurrencySymbol; label: string }[] = [
  { symbol: '€',   label: 'EUR €' },
  { symbol: '$',   label: 'USD $' },
  { symbol: '£',   label: 'GBP £' },
  { symbol: 'COP', label: 'COP' },
  { symbol: 'MXN', label: 'MXN' },
  { symbol: 'ARS', label: 'ARS' },
  { symbol: 'CLP', label: 'CLP' },
  { symbol: 'PEN', label: 'PEN' },
];

interface CurrencyContextValue {
  symbol: CurrencySymbol;
  setSymbol: (s: CurrencySymbol) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  symbol: '€',
  setSymbol: () => {},
  formatAmount: (n) => `${n.toFixed(2)} €`,
});

const STORAGE_KEY = '@app_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbolState] = useState<CurrencySymbol>('€');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const valid = CURRENCIES.map((c) => c.symbol);
      if (stored && valid.includes(stored as CurrencySymbol)) {
        setSymbolState(stored as CurrencySymbol);
      }
      setReady(true);
    });
  }, []);

  function setSymbol(s: CurrencySymbol) {
    setSymbolState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  }

  function formatAmount(amount: number) {
    return `${amount.toFixed(2)} ${symbol}`;
  }

  if (!ready) return null;

  return (
    <CurrencyContext.Provider value={{ symbol, setSymbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
