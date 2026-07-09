import { Check, X } from "lucide-react";
import { PLANS, config } from "@/lib/config";

type Cell = boolean | string;

/** Rows are derived from the real config so the table can never drift from the app. */
function rows(): { feature: string; free: Cell; pro: Cell }[] {
  const coins = PLANS.map((p) => p.coins);
  const min = Math.min(...coins).toLocaleString("en-IN");
  const max = Math.max(...coins).toLocaleString("en-IN");

  return [
    { feature: "Browse all prompts, filters & tools", free: true, pro: true },
    {
      feature: "Prompt unlocks",
      free: `${config.freeUnlocksPerDay} per day (watch an ad)`,
      pro: "Unlimited",
    },
    { feature: "Ads", free: "Yes", pro: "Never" },
    { feature: "Exclusive collections", free: false, pro: true },
    { feature: "AI image & video generation", free: false, pro: true },
    { feature: "Aspect ratios", free: "Square only", pro: "All ratios" },
    { feature: "Coins included", free: "—", pro: `${min} – ${max} per plan` },
  ];
}

function Value({ value, pro = false }: { value: Cell; pro?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-grad-gold text-gold-ink">
        <Check className="h-3 w-3" strokeWidth={3} />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-grid h-5 w-5 place-items-center rounded-full border border-hairline text-low">
        <X className="h-3 w-3" strokeWidth={3} />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className={pro ? "text-sm text-hi" : "text-sm text-mid"}>{value}</span>;
}

/** Free vs Pro at a glance. Server-rendered, so it's fully indexable. */
export function PlanComparison() {
  return (
    <section aria-labelledby="compare-heading">
      <div className="mb-5 text-center">
        <h2 id="compare-heading" className="font-display text-h2 font-semibold text-hi">
          Free vs Pro
        </h2>
        <p className="mt-1 text-caption text-mid">Everything you get when you upgrade.</p>
      </div>

      {/* The table simply reflows: cells wrap and padding tightens on small
          screens, so it never forces the page to scroll sideways. The
          overflow-x-auto wrapper stays as a safety net for long labels. */}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-modal border border-hairline bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Feature comparison between the Free and Pro plans</caption>
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="p-3 text-caption font-medium uppercase tracking-wide text-low sm:p-4">
                Feature
              </th>
              <th scope="col" className="p-3 text-caption font-semibold uppercase tracking-wide text-mid sm:p-4">
                Free
              </th>
              <th scope="col" className="p-3 text-caption font-semibold uppercase tracking-wide text-gold sm:p-4">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {rows().map((row) => (
              <tr key={row.feature} className="border-b border-hairline last:border-0">
                <th scope="row" className="p-3 text-sm font-normal text-hi sm:p-4">
                  {row.feature}
                </th>
                <td className="p-3 sm:p-4">
                  <Value value={row.free} />
                </td>
                <td className="p-3 sm:p-4">
                  <Value value={row.pro} pro />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
