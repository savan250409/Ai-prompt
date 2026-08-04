import { Container } from "@/components/layout/container";
import { YoumindPhotoPrompts } from "@/components/photo-prompts/YoumindPhotoPrompts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Prompt Examples — Prompt Studio",
  description:
    "Browse the latest AI photo prompt examples for portraits and selfies, live from YouMind.",
};

export default function PhotoPromptsPage() {
  return (
    <Container className="py-8">
      <YoumindPhotoPrompts />
    </Container>
  );
}
