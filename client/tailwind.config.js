export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#172033",
        mist: "#f5f7fb",
        line: "#dbe2ea",
        brand: "#2563eb",
        mint: "#0f766e",
        flame: "#dc2626",
        amber: "#b45309",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 51, 0.10)",
      },
    },
  },
  plugins: [],
};
