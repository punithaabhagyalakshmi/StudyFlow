import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Planner — StudyFlow AI" }] }),
  component: () => <ComingSoon title="AI Study Planner" description="Upload your syllabus and get a personalized daily, weekly, monthly and revision plan." icon={Brain} />,
});