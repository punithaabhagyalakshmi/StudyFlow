import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get set up — StudyFlow AI" }] }),
  component: OnboardingWizard,
});

type Data = {
  full_name: string;
  college: string;
  department: string;
  year: string;
  semester: string;
  target_gpa: string;
  subjects: string[];
  preferred_study_time: string;
  wake_time: string;
  sleep_time: string;
  daily_study_hours: string;
  goals: string;
};

const STEPS = ["You", "Academics", "Subjects", "Schedule", "Goals"] as const;

function OnboardingWizard() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const submit = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Data>({
    full_name: "", college: "", department: "", year: "1", semester: "1", target_gpa: "3.5",
    subjects: [], preferred_study_time: "evening", wake_time: "07:00", sleep_time: "23:00",
    daily_study_hours: "4", goals: "",
  });
  const [subjectInput, setSubjectInput] = useState("");
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Data>(k: K, v: Data[K]) => setD((s) => ({ ...s, [k]: v }));
  const addSubject = () => {
    const v = subjectInput.trim();
    if (!v || d.subjects.includes(v)) return;
    update("subjects", [...d.subjects, v]);
    setSubjectInput("");
  };

  async function finish() {
    setSaving(true);
    try {
      await submit({
        data: {
          full_name: d.full_name,
          college: d.college || null,
          department: d.department || null,
          year: parseInt(d.year) || null,
          semester: parseInt(d.semester) || null,
          target_gpa: parseFloat(d.target_gpa) || null,
          preferred_study_time: d.preferred_study_time || null,
          wake_time: d.wake_time || null,
          sleep_time: d.sleep_time || null,
          daily_study_hours: parseFloat(d.daily_study_hours) || null,
          goals: d.goals || null,
          subjects: d.subjects,
        },
      });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Welcome to StudyFlow!");
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally { setSaving(false); }
  }

  const pct = ((step + 1) / STEPS.length) * 100;
  const canNext =
    step === 0 ? d.full_name.trim().length > 0 : true;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <Progress value={pct} className="mt-1.5 h-1.5" />
        </div>
      </div>

      <Card className="glass rounded-3xl border-border/60 p-6 shadow-soft sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Let's get to know you</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll personalize your workspace with this.</p>
            </div>
            <Field label="Full name">
              <Input value={d.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Ada Lovelace" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Your academics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="College / University">
                <Input value={d.college} onChange={(e) => update("college", e.target.value)} placeholder="e.g. Stanford" />
              </Field>
              <Field label="Department">
                <Input value={d.department} onChange={(e) => update("department", e.target.value)} placeholder="Computer Science" />
              </Field>
              <Field label="Year">
                <Input type="number" min={1} max={10} value={d.year} onChange={(e) => update("year", e.target.value)} />
              </Field>
              <Field label="Semester">
                <Input type="number" min={1} max={12} value={d.semester} onChange={(e) => update("semester", e.target.value)} />
              </Field>
              <Field label="Target GPA">
                <Input type="number" step="0.1" min={0} max={10} value={d.target_gpa} onChange={(e) => update("target_gpa", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Subjects this term</h2>
            <p className="text-sm text-muted-foreground">Add all the subjects you're studying. You can edit later.</p>
            <div className="flex gap-2">
              <Input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                placeholder="e.g. Linear Algebra" />
              <Button type="button" onClick={addSubject} variant="secondary">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.subjects.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
                  {s}
                  <button onClick={() => update("subjects", d.subjects.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                </span>
              ))}
              {d.subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects yet — add a few above.</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Your schedule</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred study time">
                <Select value={d.preferred_study_time} onValueChange={(v) => update("preferred_study_time", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_morning">Early morning</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Daily study hours">
                <Input type="number" step="0.5" min={0} max={24} value={d.daily_study_hours} onChange={(e) => update("daily_study_hours", e.target.value)} />
              </Field>
              <Field label="Wake up">
                <Input type="time" value={d.wake_time} onChange={(e) => update("wake_time", e.target.value)} />
              </Field>
              <Field label="Sleep">
                <Input type="time" value={d.sleep_time} onChange={(e) => update("sleep_time", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Your goals</h2>
            <p className="text-sm text-muted-foreground">What do you want to achieve this term?</p>
            <Textarea rows={5} value={d.goals} onChange={(e) => update("goals", e.target.value)}
              placeholder="Ace linear algebra, finish thesis proposal by week 8, keep a 30-day study streak..." />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="bg-brand-gradient text-primary-foreground shadow-glow">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving} className="bg-brand-gradient text-primary-foreground shadow-glow">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Finish setup
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}