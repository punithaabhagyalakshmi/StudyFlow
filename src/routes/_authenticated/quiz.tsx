import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({ meta: [{ title: "Quiz — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Quiz" description="Auto-generated MCQs, true/false and short answer quizzes." icon={HelpCircle} />,
});
