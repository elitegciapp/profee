import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = TextInputProps & {
  error?: boolean;
};

export function NeonInput({ style, error = false, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

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
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          }
        : {
            // Android doesn't support shadowColor reliably on Views in all cases
            elevation: 0,
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
