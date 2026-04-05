import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Couleurs Tabou ──────────────────────────────────────────────────
      colors: {
        // Fonds
        bg: {
          deep: "#050403",
          surface: "#0D0F12",
          elevated: "#15191E",
          overlay: "#1C2128",
        },
        // Texte
        text: {
          primary: "#E8E1D3",
          secondary: "#B8AE98",
          muted: "#7A7268",
          inverted: "#050403",
        },
        // Accents
        gold: {
          DEFAULT: "#F0B030",
          light: "#F7CC6A",
          dark: "#D08F30",
          deep: "#9D6823",
        },
        // Critique / Alerte (usage très rare)
        red: {
          DEFAULT: "#900000",
          light: "#C00000",
          dark: "#600000",
        },
        // Bordures et séparateurs
        border: {
          DEFAULT: "#242830",
          subtle: "#1A1E24",
          accent: "#3A3020",
        },
      },

      // ─── Typographie ─────────────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-rajdhani)", "system-ui", "sans-serif"],
        body: ["var(--font-barlow)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      letterSpacing: {
        widest: "0.2em",
        "extra-wide": "0.35em",
      },

      // ─── Ombres ──────────────────────────────────────────────────────────
      boxShadow: {
        "inner-gold": "inset 0 0 0 1px rgba(240, 176, 48, 0.15)",
        "glow-gold": "0 0 20px rgba(240, 176, 48, 0.08)",
        "glow-gold-md": "0 0 40px rgba(240, 176, 48, 0.12)",
        panel: "0 4px 32px rgba(0, 0, 0, 0.6)",
        "panel-lg": "0 8px 64px rgba(0, 0, 0, 0.8)",
      },

      // ─── Bordures ────────────────────────────────────────────────────────
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },

      // ─── Animations ──────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: "180ms",
        slow: "350ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(6px)", opacity: "1" },
        },
        "ken-burns": {
          "0%":   { transform: "scale(1.0) translate(0%, 0%)" },
          "33%":  { transform: "scale(1.07) translate(-1.2%, -0.6%)" },
          "66%":  { transform: "scale(1.05) translate(0.8%, 0.4%)" },
          "100%": { transform: "scale(1.1) translate(-0.5%, 0.8%)" },
        },
        /* Terminal EVE Time */
        "scanline": {
          "0%":   { top: "-2px", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        "terminal-glitch": {
          "0%, 100%": { transform: "translate(0, 0)", opacity: "1" },
          "20%":  { transform: "translate(-2px, 1px)", opacity: "0.8" },
          "40%":  { transform: "translate(2px, -1px)", opacity: "0.6" },
          "60%":  { transform: "translate(-1px, 0)", opacity: "0.9" },
          "80%":  { transform: "translate(1px, 1px)", opacity: "0.7" },
        },
        "terminal-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-in-fast": "fade-in-fast 0.2s ease-out forwards",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2.5s ease-in-out infinite",
        "ken-burns": "ken-burns 32s ease-in-out infinite alternate",
        "scanline": "scanline 4s linear infinite",
        "terminal-glitch": "terminal-glitch 0.3s ease-in-out",
        "terminal-cursor": "terminal-cursor 0.6s step-end infinite",
      },

      // ─── Espacements supplémentaires ──────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "section": "6rem",
        "section-lg": "8rem",
      },

      // ─── Largeur max container ────────────────────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ─── Z-index ──────────────────────────────────────────────────────────
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
      },
    },
  },
  plugins: [],
};

export default config;
