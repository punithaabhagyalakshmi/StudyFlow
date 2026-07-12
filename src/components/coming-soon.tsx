import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description, icon: Icon = Sparkles }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <Card className="glass rounded-3xl border-border/60 p-10 text-center shadow-soft">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient shadow-glow">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Coming next</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          This surface is scaffolded and ready. The full experience lands in the next iteration — the data model and design system are already in place.
        </p>
      </Card>
    </div>
  );
}