import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().datetime().optional().nullable(),
  category: z.string().max(60).optional().nullable(),
});

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase.from("tasks").insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ status: data.completed ? "completed" : "pending", completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });