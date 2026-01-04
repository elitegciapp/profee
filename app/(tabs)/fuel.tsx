import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import { FuelGauge } from "@/components/FuelGauge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { NeonInput } from "@/components/ui/neon-input";
import { SectionHeader } from "@/components/ui/section-header";
import { useTheme } from "@/src/context/ThemeContext";
import type { FuelTank } from "@/src/models/fuelProration";
import { getFuelProrationSession, setFuelProrationSession } from "@/src/storage/fuelProrationSession";
import { calculateFuelProration, clamp, parseDecimalInput } from "@/src/utils/fuelCalculations";

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}

export default function FuelScreen() {
  const { theme } = useTheme();
  const initial = getFuelProrationSession();

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
    card: {
      ...theme.ui.card,
      gap: 10,
      marginBottom: 0,
    },
    input: {
      ...theme.ui.input,
    },
    inputReadOnly: {
      opacity: 0.85,
    },
    divider: {
      ...theme.ui.divider,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    helperText: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    fieldLabel: {
      color: theme.colors.textSecondary,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sectionHeaderWrap: {
      flex: 1,
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
    removeButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgSecondary,
    },
    removeText: {
      color: theme.colors.danger,
      fontSize: 16,
      lineHeight: 16,
    },
    creditRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    creditLabel: {
      color: theme.colors.textSecondary,
    },
    creditValue: {
      color: theme.colors.textPrimary,
    },
    addButton: {
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    secondaryButton: {
      ...theme.ui.secondaryButton,
    },
    totalCard: {
      borderRadius: theme.radius.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    totalLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    totalValue: {
      color: theme.colors.accent,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 6,
      lineHeight: 28,
    },
  });

  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [includeInStatement, setIncludeInStatement] = useState<boolean>(initial.includeInStatement);
  const [sendFuelOnly, setSendFuelOnly] = useState<boolean>(initial.sendFuelOnly);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [priceInputById, setPriceInputById] = useState<Record<string, string>>({});

  const { tankResults, totalCredit } = useMemo(() => calculateFuelProration(tanks), [tanks]);

  const { totalPercent } = useMemo(() => {
    const gallons = tankResults.reduce(
      (sum, t) => sum + (Number.isFinite(t.effectiveGallons) ? t.effectiveGallons : 0),
      0
    );
    const capacity = tankResults.reduce(
      (sum, t) => sum + (Number.isFinite(t.capacityGallons) ? Math.max(0, t.capacityGallons) : 0),
      0
    );
    const percent = capacity > 0 ? (gallons / capacity) * 100 : 0;
    return {
      totalPercent: clamp(percent, 0, 100),
    };
  }, [tankResults]);

  useEffect(() => {
    setFuelProrationSession({ includeInStatement, sendFuelOnly, totalCredit, totalPercent });
  }, [includeInStatement, sendFuelOnly, totalCredit, totalPercent]);

  function addTank() {
    const id = createId();
    setTanks((prev) => [
      ...prev,
      {
        id,
        capacityGallons: 0,
        currentGallons: 0,
        percentFull: undefined,
        pricePerGallon: 0,
      },
    ]);

    setPriceInputById((prev) => ({ ...prev, [id]: "" }));
  }

  function removeTank(id: string) {
    setTanks((prev) => prev.filter((t) => t.id !== id));
    setPriceInputById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateTank(id: string, patch: Partial<FuelTank>) {
    setTanks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Fuel Proration</ThemedText>

        <ThemedView style={styles.card}>
          <View style={styles.toggleRow}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Include with fee statement
            </ThemedText>
            <View style={[styles.toggleWrap, includeInStatement ? styles.toggleWrapOn : undefined]}>
              <Switch
                value={includeInStatement}
                onValueChange={setIncludeInStatement}
                thumbColor={theme.colors.textPrimary}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              />
            </View>
          </View>
          <ThemedText style={styles.helperText}>
            When enabled, only the total credit is added to the PDF.
          </ThemedText>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Send only fuel proration
            </ThemedText>
            <View style={[styles.toggleWrap, sendFuelOnly ? styles.toggleWrapOn : undefined]}>
              <Switch
                value={sendFuelOnly}
                onValueChange={setSendFuelOnly}
                thumbColor={theme.colors.textPrimary}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              />
            </View>
          </View>
          <ThemedText style={styles.helperText}>
            When enabled, Send/Export from Fee Statement will use fuel only.
          </ThemedText>
        </ThemedView>

        {tankResults.map((tank) => (
          <ThemedView key={tank.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderWrap}>
                <SectionHeader title="Propane Tank" />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => removeTank(tank.id)}
                style={styles.removeButton}
              >
                <ThemedText style={styles.removeText}>✕</ThemedText>
              </Pressable>
            </View>

            <FuelGauge
              percent={
                tank.percentFull ??
                (tank.capacityGallons > 0 ? (tank.currentGallons / tank.capacityGallons) * 100 : 0)
              }
              capacity={tank.capacityGallons}
              pricePerGallon={tank.pricePerGallon}
              onChange={(percent, gallons) =>
                updateTank(tank.id, {
                  percentFull: percent,
                  currentGallons: gallons,
                })
              }
              onDragStart={() => setScrollEnabled(false)}
              onDragEnd={() => setScrollEnabled(true)}
            />

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Tank capacity (gal)
            </ThemedText>
            <NeonInput
              value={tank.capacityGallons ? String(tank.capacityGallons) : ""}
              onChangeText={(text) => {
                const nextCapacity = Math.max(0, parseDecimalInput(text));
                const next = { capacityGallons: nextCapacity } as Partial<FuelTank>;
                if (tank.percentFull != null) {
                  next.currentGallons = (nextCapacity * clamp(tank.percentFull, 0, 100)) / 100;
                }
                updateTank(tank.id, next);
              }}
              placeholder="0"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Percent full (%)
            </ThemedText>
            <NeonInput
              value={tank.percentFull == null ? "" : String(tank.percentFull)}
              onChangeText={(text) => {
                const trimmed = text.trim();

                if (trimmed === "") {
                  updateTank(tank.id, { percentFull: undefined });
                  return;
                }

                const nextPercent = clamp(parseDecimalInput(trimmed), 0, 100);
                const nextGallons = (Math.max(0, tank.capacityGallons) * nextPercent) / 100;

                updateTank(tank.id, {
                  percentFull: nextPercent,
                  currentGallons: nextGallons,
                });
              }}
              placeholder="e.g. 75"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <ThemedText style={styles.helperText}>
              Entering a percentage will auto-calculate gallons.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Current gallons
            </ThemedText>
            <NeonInput
              value={tank.currentGallons ? tank.currentGallons.toFixed(2) : ""}
              editable={tank.percentFull == null}
              onChangeText={(text) => {
                const gallons = Math.max(0, parseDecimalInput(text));
                const cap = Math.max(0, tank.capacityGallons);
                const clampedGallons = cap > 0 ? clamp(gallons, 0, cap) : gallons;

                updateTank(tank.id, {
                  currentGallons: clampedGallons,
                  percentFull: undefined,
                });
              }}
              placeholder="0"
              keyboardType="decimal-pad"
              style={[styles.input, tank.percentFull != null && styles.inputReadOnly]}
            />

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Price per gallon
            </ThemedText>
            <NeonInput
              value={
                priceInputById[tank.id] ?? (tank.pricePerGallon ? String(tank.pricePerGallon) : "")
              }
              onChangeText={(text) => {
                setPriceInputById((prev) => ({ ...prev, [tank.id]: text }));
                updateTank(tank.id, {
                  pricePerGallon: Math.max(0, parseDecimalInput(text)),
                });
              }}
              onBlur={() => {
                const raw = priceInputById[tank.id] ?? "";
                const parsed = Math.max(0, parseDecimalInput(raw));

                updateTank(tank.id, { pricePerGallon: parsed });
                setPriceInputById((prev) => ({
                  ...prev,
                  [tank.id]: parsed > 0 ? String(parsed) : "",
                }));
              }}
              placeholder="e.g. 3.27"
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={styles.input}
            />

            <View style={styles.divider} />

            <View style={styles.creditRow}>
              <ThemedText style={styles.creditLabel}>Credit</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.creditValue}>
                {formatMoney(tank.credit)}
              </ThemedText>
            </View>
          </ThemedView>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={addTank}
          style={[styles.addButton, styles.secondaryButton]}
        >
          <ThemedText type="defaultSemiBold">+ Add tank</ThemedText>
        </Pressable>

        <ThemedView style={styles.totalCard}>
          <ThemedText style={styles.totalLabel}>Total Fuel Credit</ThemedText>
          <ThemedText style={styles.totalValue}>{formatMoney(totalCredit)}</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
