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
          DEFAULT: "#0b1f3a",
          soft: "#123a6b",
          muted: "#5a6a84",
        },
        mist: "#e8f3f1",
        paper: "#f4f8fa",
        brand: {
          DEFAULT: "#1d4ed8",
          bright: "#3B82F6",
          soft: "#DBEAFE",
        },
        teal: {
          // Dark enough for AA on paper (#f4f8fa) — #0d9488 failed PSI at ~3.5:1
          DEFAULT: "#0f766e",
          bright: "#14b8a6",
          soft: "#ccfbf1",
        },
        amber: {
          DEFAULT: "#f59e0b",
          soft: "#fef3c7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 22px 48px -22px rgba(11, 31, 58, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
