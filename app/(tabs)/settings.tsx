import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/src/context/ThemeContext';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();

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
      </ScrollView>
    </ThemedView>
  );
}
