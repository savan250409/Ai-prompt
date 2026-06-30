import { Clapperboard, Home, ImageIcon, Palette, Wand2, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Persistent nav — Home first, then Images · Videos · AI Tools · AI Filters (§5). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/images", label: "Images", icon: ImageIcon },
  { href: "/videos", label: "Videos", icon: Clapperboard },
  { href: "/tools", label: "AI Tools", icon: Wand2 },
  { href: "/filters", label: "AI Filters", icon: Palette },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
