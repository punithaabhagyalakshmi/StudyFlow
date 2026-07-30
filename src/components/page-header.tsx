import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <header className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient/20 text-brand-2">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}