import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { NeonCard } from '@/components/ui/neon-card';
import { useTheme } from '@/src/context/ThemeContext';

type Props = {
  label: string;
  value: string;
  active?: boolean;
  valueTone?: 'primary' | 'accent';
  right?: React.ReactNode;
  footer?: React.ReactNode;
};

export function DashboardTile({
  label,
  value,
  active = false,
  valueTone = 'primary',
  right,
  footer,
}: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      padding: 14,
      minHeight: 88,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    left: {
      flex: 1,
      minWidth: 0,
    },
    right: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    value: {
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 6,
    },
    valueAccent: {
      color: theme.colors.accent,
    },
    footer: {
      marginTop: 10,
    },
  });

  return (
    <NeonCard active={active} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <ThemedText style={styles.label}>{label}</ThemedText>
          <ThemedText style={[styles.value, valueTone === 'accent' ? styles.valueAccent : undefined]}>
            {value}
          </ThemedText>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </NeonCard>
  );
}
