"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.info("Tell us what you think first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Couldn't send — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-hairline bg-surface p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-cyan" />
        <h2 className="font-display text-lg font-semibold text-hi">Feedback received</h2>
        <p className="text-caption text-mid">Thank you — we read every note.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-card border border-hairline bg-surface p-6">
      <div>
        <p className="mb-2 text-caption font-medium text-mid">How&rsquo;s your experience?</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform active:scale-90"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hover || rating) >= n ? "fill-gold text-gold" : "text-low",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="fb" className="mb-1.5 block text-caption font-medium text-mid">
          Your feedback
        </label>
        <textarea
          id="fb"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="What do you love? What could be better?"
          className="w-full resize-y rounded-input border border-hairline bg-surface-2 p-3.5 text-sm text-hi placeholder:text-low focus-visible:border-cyan focus-visible:outline-none"
        />
      </div>
      <Button type="submit" loading={busy}>
        <Send className="h-4 w-4" />
        Send feedback
      </Button>
    </form>
  );
}
