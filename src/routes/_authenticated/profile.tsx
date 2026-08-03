import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { User, Save, Plus, Trash2, Flame, Zap, Clock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getMyProfile, updateProfile } from "@/lib/profile.functions";
import { listSubjects, createSubject, deleteSubject, getDashboard } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — StudyFlow AI" },
      { name: "description", content: "Manage your academic profile: name, college, department, year, subjects, study schedule and goals." },
      { property: "og:title", content: "Profile — StudyFlow AI" },
      { property: "og:description", content: "Your academic profile, subjects and study preferences in one place." },
    ],
  }),
  component: ProfilePage,
});

type Form = {
  full_name: string;
  avatar_url: string;
  college: string;
  department: string;
  year: string;
  semester: string;
  target_gpa: string;
  preferred_study_time: string;
  wake_time: string;
  sleep_time: string;
  daily_study_hours: string;
  goals: string;
};

const EMPTY: Form = {
  full_name: "", avatar_url: "", college: "", department: "", year: "", semester: "",
  target_gpa: "", preferred_study_time: "", wake_time: "", sleep_time: "",
  daily_study_hours: "", goals: "",
};

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateProfile);
  const fetchSubjects = useServerFn(listSubjects);
  const addSubject = useServerFn(createSubject);
  const removeSubject = useServerFn(deleteSubject);
  const fetchDashboard = useServerFn(getDashboard);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => fetchSubjects() });
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });

  const [form, setForm] = useState<Form>(EMPTY);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      avatar_url: profile.avatar_url ?? "",
      college: profile.college ?? "",
      department: profile.department ?? "",
      year: profile.year ? String(profile.year) : "",
      semester: profile.semester ? String(profile.semester) : "",
      target_gpa: profile.target_gpa != null ? String(profile.target_gpa) : "",
      preferred_study_time: profile.preferred_study_time ?? "",
      wake_time: profile.wake_time ?? "",
      sleep_time: profile.sleep_time ?? "",
      daily_study_hours: profile.daily_study_hours != null ? String(profile.daily_study_hours) : "",
      goals: profile.goals ?? "",
    });
  }, [profile]);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const str = (v: string) => (v.trim() === "" ? null : v.trim());

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: form.full_name.trim() || "Student",
          avatar_url: str(form.avatar_url),
          college: str(form.college),
          department: str(form.department),
          year: num(form.year),
          semester: num(form.semester),
          target_gpa: num(form.target_gpa),
          preferred_study_time: str(form.preferred_study_time),
          wake_time: str(form.wake_time),
          sleep_time: str(form.sleep_time),
          daily_study_hours: num(form.daily_study_hours),
          goals: str(form.goals),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubjectMut = useMutation({
    mutationFn: () => addSubject({ data: { name: newSubject.trim(), difficulty: "medium" } }),
    onSuccess: () => { setNewSubject(""); qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delSubjectMut = useMutation({
    mutationFn: (id: string) => removeSubject({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = dash?.stats as { current_streak?: number; xp?: number; total_study_minutes?: number } | undefined;
  const initials = (form.full_name || "S")
    .split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Profile"
        description="Your academic identity, subjects and study preferences."
        icon={User}
        action={
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || isLoading}
            className="bg-brand-gradient text-primary-foreground shadow-glow"
          >
            {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        }
      />

      <Card className="glass mb-6 flex flex-wrap items-center gap-4 p-5">
        {form.avatar_url ? (
          <img
            src={form.avatar_url}
            alt={`${form.full_name || "Student"} avatar`}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-xl font-semibold text-primary-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{form.full_name || "Your name"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {[form.department, form.college].filter(Boolean).join(" · ") || "Add your college and department"}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat icon={Flame} label="Streak" value={`${stats?.current_streak ?? 0}d`} />
          <Stat icon={Zap} label="XP" value={String(stats?.xp ?? 0)} />
          <Stat icon={Clock} label="Focus" value={`${Math.round((stats?.total_study_minutes ?? 0) / 60)}h`} />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass space-y-4 p-5">
          <h2 className="font-semibold">Academic details</h2>
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} /></Field>
          <Field label="Avatar image URL"><Input placeholder="https://..." value={form.avatar_url} onChange={(e) => set("avatar_url")(e.target.value)} /></Field>
          <Field label="College / University"><Input value={form.college} onChange={(e) => set("college")(e.target.value)} /></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => set("department")(e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Year"><Input type="number" min={1} max={10} value={form.year} onChange={(e) => set("year")(e.target.value)} /></Field>
            <Field label="Semester"><Input type="number" min={1} max={12} value={form.semester} onChange={(e) => set("semester")(e.target.value)} /></Field>
            <Field label="Target GPA"><Input type="number" step="0.1" min={0} max={10} value={form.target_gpa} onChange={(e) => set("target_gpa")(e.target.value)} /></Field>
          </div>
        </Card>

        <Card className="glass space-y-4 p-5">
          <h2 className="font-semibold">Study preferences</h2>
          <Field label="Preferred study time">
            <Select value={form.preferred_study_time || undefined} onValueChange={set("preferred_study_time")}>
              <SelectTrigger><SelectValue placeholder="Pick a time of day" /></SelectTrigger>
              <SelectContent>
                {["Early morning", "Morning", "Afternoon", "Evening", "Late night"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wake time"><Input type="time" value={form.wake_time?.slice(0, 5) ?? ""} onChange={(e) => set("wake_time")(e.target.value)} /></Field>
            <Field label="Sleep time"><Input type="time" value={form.sleep_time?.slice(0, 5) ?? ""} onChange={(e) => set("sleep_time")(e.target.value)} /></Field>
          </div>
          <Field label="Daily study hours">
            <Input type="number" min={0} max={24} step="0.5" value={form.daily_study_hours} onChange={(e) => set("daily_study_hours")(e.target.value)} />
          </Field>
          <Field label="Goals & motivation">
            <Textarea rows={4} value={form.goals} onChange={(e) => set("goals")(e.target.value)} placeholder="What are you working towards?" />
          </Field>
        </Card>
      </div>

      <Card className="glass mt-6 p-5">
        <h2 className="mb-3 font-semibold">Subjects</h2>
        <div className="mb-4 flex gap-2">
          <Input
            value={newSubject}
            placeholder="Add a subject, e.g. Thermodynamics"
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newSubject.trim()) { e.preventDefault(); addSubjectMut.mutate(); } }}
          />
          <Button variant="outline" disabled={!newSubject.trim() || addSubjectMut.isPending} onClick={() => addSubjectMut.mutate()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects yet — add the ones you're studying this semester.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                {s.name}
                <button
                  aria-label={`Remove ${s.name}`}
                  onClick={() => delSubjectMut.mutate(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-4 w-4 text-brand-2" />
      <p className="mt-1 font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
