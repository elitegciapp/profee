import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = ViewProps & {
  active?: boolean;
};

export function NeonCard({ style, active = false, children, ...rest }: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    glowBase: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 12,
      borderWidth: 1,
    },
    glow: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
  });

  return (
    <View style={[styles.card, style]} {...rest}>
      {active ? <View pointerEvents="none" style={[styles.glowBase, styles.glow]} /> : null}
      {children}
    </View>
  );
}
