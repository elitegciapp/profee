import { Platform } from 'react-native';

type ThemeColors = {
  bgPrimary: string;
  bgSecondary: string;
  border: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  accent: string;
  danger: string;

  accentSoft: string;
  card: string;
  success: string;
  warning: string;
};

type ThemeTypography = {
  title: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
    letterSpacing: number;
  };
  sectionHeader: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
    color: string;
    marginVertical: number;
  };
  label: {
    fontSize: number;
    color: string;
  };
  value: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
    color: string;
  };
};

type ThemeUI = {
  card: {
    backgroundColor: string;
    borderRadius: number;
    padding: number;
    borderWidth: number;
    borderColor: string;
    marginBottom: number;
  };
  input: {
    backgroundColor: string;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
    color: string;
    borderWidth: number;
    borderColor: string;
  };
  inputFocused: {
    borderColor: string;
  };
  inputError: {
    borderColor: string;
  };
  primaryButton: {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    paddingVertical: number;
    alignItems: 'center';
  };
  primaryButtonPressed: {
    backgroundColor: string;
  };
  secondaryButton: {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    paddingVertical: number;
    alignItems: 'center';
  };
  disabledButton: {
    backgroundColor: string;
    borderWidth: number;
    opacity: number;
  };
  previewCard: {
    backgroundColor: string;
    borderRadius: number;
    padding: number;
    borderWidth: number;
    borderColor: string;
  };
  divider: {
    height: number;
    backgroundColor: string;
    marginVertical: number;
  };
};

type ThemeTokens = {
  colors: ThemeColors;
  glow: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: ThemeTypography;
  ui: ThemeUI;
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

function buildTheme(colors: Omit<ThemeColors, 'accentSoft' | 'card' | 'success' | 'warning'>): ThemeTokens {
  const derivedColors: ThemeColors = {
    ...colors,
    accentSoft: 'rgba(0, 229, 255, 0.15)',
    card: colors.bgSecondary,
    success: colors.accent,
    warning: colors.accent,
  };

  const nextGlow = {
    shadowColor: derivedColors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  } as const;

  const nextTypography = {
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: derivedColors.textPrimary,
      marginVertical: 10,
    },
    label: {
      fontSize: 12,
      color: derivedColors.textMuted,
    },
    value: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: derivedColors.textPrimary,
    },
  } as const;

  const nextUi = {
    card: {
      backgroundColor: derivedColors.card,
      borderRadius: radius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: derivedColors.border,
      marginBottom: 16,
    },
    input: {
      backgroundColor: derivedColors.bgSecondary,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: derivedColors.textPrimary,
      borderWidth: 1,
      borderColor: derivedColors.border,
    },
    inputFocused: {
      borderColor: derivedColors.accent,
    },
    inputError: {
      borderColor: derivedColors.danger,
    },
    primaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: derivedColors.accent,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    primaryButtonPressed: {
      backgroundColor: derivedColors.accentSoft,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: derivedColors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center' as const,
    },
    disabledButton: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      opacity: 0.5,
    },
    previewCard: {
      backgroundColor: derivedColors.card,
      borderRadius: radius.md,
      padding: 18,
      borderWidth: 1,
      borderColor: derivedColors.border,
    },
    divider: {
      height: 1,
      backgroundColor: derivedColors.border,
      marginVertical: 12,
    },
  } as const;

  return {
    colors: derivedColors,
    glow: nextGlow,
    radius,
    typography: nextTypography,
    ui: nextUi,
  };
}

export const darkTheme = buildTheme({
  bgPrimary: '#0A0A0A',
  bgSecondary: '#121212',
  border: '#1F1F1F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textMuted: '#6B6B6B',
  accent: '#00E5FF',
  danger: '#FF4D4F',
});

export const lightTheme = buildTheme({
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F6F6F6',
  border: '#E6E6E6',
  textPrimary: '#0A0A0A',
  textSecondary: '#333333',
  textMuted: '#666666',
  accent: '#00E5FF',
  danger: '#FF4D4F',
});

// Legacy export: keep existing imports working (defaults to dark).
export const theme = darkTheme;

/**
 * Compatibility exports (existing code imports these).
 * Rule: if it’s not coming from theme, it doesn’t exist.
 */
export const colors = {
  ...theme.colors,
} as const;

export const glow = {
  ...theme.glow,
} as const;

export const typography = {
  ...theme.typography,
} as const;

export const ui = {
  ...theme.ui,
} as const;

export const Colors = {
  light: {
    text: lightTheme.colors.textPrimary,
    background: lightTheme.colors.bgPrimary,
    tint: lightTheme.colors.accent,
    icon: lightTheme.colors.textSecondary,
    tabIconDefault: lightTheme.colors.textMuted,
    tabIconSelected: lightTheme.colors.textMuted,
    bgPrimary: lightTheme.colors.bgPrimary,
    bgSecondary: lightTheme.colors.bgSecondary,
    card: lightTheme.colors.card,
    border: lightTheme.colors.border,
    textPrimary: lightTheme.colors.textPrimary,
    textSecondary: lightTheme.colors.textSecondary,
    textMuted: lightTheme.colors.textMuted,
    accent: lightTheme.colors.accent,
    accentSoft: lightTheme.colors.accentSoft,
    success: lightTheme.colors.success,
    warning: lightTheme.colors.warning,
    danger: lightTheme.colors.danger,
  },
  dark: {
    text: darkTheme.colors.textPrimary,
    background: darkTheme.colors.bgPrimary,
    tint: darkTheme.colors.accent,
    icon: darkTheme.colors.textSecondary,
    tabIconDefault: darkTheme.colors.textMuted,
    tabIconSelected: darkTheme.colors.textMuted,
    bgPrimary: darkTheme.colors.bgPrimary,
    bgSecondary: darkTheme.colors.bgSecondary,
    card: darkTheme.colors.card,
    border: darkTheme.colors.border,
    textPrimary: darkTheme.colors.textPrimary,
    textSecondary: darkTheme.colors.textSecondary,
    textMuted: darkTheme.colors.textMuted,
    accent: darkTheme.colors.accent,
    accentSoft: darkTheme.colors.accentSoft,
    success: darkTheme.colors.success,
    warning: darkTheme.colors.warning,
    danger: darkTheme.colors.danger,
  },
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
