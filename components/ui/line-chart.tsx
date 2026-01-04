import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { line, curveCatmullRom } from 'd3-shape';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/theme';

type Props = {
  width: number;
  height: number;
  points: number[];
  label?: string;
  onPointPress?: (index: number, value: number) => void;
};

export function LineChart({
  width,
  height,
  points,
  label,
  onPointPress,
}: Props) {
  const { path, xs, ys } = useMemo(() => {
    const safe = points.length > 1 ? points : [0, ...(points.length ? points : [0])];
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const range = max - min || 1;

    const padding = 10;
    const w = Math.max(1, width - padding * 2);
    const h = Math.max(1, height - padding * 2);

    const xFor = (i: number) => padding + (w * i) / (safe.length - 1);
    const yFor = (v: number) => padding + h - ((v - min) / range) * h;

    const pts = safe.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
    const generator = line<{ x: number; y: number }>()
      .x((d: { x: number; y: number }) => d.x)
      .y((d: { x: number; y: number }) => d.y)
      .curve(curveCatmullRom.alpha(0.7));

    return {
      path: generator(pts) ?? '',
      xs: pts.map((p) => p.x),
      ys: pts.map((p) => p.y),
    };
  }, [height, points, width]);

  return (
    <View style={styles.wrap}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <View style={[styles.chart, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="1" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0.65" />
            </LinearGradient>
          </Defs>

          <Rect x="0" y="0" width={width} height={height} fill={colors.bgSecondary} rx={10} />

          {/* minimal grid */}
          <Path
            d={`M 10 ${height - 18} H ${width - 10}`}
            stroke={colors.border}
            strokeOpacity={0.35}
            strokeWidth={1}
          />

          <Path d={path} stroke="url(#stroke)" strokeWidth={3} fill="none" />

          {/* highlight last point */}
          {xs.length ? (
            <Circle
              cx={xs[xs.length - 1]}
              cy={ys[ys.length - 1]}
              r={4}
              fill={colors.textPrimary}
            />
          ) : null}
          {xs.length ? (
            <Circle
              cx={xs[xs.length - 1]}
              cy={ys[ys.length - 1]}
              r={8}
              fill={colors.accent}
              opacity={0.16}
            />
          ) : null}
        </Svg>

        {onPointPress
          ? xs.map((x, idx) => (
              <Pressable
                key={idx}
                style={[styles.hit, { left: x - 18, top: ys[idx] - 18 }]}
                onPress={() => onPointPress(idx, points[idx] ?? 0)}
              />
            ))
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chart: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  hit: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
