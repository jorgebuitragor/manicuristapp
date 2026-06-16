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

// Currencies where decimals don't apply (whole-number amounts)
const NO_DECIMAL_CURRENCIES: CurrencySymbol[] = ['COP', 'CLP', 'ARS'];

interface CurrencyContextValue {
  symbol: CurrencySymbol;
  setSymbol: (s: CurrencySymbol) => void;
  formatAmount: (amount: number) => string;
  parseAmountInput: (input: string) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  symbol: 'COP',
  setSymbol: () => {},
  formatAmount: (n) => `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n))} COP`,
  parseAmountInput: (s) => parseFloat(s.replace(/[.,]/g, '')) || 0,
});

const STORAGE_KEY = '@app_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbolState] = useState<CurrencySymbol>('COP');
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

  function formatAmount(amount: number): string {
    if (NO_DECIMAL_CURRENCIES.includes(symbol)) {
      const formatted = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(amount));
      return `${formatted} ${symbol}`;
    }
    return `${amount.toFixed(2)} ${symbol}`;
  }

  function parseAmountInput(input: string): number {
    if (NO_DECIMAL_CURRENCIES.includes(symbol)) {
      // Dots and commas are thousands separators → strip both before parsing
      return parseFloat(input.replace(/[.,]/g, '')) || 0;
    }
    return parseFloat(input.replace(',', '.')) || 0;
  }

  if (!ready) return null;

  return (
    <CurrencyContext.Provider value={{ symbol, setSymbol, formatAmount, parseAmountInput }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
