import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  FileText,
  Gem,
  Heart,
  ImageIcon,
  LifeBuoy,
  MessageSquare,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/server/auth";
import { store } from "@/server/store";
import { Container } from "@/components/layout/container";
import { buttonClass } from "@/components/ui/button-variants";
import { LogoutButton } from "@/components/account/logout-button";
import { ShareAppButton } from "@/components/account/share-app-button";
import { PhoneField } from "@/components/account/phone-field";
import { formatCoins } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

const SETTINGS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account/media", label: "My Media", icon: ImageIcon },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/billing", label: "Billing & Coins", icon: CreditCard },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/feedback", label: "Send Feedback", icon: MessageSquare },
  { href: "/feedback", label: "Rate Us", icon: Star },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
];

export default async function AccountPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/account");

  const [user, isPro, coins] = await Promise.all([
    store.users.findById(userId),
    store.subscriptions.isPro(userId),
    store.coins.balance(userId),
  ]);
  const name = user?.name ?? user?.email ?? "You";

  return (
    <Container className="max-w-3xl py-10">
      {/* profile */}
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-pill bg-grad-electric text-on-electric shadow-glow">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-2xl font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-h2 font-semibold text-hi">{name}</h1>
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-grad-gold px-2 py-0.5 text-[11px] font-semibold uppercase text-gold-ink shadow-glow-gold">
                <Gem className="h-3 w-3" />
                Pro
              </span>
            )}
          </div>
          <p className="truncate text-caption text-mid">{user?.email}</p>
          <p className="mt-1 font-mono text-caption text-mid">
            {formatCoins(coins)} coins
          </p>
        </div>
      </div>

      {/* go pro banner */}
      {!isPro && (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-modal border border-hairline bg-surface p-6 ring-gold sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-hi">Unlock everything with Pro</h2>
            <p className="text-caption text-mid">No ads, unlimited prompts, AI generation.</p>
          </div>
          <Link href="/pricing" className={buttonClass({ variant: "pro" })}>
            <Gem className="h-4 w-4" />
            Go Pro
          </Link>
        </div>
      )}

      {/* profile — optional mobile number (used at checkout) */}
      <div className="mt-8">
        <PhoneField initialPhone={user?.phone ?? null} />
      </div>

      {/* settings */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SETTINGS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-pill bg-surface-2 text-cyan">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-hi">{s.label}</span>
            </Link>
          );
        })}
      </div>

      {/* footer row */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6">
        <div className="flex items-center gap-3">
          <ShareAppButton />
          <span className="text-caption text-low">Version 1.0.0</span>
        </div>
        <LogoutButton />
      </div>
    </Container>
  );
}
