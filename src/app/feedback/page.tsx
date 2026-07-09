import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Feedback",
  description:
    "Tell us what to build next. Report a bug, request a feature, or rate Prompt Studio.",
  path: "/feedback",
});

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
