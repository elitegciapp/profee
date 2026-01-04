import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/constants/theme';

type Props = ViewProps & {
  active?: boolean;
};

export function NeonCard({ style, active = false, children, ...rest }: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {active ? <View pointerEvents="none" style={[styles.glowBase, styles.glow]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  glowBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
  },
  glow: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
});
