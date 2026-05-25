import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F7F8FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EEF2FF',
    textSecondary: '#64748B',
    iconSecondary: '#64748B',
    tint: '#5B3DF5',
    purple: '#6E59F7',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#EEF2FF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#090A0F',
    backgroundElement: '#131520',
    backgroundSelected: '#1E1B4B',
    textSecondary: '#94A3B8',
    iconSecondary: '#94A3B8',
    tint: '#5B3DF5',
    purple: '#6E59F7',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'ui-rounded, sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 64, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const BorderRadii = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
} as const;
export const Shadows = {
  light: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
