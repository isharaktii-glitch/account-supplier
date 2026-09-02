import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        galaxy: {
          bg: "#05050a",
          surface: "#0d0d18",
          accent: "#7c3aed",
          accent2: "#22d3ee",
          glow: "#a855f7"
        }
      },
      backgroundImage: {
        "galaxy-radial":
          "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.18), transparent 45%), radial-gradient(circle at 50% 100%, rgba(168,85,247,0.15), transparent 50%)"
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.55)",
        "glow-purple": "0 0 25px rgba(168, 85, 247, 0.45)",
        "glow-cyan": "0 0 25px rgba(34, 211, 238, 0.35)"
      },
      backdropBlur: {
        glass: "18px"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
export default config;
