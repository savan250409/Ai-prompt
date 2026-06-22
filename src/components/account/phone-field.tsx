"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";

/** Optional mobile number — used to prefill Cashfree checkout (§ billing). */
export function PhoneField({ initialPhone }: { initialPhone: string | null }) {
  const storePhone = useSession((s) => s.me?.user?.phone);
  const setPhone = useSession((s) => s.setPhone);
  const current = storePhone ?? initialPhone ?? "";
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save your number.");
        return;
      }
      setPhone(data.phone ?? null);
      setValue(data.phone ?? "");
      toast.success(data.phone ? "Mobile number saved" : "Mobile number cleared");
    } catch {
      toast.error("Couldn't save your number.");
    } finally {
      setBusy(false);
    }
  }

  const dirty = value.trim() !== (current ?? "");

  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-pill bg-surface-2 text-cyan">
          <Phone className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-hi">
            Mobile number <span className="font-normal text-low">(optional)</span>
          </h2>
          <p className="text-caption text-mid">Used for payment updates at checkout.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center overflow-hidden rounded-input border border-hairline bg-surface-2 focus-within:border-cyan">
          <span className="px-3 font-mono text-sm text-mid">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="98765 43210"
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 font-mono text-sm text-hi placeholder:text-low focus:outline-none"
          />
        </div>
        <Button size="md" onClick={save} loading={busy} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
