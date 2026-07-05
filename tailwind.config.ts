import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary accent — emerald green
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        // Secondary accent — blue
        sky: {
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
        },
        // Warm off-white background system (light mode)
        cream: {
          DEFAULT: "#FAF8F4",
          50: "#FFFFFF",
          100: "#F5F2EB",
          200: "#EDE9DF",
        },
        // Graphite black background system (dark mode)
        graphite: {
          DEFAULT: "#18191C",
          50: "#232428",
          100: "#1E1F23",
          200: "#141518",
          border: "#2B2D31",
        },
        ink: "#26251F", // primary text, light mode
      },
      borderRadius: {
        xl: "20px",
        "2xl": "24px",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(24, 25, 28, 0.08)",
        "soft-lg": "0 8px 40px -8px rgba(24, 25, 28, 0.14)",
        glow: "0 0 0 1px rgba(16, 185, 129, 0.15), 0 8px 30px -6px rgba(16, 185, 129, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
