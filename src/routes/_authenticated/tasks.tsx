import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, createTask, toggleTask, deleteTask } from "@/lib/tasks.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search, ListChecks } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — StudyFlow AI" }] }),
  component: TasksPage,
});

function TasksPage() {
  const qc = useQueryClient();
  const list = useServerFn(listTasks);
  const create = useServerFn(createTask);
  const toggle = useServerFn(toggleTask);
  const del = useServerFn(deleteTask);

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => list() });

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [q, setQ] = useState("");

  const addM = useMutation({
    mutationFn: (v: { title: string; priority: "low" | "medium" | "high" | "urgent" }) => create({ data: v }),
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["tasks"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const toggleM = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const filtered = tasks.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
  const pending = filtered.filter((t) => t.status !== "completed");
  const done = filtered.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan your day, one task at a time.</p>
        </div>
      </header>

      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <form
          onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; addM.mutate({ title: title.trim(), priority }); }}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need to do?" />
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
            <SelectTrigger className="hidden w-32 sm:flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={addM.isPending || !title.trim()} className="bg-brand-gradient text-primary-foreground shadow-glow">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </form>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search tasks..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Section title={`To do · ${pending.length}`}>
            {pending.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={(c) => toggleM.mutate({ id: t.id, completed: c })} onDelete={() => delM.mutate(t.id)} />
            ))}
          </Section>
          {done.length > 0 && (
            <Section title={`Done · ${done.length}`}>
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={(c) => toggleM.mutate({ id: t.id, completed: c })} onDelete={() => delM.mutate(t.id)} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: { id: string; title: string; priority: string; status: string; due_date: string | null }; onToggle: (c: boolean) => void; onDelete: () => void }) {
  const done = task.status === "completed";
  const priorityColor: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-accent text-accent-foreground",
    high: "bg-orange-500/20 text-orange-300",
    urgent: "bg-destructive/20 text-destructive-foreground",
  };
  return (
    <Card className="glass flex items-center gap-3 rounded-xl border-border/60 p-3 shadow-soft">
      <Checkbox checked={done} onCheckedChange={(v) => onToggle(!!v)} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase ${priorityColor[task.priority] ?? ""}`}>{task.priority}</span>
      <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="glass rounded-2xl border-dashed border-border/60 p-10 text-center shadow-soft">
      <ListChecks className="mx-auto mb-3 h-8 w-8 text-brand-2" />
      <p className="text-sm text-muted-foreground">No tasks yet — add one above to get started.</p>
    </Card>
  );
}