import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Prompt Studio — AI Photo & Video Prompts",
    template: "%s · Prompt Studio",
  },
  description:
    "A premium AI media studio. Thousands of cinematic photo & video prompts, AI filters, and creative tools. Unlock, copy, and generate.",
  applicationName: "Prompt Studio",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "Prompt Studio — AI Photo & Video Prompts",
    description:
      "Thousands of cinematic AI photo & video prompts, filters, and tools. Create something unreal.",
    siteName: "Prompt Studio",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0E14" },
    { media: "(prefers-color-scheme: light)", color: "#F4F6F9" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes sets data-theme on <html> pre-paint
    // data-scroll-behavior: scope smooth scroll so Next disables it on route change
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={fontVariables}>
      <body className="font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
