import { Platform } from 'react-native';

export const theme = {
  colors: {
    bgPrimary: '#0A0A0A',
    bgSecondary: '#121212',
    border: '#1F1F1F',

    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1A1',
    textMuted: '#6B6B6B',

    accent: '#00E5FF',
    danger: '#FF4D4F',
  },

  glow: {
    color: '#00E5FF',
    opacity: 0.25,
    radius: 8,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
} as const;

/**
 * Compatibility exports (existing code imports these).
 * Rule: if it’s not coming from theme, it doesn’t exist.
 */
export const colors = {
  ...theme.colors,
  // Legacy aliases
  card: theme.colors.bgSecondary,
  success: theme.colors.accent,
  warning: theme.colors.accent,
  // Keep existing translucent accent usage centralized here.
  accentSoft: 'rgba(0, 229, 255, 0.15)',
} as const;

export const glow = {
  shadowColor: theme.colors.accent,
  shadowOpacity: theme.glow.opacity,
  shadowRadius: theme.glow.radius,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
} as const;

export const typography = {
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
} as const;

export const ui = {
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.danger,
  },
  primaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  disabledButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    opacity: 0.5,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
} as const;

const navigationTheme = {
  text: colors.textPrimary,
  background: colors.bgPrimary,
  tint: colors.accent,
  icon: colors.textSecondary,
  tabIconDefault: colors.textMuted,
  tabIconSelected: colors.textMuted,
  bgPrimary: colors.bgPrimary,
  bgSecondary: colors.bgSecondary,
  card: colors.card,
  border: colors.border,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  accent: colors.accent,
  accentSoft: colors.accentSoft,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
} as const;

export const Colors = {
  light: navigationTheme,
  dark: navigationTheme,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
