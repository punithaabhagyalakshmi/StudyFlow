import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { StickyNote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes — StudyFlow AI" }] }),
  component: () => <ComingSoon title="Notes" description="Rich text notes with folders, tags and attachments." icon={StickyNote} />,
});
