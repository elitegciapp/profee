import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/src/context/ThemeContext";

type Props = ViewProps & {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function FintechTile({ title, subtitle, children, style, ...rest }: Props) {
  const { theme, colorScheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      marginBottom: 18,
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,

      // Subtle fintech glow (App Store safe)
      ...(colorScheme === "dark"
        ? {
            shadowColor: theme.colors.accent,
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }
        : {
            // avoid dark shadows in light mode
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
          }),
    },
    header: {
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.4,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      marginTop: 2,
      color: theme.colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
  });

  return (
    <View {...rest} style={[styles.container, style]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>

      <View style={styles.divider} />

      <View>{children}</View>
    </View>
  );
}
