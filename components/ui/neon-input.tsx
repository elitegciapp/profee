import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = TextInputProps & {
  error?: boolean;
};

export function NeonInput({ style, error = false, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

  const isDark = theme.colors.bgPrimary === '#0B1220' || theme.colors.bgPrimary === '#0A0A0A';

  const styles = StyleSheet.create({
    base: {
      ...theme.ui.input,
      minHeight: 44,
      fontSize: 14,
    },
    focused: {
      borderColor: theme.colors.accent,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: theme.colors.accent,
            shadowOpacity: isDark ? 0.22 : 0.18,
            shadowRadius: isDark ? 10 : 8,
            shadowOffset: { width: 0, height: 0 },
          }
        : {
            // Android doesn't support shadowColor reliably on Views in all cases
            elevation: isDark ? 3 : 2,
          }),
      backgroundColor: theme.colors.bgSecondary,
    },
    error: {
      borderColor: theme.colors.danger,
    },
  });

  return (
    <TextInput
      {...rest}
      style={[styles.base, focused ? styles.focused : undefined, error ? styles.error : undefined, style]}
      placeholderTextColor={theme.colors.textMuted}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}
