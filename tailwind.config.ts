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
          DEFAULT: "#0b1220",
          soft: "#162033",
          muted: "#5a6a84",
        },
        mist: "#e8eef8",
        paper: "#f5f7fc",
        brand: {
          DEFAULT: "#2563EB",
          bright: "#3B82F6",
          soft: "#DBEAFE",
        },
        teal: {
          DEFAULT: "#2563EB",
          bright: "#3B82F6",
          soft: "#DBEAFE",
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
        glow: "0 20px 50px -20px rgba(37, 99, 235, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
