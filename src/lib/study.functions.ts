import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ---------------- subjects ---------------- */

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        code: z.string().max(30).optional().nullable(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        credits: z.number().int().min(0).max(20).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("subjects")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subjects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- calendar ---------------- */

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("calendar_events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional().nullable(),
        event_type: z.enum(["class", "exam", "study", "assignment", "holiday", "other"]),
        starts_at: z.string(),
        ends_at: z.string().optional().nullable(),
        location: z.string().max(200).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("calendar_events")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("calendar_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- notes ---------------- */

export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid().optional().nullable(),
        title: z.string().min(1).max(200),
        content: z.string().max(50000).optional().nullable(),
        folder: z.string().max(80).optional().nullable(),
        tags: z.array(z.string().max(40)).max(20).default([]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { data: row, error } = await context.supabase
        .from("notes")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("notes")
      .insert({ ...fields, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- flashcards ---------------- */

export const listDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: decks, error } = await context.supabase
      .from("flashcard_decks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: cards, error: cErr } = await context.supabase
      .from("flashcards")
      .select("id, deck_id, known");
    if (cErr) throw new Error(cErr.message);
    return (decks ?? []).map((d) => {
      const mine = (cards ?? []).filter((c) => c.deck_id === d.id);
      return { ...d, cardCount: mine.length, knownCount: mine.filter((c) => c.known).length };
    });
  });

export const createDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        description: z.string().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("flashcard_decks")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await context.supabase.from("flashcards").delete().eq("deck_id", data.id);
    const { error } = await context.supabase.from("flashcard_decks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ deck_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", data.deck_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        deck_id: z.string().uuid(),
        front: z.string().min(1).max(1000),
        back: z.string().min(1).max(2000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("flashcards")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const markCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), known: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("flashcards")
      .update({ known: data.known, last_reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- goals ---------------- */

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional().nullable(),
        period: z.enum(["daily", "weekly", "monthly", "semester"]),
        target: z.number().min(1).max(100000).default(1),
        due_date: z.string().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("goals")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateGoalProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), progress: z.number().min(0) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: goal } = await context.supabase
      .from("goals")
      .select("target")
      .eq("id", data.id)
      .maybeSingle();
    const completed = !!goal?.target && data.progress >= Number(goal.target);
    const { error } = await context.supabase
      .from("goals")
      .update({ progress: data.progress, completed })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, completed };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- pomodoro + stats ---------------- */

export const logPomodoro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        duration_minutes: z.number().int().min(1).max(240),
        type: z.enum(["focus", "break"]).default("focus"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pomodoro_sessions").insert({
      user_id: context.userId,
      duration_minutes: data.duration_minutes,
      type: data.type,
      ended_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    if (data.type !== "focus") return { ok: true, xp: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const { data: stats } = await context.supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const xpGain = Math.max(5, Math.round(data.duration_minutes / 5) * 5);
    const prevDate = stats?.last_active_date ?? null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak =
      prevDate === today
        ? (stats?.streak ?? 1)
        : prevDate === yesterday
          ? (stats?.streak ?? 0) + 1
          : 1;
    const xp = (stats?.xp ?? 0) + xpGain;
    await context.supabase.from("user_stats").upsert({
      user_id: context.userId,
      xp,
      level: Math.floor(xp / 500) + 1,
      streak,
      longest_streak: Math.max(streak, stats?.longest_streak ?? 0),
      last_active_date: today,
      total_study_minutes: (stats?.total_study_minutes ?? 0) + data.duration_minutes,
      updated_at: new Date().toISOString(),
    });
    return { ok: true, xp: xpGain };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const [statsRes, tasksRes, pomRes, eventsRes, plansRes, goalsRes] = await Promise.all([
      context.supabase.from("user_stats").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("tasks").select("id, title, status, due_date, priority, completed_at"),
      context.supabase
        .from("pomodoro_sessions")
        .select("duration_minutes, type, started_at")
        .gte("started_at", `${since}T00:00:00.000Z`),
      context.supabase
        .from("calendar_events")
        .select("id, title, starts_at, event_type")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      context.supabase
        .from("study_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1),
      context.supabase.from("goals").select("id, title, target, progress, completed, period"),
    ]);

    const tasks = tasksRes.data ?? [];
    const poms = (pomRes.data ?? []).filter((p) => p.type === "focus");
    const today = new Date().toISOString().slice(0, 10);

    const weekly: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      weekly.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: poms
          .filter((p) => (p.started_at ?? "").slice(0, 10) === key)
          .reduce((s, p) => s + (p.duration_minutes ?? 0), 0),
      });
    }

    return {
      stats: statsRes.data,
      focusTodayMinutes: weekly[weekly.length - 1]?.minutes ?? 0,
      weekly,
      pomodorosThisWeek: poms.length,
      studyMinutesThisWeek: weekly.reduce((s, d) => s + d.minutes, 0),
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((t) => t.status === "completed").length,
      tasksDoneThisWeek: tasks.filter(
        (t) => t.completed_at && t.completed_at.slice(0, 10) >= since,
      ).length,
      todayTasks: tasks
        .filter((t) => t.status !== "completed")
        .filter((t) => !t.due_date || t.due_date.slice(0, 10) <= today)
        .slice(0, 6),
      upcomingEvents: eventsRes.data ?? [],
      latestPlan: plansRes.data?.[0] ?? null,
      goals: goalsRes.data ?? [],
    };
  });

/* ---------------- daily check-in (streak) ---------------- */

export const checkInToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const today = data.date;
    const { data: stats } = await context.supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (stats?.last_active_date === today) {
      return { ok: true, already: true, streak: stats.streak ?? 1, xp: 0 };
    }

    const prev = stats?.last_active_date ?? null;
    const yesterday = new Date(`${today}T12:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);

    const streak = prev === yKey ? (stats?.streak ?? 0) + 1 : 1;
    const xpGain = 10;
    const xp = (stats?.xp ?? 0) + xpGain;

    const { error } = await context.supabase.from("user_stats").upsert({
      user_id: context.userId,
      xp,
      level: Math.floor(xp / 500) + 1,
      streak,
      longest_streak: Math.max(streak, stats?.longest_streak ?? 0),
      last_active_date: today,
      total_study_minutes: stats?.total_study_minutes ?? 0,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, already: false, streak, xp: xpGain };
  });

/* ---------------- analytics ---------------- */

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const [statsRes, pomRes, tasksRes, subjRes, quizRes, cardRes] = await Promise.all([
      context.supabase.from("user_stats").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase
        .from("pomodoro_sessions")
        .select("duration_minutes, type, started_at, subject_id")
        .gte("started_at", `${since}T00:00:00.000Z`),
      context.supabase.from("tasks").select("id, status, completed_at, priority, subject_id"),
      context.supabase.from("subjects").select("id, name, color"),
      context.supabase.from("quizzes").select("id, title, score, total, created_at"),
      context.supabase.from("flashcards").select("id, known"),
    ]);

    const poms = (pomRes.data ?? []).filter((p) => p.type === "focus");
    const days: { day: string; label: string; minutes: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: key,
        label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        minutes: poms
          .filter((p) => (p.started_at ?? "").slice(0, 10) === key)
          .reduce((s, p) => s + (p.duration_minutes ?? 0), 0),
      });
    }

    const subjects = subjRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const bySubject = subjects.map((s) => ({
      name: s.name,
      color: s.color,
      minutes: poms
        .filter((p) => p.subject_id === s.id)
        .reduce((sum, p) => sum + (p.duration_minutes ?? 0), 0),
      tasks: tasks.filter((t) => t.subject_id === s.id).length,
    }));

    const quizzes = (quizRes.data ?? []).filter((q) => q.score !== null && q.total);
    const cards = cardRes.data ?? [];

    return {
      stats: statsRes.data,
      days,
      totalMinutes: days.reduce((s, d) => s + d.minutes, 0),
      sessions: poms.length,
      bySubject,
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((t) => t.status === "completed").length,
      quizAvg: quizzes.length
        ? Math.round(
            (quizzes.reduce((s, q) => s + (q.score ?? 0) / (q.total || 1), 0) / quizzes.length) * 100,
          )
        : null,
      quizCount: quizzes.length,
      cardsTotal: cards.length,
      cardsKnown: cards.filter((c) => c.known).length,
    };
  });