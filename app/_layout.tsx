import { ThemeProvider as NavigationThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { SplashOverlay } from '@/components/splash-overlay';
import { runVersionMigration } from '@/src/utils/versionMigration';

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore
});

export const unstable_settings = {
  anchor: '(Back)',
};

export default function RootLayout() {
  useEffect(() => {
    // TEMP REVIEW-SAFETY LOG: helps confirm we reached first render during App Review.
    // Keep lightweight and non-blocking.
    console.info('[startup] RootLayout mounted');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigation />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigation() {
  const { theme, colorScheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [hideSplash, setHideSplash] = useState(false);
  const [rootLaidOut, setRootLaidOut] = useState(false);

  // 🔑 Run once on app launch to clear mock AsyncStorage data on version upgrade
  useEffect(() => {
    runVersionMigration();
  }, []);

  const navTheme: Theme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.bgPrimary,
      card: theme.colors.bgPrimary,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
    },
  };

  const onRootLayout = useCallback(() => {
    setRootLaidOut(true);
  }, []);

  useEffect(() => {
    // TEMP REVIEW-SAFETY LOG: confirms navigation subtree is mounting.
    console.info('[startup] RootNavigation mounted');
  }, []);

  useEffect(() => {
    if (!rootLaidOut) return;
    SplashScreen.hideAsync().catch(() => {
      // ignore
    });
  }, [rootLaidOut]);

  useEffect(() => {
    if (!rootLaidOut) return;
    const t = setTimeout(() => setHideSplash(true), 950);
    return () => clearTimeout(t);
  }, [rootLaidOut]);

  return (
    <View style={{ flex: 1 }} onLayout={onRootLayout}>
      <NavigationThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.bgPrimary,
            },
            headerTintColor: theme.colors.textPrimary,
            headerBackTitle: 'Back',
            contentStyle: {
              backgroundColor: theme.colors.bgPrimary,
            },
          }}
        >
          <Stack.Screen name="(Back)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>

      {showSplash ? (
        <SplashOverlay
          hide={hideSplash}
          onHidden={() => {
            setShowSplash(false);
          }}
        />
      ) : null}
    </View>
  );
}
