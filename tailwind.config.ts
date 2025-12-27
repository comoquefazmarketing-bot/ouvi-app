import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        offwhite: "#EAEAEA",
        accent: "#D4C5B0",
        "accent-cool": "#A3B8C2",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
