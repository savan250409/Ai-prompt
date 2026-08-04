import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <>
      <PageHero eyebrow="We're listening" title="Send Feedback" subtitle="Help shape Prompt Studio." />
      <Container className="max-w-2xl py-10">
        <FeedbackForm />
      </Container>
    </>
  );
}
