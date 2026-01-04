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
  const { theme } = useTheme();

  const isDark = theme.colors.bgPrimary === "#0B1220" || theme.colors.bgPrimary === "#0A0A0A";

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1.5,
      borderRadius: 18,
      padding: 16,
      marginBottom: 18,
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
      opacity: 0.9,
      marginVertical: 12,
    },
  });

  return (
    <View
      {...rest}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: isDark ? theme.colors.accent : theme.colors.border,
          shadowColor: isDark ? theme.colors.accent : "transparent",
          shadowOpacity: isDark ? 0.18 : 0,
          shadowRadius: isDark ? 16 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: isDark ? 8 : 0,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>

      <View style={styles.divider} />

      <View>{children}</View>
    </View>
  );
}
