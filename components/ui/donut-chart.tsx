import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/theme';

type Props = {
  size?: number;
  strokeWidth?: number;
  value: number; // 0..1
  centerLabel: string;
  centerValue: string;
};

export function DonutChart({
  size = 92,
  strokeWidth = 10,
  value,
  centerLabel,
  centerValue,
}: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamped;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0.65" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View pointerEvents="none" style={styles.center}>
        <ThemedText style={styles.centerLabel}>{centerLabel}</ThemedText>
        <ThemedText style={styles.centerValue}>{centerValue}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  centerLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  centerValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
});
