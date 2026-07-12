import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudyFlow AI" }] }),
  component: () => <ComingSoon title="AI Tutor" description="Explain concepts, summarize chapters and generate revision notes." icon={Bot} />,
});
