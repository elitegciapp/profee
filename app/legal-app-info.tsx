import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';

import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/src/context/ThemeContext';

function getVersionInfo() {
  const expoVersion = Constants.expoConfig?.version;

  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Platform.OS === 'android'
        ? (Constants.expoConfig?.android?.versionCode != null
            ? String(Constants.expoConfig?.android?.versionCode)
            : undefined)
        : undefined;

  const platform = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'web' ? 'PWA' : Platform.OS;

  return {
    version: expoVersion ?? '—',
    build: buildNumber ?? '—',
    platform,
  };
}

function InfoRow({ label, value, labelColor, valueColor }: { label: string; value: string; labelColor: string; valueColor: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 }}>
      <Text style={{ color: labelColor, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function NavRow({ label, valueColor, labelColor }: { label: string; valueColor: string; labelColor: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 12 }}>
      <Text style={{ color: valueColor, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: labelColor, fontSize: 18, lineHeight: 18 }}>›</Text>
    </View>
  );
}

export default function LegalAppInfoScreen() {
  const { theme } = useTheme();
  const responsive = useResponsive();
  const info = useMemo(() => getVersionInfo(), []);

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    container: {
      padding: responsive.horizontalPadding,
      paddingBottom: 28,
      gap: responsive.cardSpacing,
      alignSelf: "center",
      width: "100%",
      maxWidth: responsive.contentMaxWidth,
    },
    section: {
      backgroundColor: theme.colors.bgSecondary,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
    },
    pressableRow: {
      borderRadius: theme.radius.lg,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 0,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
  });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Legal & App Info' }} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <Pressable
            onPress={() => router.push('/privacy-policy')}
            style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.92 : 1 }]}
          >
            <NavRow
              label="Privacy Policy"
              valueColor={theme.colors.textPrimary}
              labelColor={theme.colors.textMuted}
            />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => router.push('/terms-of-service')}
            style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.92 : 1 }]}
          >
            <NavRow
              label="Terms of Service"
              valueColor={theme.colors.textPrimary}
              labelColor={theme.colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <InfoRow label="App Name" value="ProFee" labelColor={theme.colors.textSecondary} valueColor={theme.colors.textPrimary} />
          <InfoRow label="Version" value={info.version} labelColor={theme.colors.textSecondary} valueColor={theme.colors.textPrimary} />
          <InfoRow label="Build" value={info.build} labelColor={theme.colors.textSecondary} valueColor={theme.colors.textPrimary} />
          <InfoRow label="Platform" value={info.platform} labelColor={theme.colors.textSecondary} valueColor={theme.colors.textPrimary} />
          <InfoRow label="Environment" value="Production" labelColor={theme.colors.textSecondary} valueColor={theme.colors.textPrimary} />
        </View>
      </ScrollView>
    </View>
  );
}
