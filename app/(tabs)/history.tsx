import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, typography, ui } from "@/constants/theme";
import type { Statement } from "@/src/models/statement";
import { deleteStatement, getAllStatements } from "@/src/storage/statements";

export default function HistoryScreen() {
  const router = useRouter();
  const [statements, setStatements] = useState<Statement[]>([]);

  async function loadHistory() {
    const data = await getAllStatements();
    setStatements(data);
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function confirmDelete(id: string) {
    Alert.alert(
      "Delete statement?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteStatement(id);
            await loadHistory();
          },
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">History</ThemedText>

        {statements.length === 0 && (
          <ThemedText style={styles.emptyText}>No saved statements yet.</ThemedText>
        )}

        {statements.map((s) => (
          <ThemedView key={s.id} style={styles.card}>
            <ThemedText type="defaultSemiBold">
              {s.propertyAddress || "Untitled Statement"}
            </ThemedText>

            <ThemedText style={styles.metaText}>
              {new Date(s.createdAt).toLocaleString()}
            </ThemedText>

            <View style={styles.actions}>
              <Button
                label="Open"
                onPress={() =>
                  router.push({
                    pathname: "/",
                    params: { id: s.id },
                  })
                }
              />
              <Button label="Delete" tone="danger" onPress={() => confirmDelete(s.id)} />
            </View>
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function Button({
  label,
  onPress,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger";
}) {
  const borderColor = tone === "danger" ? colors.danger : colors.accent;
  const textColor = tone === "danger" ? colors.danger : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.buttonBase, { borderColor }]}
    >
      <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
  },
  card: {
    ...ui.card,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  buttonBase: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  sectionHeader: {
    ...typography.sectionHeader,
  },
});
