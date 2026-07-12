import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Calendar, ListChecks, Timer, Trophy, ArrowRight, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="bg-mesh min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient shadow-glow">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>StudyFlow<span className="text-brand-gradient"> AI</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth" search={{ mode: "signup" } as never}><Button size="sm" className="bg-brand-gradient text-primary-foreground shadow-glow">Get started</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 glass px-3 py-1 text-xs text-muted-foreground animate-fade-up">
          <Sparkles className="h-3 w-3 text-brand-2" />
          Your AI academic operating system
        </div>
        <h1 className="animate-fade-up text-balance text-5xl font-bold tracking-tight sm:text-7xl">
          Learn better,<br />
          <span className="text-brand-gradient" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>effortlessly.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground sm:text-xl">
          StudyFlow plans your semester, generates flashcards from your notes,
          tutors you when you're stuck, and keeps your streak alive — all in one calm workspace.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
          <Link to="/auth" search={{ mode: "signup" } as never}>
            <Button size="lg" className="bg-brand-gradient text-primary-foreground shadow-glow">
              Start studying <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline">I have an account</Button></Link>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-left shadow-soft animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient/20 text-brand-2">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StudyFlow AI — built for students who want to learn better.
      </footer>
    </div>
  );
}

const features = [
  { icon: Brain, title: "AI Study Planner", desc: "Upload your syllabus and get a daily, weekly and revision plan tuned to your exam dates." },
  { icon: ListChecks, title: "Smart Tasks", desc: "Priorities, subtasks, recurrence and reminders. The way you actually work." },
  { icon: Calendar, title: "Academic Calendar", desc: "Classes, deadlines, exams and holidays in one drag-and-drop view." },
  { icon: Sparkles, title: "AI Tutor & Flashcards", desc: "Get concepts explained, generate flashcards and quizzes from any note or PDF." },
  { icon: Timer, title: "Deep Focus Pomodoro", desc: "25/5 by default, custom timers, subject tracking and gorgeous stats." },
  { icon: Trophy, title: "XP, streaks & goals", desc: "Turn consistency into a game. Level up as you show up." },
];
