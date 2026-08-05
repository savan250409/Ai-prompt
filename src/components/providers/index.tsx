"use client";

import { useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SmoothScroll } from "./smooth-scroll";
import { SessionSync } from "./session-sync";

// Filter out the React 19 next-themes script tag warning/error in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

/**
 * App-wide client providers — §2.
 * - next-themes drives [data-theme] on <html> (dark default, no FOUC via the
 *   inline script next-themes injects before paint).
 * - TanStack Query for server state. Zustand stores are imported directly.
 * - sonner toasts, top-center (§11.6). Lenis smooth scroll.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      themes={["dark", "light"]}
      scriptProps={{ id: "theme-script" }}
    >
      <QueryClientProvider client={queryClient}>
        <SmoothScroll />
        <SessionSync />
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast: "glass !rounded-2xl !border-hairline",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
