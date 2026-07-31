import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Target, Plus, Trash2, Minus, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listGoals, createGoal, updateGoalProgress, deleteGoal } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals — StudyFlow AI" },
      { name: "description", content: "Set daily, weekly, monthly and semester study goals and track progress towards each one." },
      { property: "og:title", content: "Goals — StudyFlow AI" },
      { property: "og:description", content: "Daily to semester study goals with live progress tracking." },
    ],
  }),
  component: GoalsPage,
});

const PERIODS = ["daily", "weekly", "monthly", "semester"] as const;
type Period = (typeof PERIODS)[number];

function GoalsPage() {
  const qc = useQueryClient();
  const fetchGoals = useServerFn(listGoals);
  const add = useServerFn(createGoal);
  const bump = useServerFn(updateGoalProgress);
  const remove = useServerFn(deleteGoal);

  const { data: goals = [] } = useQuery({ queryKey: ["goals"], queryFn: () => fetchGoals() });

  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<Period>("weekly");
  const [target, setTarget] = useState("5");
  const [due, setDue] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goals"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: () =>
      add({ data: { title: title.trim(), period, target: Number(target) || 1, due_date: due || null, description: null } }),
    onSuccess: () => { setTitle(""); setDue(""); invalidate(); toast.success("Goal added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const progress = useMutation({
    mutationFn: (v: { id: string; progress: number }) => bump({ data: v }),
    onSuccess: (r) => { invalidate(); if (r.completed) toast.success("Goal complete 🎉"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader icon={Target} title="Goals" description="Daily, weekly, monthly and semester targets." />

      <Card className="glass mb-4 rounded-2xl border-border/60 p-5 shadow-soft">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_110px_150px_auto]">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal — e.g. Finish 5 chapters" maxLength={200} />
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Button className="bg-brand-gradient text-primary-foreground shadow-glow" disabled={!title.trim() || create.isPending} onClick={() => create.mutate()}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {goals.length === 0 ? (
        <Card className="glass grid place-items-center rounded-2xl border-border/60 p-12 text-sm text-muted-foreground shadow-soft">
          No goals yet — set your first one above.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {PERIODS.filter((p) => goals.some((g) => g.period === p)).map((p) => (
            <Card key={p} className="glass rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold capitalize">{p} goals</h3>
              <ul className="space-y-3">
                {goals.filter((g) => g.period === p).map((g) => {
                  const t = Number(g.target ?? 1) || 1;
                  const pr = Number(g.progress ?? 0);
                  return (
                    <li key={g.id} className="rounded-xl border border-border/60 p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {g.completed ? <CheckCircle2 className="mr-1 inline h-4 w-4 text-chart-2" /> : null}
                            {g.title}
                          </p>
                          {g.due_date ? <p className="text-xs text-muted-foreground">Due {g.due_date}</p> : null}
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <Progress value={Math.min(100, (pr / t) * 100)} className="h-1.5" />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs tabular-nums text-muted-foreground">{pr}/{t}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="outline" disabled={pr <= 0} onClick={() => progress.mutate({ id: g.id, progress: Math.max(0, pr - 1) })}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => progress.mutate({ id: g.id, progress: pr + 1 })}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
