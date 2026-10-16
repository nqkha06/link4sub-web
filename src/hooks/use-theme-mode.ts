"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export type ThemeMode = "light" | "dark";

export function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const theme: ThemeMode =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  function changeTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
  }

  function toggleTheme() {
    changeTheme(theme === "dark" ? "light" : "dark");
  }

  return {
    mounted,
    theme,
    changeTheme,
    toggleTheme,
  };
}
