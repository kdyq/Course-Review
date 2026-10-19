"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "切换到亮色模式" : "切换到暗黑模式"}
      title={isDark ? "切换到亮色模式" : "切换到暗黑模式"}
    >
      <Moon className="icon-moon" size={18} weight="bold" aria-hidden="true" />
      <Sun className="icon-sun" size={18} weight="bold" aria-hidden="true" />
    </button>
  );
}
