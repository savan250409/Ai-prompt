import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption text-mid">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-low" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-hi">
              {item.label}
            </Link>
          ) : (
            <span className="text-hi">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
