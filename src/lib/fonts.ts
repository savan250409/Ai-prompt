import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Typography — §11.3.
 * Display: Clash Display (self-hosted woff2). Body: Inter. Mono: JetBrains Mono
 * (all AI prompt text, coins, durations/resolutions/metadata render in mono).
 */
export const fontDisplay = localFont({
  src: [
    { path: "../app/fonts/ClashDisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../app/fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;
