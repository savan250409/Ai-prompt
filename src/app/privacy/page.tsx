import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Prose } from "@/components/ui/prose";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="How we handle your data." />
      <Container className="py-10">
        <Prose>
          <p>
            <strong>Template notice:</strong> this is placeholder policy text. Replace it with your
            reviewed privacy policy before launch.
          </p>
          <h2>What we collect</h2>
          <p>
            Account details (name, email), authentication data, your coin balance and subscription
            status, prompts you unlock, items you favorite, and media you generate.
          </p>
          <h2>How we use it</h2>
          <ul>
            <li>To provide the service — unlocking prompts, generating media, and billing.</li>
            <li>To keep your account secure and prevent abuse.</li>
            <li>To improve the product in aggregate.</li>
          </ul>
          <h2>Media you upload</h2>
          <p>
            Photos you upload for filters and tools are sent to our AI provider to produce your
            result. We strip EXIF metadata before processing and do not use your uploads to train
            models.
          </p>
          <h2>Payments</h2>
          <p>
            Payments are handled by Cashfree. We never see or store your full card details.
          </p>
          <h2>Your choices</h2>
          <p>
            You can delete your account at any time. Contact support to request data export or
            deletion.
          </p>
        </Prose>
      </Container>
    </>
  );
}
