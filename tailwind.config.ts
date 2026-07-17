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
          DEFAULT: "#0c1222",
          soft: "#162033",
          muted: "#5c6b82",
        },
        mist: "#e4e9f0",
        paper: "#f2f4f8",
        brand: {
          DEFAULT: "#0e8f86",
          bright: "#14b8a6",
          soft: "#d5f5f2",
        },
        teal: {
          DEFAULT: "#0e8f86",
          bright: "#14b8a6",
          soft: "#d5f5f2",
        },
        amber: {
          DEFAULT: "#d97706",
          soft: "#fef3c7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Avenir Next", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 48px -28px rgba(14, 143, 134, 0.45)",
        lift: "0 18px 40px -24px rgba(12, 18, 34, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
