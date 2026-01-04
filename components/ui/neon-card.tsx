import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = ViewProps & {
  active?: boolean;
};

export function NeonCard({ style, active = false, children, ...rest }: Props) {
  const { theme } = useTheme();
  const isDark = theme.colors.bgPrimary === "#0B1220" || theme.colors.bgPrimary === "#0A0A0A";

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: active ? 1.5 : 1,
      borderColor: isDark && active ? theme.colors.accent : theme.colors.border,
      overflow: 'hidden',

      ...(isDark && active
        ? {
            shadowColor: theme.colors.accent,
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }
        : {
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          }),
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
