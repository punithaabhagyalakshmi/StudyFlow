import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listNotes, upsertNote, deleteNote } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Notes — StudyFlow AI" },
      { name: "description", content: "Capture lecture notes, organise them by folder and tag, and revisit them anytime." },
      { property: "og:title", content: "Notes — StudyFlow AI" },
      { property: "og:description", content: "Organised notes for every subject." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const fetchNotes = useServerFn(listNotes);
  const save = useServerFn(upsertNote);
  const remove = useServerFn(deleteNote);
  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: () => fetchNotes() });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("");

  function open(n: (typeof notes)[number]) {
    setActiveId(n.id);
    setTitle(n.title);
    setContent(n.content ?? "");
    setFolder(n.folder ?? "");
  }
  function blank() {
    setActiveId(null);
    setTitle("");
    setContent("");
    setFolder("");
  }

  const persist = useMutation({
    mutationFn: () =>
      save({ data: { id: activeId, title: title.trim() || "Untitled note", content, folder: folder || null, tags: [] } }),
    onSuccess: (row) => {
      setActiveId(row.id);
      toast.success("Note saved");
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      blank();
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return (
    <div>
      <PageHeader
        icon={StickyNote}
        title="Notes"
        description="Everything you learn, in one searchable place."
        action={<Button onClick={blank} className="bg-brand-gradient text-primary-foreground shadow-glow"><Plus className="mr-1 h-4 w-4" /> New note</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="glass h-fit max-h-[70vh] overflow-y-auto rounded-2xl border-border/60 p-3 shadow-soft">
          {notes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-1">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => open(n)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeId === n.id ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}
                  >
                    <span className="block truncate font-medium">{n.title}</span>
                    <span className="block truncate text-xs opacity-70">{n.folder ?? "Unfiled"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
          <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" maxLength={200} />
            <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder (optional)" maxLength={80} />
          </div>
          <Textarea
            rows={16}
            value={content}
            maxLength={50000}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing…"
            className="resize-none"
          />
          <div className="mt-3 flex justify-between">
            {activeId ? (
              <Button variant="ghost" onClick={() => del.mutate(activeId)} className="text-muted-foreground">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            ) : <span />}
            <Button onClick={() => persist.mutate()} disabled={persist.isPending} className="bg-brand-gradient text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
