import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";

/** Page chrome — header (always), content, footer, mobile bottom nav (§5). */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* spacer so footer clears the fixed mobile nav */}
      <div className="h-[76px] md:hidden" aria-hidden />
      <BottomNav />
    </div>
  );
}
