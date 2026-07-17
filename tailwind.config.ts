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
          DEFAULT: "#07111f",
          soft: "#12233a",
          muted: "#5a6f7d",
        },
        mist: "#e6f0f4",
        paper: "#f3f7f9",
        brand: {
          DEFAULT: "#0e7490",
          bright: "#14b8a6",
          deep: "#0c4a6e",
          soft: "#ccfbf1",
        },
        teal: {
          DEFAULT: "#0e7490",
          bright: "#14b8a6",
          soft: "#ccfbf1",
        },
        accent: {
          DEFAULT: "#16a34a",
          soft: "#dcfce7",
        },
        amber: {
          DEFAULT: "#d97706",
          soft: "#fef3c7",
        },
        coral: {
          DEFAULT: "#e11d48",
          soft: "#ffe4e6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 22px 55px -24px rgba(14, 116, 144, 0.45)",
        report: "0 24px 60px -36px rgba(7, 17, 31, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
