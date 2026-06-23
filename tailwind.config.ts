import type { Config } from "tailwindcss";

/**
 * Design system — Section 11 of the brief.
 * Colors are driven by CSS variables (see globals.css) so themes swap with no
 * component changes. NEVER hardcode hex in components — use these tokens.
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        surface: "var(--slate)",
        "surface-2": "var(--slate-2)",
        hairline: "var(--hairline)",
        // text ramp — used as text-hi / text-mid / text-low
        hi: "var(--text-hi)",
        mid: "var(--text-mid)",
        low: "var(--text-low)",
        // accents
        cyan: "var(--cyan)",
        blue: "var(--blue)",
        gold: "var(--gold)",
        "gold-deep": "var(--gold-deep)",
        "gold-ink": "var(--gold-ink)",
        "on-electric": "var(--on-electric)",
        glass: "var(--glass)",
        danger: "var(--danger)",
        // legacy aliases kept for the base template
        background: "var(--ink)",
        foreground: "var(--text-hi)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "20px",
        modal: "28px",
        input: "14px",
        pill: "999px",
      },
      boxShadow: {
        glow: "var(--glow-electric)",
        "glow-gold": "var(--glow-gold)",
        card: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 18px 40px -24px rgba(0,0,0,0.65)",
        "card-hover": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 30px 60px -28px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grad-electric": "var(--grad-electric)",
        "grad-gold": "var(--grad-gold)",
        scrim: "var(--scrim)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22,1,0.36,1)",
        spring: "cubic-bezier(0.34,1.56,0.64,1)",
      },
      transitionDuration: {
        fast: "160ms",
        base: "280ms",
        slow: "460ms",
      },
      fontSize: {
        // fluid scale via clamp — §11.3
        display: ["clamp(2rem,1.2rem + 4vw,3.5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        h1: ["clamp(1.5rem,1.1rem + 2vw,2.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        h2: ["clamp(1.25rem,1rem + 1.2vw,1.75rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        body: ["clamp(0.9375rem,0.9rem + 0.2vw,1rem)", { lineHeight: "1.55" }],
        caption: ["clamp(0.75rem,0.72rem + 0.1vw,0.8125rem)", { lineHeight: "1.4" }],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "shimmer-bg": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(220%)" },
        },
        "gold-sweep": {
          "0%": { transform: "translateX(-120%) skewX(-12deg)", opacity: "0" },
          "40%": { opacity: "0.9" },
          "100%": { transform: "translateX(220%) skewX(-12deg)", opacity: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "media-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(34,211,238,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0)" },
        },
        "marquee-y": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-50%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "shimmer-bg": "shimmer-bg 1.8s linear infinite",
        scanline: "scanline 2.4s linear infinite",
        "gold-sweep": "gold-sweep 1.1s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "fade-rise": "fade-rise 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "media-in": "media-in 0.45s ease-out both",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22,1,0.36,1) infinite",
        "marquee-up": "marquee-y 42s linear infinite",
        "marquee-down": "marquee-y 42s linear infinite reverse",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
