import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NeonCard } from '@/components/ui/neon-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/src/context/ThemeContext';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const responsive = useResponsive();

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    screenGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    container: {
      padding: responsive.horizontalPadding,
      paddingBottom: 28,
      gap: responsive.cardSpacing,
      alignSelf: "center",
      width: "100%",
      maxWidth: responsive.contentMaxWidth,
    },
    appearanceCard: {
      padding: 16,
      borderRadius: theme.radius.lg,
      gap: 10,
      marginBottom: 0,
    },
    navCard: {
      padding: 16,
      borderRadius: theme.radius.lg,
      marginBottom: 0,
    },
    appearanceLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
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
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.backgroundGradient}
        style={styles.screenGradient}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <NeonCard style={styles.appearanceCard}>
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
        </NeonCard>

        <Pressable
          onPress={() => router.push('/legal-app-info')}
          style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
          <NeonCard style={styles.navCard}>
            <View style={styles.navRow}>
              <ThemedText>Legal & App Info</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={theme.colors.textMuted} />
            </View>
          </NeonCard>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
