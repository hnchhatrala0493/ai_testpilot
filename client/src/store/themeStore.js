import { create } from "zustand";

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const savedTheme = localStorage.getItem("bug-tracker-theme") || "light";
applyTheme(savedTheme);

export const useThemeStore = create((set) => ({
  theme: savedTheme,
  toggleTheme: () => {
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("bug-tracker-theme", theme);
      applyTheme(theme);
      return { theme };
    });
  },
}));
