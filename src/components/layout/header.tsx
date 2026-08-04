import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProPill } from "@/components/ui/pro-pill";
import { CoinChip } from "@/components/ui/coin-chip";
import { DesktopNav } from "./desktop-nav";
import { AccountButton } from "./account-button";

/** Sticky glass header — present on every screen (§5). */
export function Header() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <DesktopNav />
        </div>

        <div className="flex items-center gap-2">
          <CoinChip />
          <ProPill className="hidden sm:inline-flex" />
          <ThemeToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
