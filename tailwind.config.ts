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
          soft: "#1a2438",
          muted: "#5b6b85",
        },
        mist: "#e8eef6",
        paper: "#f4f7fb",
        teal: {
          DEFAULT: "#0d9488",
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
        glow: "0 20px 50px -20px rgba(13, 148, 136, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
