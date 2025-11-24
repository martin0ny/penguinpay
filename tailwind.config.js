/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./store/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand + status
        primary: "#4f46e5",
        danger: "#fb7185",

        // App shell
        "app-bg-light": "#f9fafb",
        "app-bg-dark": "#020617",

        "card-bg-light": "#ffffff",
        "card-bg-dark": "#020617",

        "border-subtle-light": "#e5e7eb",
        "border-subtle-dark": "#1f2937",

        // Text system
        "text-main-light": "#0f172a",
        "text-main-dark": "#e5e7eb",

        "text-soft-light": "#6b7280",
        "text-soft-dark": "#9ca3af",

        "text-strong-light": "#020617",
        "text-strong-dark": "#f9fafb",

        // Inputs
        "input-bg-light": "#ffffff",
        "input-bg-dark": "#020617",

        "input-border-light": "#e5e7eb",
        "input-border-dark": "#374151",

        // Success / “Live FX”
        success: "#10b981",
        "success-soft": "rgba(16,185,129,0.12)",
        "success-border": "rgba(16,185,129,0.4)",
        "success-text": "#a7f3d0",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};