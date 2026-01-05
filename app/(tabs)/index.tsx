import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FintechTile } from "@/components/FintechTile";
import { NeonCard } from "@/components/ui/neon-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Statement } from "@/src/models/statement";
import { getFuelProrationSession, getFuelProrationStatementAddon } from "@/src/storage/fuelProrationSession";
import { getStatementById, upsertStatement } from "@/src/storage/statements";
import { consumeTitleCompanySelectionForStatement } from "@/src/storage/titleCompanySelection";
import { calculateStatementSummary } from "@/src/utils/calculations";
import { exportStatementPdf } from "../../src/pdf/exportStatementPdf";
import { exportFuelOnlyPdf } from "../../src/pdf/exportFuelOnlyPdf";
import { buildFuelProrationText } from "../../src/utils/buildFuelText";
import { buildStatementText } from "../../src/utils/buildStatementText";
import { validateStatement } from "../../src/utils/validation";
import { useTheme } from "@/src/context/ThemeContext";

function createStatementId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function createEmptyStatement(): Statement {
  return {
    id: createStatementId(),
    createdAt: new Date().toISOString(),
    propertyAddress: "",
    salePrice: 0,
    listingCommissionPct: 0,
    buyerCommissionPct: 0,
    referralFeePct: 0,
    referralFeePercent: 0,
    referralRecipient: undefined,
    deposit: {
      amount: 0,
      heldBy: "",
      creditedToBuyer: false,
    },
    teamSplits: [],
  };
}

function toNumber(text: string): number {
  const next = Number(text.replace(/,/g, ""));
  return Number.isFinite(next) ? next : 0;
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function FeeStatementScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [statement, setStatement] = useState<Statement>(() => createEmptyStatement());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fuelSnapshot, setFuelSnapshot] = useState(() => getFuelProrationSession());
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const exportMode: "full" | "fuel-only" = fuelSnapshot.exportFuelOnly ? "fuel-only" : "full";

  const styles = StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    screenGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    container: {
      padding: 16,
      paddingBottom: 28,
      gap: 16,
    },
    actionsGrid: {
      gap: 12,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 12,
    },
    actionButtonBase: {
      flex: 1,
      paddingHorizontal: 14,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    actionButtonGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: theme.radius.md,
      opacity: isDark ? 1 : 0,
    },
    actionButtonGradientPressed: {
      opacity: isDark ? 1 : 0,
    },
    actionButtonText: {
      textAlign: "center",
    },
    actionButtonLabel: {
      color: isDark ? theme.colors.textPrimary : theme.colors.accent,
    },
    actionStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      minHeight: 18,
    },
    primaryButton: {
      ...theme.ui.primaryButton,
    },
    primaryButtonPressed: {
      ...theme.ui.primaryButtonPressed,
    },
    primaryButtonText: {
      color: theme.colors.accent,
    },
    secondaryButton: {
      ...theme.ui.secondaryButton,
    },
    statusOk: {
      color: theme.colors.success,
    },
    statusBad: {
      color: theme.colors.danger,
    },
    section: {
      ...theme.ui.card,
      gap: 12,
      marginBottom: 0,
    },
    previewSection: {
      ...theme.ui.previewCard,
      gap: 8,
      padding: 16,
      marginBottom: 0,
    },
    input: {
      ...theme.ui.input,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleWrap: {
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.borderEmphasis : theme.colors.border,
    },
    toggleWrapOn: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    splitName: {
      flex: 2,
    },
    splitPct: {
      width: 70,
      textAlign: "right",
    },
    removeButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgSecondary,
    },
    remove: {
      fontSize: 18,
      color: theme.colors.danger,
    },
    addButton: {
      marginTop: 8,
      paddingVertical: 12,
    },
    previewHeader: {
      ...theme.typography.sectionHeader,
      marginTop: 12,
    },
    previewNet: {
      color: theme.colors.accent,
      textShadowColor: theme.colors.accentSoft,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    fieldLabel: {
      color: theme.colors.textSecondary,
    },
    fintechLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: isDark ? theme.colors.textEmphasis : theme.colors.textPrimary,
      marginBottom: 6,
    },
    fintechInput: {
      backgroundColor: theme.colors.bgSecondary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 14,
    },
    fintechInputDark: {
      borderWidth: 1.5,
      borderColor: theme.colors.borderEmphasis,
    },
    fintechInputFocused: {
      borderColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: isDark ? 0.22 : 0.18,
      shadowRadius: isDark ? 10 : 8,
      shadowOffset: { width: 0, height: 0 },
      ...(Platform.OS === "android" ? { elevation: isDark ? 3 : 2 } : null),
    },
    fintechValueEmphasis: {
      color: theme.colors.textEmphasis,
      fontSize: 14,
      fontWeight: "600",
    },
    fintechMoneyEmphasis: {
      color: theme.colors.textEmphasis,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    inlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    netHighlight: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.bgPrimary,
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    netHighlightLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    netHighlightValue: {
      color: theme.colors.accent,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: 0.4,
      marginTop: 4,
    },
    selector: {
      backgroundColor: theme.colors.bgSecondary,
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectorDark: {
      borderWidth: 1.5,
      borderColor: theme.colors.borderEmphasis,
    },
    selectorText: {
      color: theme.colors.textPrimary,
    },
    selectorTextEmphasis: {
      color: theme.colors.textEmphasis,
      fontSize: 14,
      fontWeight: "600",
    },
    selectorPlaceholder: {
      color: theme.colors.textMuted,
    },

    tileLogo: {
      width: "100%",
      height: 190,
      resizeMode: "contain",
    },
  });

  function normalizedStatementForSave(next: Statement): Statement {
    const referralFeePercent = next.referralFeePercent ?? next.referralFeePct ?? 0;
    const referralRecipient = next.referralRecipient?.trim() || undefined;

    const titleCompanyName = next.titleCompany?.name?.trim() || next.titleCompanyName;
    const titleCompanyEmail = next.titleCompany?.email?.trim() || next.titleCompanyEmail;

    return {
      ...next,
      referralFeePct: next.referralFeePct ?? referralFeePercent,
      referralFeePercent,
      referralRecipient: referralFeePercent > 0 ? referralRecipient : undefined,

      titleCompanyName,
      titleCompanyEmail,
    };
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      consumeTitleCompanySelectionForStatement(statement.id)
        .then((company) => {
          if (!isActive) return;
          if (!company) return;

          setStatement((prev) => ({
            ...prev,
            titleCompany: company,
            titleCompanyName: company.name,
            titleCompanyEmail: company.email,
          }));
        })
        .catch(() => {
          // ignore selection failures
        });

      return () => {
        isActive = false;
      };
    }, [statement.id])
  );

  useFocusEffect(
    useCallback(() => {
      setFuelSnapshot(getFuelProrationSession());
    }, [])
  );

  function getFuelOnlyDataOrAlert(): { totalCredit: number; totalPercent: number } | null {
    const snapshot = getFuelProrationSession();
    setFuelSnapshot(snapshot);

    const credit = Number.isFinite(snapshot.totalCredit) ? snapshot.totalCredit : 0;
    const percent = Number.isFinite(snapshot.totalPercent) ? snapshot.totalPercent : 0;

    if (!(credit > 0)) {
      Alert.alert(
        "No fuel proration available",
        "Go to the Fuel tab, enter the tanks, and calculate a Total Fuel Credit first."
      );
      return null;
    }

    return {
      totalCredit: credit,
      totalPercent: Math.max(0, Math.min(100, percent)),
    };
  }

  async function copySummary() {
    if (exportMode === "fuel-only") {
      const fuel = getFuelOnlyDataOrAlert();
      if (!fuel) return;

      await Clipboard.setStringAsync(buildFuelProrationText(fuel));
      Alert.alert("Copied", "Fuel proration summary copied to clipboard.");
      return;
    }

    const next = normalizedStatementForSave(statement);
    const errors = validateStatement(next);

    if (errors.length > 0) {
      Alert.alert(
        "Cannot copy summary",
        errors.map((e) => `• ${e.message}`).join("\n")
      );
      return;
    }

    await Clipboard.setStringAsync(buildStatementText(next));
    Alert.alert("Copied", "Statement summary copied to clipboard.");
  }

  async function saveStatement() {
    const next = normalizedStatementForSave(statement);
    const errors = validateStatement(next);

    if (errors.length > 0) {
      Alert.alert(
        "Fix required fields",
        errors.map((e) => `• ${e.message}`).join("\n")
      );
      return;
    }

    await upsertStatement(next);
    Alert.alert("Saved", "Statement saved successfully.");

    // Prepare a fresh statement so the next Save creates a new History entry.
    if (!params?.id) {
      setStatement(createEmptyStatement());
    }
  }

  async function exportPdf() {
    if (exportMode === "fuel-only") {
      const fuel = getFuelOnlyDataOrAlert();
      if (!fuel) return;

      try {
        await exportFuelOnlyPdf(fuel);
      } catch {
        Alert.alert(
          "Export failed",
          "Unable to generate or share the PDF. Please try again."
        );
      }
      return;
    }

    const next = normalizedStatementForSave(statement);
    const errors = validateStatement(next);

    if (errors.length > 0) {
      Alert.alert(
        "Cannot export PDF",
        errors.map((e) => `• ${e.message}`).join("\n")
      );
      return;
    }

    try {
      await exportStatementPdf(next, getFuelProrationStatementAddon());
    } catch {
      Alert.alert(
        "Export failed",
        "Unable to generate or share the PDF. Please try again."
      );
    }
  }

  function clearForm() {
    Alert.alert("Clear fee statement?", "This will clear all fields in the form.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setFocusedField(null);
          setSaveStatus("idle");
          setStatement((prev) => ({
            id: prev.id,
            createdAt: prev.createdAt,
            propertyAddress: "",
            salePrice: undefined,
            listingCommissionPct: undefined,
            buyerCommissionPct: undefined,
            referralFeePct: undefined,
            referralFeePercent: undefined,
            referralRecipient: undefined,
            deposit: undefined,
            teamSplits: [],
            titleCompany: undefined,
            titleCompanyName: undefined,
            titleCompanyEmail: undefined,
          }));
        },
      },
    ]);
  }

  useEffect(() => {
    let isMounted = true;

    const id = typeof params?.id === "string" ? params.id : undefined;
    if (!id) return;

    getStatementById(id)
      .then((found) => {
        if (!isMounted) return;
        if (found) setStatement(found);
      })
      .catch(() => {
        // ignore; storage is optional for app startup
      });

    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  const summary = calculateStatementSummary(statement);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.backgroundGradient}
        style={styles.screenGradient}
      />
      <ThemedText type="title">Fee Statement</ThemedText>

      <ThemedView style={styles.actionsGrid}>
        <ThemedView style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              setSaveStatus("saving");
              try {
                await saveStatement();
                setSaveStatus("saved");
              } catch {
                setSaveStatus("error");
              }
            }}
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : undefined,
              pressed ? { transform: [{ scale: 0.98 }] } : undefined,
            ]}
          >
            {({ pressed }) => (
              <>
                <LinearGradient
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  colors={theme.tiles.primaryGradient}
                  style={[
                    styles.actionButtonGradient,
                    pressed ? styles.actionButtonGradientPressed : undefined,
                  ]}
                />
                <ThemedText
                  numberOfLines={1}
                  type="defaultSemiBold"
                  style={[styles.actionButtonLabel, styles.actionButtonText]}
                >
                  {saveStatus === "saving" ? "Saving…" : "Save"}
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={clearForm}
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : undefined,
              pressed ? { transform: [{ scale: 0.98 }] } : undefined,
            ]}
          >
            {({ pressed }) => (
              <>
                <LinearGradient
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  colors={theme.tiles.primaryGradient}
                  style={[
                    styles.actionButtonGradient,
                    pressed ? styles.actionButtonGradientPressed : undefined,
                  ]}
                />
                <ThemedText
                  numberOfLines={1}
                  type="defaultSemiBold"
                  style={[styles.actionButtonLabel, styles.actionButtonText]}
                >
                  Clear
                </ThemedText>
              </>
            )}
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={exportPdf}
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : undefined,
              pressed ? { transform: [{ scale: 0.98 }] } : undefined,
            ]}
          >
            {({ pressed }) => (
              <>
                <LinearGradient
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  colors={theme.tiles.primaryGradient}
                  style={[
                    styles.actionButtonGradient,
                    pressed ? styles.actionButtonGradientPressed : undefined,
                  ]}
                />
                <ThemedText
                  numberOfLines={1}
                  type="defaultSemiBold"
                  style={[styles.actionButtonLabel, styles.actionButtonText]}
                >
                  {exportMode === "fuel-only" ? "Export Fuel PDF" : "Export PDF"}
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={copySummary}
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : undefined,
              pressed ? { transform: [{ scale: 0.98 }] } : undefined,
            ]}
          >
            {({ pressed }) => (
              <>
                <LinearGradient
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  colors={theme.tiles.primaryGradient}
                  style={[
                    styles.actionButtonGradient,
                    pressed ? styles.actionButtonGradientPressed : undefined,
                  ]}
                />
                <ThemedText
                  numberOfLines={1}
                  type="defaultSemiBold"
                  style={[styles.actionButtonLabel, styles.actionButtonText]}
                >
                  {exportMode === "fuel-only" ? "Copy Fuel Summary" : "Copy Statement"}
                </ThemedText>
              </>
            )}
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.actionStatusRow}>
          {saveStatus === "saved" ? <ThemedText style={styles.statusOk}>Saved</ThemedText> : null}
          {saveStatus === "error" ? <ThemedText style={styles.statusBad}>Save failed</ThemedText> : null}
        </ThemedView>
      </ThemedView>

      <FintechTile
        title="Fee Statement"
        subtitle="Commission & disbursement summary"
        headerTop={
          <Image
            source={require("../../assets/images/Untitled (1536 x 1024 px).png")}
            style={styles.tileLogo}
          />
        }
      >
        <ThemedText style={styles.fintechLabel}>Property address</ThemedText>
        <TextInput
          value={statement.propertyAddress}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, propertyAddress: text }))}
          placeholder="123 Main St"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("propertyAddress")}
          onBlur={() => setFocusedField((prev) => (prev === "propertyAddress" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "propertyAddress" ? styles.fintechInputFocused : undefined,
            isDark ? styles.fintechValueEmphasis : undefined,
          ]}
        />

        <ThemedText style={styles.fintechLabel}>Title Company</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/title" as any, params: { statementId: statement.id } })
          }
          style={[styles.selector, isDark ? styles.selectorDark : undefined]}
        >
          <ThemedText
            style={
              statement.titleCompany?.name
                ? [styles.selectorText, isDark ? styles.selectorTextEmphasis : undefined]
                : styles.selectorPlaceholder
            }
          >
            {statement.titleCompany?.name || "Select title company"}
          </ThemedText>
          <ThemedText style={styles.selectorPlaceholder}>›</ThemedText>
        </Pressable>

        <ThemedText style={styles.fintechLabel}>Sale price</ThemedText>
        <TextInput
          value={statement.salePrice ? String(statement.salePrice) : ""}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, salePrice: toNumber(text) }))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("salePrice")}
          onBlur={() => setFocusedField((prev) => (prev === "salePrice" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "salePrice" ? styles.fintechInputFocused : undefined,
            isDark ? styles.fintechMoneyEmphasis : undefined,
          ]}
        />

        <ThemedText style={styles.fintechLabel}>Listing commission %</ThemedText>
        <TextInput
          value={statement.listingCommissionPct ? String(statement.listingCommissionPct) : ""}
          onChangeText={(text) =>
            setStatement((prev) => ({ ...prev, listingCommissionPct: toNumber(text) }))
          }
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("listingCommissionPct")}
          onBlur={() => setFocusedField((prev) => (prev === "listingCommissionPct" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "listingCommissionPct" ? styles.fintechInputFocused : undefined,
          ]}
        />

        <ThemedText style={styles.fintechLabel}>Buyer commission %</ThemedText>
        <TextInput
          value={statement.buyerCommissionPct ? String(statement.buyerCommissionPct) : ""}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, buyerCommissionPct: toNumber(text) }))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("buyerCommissionPct")}
          onBlur={() => setFocusedField((prev) => (prev === "buyerCommissionPct" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "buyerCommissionPct" ? styles.fintechInputFocused : undefined,
          ]}
        />

        <ThemedText style={styles.fintechLabel}>Referral fee %</ThemedText>
        <TextInput
          value={statement.referralFeePct?.toString() ?? ""}
          onChangeText={(text) =>
            setStatement((prev) => ({
              ...prev,
              referralFeePct: toNumber(text) || 0,
              referralFeePercent: toNumber(text) || 0,
              referralRecipient: (toNumber(text) || 0) > 0 ? prev.referralRecipient : undefined,
            }))
          }
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("referralFeePct")}
          onBlur={() => setFocusedField((prev) => (prev === "referralFeePct" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "referralFeePct" ? styles.fintechInputFocused : undefined,
            isDark ? styles.fintechValueEmphasis : undefined,
          ]}
        />

        {Number(statement.referralFeePct ?? statement.referralFeePercent ?? 0) > 0 ? (
          <>
            <ThemedText style={styles.fintechLabel}>Referral Paid To</ThemedText>
            <TextInput
              value={statement.referralRecipient ?? ""}
              onChangeText={(text) =>
                setStatement((prev) => ({
                  ...prev,
                  referralRecipient: text,
                }))
              }
              placeholder="Referral agent or brokerage"
              autoCapitalize="words"
              placeholderTextColor={theme.colors.textMuted}
              onFocus={() => setFocusedField("referralRecipient")}
              onBlur={() => setFocusedField((prev) => (prev === "referralRecipient" ? null : prev))}
              style={[
                styles.fintechInput,
                isDark ? styles.fintechInputDark : undefined,
                focusedField === "referralRecipient" ? styles.fintechInputFocused : undefined,
              ]}
            />
          </>
        ) : null}

        <SectionHeader title="Deposit" />

        <ThemedText style={styles.fintechLabel}>Deposit amount</ThemedText>
        <TextInput
          value={statement.deposit?.amount?.toString() ?? ""}
          onChangeText={(text) =>
            setStatement((prev) => ({
              ...prev,
              deposit: {
                amount: toNumber(text) || 0,
                heldBy: prev.deposit?.heldBy ?? "",
                creditedToBuyer: prev.deposit?.creditedToBuyer ?? false,
              },
            }))
          }
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("depositAmount")}
          onBlur={() => setFocusedField((prev) => (prev === "depositAmount" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "depositAmount" ? styles.fintechInputFocused : undefined,
            isDark ? styles.fintechMoneyEmphasis : undefined,
          ]}
        />

        <ThemedText style={styles.fintechLabel}>Held by</ThemedText>
        <TextInput
          value={statement.deposit?.heldBy ?? ""}
          onChangeText={(text) =>
            setStatement((prev) => ({
              ...prev,
              deposit: {
                amount: prev.deposit?.amount ?? 0,
                heldBy: text,
                creditedToBuyer: prev.deposit?.creditedToBuyer ?? false,
              },
            }))
          }
          placeholder="Title Company / Brokerage"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField("heldBy")}
          onBlur={() => setFocusedField((prev) => (prev === "heldBy" ? null : prev))}
          style={[
            styles.fintechInput,
            isDark ? styles.fintechInputDark : undefined,
            focusedField === "heldBy" ? styles.fintechInputFocused : undefined,
            isDark ? styles.fintechValueEmphasis : undefined,
          ]}
        />

        <View style={styles.row}>
          <ThemedText style={styles.fintechLabel}>Credited to buyer</ThemedText>
          <View style={styles.inlineRow}>
            {isDark ? (
              <ThemedText style={styles.fintechValueEmphasis}>
                {statement.deposit?.creditedToBuyer ? "Yes" : "No"}
              </ThemedText>
            ) : null}

            <View
              style={[
                styles.toggleWrap,
                statement.deposit?.creditedToBuyer ? styles.toggleWrapOn : undefined,
              ]}
            >
              <Switch
                value={statement.deposit?.creditedToBuyer ?? false}
                thumbColor={theme.colors.textPrimary}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
                onValueChange={(value) =>
                  setStatement((prev) => ({
                    ...prev,
                    deposit: {
                      amount: prev.deposit?.amount ?? 0,
                      heldBy: prev.deposit?.heldBy ?? "",
                      creditedToBuyer: value,
                    },
                  }))
                }
              />
            </View>
          </View>
        </View>

        <SectionHeader title="Team Splits" />

        {(statement.teamSplits ?? []).map((split, index) => (
          <View key={split.id ?? `${index}`} style={styles.splitRow}>
            <TextInput
              style={[
                styles.fintechInput,
                isDark ? styles.fintechInputDark : undefined,
                focusedField === `splitName-${index}` ? styles.fintechInputFocused : undefined,
                styles.splitName,
              ]}
              placeholder="Agent name"
              value={split.name}
              placeholderTextColor={theme.colors.textMuted}
              onFocus={() => setFocusedField(`splitName-${index}`)}
              onBlur={() => setFocusedField((prev) => (prev === `splitName-${index}` ? null : prev))}
              onChangeText={(text) =>
                setStatement((prev) => {
                  const current = prev.teamSplits ?? [];
                  const updated = current.slice();
                  updated[index] = { ...updated[index], name: text };
                  return { ...prev, teamSplits: updated };
                })
              }
            />

            <TextInput
              style={[
                styles.fintechInput,
                isDark ? styles.fintechInputDark : undefined,
                focusedField === `splitPct-${index}` ? styles.fintechInputFocused : undefined,
                styles.splitPct,
              ]}
              placeholder="%"
              keyboardType="numeric"
              value={String(split.percentage ?? 0)}
              placeholderTextColor={theme.colors.textMuted}
              onFocus={() => setFocusedField(`splitPct-${index}`)}
              onBlur={() => setFocusedField((prev) => (prev === `splitPct-${index}` ? null : prev))}
              onChangeText={(text) =>
                setStatement((prev) => {
                  const current = prev.teamSplits ?? [];
                  const updated = current.slice();
                  updated[index] = {
                    ...updated[index],
                    percentage: toNumber(text) || 0,
                  };
                  return { ...prev, teamSplits: updated };
                })
              }
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setStatement((prev) => ({
                  ...prev,
                  teamSplits: (prev.teamSplits ?? []).filter((_, i) => i !== index),
                }))
              }
              style={styles.removeButton}
            >
              <ThemedText style={styles.remove}>✕</ThemedText>
            </Pressable>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setStatement((prev) => ({
              ...prev,
              teamSplits: [
                ...(prev.teamSplits ?? []),
                {
                  id: createStatementId(),
                  name: "",
                  percentage: 0,
                },
              ],
            }))
          }
          style={[styles.addButton, styles.secondaryButton]}
        >
          <ThemedText type="defaultSemiBold">+ Add team member</ThemedText>
        </Pressable>
      </FintechTile>

      <NeonCard active style={styles.previewSection}>
        <SectionHeader title="Preview" />

        <ThemedText>Listing commission: {money(summary.listingCommissionAmount)}</ThemedText>
        <ThemedText>Buyer commission: {money(summary.buyerCommissionAmount)}</ThemedText>
        <ThemedText>Gross commission: {money(summary.grossCommissionAmount)}</ThemedText>
        <ThemedText>Referral fee: {money(summary.referralFeeAmount)}</ThemedText>
        {summary.referralFeeAmount > 0 && statement.referralRecipient ? (
          <ThemedText>Referral paid to: {statement.referralRecipient}</ThemedText>
        ) : null}

        <View style={styles.netHighlight}>
          <ThemedText style={styles.netHighlightLabel}>Net Commission</ThemedText>
          <ThemedText style={styles.netHighlightValue}>
            {money(summary.netCommissionAmount)}
          </ThemedText>
        </View>

        {statement.deposit?.amount ? (
          <>
            <ThemedText>Deposit: {money(statement.deposit.amount)}</ThemedText>
            <ThemedText>Held by: {statement.deposit.heldBy || "—"}</ThemedText>
            <ThemedText>
              Credited to buyer: {statement.deposit.creditedToBuyer ? "Yes" : "No"}
            </ThemedText>
          </>
        ) : null}

        {summary.teamSplitResults?.length ? (
          <>
            <ThemedText style={styles.previewHeader}>Team Split</ThemedText>
            {summary.teamSplitResults.map((split, index) => (
              <ThemedText key={`${split.name}-${split.percentage}-${index}`}>
                {split.name || "—"}: {money(split.amount)}
              </ThemedText>
            ))}
          </>
        ) : null}
      </NeonCard>
    </ScrollView>
  );
}
