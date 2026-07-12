import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Goals" description="Semester, monthly, weekly and daily goals." icon={Target} />,
});
