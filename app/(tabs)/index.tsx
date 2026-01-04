import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FintechTile } from "@/components/FintechTile";
import { NeonInput } from "@/components/ui/neon-input";
import { NeonCard } from "@/components/ui/neon-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Statement } from "@/src/models/statement";
import { getFuelProrationStatementAddon } from "@/src/storage/fuelProrationSession";
import { getStatementById, upsertStatement } from "@/src/storage/statements";
import { consumeTitleCompanySelectionForStatement } from "@/src/storage/titleCompanySelection";
import { calculateStatementSummary } from "@/src/utils/calculations";
import { exportStatementPdf } from "../../src/pdf/exportStatementPdf";
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
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [statement, setStatement] = useState<Statement>(() => createEmptyStatement());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const styles = StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    container: {
      padding: 16,
      paddingBottom: 28,
      gap: 16,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    saveButtonBase: {
      paddingHorizontal: 14,
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
      borderColor: theme.colors.border,
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
      color: theme.colors.textMuted,
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
    selectorText: {
      color: theme.colors.textPrimary,
    },
    selectorPlaceholder: {
      color: theme.colors.textMuted,
    },
    sendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sendButton: {
      flex: 1,
      paddingVertical: 12,
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

  function sendToTitleCompany() {
    const email = statement.titleCompany?.email || statement.titleCompanyEmail;
    if (!email) {
      Alert.alert("No title company selected", "Select a title company to send to.");
      return;
    }

    const subject = encodeURIComponent("Fee Statement");
    const body = encodeURIComponent("Please see attached fee statement.");

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert("Unable to open email", "Please configure an email app and try again.");
    });
  }

  function sendFromMyEmail() {
    const subject = encodeURIComponent("Fee Statement");
    const body = encodeURIComponent("Please see attached fee statement.");

    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert("Unable to open email", "Please configure an email app and try again.");
    });
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
      <ThemedText type="title">Fee Statement</ThemedText>

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
            styles.saveButtonBase,
            styles.primaryButton,
            pressed ? styles.primaryButtonPressed : undefined,
          ]}
        >
          <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={exportPdf}
          style={[styles.saveButtonBase, styles.secondaryButton]}
        >
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>Export PDF</ThemedText>
        </Pressable>
        {saveStatus === "saved" ? <ThemedText style={styles.statusOk}>Saved</ThemedText> : null}
        {saveStatus === "error" ? <ThemedText style={styles.statusBad}>Save failed</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.sendRow}>
        <Pressable
          accessibilityRole="button"
          onPress={sendToTitleCompany}
          disabled={!(statement.titleCompany?.email || statement.titleCompanyEmail)}
          style={[
            styles.secondaryButton,
            styles.sendButton,
            !(statement.titleCompany?.email || statement.titleCompanyEmail) ? theme.ui.disabledButton : undefined,
          ]}
        >
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Send to Title
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={sendFromMyEmail}
          style={[styles.secondaryButton, styles.sendButton]}
        >
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Send from My Email
          </ThemedText>
        </Pressable>
      </ThemedView>

      <FintechTile title="Fee Statement" subtitle="Commission & disbursement summary">
        <ThemedText style={styles.fintechLabel}>Property address</ThemedText>
        <NeonInput
          value={statement.propertyAddress}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, propertyAddress: text }))}
          placeholder="123 Main St"
          style={styles.fintechInput}
        />

        <ThemedText style={styles.fintechLabel}>Title Company</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/title" as any, params: { statementId: statement.id } })
          }
          style={styles.selector}
        >
          <ThemedText
            style={statement.titleCompany?.name ? styles.selectorText : styles.selectorPlaceholder}
          >
            {statement.titleCompany?.name || "Select title company"}
          </ThemedText>
          <ThemedText style={styles.selectorPlaceholder}>›</ThemedText>
        </Pressable>

        <ThemedText style={styles.fintechLabel}>Sale price</ThemedText>
        <NeonInput
          value={statement.salePrice ? String(statement.salePrice) : ""}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, salePrice: toNumber(text) }))}
          placeholder="0"
          keyboardType="numeric"
          style={styles.fintechInput}
        />

        <ThemedText style={styles.fintechLabel}>Listing commission %</ThemedText>
        <NeonInput
          value={statement.listingCommissionPct ? String(statement.listingCommissionPct) : ""}
          onChangeText={(text) =>
            setStatement((prev) => ({ ...prev, listingCommissionPct: toNumber(text) }))
          }
          placeholder="0"
          keyboardType="numeric"
          style={styles.fintechInput}
        />

        <ThemedText style={styles.fintechLabel}>Buyer commission %</ThemedText>
        <NeonInput
          value={statement.buyerCommissionPct ? String(statement.buyerCommissionPct) : ""}
          onChangeText={(text) => setStatement((prev) => ({ ...prev, buyerCommissionPct: toNumber(text) }))}
          placeholder="0"
          keyboardType="numeric"
          style={styles.fintechInput}
        />

        <ThemedText style={styles.fintechLabel}>Referral fee %</ThemedText>
        <NeonInput
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
          style={styles.fintechInput}
        />

        {Number(statement.referralFeePct ?? statement.referralFeePercent ?? 0) > 0 ? (
          <>
            <ThemedText style={styles.fintechLabel}>Referral Paid To</ThemedText>
            <NeonInput
              value={statement.referralRecipient ?? ""}
              onChangeText={(text) =>
                setStatement((prev) => ({
                  ...prev,
                  referralRecipient: text,
                }))
              }
              placeholder="Referral agent or brokerage"
              autoCapitalize="words"
              style={styles.fintechInput}
            />
          </>
        ) : null}

        <SectionHeader title="Deposit" />

        <ThemedText style={styles.fintechLabel}>Deposit amount</ThemedText>
        <NeonInput
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
          style={styles.fintechInput}
        />

        <ThemedText style={styles.fintechLabel}>Held by</ThemedText>
        <NeonInput
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
          style={styles.fintechInput}
        />

        <View style={styles.row}>
          <ThemedText style={styles.fintechLabel}>Credited to buyer</ThemedText>
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

        <SectionHeader title="Team Splits" />

        {(statement.teamSplits ?? []).map((split, index) => (
          <View key={split.id ?? `${index}`} style={styles.splitRow}>
            <NeonInput
              style={[styles.fintechInput, styles.splitName]}
              placeholder="Agent name"
              value={split.name}
              onChangeText={(text) =>
                setStatement((prev) => {
                  const current = prev.teamSplits ?? [];
                  const updated = current.slice();
                  updated[index] = { ...updated[index], name: text };
                  return { ...prev, teamSplits: updated };
                })
              }
            />

            <NeonInput
              style={[styles.fintechInput, styles.splitPct]}
              placeholder="%"
              keyboardType="numeric"
              value={String(split.percentage ?? 0)}
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
