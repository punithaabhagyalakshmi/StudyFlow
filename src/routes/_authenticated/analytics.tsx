import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Flame, Timer, Trophy, ListChecks, Layers, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAnalytics } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — StudyFlow AI" },
      { name: "description", content: "See your 30-day focus trend, subject split, task completion, quiz averages and flashcard mastery." },
      { property: "og:title", content: "Analytics — StudyFlow AI" },
      { property: "og:description", content: "Study hours, streaks and completion analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fetchAnalytics = useServerFn(getAnalytics);
  const { data } = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });

  const days = data?.days ?? [];
  const max = Math.max(60, ...days.map((d) => d.minutes));
  const hours = Math.round(((data?.totalMinutes ?? 0) / 60) * 10) / 10;
  const subjMax = Math.max(1, ...(data?.bySubject ?? []).map((s) => s.minutes));

  return (
    <div>
      <PageHeader icon={BarChart3} title="Analytics" description="How your last 30 days of studying actually went." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Timer} label="Focus (30d)" value={`${hours}h`} hint={`${data?.sessions ?? 0} sessions`} />
        <Stat icon={Flame} label="Streak" value={`${data?.stats?.streak ?? 0}d`} hint={`Longest ${data?.stats?.longest_streak ?? 0}d`} />
        <Stat icon={Trophy} label="XP" value={String(data?.stats?.xp ?? 0)} hint={`Level ${data?.stats?.level ?? 1}`} />
        <Stat icon={ListChecks} label="Tasks done" value={`${data?.tasksDone ?? 0}/${data?.tasksTotal ?? 0}`} hint="All time" />
      </div>

      <Card className="glass mb-4 rounded-2xl border-border/60 p-6 shadow-soft">
        <h2 className="mb-4 font-semibold">Daily focus minutes</h2>
        <div className="flex h-40 items-end gap-[3px]">
          {days.map((d) => (
            <div key={d.day} className="group relative flex-1" title={`${d.label}: ${d.minutes} min`}>
              <div
                className="w-full rounded-t bg-brand-gradient transition-opacity hover:opacity-80"
                style={{ height: `${Math.max(3, (d.minutes / max) * 150)}px` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{days[0]?.label}</span>
          <span>{days[days.length - 1]?.label}</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-4 font-semibold">Focus by subject</h2>
          {data?.bySubject?.length ? (
            <ul className="space-y-3">
              {data.bySubject.map((s) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">{s.minutes}m</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(s.minutes / subjMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No subjects yet.</p>
          )}
        </Card>

        <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="mb-4 font-semibold">Mastery</h2>
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-brand-2" /> Flashcards known</span>
                <span className="tabular-nums">{data?.cardsKnown ?? 0}/{data?.cardsTotal ?? 0}</span>
              </div>
              <Progress value={data?.cardsTotal ? ((data.cardsKnown ?? 0) / data.cardsTotal) * 100 : 0} className="h-1.5" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-brand-2" /> Quiz average</span>
                <span className="tabular-nums">{data?.quizAvg === null || data?.quizAvg === undefined ? "—" : `${data.quizAvg}%`}</span>
              </div>
              <Progress value={data?.quizAvg ?? 0} className="h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">{data?.quizCount ?? 0} quizzes taken</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-brand-2" /> Task completion</span>
                <span className="tabular-nums">
                  {data?.tasksTotal ? Math.round(((data.tasksDone ?? 0) / data.tasksTotal) * 100) : 0}%
                </span>
              </div>
              <Progress value={data?.tasksTotal ? ((data.tasksDone ?? 0) / data.tasksTotal) * 100 : 0} className="h-1.5" />
            </div>
          </div>
        </Card>
      </div>
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
