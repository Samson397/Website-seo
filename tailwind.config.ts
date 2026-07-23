import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a1220",
          soft: "#1a2b45",
          muted: "#5c6b7a",
        },
        mist: "#dfe6e4",
        paper: "#e7eceb",
        brand: {
          // Single accent family — teal, not competing blue
          DEFAULT: "#0f766e",
          bright: "#14b8a6",
          soft: "#d5ebe8",
        },
        teal: {
          // Dark enough for AA on paper — #0d9488 failed PSI at ~3.5:1
          DEFAULT: "#0f766e",
          bright: "#14b8a6",
          soft: "#d5ebe8",
        },
        amber: {
          DEFAULT: "#c27803",
          soft: "#f5e6c8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Syne", "Arial Narrow", "sans-serif"],
        body: ["var(--font-body)", "IBM Plex Sans", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 22px 48px -22px rgba(10, 18, 32, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
