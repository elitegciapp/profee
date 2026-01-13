import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonInput } from "@/components/ui/neon-input";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/src/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import type { FuelPhotoAttachment, FuelTank } from "@/src/models/fuelProration";
import {
  getFuelProrationSession,
  hydrateFuelProrationSession,
  setFuelProrationSession,
} from "@/src/storage/fuelProrationSession";
import { calculateFuelProration, clamp, parseDecimalInput } from "@/src/utils/fuelCalculations";

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}

export default function FuelScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const responsive = useResponsive();
  const initial = getFuelProrationSession();

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
    card: {
      padding: 16,
      borderRadius: theme.radius.lg,
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
      color: isDark ? theme.colors.textEmphasis : theme.colors.textPrimary,
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
      borderColor: isDark ? theme.colors.borderEmphasis : theme.colors.border,
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
      color: isDark ? theme.colors.textEmphasis : theme.colors.textPrimary,
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
      padding: 18,
      borderRadius: theme.radius.lg,
    },
    totalLabel: {
      color: isDark ? theme.colors.textEmphasis : theme.colors.textPrimary,
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

    photoActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    photoButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    photoPreview: {
      width: "100%",
      height: 180,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.borderEmphasis : theme.colors.border,
      backgroundColor: theme.colors.bgSecondary,
      overflow: "hidden",
    },
    photoErrorText: {
      color: theme.colors.danger,
      fontSize: 12,
    },
  });

  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [includeInStatement, setIncludeInStatement] = useState<boolean>(initial.includeInStatement);
  const [exportFuelOnly, setExportFuelOnly] = useState<boolean>(initial.exportFuelOnly);
  const [creditToBuyer, setCreditToBuyer] = useState<boolean>(initial.creditTo === "buyer");
  const [photo, setPhoto] = useState<FuelPhotoAttachment | null>(initial.photo ?? null);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
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
    hydrateFuelProrationSession()
      .then(() => {
        const next = getFuelProrationSession();
        setIncludeInStatement(next.includeInStatement);
        setExportFuelOnly(next.exportFuelOnly);
        setCreditToBuyer(next.creditTo === "buyer");
        setPhoto(next.photo ?? null);
      })
      .catch(() => {
        // ignore hydration failures
      });
  }, []);

  useEffect(() => {
    setFuelProrationSession({
      includeInStatement,
      exportFuelOnly,
      totalCredit,
      totalPercent,
      creditTo: creditToBuyer ? "buyer" : "seller",
    });
  }, [includeInStatement, exportFuelOnly, totalCredit, totalPercent, creditToBuyer]);

  function normalizePickedPhoto(asset: ImagePicker.ImagePickerAsset): FuelPhotoAttachment | null {
    if (!asset?.uri) return null;
    const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? undefined;
    return {
      uri: asset.uri,
      width: Number.isFinite(asset.width) ? asset.width : 0,
      height: Number.isFinite(asset.height) ? asset.height : 0,
      fileName,
    };
  }

  async function attachFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission required", "Enable camera access to take a fuel photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    const next = asset ? normalizePickedPhoto(asset) : null;

    if (!next) {
      Alert.alert("Photo error", "Failed to read photo URI.");
      return;
    }

    setPhotoLoadFailed(false);
    setPhoto(next);
    setFuelProrationSession({ photo: next });
  }

  async function attachFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo library permission required", "Enable photo access to attach a fuel photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    const next = asset ? normalizePickedPhoto(asset) : null;

    if (!next) {
      Alert.alert("Photo error", "Failed to read photo URI.");
      return;
    }

    setPhotoLoadFailed(false);
    setPhoto(next);
    setFuelProrationSession({ photo: next });
  }

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
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.backgroundGradient}
        style={styles.screenGradient}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Fuel Proration</ThemedText>

        <NeonCard style={styles.card}>
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
              Export/copy fuel proration only
            </ThemedText>
            <View style={[styles.toggleWrap, exportFuelOnly ? styles.toggleWrapOn : undefined]}>
              <Switch
                value={exportFuelOnly}
                onValueChange={setExportFuelOnly}
                thumbColor={theme.colors.textPrimary}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              />
            </View>
          </View>
          <ThemedText style={styles.helperText}>
            When enabled, Export/Copy from Fee Statement will use fuel only.
          </ThemedText>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Credited to buyer
            </ThemedText>
            <View style={[styles.toggleWrap, creditToBuyer ? styles.toggleWrapOn : undefined]}>
              <Switch
                value={creditToBuyer}
                onValueChange={setCreditToBuyer}
                thumbColor={theme.colors.textPrimary}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              />
            </View>
          </View>
          <ThemedText style={styles.helperText}>
            Turn off to credit the seller.
          </ThemedText>

          <View style={styles.divider} />

          <View style={styles.photoActionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={attachFromCamera}
              style={[styles.secondaryButton, styles.photoButton]}
            >
              <ThemedText type="defaultSemiBold">Take photo</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={attachFromLibrary}
              style={[styles.secondaryButton, styles.photoButton]}
            >
              <ThemedText type="defaultSemiBold">Choose photo</ThemedText>
            </Pressable>
          </View>

          {photo ? (
            <>
              <View style={styles.divider} />
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
                contentFit="cover"
                onError={() => {
                  setPhotoLoadFailed(true);
                  Alert.alert("Photo error", "Failed to read photo URI.");
                }}
              />
              {photoLoadFailed ? (
                <ThemedText style={styles.photoErrorText}>
                  Photo failed to load. Please re-select it.
                </ThemedText>
              ) : null}
            </>
          ) : null}
        </NeonCard>

        {tankResults.map((tank) => (
          <NeonCard key={tank.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionHeaderWrap} />
              <Pressable
                accessibilityRole="button"
                onPress={() => removeTank(tank.id)}
                style={styles.removeButton}
              >
                <ThemedText style={styles.removeText}>✕</ThemedText>
              </Pressable>
            </View>

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
          </NeonCard>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={addTank}
          style={[styles.addButton, styles.secondaryButton]}
        >
          <ThemedText type="defaultSemiBold">+ Add tank</ThemedText>
        </Pressable>

        <NeonCard active style={styles.totalCard}>
          <ThemedText style={styles.totalLabel}>Total Fuel Credit</ThemedText>
          <ThemedText style={styles.totalValue}>{formatMoney(totalCredit)}</ThemedText>
        </NeonCard>
      </ScrollView>
    </ThemedView>
  );
}
