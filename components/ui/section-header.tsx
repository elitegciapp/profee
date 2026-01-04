import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/src/context/ThemeContext';

type Props = {
  title: string;
};

export function SectionHeader({ title }: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    wrap: {
      marginTop: 18,
      marginBottom: 8,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.accent,
      opacity: 0.9,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <ThemedText style={styles.title}>{title}</ThemedText>
      </View>
      <View style={styles.divider} />
    </View>
  );
}
