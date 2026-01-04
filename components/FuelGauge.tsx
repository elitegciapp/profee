import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { colors } from "@/constants/theme";

type Props = {
  percent: number; // 0..100
  capacity: number; // gallons
  pricePerGallon: number; // dollars
  onChange: (percent: number, gallons: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  height?: number;
  snapPoints?: number[];
  snapThreshold?: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function snapNearest(value: number, snapPoints: number[], snapThreshold: number) {
  "worklet";

  if (!Array.isArray(snapPoints) || snapPoints.length === 0) return value;

  let nearest = snapPoints[0];
  let best = Math.abs(value - nearest);

  for (let i = 0; i < snapPoints.length; i++) {
    const s = snapPoints[i];
    const d = Math.abs(value - s);
    if (d < best) {
      best = d;
      nearest = s;
    }
  }

  if (best <= snapThreshold) return nearest;
  return value;
}

function triggerLightHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function FuelGauge({
  percent,
  capacity,
  pricePerGallon,
  onChange,
  onDragStart,
  onDragEnd,
  height = 180,
  snapPoints = [0, 25, 50, 75, 100],
  snapThreshold = 4,
}: Props) {
  const p = useSharedValue(clamp(percent || 0, 0, 100));
  const startPercent = useSharedValue(0);
  const lastSnap = useSharedValue<number>(Math.round(clamp(percent || 0, 0, 100)));
  const lastEmitted = useSharedValue<number>(Math.round(clamp(percent || 0, 0, 100)));

  useEffect(() => {
    const next = clamp(percent || 0, 0, 100);
    p.value = withTiming(next, { duration: 160 });
    lastSnap.value = Math.round(next);
    lastEmitted.value = Math.round(next);
  }, [lastEmitted, lastSnap, p, percent]);

  const tickLabels = useMemo(
    () => [
      { label: "F", value: 100 },
      { label: "¾", value: 75 },
      { label: "½", value: 50 },
      { label: "¼", value: 25 },
      { label: "0", value: 0 },
    ],
    []
  );

  const fireOnChange = useMemo(
    () =>
      (nextPercent: number) => {
        const pct = clamp(nextPercent, 0, 100);
        const gallons = (Math.max(0, capacity) * pct) / 100;
        onChange(Math.round(pct), Number(gallons.toFixed(2)));
      },
    [capacity, onChange]
  );

  const panGesture = useMemo(() => {
    const resistance = 0.85;

    return Gesture.Pan()
      .onBegin(() => {
        startPercent.value = p.value;

        if (onDragStart) {
          runOnJS(onDragStart)();
        }
      })
      .onUpdate((evt) => {
        const deltaPercent = (-evt.translationY / height) * 100 * resistance;
        const next = clamp(startPercent.value + deltaPercent, 0, 100);
        p.value = next;

        const rounded = Math.round(next);
        if (rounded !== lastEmitted.value) {
          lastEmitted.value = rounded;
          runOnJS(fireOnChange)(rounded);
        }
      })
      .onFinalize(() => {
        const snapped = snapNearest(p.value, snapPoints, snapThreshold);
        const snappedRounded = Math.round(snapped);

        p.value = withTiming(snappedRounded, { duration: 140 });
        runOnJS(fireOnChange)(snappedRounded);

        if (onDragEnd) {
          runOnJS(onDragEnd)();
        }

        if (snappedRounded !== lastSnap.value) {
          lastSnap.value = snappedRounded;
          runOnJS(triggerLightHaptic)();
        }
      });
  }, [fireOnChange, height, lastEmitted, lastSnap, onDragEnd, onDragStart, p, snapPoints, snapThreshold, startPercent]);

  const fillStyle = useAnimatedStyle(() => {
    return {
      height: (height * p.value) / 100,
    };
  }, [height]);

  const safePercent = clamp(percent || 0, 0, 100);
  const credit = ((Math.max(0, capacity) * safePercent) / 100) * Math.max(0, pricePerGallon);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel Level</Text>

      <View style={styles.row}>
        <View style={[styles.ticks, { height }]}>
          {tickLabels.map((t) => (
            <View key={t.value} style={styles.tickRow}>
              <Text style={styles.tickText}>{t.label}</Text>
              <View style={styles.tickLine} />
            </View>
          ))}
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.gauge, { height }]}>
            <Animated.View style={[styles.fill, fillStyle]} />
            <View style={styles.overlay}>
              <Text style={styles.percentText}>{Math.round(safePercent)}%</Text>
              <Text style={styles.helper}>Swipe up/down</Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      <Text style={styles.credit}>Credit: ${Number.isFinite(credit) ? credit.toFixed(2) : "0.00"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 16,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ticks: {
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  tickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tickText: {
    width: 20,
    textAlign: "right",
    color: colors.textSecondary,
    fontSize: 12,
  },
  tickLine: {
    width: 10,
    height: 1,
    backgroundColor: colors.border,
  },
  gauge: {
    width: 76,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  fill: {
    backgroundColor: colors.accent,
    width: "100%",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  percentText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  credit: {
    marginTop: 10,
    color: colors.accent,
    fontWeight: "600",
  },
});
