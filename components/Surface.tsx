import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = ViewProps;

export function Surface({ style, children, ...rest }: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    surface: {
      backgroundColor: theme.colors.bgSecondary,
      borderRadius: theme.radius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });

  return (
    <View style={[styles.surface, style]} {...rest}>
      {children}
    </View>
  );
}
