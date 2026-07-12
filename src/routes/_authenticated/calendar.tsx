import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Calendar" description="Classes, deadlines and exams in one view." icon={Calendar} />,
});
