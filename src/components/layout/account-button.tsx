"use client";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

/** Header account affordance — avatar when signed in, else a sign-in link. */
export function AccountButton({ className }: { className?: string }) {
  const me = useSession((s) => s.me);
  const authed = me?.authenticated;

  if (authed && me?.user) {
    return (
      <Link
        href="/account"
        aria-label="Account"
        className={cn(
          "grid h-10 w-10 place-items-center overflow-hidden rounded-pill border border-hairline transition-colors hover:bg-surface-2",
          className,
        )}
      >
        {me.user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-semibold text-hi">
            {(me.user.name ?? me.user.email).slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="Sign in"
      className={cn(
        "grid h-10 w-10 place-items-center rounded-pill border border-hairline text-mid transition-colors hover:bg-surface-2 hover:text-hi",
        className,
      )}
    >
      <CircleUserRound className="h-5 w-5" />
    </Link>
  );
}
