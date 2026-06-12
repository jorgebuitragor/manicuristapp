export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryMuted: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  inputBackground: string;
  tabBar: string;
  shadow: string;
  overlay: string;
  // Status appointment colors
  statusPending: string;
  statusPendingText: string;
  statusCompleted: string;
  statusCompletedText: string;
  statusCancelled: string;
  statusCancelledText: string;
  // Danger
  danger: string;
  dangerMuted: string;
  dangerBorder: string;
}

export const lightColors: ThemeColors = {
  primary: '#c084fc',
  onPrimary: '#ffffff',
  primaryMuted: '#fdf4ff',
  background: '#fdf2f8',
  card: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  inputBackground: '#fafafa',
  tabBar: '#ffffff',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.1)',
  statusPending: '#fef3c7',
  statusPendingText: '#92400e',
  statusCompleted: '#d1fae5',
  statusCompletedText: '#065f46',
  statusCancelled: '#fee2e2',
  statusCancelledText: '#991b1b',
  danger: '#ef4444',
  dangerMuted: '#fef2f2',
  dangerBorder: '#fecaca',
};

export const darkColors: ThemeColors = {
  primary: '#c084fc',
  onPrimary: '#ffffff',
  primaryMuted: '#2d1a40',
  background: '#0d0d1a',
  card: '#1a1a2e',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  border: '#374151',
  inputBackground: '#252538',
  tabBar: '#1a1a2e',
  shadow: '#000000',
  overlay: 'rgba(255,255,255,0.14)',
  statusPending: '#78350f',
  statusPendingText: '#fde68a',
  statusCompleted: '#064e3b',
  statusCompletedText: '#6ee7b7',
  statusCancelled: '#7f1d1d',
  statusCancelledText: '#fca5a5',
  danger: '#f87171',
  dangerMuted: '#3b1212',
  dangerBorder: '#7f1d1d',
};
