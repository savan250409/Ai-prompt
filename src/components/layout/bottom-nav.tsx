"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS, isActivePath } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom tab bar — §5, §11.6.
 * Home first; active tab gets the electric color + a sliding gradient indicator.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative mx-auto flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors duration-base",
                  active ? "text-cyan" : "text-low hover:text-mid",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-0.5 h-1 w-8 rounded-full bg-grad-electric"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
