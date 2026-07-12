import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Profile" description="Edit your photo, college, subjects and preferences." icon={User} />,
});
