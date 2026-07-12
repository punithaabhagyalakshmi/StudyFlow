import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Analytics" description="Study hours, streaks and completion analytics." icon={BarChart3} />,
});
