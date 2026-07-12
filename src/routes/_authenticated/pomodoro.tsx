import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pomodoro")({
  head: () => ({ meta: [{ title: "Pomodoro — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Pomodoro" description="25/5 timers, custom sessions and focus statistics." icon={Timer} />,
});
