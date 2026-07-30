import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logPomodoro } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/pomodoro")({
  head: () => ({
    meta: [
      { title: "Focus Timer — StudyFlow AI" },
      { name: "description", content: "Pomodoro focus sessions with XP, streaks and automatic study tracking." },
      { property: "og:title", content: "Focus Timer — StudyFlow AI" },
      { property: "og:description", content: "Pomodoro sessions that feed your streaks and study analytics." },
    ],
  }),
  component: PomodoroPage,
});

const PRESETS = [
  { label: "Focus 25", focus: 25, brk: 5 },
  { label: "Focus 50", focus: 50, brk: 10 },
  { label: "Deep 90", focus: 90, brk: 20 },
];

function PomodoroPage() {
  const qc = useQueryClient();
  const log = useServerFn(logPomodoro);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(PRESETS[0].focus * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const finishedRef = useRef(false);

  const save = useMutation({
    mutationFn: (v: { duration_minutes: number; type: "focus" | "break" }) => log({ data: v }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (res?.xp) toast.success(`Session logged · +${res.xp} XP`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left > 0) {
      finishedRef.current = false;
      return;
    }
    if (!running || finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    const mins = phase === "focus" ? preset.focus : preset.brk;
    save.mutate({ duration_minutes: mins, type: phase });
    if (phase === "focus") {
      setCompleted((c) => c + 1);
      setPhase("break");
      setLeft(preset.brk * 60);
    } else {
      setPhase("focus");
      setLeft(preset.focus * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  function selectPreset(p: (typeof PRESETS)[number]) {
    setPreset(p);
    setPhase("focus");
    setLeft(p.focus * 60);
    setRunning(false);
  }

  const total = (phase === "focus" ? preset.focus : preset.brk) * 60;
  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div>
      <PageHeader icon={Timer} title="Focus Timer" description="Deep work sessions that count towards your streak." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="glass grid place-items-center rounded-2xl border-border/60 p-10 shadow-soft">
          <div className="text-center">
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {phase === "focus" ? "Focus" : "Break"}
            </p>
            <div className="relative mx-auto grid h-56 w-56 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"
                  strokeLinecap="round"
                  className="text-brand-2 transition-[stroke-dashoffset] duration-1000 ease-linear"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - pct / 100)}
                />
              </svg>
              <span className="text-5xl font-semibold tabular-nums">{mm}:{ss}</span>
            </div>
            <div className="mt-8 flex justify-center gap-2">
              <Button onClick={() => setRunning((r) => !r)} className="bg-brand-gradient px-6 text-primary-foreground shadow-glow">
                {running ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
              </Button>
              <Button variant="outline" onClick={() => selectPreset(preset)}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold">Session length</h3>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => selectPreset(p)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${preset.label === p.label ? "border-transparent bg-brand-gradient text-primary-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                >
                  <span>{p.label}</span>
                  <span className="text-xs opacity-80">{p.focus} / {p.brk} min</span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
            <h3 className="mb-1 text-sm font-semibold">This sitting</h3>
            <p className="text-3xl font-semibold tabular-nums">{completed}</p>
            <p className="text-xs text-muted-foreground">focus sessions completed</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
