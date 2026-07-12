import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Flashcards" description="Generate and review flashcards from your notes and PDFs." icon={Layers} />,
});
