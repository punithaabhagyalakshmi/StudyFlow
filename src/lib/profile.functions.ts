import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const OnboardingSchema = z.object({
  full_name: z.string().min(1).max(120),
  avatar_url: z.string().url().max(500).optional().nullable(),
  college: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  year: z.number().int().min(1).max(10).optional().nullable(),
  semester: z.number().int().min(1).max(12).optional().nullable(),
  target_gpa: z.number().min(0).max(10).optional().nullable(),
  preferred_study_time: z.string().max(50).optional().nullable(),
  wake_time: z.string().optional().nullable(),
  sleep_time: z.string().optional().nullable(),
  daily_study_hours: z.number().min(0).max(24).optional().nullable(),
  goals: z.string().max(2000).optional().nullable(),
  subjects: z.array(z.string().max(120)).max(30).optional(),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OnboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { subjects, ...profileFields } = data;
    const { error: pErr } = await context.supabase
      .from("profiles")
      .update({ ...profileFields, onboarded: true })
      .eq("id", context.userId);
    if (pErr) throw new Error(pErr.message);
    if (subjects && subjects.length) {
      const rows = subjects
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ user_id: context.userId, name }));
      if (rows.length) {
        const { error: sErr } = await context.supabase.from("subjects").insert(rows);
        if (sErr) throw new Error(sErr.message);
      }
    }
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    OnboardingSchema.partial().parse(input),
  )
  .handler(async ({ data, context }) => {
    const { subjects: _s, ...fields } = data;
    const { error } = await context.supabase
      .from("profiles")
      .update(fields)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
