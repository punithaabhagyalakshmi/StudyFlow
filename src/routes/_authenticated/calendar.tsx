import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listEvents, createEvent, deleteEvent } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — StudyFlow AI" },
      { name: "description", content: "Track classes, exams, assignments and study blocks in a clean month calendar." },
      { property: "og:title", content: "Calendar — StudyFlow AI" },
      { property: "og:description", content: "Classes, deadlines and exams in one study calendar." },
    ],
  }),
  component: CalendarPage,
});

const TYPES = ["class", "exam", "study", "assignment", "holiday", "other"] as const;
type EventType = (typeof TYPES)[number];

const TYPE_STYLES: Record<EventType, string> = {
  class: "bg-chart-1/15 text-chart-1",
  exam: "bg-destructive/15 text-destructive",
  study: "bg-chart-2/15 text-chart-2",
  assignment: "bg-chart-3/20 text-chart-3",
  holiday: "bg-chart-4/15 text-chart-4",
  other: "bg-muted text-muted-foreground",
};

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  const qc = useQueryClient();
  const fetchEvents = useServerFn(listEvents);
  const add = useServerFn(createEvent);
  const remove = useServerFn(deleteEvent);
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => fetchEvents() });

  const [today, setToday] = useState<Date | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(key(now));
  }, []);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("class");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const k = key(new Date(e.starts_at));
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  const dayEvents = selected ? (byDay.get(selected) ?? []) : [];
  const selectedDate = selected ? new Date(`${selected}T12:00:00`) : null;
  const todayKey = today ? key(today) : null;

  const save = useMutation({
    mutationFn: () =>
      add({
        data: {
          title: title.trim(),
          event_type: type,
          starts_at: new Date(`${selected}T${time}:00`).toISOString(),
          location: location || null,
          description: desc || null,
          ends_at: null,
        },
      }),
    onSuccess: () => {
      setTitle(""); setLocation(""); setDesc("");
      toast.success("Event added");
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        title="Calendar"
        description="Classes, exams, assignments and study blocks."
        action={
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelected(key(now));
            }}
          >
            Today
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const k = key(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = k === todayKey;
              const isSel = k === selected;
              const count = byDay.get(k)?.length ?? 0;
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={`relative aspect-square rounded-xl border p-1 text-sm transition-colors ${
                    isSel
                      ? "border-transparent bg-brand-gradient text-primary-foreground shadow-glow"
                      : isToday
                        ? "border-brand/60 bg-accent/50 font-semibold"
                        : "border-border/50 hover:bg-sidebar-accent/60"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <span className="tabular-nums">{d.getDate()}</span>
                  {count > 0 ? (
                    <span className={`absolute inset-x-0 bottom-1 mx-auto h-1.5 w-1.5 rounded-full ${isSel ? "bg-primary-foreground" : "bg-brand-2"}`} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {selected === todayKey ? "Today" : "Selected day"}
            </p>
            <h3 className="text-lg font-semibold">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "Pick a date"}
            </h3>
            <div className="mt-4 space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
              ) : (
                dayEvents.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.starts_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase ${TYPE_STYLES[e.event_type as EventType]}`}>
                        {e.event_type}
                      </span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold">Add to this day</h3>
            <div className="space-y-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={200} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" maxLength={200} />
              <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes (optional)" maxLength={1000} className="resize-none" />
              <Button
                className="w-full bg-brand-gradient text-primary-foreground shadow-glow"
                disabled={!title.trim() || !selected || save.isPending}
                onClick={() => save.mutate()}
              >
                <Plus className="mr-1 h-4 w-4" /> Add event
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
