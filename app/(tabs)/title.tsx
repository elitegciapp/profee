import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { NeonInput } from "@/components/ui/neon-input";
import type { TitleCompany } from "@/src/models/titleCompany";
import { getAllTitleCompanies, saveTitleCompany } from "@/src/storage/titleCompanies";
import { setTitleCompanySelectionForStatement } from "@/src/storage/titleCompanySelection";
import { useTheme } from "@/src/context/ThemeContext";

function createId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function normalizeKey(name: string, email: string) {
  return `${name.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export default function TitleCompaniesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ statementId?: string }>();

  const selectionStatementId = typeof params.statementId === "string" ? params.statementId : undefined;
  const isSelectMode = Boolean(selectionStatementId);

  const [companies, setCompanies] = useState<TitleCompany[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
    fieldLabel: {
      color: theme.colors.textSecondary,
    },
    helper: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    button: {
      ...theme.ui.secondaryButton,
      paddingVertical: 12,
      flex: 1,
    },
    primaryButton: {
      ...theme.ui.primaryButton,
      paddingVertical: 12,
      flex: 1,
    },
    primaryButtonText: {
      color: theme.colors.accent,
    },
    companyCard: {
      ...theme.ui.card,
      marginBottom: 0,
      gap: 6,
    },
    companyName: {
      color: theme.colors.textPrimary,
      fontWeight: "700",
    },
    companyMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    divider: {
      ...theme.ui.divider,
      marginVertical: 8,
    },
  });

  const load = useCallback(async () => {
    const all = await getAllTitleCompanies();
    setCompanies(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const existingKeys = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) {
      map.set(normalizeKey(c.name, c.email), c.id);
    }
    return map;
  }, [companies]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
  }

  async function onSave() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert("Missing name", "Title company name is required.");
      return;
    }

    if (!trimmedEmail) {
      Alert.alert("Missing email", "Email is required.");
      return;
    }

    const key = normalizeKey(trimmedName, trimmedEmail);
    const existingId = existingKeys.get(key);
    if (existingId && existingId !== editingId) {
      Alert.alert("Duplicate", "A title company with the same name and email already exists.");
      return;
    }

    const company: TitleCompany = {
      id: editingId ?? createId(),
      name: trimmedName,
      contactName: contactName.trim() || undefined,
      email: trimmedEmail,
      phone: phone.trim() || undefined,
    };

    await saveTitleCompany(company);
    await load();
    resetForm();
  }

  async function onSelect(company: TitleCompany) {
    if (!selectionStatementId) return;

    await setTitleCompanySelectionForStatement(selectionStatementId, company);
    router.back();
  }

  function beginEdit(company: TitleCompany) {
    setEditingId(company.id);
    setName(company.name);
    setContactName(company.contactName ?? "");
    setEmail(company.email);
    setPhone(company.phone ?? "");
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Title</ThemedText>
        {isSelectMode ? (
          <ThemedText style={styles.helper}>Tap a company to select it for this statement.</ThemedText>
        ) : (
          <ThemedText style={styles.helper}>Save contacts for offline use and quick selection.</ThemedText>
        )}

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Title Company Name
          </ThemedText>
          <NeonInput value={name} onChangeText={setName} placeholder="e.g. ABC Title" style={styles.input} />

          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Contact Name (optional)
          </ThemedText>
          <NeonInput
            value={contactName}
            onChangeText={setContactName}
            placeholder="e.g. Jane Smith"
            style={styles.input}
          />

          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Email
          </ThemedText>
          <NeonInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            Phone (optional)
          </ThemedText>
          <NeonInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <View style={styles.row}>
            <Pressable accessibilityRole="button" onPress={resetForm} style={styles.button}>
              <ThemedText type="defaultSemiBold">{editingId ? "Cancel" : "Clear"}</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSave} style={styles.primaryButton}>
              <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                {editingId ? "Update" : "Save"}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        <View style={styles.divider} />

        {companies.map((company) => (
          <Pressable
            key={company.id}
            accessibilityRole="button"
            onPress={() => (isSelectMode ? onSelect(company) : beginEdit(company))}
            style={styles.companyCard}
          >
            <ThemedText style={styles.companyName}>{company.name}</ThemedText>
            <ThemedText style={styles.companyMeta}>{company.email}</ThemedText>
            {company.contactName ? (
              <ThemedText style={styles.companyMeta}>Contact: {company.contactName}</ThemedText>
            ) : null}
            {company.phone ? <ThemedText style={styles.companyMeta}>Phone: {company.phone}</ThemedText> : null}
          </Pressable>
        ))}

        {companies.length === 0 ? (
          <ThemedText style={styles.helper}>No saved title companies yet.</ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}
