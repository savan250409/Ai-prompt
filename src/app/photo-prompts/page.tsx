import { Container } from "@/components/layout/container";
import { TrendingPhotoPrompts } from "@/components/photo-prompts/TrendingPhotoPrompts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Prompt Examples — Prompt Studio",
  description:
    "Browse the latest AI photo prompt examples for portraits and selfies curated for high-quality edits.",
};

export default function PhotoPromptsPage() {
  return (
    <Container className="py-8">
      <TrendingPhotoPrompts />
    </Container>
  );
}
