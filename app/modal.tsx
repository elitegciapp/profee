import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { NeonCard } from "@/components/ui/neon-card";
import { colors, typography, ui } from "@/constants/theme";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <NeonCard active style={styles.card}>
        <Text style={styles.title}>Modal</Text>
        <Text style={styles.subtitle}>Quick actions live here.</Text>

        <View style={styles.actionsRow}>
          <Link href="/" dismissTo asChild>
            <Pressable accessibilityRole="button" style={[styles.buttonBase, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>Go Home</Text>
            </Pressable>
          </Link>
        </View>
      </NeonCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    gap: 10,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
  },
  actionsRow: {
    marginTop: 6,
  },
  buttonBase: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    ...ui.primaryButton,
  },
  primaryButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});
