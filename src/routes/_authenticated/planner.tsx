import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Brain, Loader2, Sparkles, Trash2, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateStudyPlan, listPlans, deletePlan } from "@/lib/ai.functions";
import { listSubjects } from "@/lib/study.functions";
import type { StudyPlan } from "@/lib/ai-schemas";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "AI Study Planner — StudyFlow AI" },
      { name: "description", content: "Generate a personalized daily, weekly, monthly or revision study plan with AI." },
      { property: "og:title", content: "AI Study Planner — StudyFlow AI" },
      { property: "og:description", content: "Generate a personalized study plan with AI." },
    ],
  }),
  component: PlannerPage,
});

const PERIODS = ["daily", "weekly", "monthly", "revision"] as const;
type Period = (typeof PERIODS)[number];

function PlannerPage() {
  const qc = useQueryClient();
  const fetchSubjects = useServerFn(listSubjects);
  const fetchPlans = useServerFn(listPlans);
  const genPlan = useServerFn(generateStudyPlan);
  const removePlan = useServerFn(deletePlan);

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => fetchSubjects() });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => fetchPlans() });

  const [period, setPeriod] = useState<Period>("weekly");
  const [hours, setHours] = useState(3);
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const generate = useMutation({
    mutationFn: () =>
      genPlan({
        data: {
          period,
          hoursPerDay: hours,
          examDate: examDate || null,
          notes: notes || null,
          subjects: selected.length ? selected : subjects.map((s) => s.name),
        },
      }),
    onSuccess: () => {
      toast.success("Your plan is ready");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not generate the plan"),
  });

  const del = useMutation({
    mutationFn: (id: string) => removePlan({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const latest = plans[0];

  return (
    <div>
      <PageHeader
        icon={Brain}
        title="AI Study Planner"
        description="Tell StudyFlow what you're studying and get a realistic, personalized schedule."
      />

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="glass h-fit rounded-2xl border-border/60 p-5 shadow-soft">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Plan type</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${period === p ? "border-transparent bg-brand-gradient text-primary-foreground shadow-glow" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Subjects</Label>
              {subjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No subjects yet — add them in Profile. We'll plan generally for now.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const on = selected.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSelected((cur) =>
                            on ? cur.filter((n) => n !== s.name) : [...cur, s.name],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-transparent bg-brand-gradient text-primary-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hours">Study hours per day</Label>
              <Input
                id="hours"
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam">Exam / deadline (optional)</Label>
              <Input id="exam" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Anything else?</Label>
              <Textarea
                id="notes"
                rows={3}
                maxLength={2000}
                placeholder="Weak in thermodynamics, mornings are free…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="w-full bg-brand-gradient text-primary-foreground shadow-glow"
            >
              {generate.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building your plan…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate plan</>
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {generate.isPending ? (
            <Card className="glass rounded-2xl border-border/60 p-10 text-center shadow-soft">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-2" />
              <p className="text-sm text-muted-foreground">Designing a schedule around your time…</p>
            </Card>
          ) : latest ? (
            <PlanView plan={latest.plan as unknown as StudyPlan} />
          ) : (
            <Card className="glass rounded-2xl border-dashed border-border/60 p-10 text-center shadow-soft">
              <Brain className="mx-auto mb-3 h-8 w-8 text-brand-2" />
              <p className="text-sm text-muted-foreground">
                No plans yet. Fill in the form and generate your first schedule.
              </p>
            </Card>
          )}

          {plans.length > 1 ? (
            <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold">Previous plans</h3>
              <ul className="space-y-2">
                {plans.slice(1).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <Badge variant="secondary" className="mr-2 capitalize">{p.period}</Badge>
                      {p.title ?? "Study plan"}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: StudyPlan }) {
  if (!plan?.days) return null;
  return (
    <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
      <h2 className="text-xl font-semibold">{plan.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
      <div className="mt-5 space-y-4">
        {plan.days.map((d, i) => (
          <div key={i} className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{d.label}</h3>
              <span className="text-xs text-muted-foreground">{d.focus}</span>
            </div>
            <ul className="space-y-2">
              {d.blocks.map((b, j) => (
                <li key={j} className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                  <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-brand-2">
                    <Clock className="h-3 w-3" /> {b.time}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{b.subject}</span>
                    <span className="text-muted-foreground"> — {b.activity}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">{b.minutes}m</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {plan.tips?.length ? (
        <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4">
          <h4 className="mb-2 text-sm font-semibold">Coach tips</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}