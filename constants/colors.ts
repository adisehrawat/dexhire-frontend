/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'

export const Colors = {
  light: {
    background: '#fff',
    border: '#e0e0e0',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    text: '#11181C',
    tint: tintColorLight,
  },
  dark: {
    background: '#151718',
    border: '#2A2C2E',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    text: '#ECEDEE',
    tint: tintColorDark,
  },
}

export const LIGHT_COLORS = {
    background: '#F3F6FB', // lighter, modern background
    surface: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#2563EB', // blue (trustworthy)
    secondary: '#059669', // green (success)
    accent: '#F59E0B', // gold (highlight)
    error: '#EF4444',
    info: '#38BDF8',
    success: '#22C55E',
    warning: '#F59E42',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    cardShadow: 'rgba(37, 99, 235, 0.08)',
    cardBorder: '#E0E7EF',
    buttonShadow: 'rgba(37, 99, 235, 0.12)',
  } as const;