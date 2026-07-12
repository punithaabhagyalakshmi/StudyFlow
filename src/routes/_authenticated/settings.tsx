import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Settings" description="Theme, notifications, privacy and account." icon={Settings} />,
});
