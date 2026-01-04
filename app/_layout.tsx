import { ThemeProvider as NavigationThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.bgPrimary,
          },
          headerTintColor: theme.colors.textPrimary,
          contentStyle: {
            backgroundColor: theme.colors.bgPrimary,
          },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
