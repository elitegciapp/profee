import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DashboardTile } from '@/components/ui/dashboard-tile';
import { DonutChart } from '@/components/ui/donut-chart';
import { LineChart } from '@/components/ui/line-chart';
import type { Statement } from '@/src/models/statement';
import { getAllStatements } from '@/src/storage/statements';
import { calculateStatementSummary } from '@/src/utils/calculations';
import { useTheme } from '@/src/context/ThemeContext';

function money(value: number): string {
  if (!Number.isFinite(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

export default function ExploreDashboardScreen() {
  const { theme, mode, setMode } = useTheme();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number } | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  const load = useCallback(async () => {
    const all = await getAllStatements();
    // newest first; keep lightweight
    setStatements(all.slice(0, 20));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const metrics = useMemo(() => {
    const summaries = statements
      .map((s) => ({ s, summary: calculateStatementSummary(s) }))
      .sort((a, b) => (a.s.createdAt < b.s.createdAt ? -1 : 1));

    const totalSale = summaries.reduce((sum, x) => sum + (Number.isFinite(x.s.salePrice ?? 0) ? (x.s.salePrice ?? 0) : 0), 0);
    const totalGross = summaries.reduce((sum, x) => sum + (Number.isFinite(x.summary.grossCommissionAmount) ? x.summary.grossCommissionAmount : 0), 0);

    const totalNetAfterTeam = summaries.reduce((sum, x) => {
      const teamTotal = x.summary.teamSplitResults.reduce((t, s) => t + (Number.isFinite(s.amount) ? s.amount : 0), 0);
      const net = (Number.isFinite(x.summary.netCommissionAmount) ? x.summary.netCommissionAmount : 0) - teamTotal;
      return sum + net;
    }, 0);

    const netPctAfterTeam = totalGross > 0 ? totalNetAfterTeam / totalGross : 0;

    const points = summaries.map((x) => {
      const teamTotal = x.summary.teamSplitResults.reduce((t, s) => t + (Number.isFinite(s.amount) ? s.amount : 0), 0);
      const net = (Number.isFinite(x.summary.netCommissionAmount) ? x.summary.netCommissionAmount : 0) - teamTotal;
      return net;
    });

    return {
      totalSale,
      totalGross,
      totalNet: totalNetAfterTeam,
      netPct: netPctAfterTeam,
      points,
      count: summaries.length,
    };
  }, [statements]);

  const chartWidth = Math.max(280, Math.min(420, Math.round(windowWidth - 32 - 2)));

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    container: {
      padding: 16,
      paddingBottom: 28,
      gap: 12,
    },
    headerWrap: {
      borderRadius: 12,
      overflow: 'hidden',
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgPrimary,
      gap: 6,
    },
    headerGlow: {
      ...StyleSheet.absoluteFillObject,
    },
    subtle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    tilesGrid: {
      flexDirection: 'column',
      gap: 12,
    },
    miniMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    chartCard: {
      ...theme.ui.card,
      gap: 10,
      marginBottom: 0,
    },
    chartHint: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    tooltip: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.bgSecondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tooltipLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    tooltipValue: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 4,
    },
    appearanceCard: {
      ...theme.ui.card,
      gap: 10,
      marginBottom: 0,
    },
    appearanceLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
  });

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[theme.colors.accentSoft, theme.colors.accentSoft, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGlow}
          />
          <ThemedText type="title">Overview</ThemedText>
          <ThemedText style={styles.subtle}>Portfolio-style snapshot from saved statements</ThemedText>
        </View>

        <View style={styles.appearanceCard}>
          <ThemedText style={styles.appearanceLabel}>Appearance</ThemedText>

          <View style={styles.toggleRow}>
            <ThemedText>System</ThemedText>
            <Switch
              value={mode === 'system'}
              onValueChange={(value) => {
                if (value) setMode('system');
              }}
            />
          </View>

          <View style={styles.toggleRow}>
            <ThemedText>Light</ThemedText>
            <Switch
              value={mode === 'light'}
              onValueChange={(value) => {
                if (value) setMode('light');
              }}
            />
          </View>

          <View style={styles.toggleRow}>
            <ThemedText>Dark</ThemedText>
            <Switch
              value={mode === 'dark'}
              onValueChange={(value) => {
                if (value) setMode('dark');
              }}
            />
          </View>
        </View>

        <View style={styles.tilesGrid}>
          <DashboardTile
            label="Total Volume"
            value={money(metrics.totalSale)}
            active={false}
          />
          <DashboardTile
            label="Gross Commission"
            value={money(metrics.totalGross)}
            valueTone="primary"
            active={false}
          />
          <DashboardTile
            label="Net Payout"
            value={money(metrics.totalNet)}
            valueTone="accent"
            active
            footer={<ThemedText style={styles.miniMeta}>{metrics.count} statements</ThemedText>}
          />
          <DashboardTile
            label="Net %"
            value={`${Math.round(metrics.netPct * 100)}%`}
            valueTone="accent"
            active
            right={
              <DonutChart
                value={metrics.netPct}
                centerLabel="Net"
                centerValue={`${Math.round(metrics.netPct * 100)}%`}
              />
            }
          />
        </View>

        <View style={styles.chartCard}>
          <LineChart
            width={chartWidth}
            height={160}
            points={metrics.points}
            label="Net payout trend (most recent first)"
            onPointPress={(index, value) => setSelectedPoint({ index, value })}
          />
          {selectedPoint ? (
            <View style={styles.tooltip}>
              <ThemedText style={styles.tooltipLabel}>Point {selectedPoint.index + 1}</ThemedText>
              <ThemedText style={styles.tooltipValue}>{money(selectedPoint.value)}</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.chartHint}>Tap a point for details.</ThemedText>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}
