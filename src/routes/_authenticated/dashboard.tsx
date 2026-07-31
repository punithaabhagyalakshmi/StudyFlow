import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyProfile } from "@/lib/profile.functions";
import { checkInToday, getDashboard } from "@/lib/study.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame, Trophy, Timer, Target, ListChecks, Brain, Sparkles, Calendar, TrendingUp,
  CheckCircle2, StickyNote, Layers,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudyFlow AI" },
      { name: "description", content: "Your daily study command centre: streaks, focus time, tasks, plans and upcoming classes." },
      { property: "og:title", content: "Dashboard — StudyFlow AI" },
      { property: "og:description", content: "Streaks, focus time, tasks and today's study plan in one view." },
    ],
  }),
  component: DashboardPage,
});

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DashboardPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchDashboard = useServerFn(getDashboard);
  const checkIn = useServerFn(checkInToday);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => fetchProfile(),
  });
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const mark = useMutation({
    mutationFn: () => checkIn({ data: { date: localDateKey(now ?? new Date()) } }),
    onSuccess: (r) => {
      if (r.already) toast.info(`Today is already checked in · ${r.streak}-day streak 🔥`);
      else toast.success(`Streak active · ${r.streak} day${r.streak === 1 ? "" : "s"} · +${r.xp} XP`);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isLoading && profile && !profile.onboarded) return <OnboardingNudge />;

  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const hour = now?.getHours() ?? 9;
  const greeting = hour < 5 ? "Still up," : hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
  const todayKey = now ? localDateKey(now) : null;
  const activeToday = !!todayKey && dash?.stats?.last_active_date === todayKey;

  const stats = dash?.stats;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const focusToday = dash?.focusTodayMinutes ?? 0;
  const weekly = dash?.weekly ?? [];
  const maxMin = Math.max(60, ...weekly.map((w) => w.minutes));
  const dailyGoal = Math.round((Number(profile?.daily_study_hours) || 3) * 60);
  const plan = dash?.latestPlan?.plan as
    | { title?: string; days?: { label: string; focus: string; blocks: { time: string; subject: string; activity: string }[] }[] }
    | undefined;
  const planDay = plan?.days?.[0];

  return (
    <div className="space-y-6">
      <header className="animate-fade-up grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">
            {name} <span className="text-brand-gradient">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {now
              ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : "Loading today…"}
          </p>
        </div>
        <Link to="/planner"><Button className="shrink-0 bg-brand-gradient text-primary-foreground shadow-glow"><Sparkles className="mr-1 h-4 w-4" /> AI plan</Button></Link>
      </header>

      <Card className="glass animate-fade-up flex flex-wrap items-center justify-between gap-4 rounded-2xl border-border/60 p-5 shadow-soft">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${activeToday ? "bg-brand-gradient text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
            <Flame className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {activeToday ? "Today is logged — streak is alive" : "Keep your streak alive"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {stats?.streak ?? 0}-day streak · longest {stats?.longest_streak ?? 0} · last active {stats?.last_active_date ?? "never"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => mark.mutate()}
          disabled={mark.isPending || activeToday || !now}
          variant={activeToday ? "outline" : "default"}
          className={activeToday ? "" : "bg-brand-gradient text-primary-foreground shadow-glow"}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {activeToday ? "Checked in today" : "I studied today"}
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Study streak" value={`${stats?.streak ?? 0} days`} hint={`Longest ${stats?.longest_streak ?? 0}`} />
        <Stat icon={Timer} label="Focus today" value={`${focusToday}m`} hint={`of ${dailyGoal}m goal`} />
        <Stat icon={Trophy} label="XP" value={String(xp)} hint={`Level ${level}`} />
        <Stat icon={ListChecks} label="Tasks done" value={`${dash?.tasksDone ?? 0}/${dash?.tasksTotal ?? 0}`} hint={`${dash?.tasksDoneThisWeek ?? 0} this week`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today's plan</h2>
            <Link to="/planner" className="text-xs text-brand-2 hover:underline">Regenerate</Link>
          </div>
          {planDay ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{planDay.label} · {planDay.focus}</p>
              {planDay.blocks?.slice(0, 6).map((b, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 p-3 text-sm">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted-foreground">{b.time}</span>
                  <span className="min-w-0"><span className="font-medium">{b.subject}</span> — {b.activity}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              <Brain className="mx-auto mb-3 h-8 w-8 text-brand-2" />
              No plan yet. Generate one from the <Link to="/planner" className="text-brand-2 underline">AI Planner</Link>.
            </div>
          )}
        </Card>

        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-4 font-semibold">Weekly progress</h2>
          <div className="mb-5 flex h-24 items-end gap-2">
            {weekly.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-gradient"
                  style={{ height: `${Math.max(4, (w.minutes / maxMin) * 80)}px` }}
                  title={`${w.minutes} min`}
                />
                <span className="text-[10px] text-muted-foreground">{w.day.slice(0, 1)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Metric label="Study minutes" value={dash?.studyMinutesThisWeek ?? 0} target={dailyGoal * 7} />
            <Metric label="Tasks completed" value={dash?.tasksDoneThisWeek ?? 0} target={15} />
            <Metric label="Pomodoros" value={dash?.pomodorosThisWeek ?? 0} target={20} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-3 font-semibold">Today's tasks</h2>
          {dash?.todayTasks?.length ? (
            <ul className="space-y-2">
              {dash.todayTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase text-accent-foreground">{t.priority}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing due — <Link to="/tasks" className="text-brand-2 underline">add a task</Link>.</p>
          )}
        </Card>
        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-3 font-semibold">Coming up</h2>
          {dash?.upcomingEvents?.length ? (
            <ul className="space-y-2">
              {dash.upcomingEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                  <span className="truncate">{e.title}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {new Date(e.starts_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events — <Link to="/calendar" className="text-brand-2 underline">plan your week</Link>.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickTile to="/tasks" icon={ListChecks} title="Tasks" desc="Plan your day" />
        <QuickTile to="/calendar" icon={Calendar} title="Calendar" desc="Classes & exams" />
        <QuickTile to="/pomodoro" icon={Timer} title="Focus timer" desc="Start a 25/5 session" />
        <QuickTile to="/flashcards" icon={Layers} title="Flashcards" desc="Review your decks" />
        <QuickTile to="/notes" icon={StickyNote} title="Notes" desc="Capture lectures" />
        <QuickTile to="/goals" icon={Target} title="Goals" desc="Set and track" />
        <QuickTile to="/analytics" icon={TrendingUp} title="Analytics" desc="See how you're doing" />
      </div>
    </div>
  );
}

function OnboardingNudge() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="glass max-w-md rounded-2xl p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient shadow-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Welcome to StudyFlow AI</h2>
        <p className="mt-2 text-sm text-muted-foreground">Tell us a bit about your studies so we can personalize your workspace.</p>
        <Link to="/onboarding"><Button className="mt-6 bg-brand-gradient text-primary-foreground shadow-glow">Start onboarding</Button></Link>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string }) {
  return (
    <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient/20 text-brand-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value}/{target}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function QuickTile({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to as string} className="glass group flex items-center gap-3 rounded-2xl border border-border/60 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient/20 text-brand-2 transition-colors group-hover:bg-brand-gradient group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}