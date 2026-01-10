import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { NeonCard } from "@/components/ui/neon-card";
import type { Statement } from "@/src/models/statement";
import { deleteStatement, getAllStatements } from "@/src/storage/statements";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/src/context/ThemeContext";

export default function HistoryScreen() {
  const { theme } = useTheme();
  const responsive = useResponsive();
  const router = useRouter();
  const [statements, setStatements] = useState<Statement[]>([]);

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
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: responsive.cardSpacing,
      marginTop: responsive.cardSpacing,
    },
    gridItem: {
      width: responsive.isPhone ? "100%" : `${(100 / responsive.numColumns) - (responsive.cardSpacing * (responsive.numColumns - 1) / responsive.numColumns)}%`,
    },
    emptyText: {
      color: theme.colors.textMuted,
    },
    card: {
      padding: 16,
      borderRadius: theme.radius.lg,
      gap: 6,
      marginBottom: 0,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.textMuted,
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
  });

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
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.backgroundGradient}
        style={styles.screenGradient}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">History</ThemedText>

        {statements.length === 0 && (
          <ThemedText style={styles.emptyText}>No saved statements yet.</ThemedText>
        )}

        <View style={styles.gridContainer}>
          {statements.map((s) => (
            <View key={s.id} style={styles.gridItem}>
              <NeonCard style={styles.card}>
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
              </NeonCard>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );

  function Button({
    label,
    onPress,
    tone = "primary",
  }: {
    label: string;
    onPress: () => void;
    tone?: "primary" | "danger";
  }) {
    const borderColor = tone === "danger" ? theme.colors.danger : theme.colors.accent;
    const textColor = tone === "danger" ? theme.colors.danger : theme.colors.accent;

    return (
      <Pressable onPress={onPress} style={[styles.buttonBase, { borderColor }]}>
        <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }
}
