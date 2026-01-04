import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/src/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    iconTile: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },

    iconTileActive: {
      backgroundColor: theme.colors.bgSecondary,
      ...theme.glow,
    },
    underline: {
      height: 2,
      width: 18,
      borderRadius: 1,
      backgroundColor: 'transparent',
      marginTop: 4,
    },
    underlineActive: {
      backgroundColor: theme.colors.accent,
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.textMuted,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.bgPrimary,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <IconSymbol size={26} name="house.fill" color={theme.colors.textMuted} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <IconSymbol size={26} name="paperplane.fill" color={theme.colors.textMuted} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="title"
        options={{
          title: 'Title',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <IconSymbol size={26} name="building.2.fill" color={theme.colors.textMuted} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Fuel',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <IconSymbol size={26} name="drop" color={theme.colors.textMuted} />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <IconSymbol size={26} name="clock.fill" color={theme.colors.textMuted} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );

  function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
    return (
      <View style={[styles.iconTile, focused && styles.iconTileActive]}>
        {children}
        <View style={[styles.underline, focused && styles.underlineActive]} />
      </View>
    );
  }
}
