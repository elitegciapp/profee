import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { darkTheme, lightTheme } from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

export type ThemeContextType = {
  theme: typeof darkTheme;
  colorScheme: "light" | "dark";
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "PROFEE_THEME_MODE";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    // DEFENSIVE: In some production/native init failure scenarios (or mislinked builds),
    // AsyncStorage can be missing/undefined and calling it would crash the app on startup.
    // We treat theme persistence as optional and fail gracefully.
    let cancelled = false;

    (async () => {
      try {
        const getter = (AsyncStorage as any)?.getItem;
        if (typeof getter !== 'function') {
          console.warn('[startup] AsyncStorage.getItem unavailable; using default theme mode');
          return;
        }

        const saved = await getter.call(AsyncStorage, STORAGE_KEY);
        if (cancelled) return;

        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch (err) {
        console.warn('[startup] Failed to read theme mode from storage; using default', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);

    // DEFENSIVE: persistence should never crash the UI.
    try {
      const setter = (AsyncStorage as any)?.setItem;
      if (typeof setter !== 'function') return;
      void setter.call(AsyncStorage, STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  };

  const colorScheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const resolvedTheme = useMemo(() => {
    return colorScheme === "dark" ? darkTheme : lightTheme;
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, colorScheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
