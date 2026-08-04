"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "./nav-items";
import { cn } from "@/lib/utils";

/** Desktop top nav — active gradient fill indicator (§11.6). */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-pill px-4 py-2 text-sm font-medium transition-colors duration-base",
              active ? "text-hi" : "text-mid hover:text-hi",
            )}
          >
            {active && <span className="nav-active absolute inset-0 rounded-pill" />}
            <span className="relative inline-flex items-center gap-2">
              <Icon className={cn("h-4 w-4", active && "text-cyan")} />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
