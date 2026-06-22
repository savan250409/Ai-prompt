import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { usingMockCatalog } from "@/data/catalog";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/images", label: "AI Photo Prompts" },
      { href: "/videos", label: "AI Video Prompts" },
      { href: "/filters", label: "AI Filters" },
      { href: "/tools", label: "AI Tools" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/pricing", label: "Go Pro" },
      { href: "/account/media", label: "My Media" },
      { href: "/account/favorites", label: "Favorites" },
      { href: "/account/billing", label: "Billing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/support", label: "Support" },
      { href: "/feedback", label: "Feedback" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-caption text-mid">
            A premium AI media studio — thousands of cinematic photo & video prompts,
            filters, and tools. Create something unreal.
          </p>
          {usingMockCatalog && (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 text-[11px] font-medium text-low">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Running on demo data
            </span>
          )}
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-hi">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-caption text-mid transition-colors hover:text-hi"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-caption text-low sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Prompt Studio. All rights reserved.</span>
          <span className="text-low">Crafted for creators.</span>
        </div>
      </div>
    </footer>
  );
}
