import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? theme.tiles.insetBorder : theme.colors.border,
      overflow: 'hidden',

      ...(isDark
        ? {
            shadowColor: theme.colors.bgPrimary,
            shadowOpacity: 0.35,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 12 },
            elevation: 6,
          }
        : {
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 1,
          }),
    },
    gradientWash: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      opacity: isDark ? 1 : 0,
    },
    edgeGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      opacity: isDark ? (active ? 0.22 : 0.12) : 0,
      shadowColor: theme.colors.accent,
      shadowOpacity: isDark ? (active ? 0.22 : 0.16) : 0,
      shadowRadius: isDark ? (active ? 22 : 16) : 0,
      shadowOffset: { width: 0, height: 0 },
      ...(isDark ? { elevation: active ? 10 : 6 } : null),
    },
    content: {
      position: 'relative',
      zIndex: 1,
    },
  });

  return (
    <View style={[styles.card, style]} {...rest}>
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.primaryGradient}
        style={styles.gradientWash}
      />
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.edgeGlow}
        style={styles.edgeGlow}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}
