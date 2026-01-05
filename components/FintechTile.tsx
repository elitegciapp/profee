import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/src/context/ThemeContext";

type Props = ViewProps & {
  title: string;
  subtitle?: string;
  headerTop?: React.ReactNode;
  children: React.ReactNode;
};

export function FintechTile({ title, subtitle, headerTop, children, style, ...rest }: Props) {
  const { theme } = useTheme();

  const isDark = theme.colors.bgPrimary === "#0B1220" || theme.colors.bgPrimary === "#0A0A0A";

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1.5,
      borderRadius: 20,
      padding: 16,
      marginBottom: 18,
    },
    gradientWash: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      opacity: isDark ? 1 : 0,
    },
    edgeGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      opacity: isDark ? 0.12 : 0,
      shadowColor: theme.colors.accent,
      shadowOpacity: isDark ? 0.18 : 0,
      shadowRadius: isDark ? 16 : 0,
      shadowOffset: { width: 0, height: 0 },
      ...(isDark ? { elevation: 6 } : null),
    },
    header: {
      marginBottom: 8,
    },
    headerTop: {
      width: "100%",
      marginBottom: 10,
      alignItems: "center",
      justifyContent: "center",
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
    content: {
      position: "relative",
      zIndex: 1,
    },
  });

  return (
    <View
      {...rest}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: isDark ? theme.tiles.insetBorder : theme.colors.border,
          shadowColor: isDark ? theme.colors.bgPrimary : "transparent",
          shadowOpacity: isDark ? 0.35 : 0,
          shadowRadius: isDark ? 22 : 0,
          shadowOffset: { width: 0, height: 12 },
          elevation: isDark ? 6 : 0,
        },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.primaryGradient}
        style={styles.gradientWash}
      />
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={theme.tiles.edgeGlow}
        style={styles.edgeGlow}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          {headerTop ? <View style={styles.headerTop}>{headerTop}</View> : null}
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
        </View>

        <View style={styles.divider} />

        <View>{children}</View>
      </View>
    </View>
  );
}
