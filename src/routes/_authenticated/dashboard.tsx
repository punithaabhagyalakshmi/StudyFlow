import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame, Trophy, Timer, Target, ListChecks, Brain, Sparkles, Calendar, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyFlow AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => fetchProfile(),
  });

  if (!isLoading && profile && !profile.onboarded) {
    return <OnboardingNudge />;
  }

  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 5 ? "Still up," : hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  return (
    <div className="space-y-6">
      <header className="animate-fade-up grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">
            {name} <span className="text-brand-gradient">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your study plan for today.</p>
        </div>
        <Link to="/planner"><Button className="shrink-0 bg-brand-gradient text-primary-foreground shadow-glow"><Sparkles className="mr-1 h-4 w-4" /> AI plan</Button></Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Study streak" value="0 days" hint="Start today" />
        <Stat icon={Timer} label="Focus today" value="0m" hint="of goal" />
        <Stat icon={Trophy} label="XP" value="0" hint="Level 1" />
        <Stat icon={ListChecks} label="Tasks done" value="0/0" hint="This week" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass col-span-2 rounded-2xl border-border/60 p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today's plan</h2>
            <Link to="/planner" className="text-xs text-brand-2 hover:underline">Regenerate</Link>
          </div>
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            <Brain className="mx-auto mb-3 h-8 w-8 text-brand-2" />
            No plan yet. Generate one from the <Link to="/planner" className="text-brand-2 underline">AI Planner</Link>.
          </div>
        </Card>
        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-4 font-semibold">Weekly progress</h2>
          <div className="space-y-4">
            <Metric label="Study hours" value={0} target={20} />
            <Metric label="Tasks completed" value={0} target={15} />
            <Metric label="Pomodoros" value={0} target={30} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickTile to="/tasks" icon={ListChecks} title="Tasks" desc="Plan your day" />
        <QuickTile to="/calendar" icon={Calendar} title="Calendar" desc="Upcoming classes & exams" />
        <QuickTile to="/pomodoro" icon={Timer} title="Focus timer" desc="Start a 25/5 session" />
        <QuickTile to="/flashcards" icon={Brain} title="Flashcards" desc="Review your decks" />
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