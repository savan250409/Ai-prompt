import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" subtitle="The rules of the road." />
      <Container className="py-10">
        <Prose>
          <p>
            <strong>Template notice:</strong> this is placeholder terms text. Replace it with your
            reviewed terms before launch.
          </p>
          <h2>Your account</h2>
          <p>
            You&rsquo;re responsible for activity under your account. Keep your password secure and
            don&rsquo;t share your login.
          </p>
          <h2>Coins &amp; subscriptions</h2>
          <ul>
            <li>Coins are granted with each plan and spent on AI generation.</li>
            <li>If a generation fails, the coins for it are refunded automatically.</li>
            <li>Subscriptions renew until cancelled; you can cancel anytime.</li>
          </ul>
          <h2>Acceptable use</h2>
          <p>
            Don&rsquo;t use the service to create unlawful, harmful, or infringing content, and
            don&rsquo;t attempt to disrupt or reverse-engineer it.
          </p>
          <h2>Content ownership</h2>
          <p>
            You own the media you generate, subject to the terms of the underlying AI models. Prompt
            catalog content remains the property of its owners.
          </p>
          <h2>No warranty</h2>
          <p>
            The service is provided &ldquo;as is.&rdquo; AI output may vary and is not guaranteed to
            be accurate or suitable for any particular purpose.
          </p>
        </Prose>
      </Container>
    </>
  );
}
