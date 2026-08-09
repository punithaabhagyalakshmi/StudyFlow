import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  PlanInput,
  planPrompt,
} from "@/lib/ai-schemas";

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PlanInput.parse(i))
  .handler(async ({ data, context }) => {
    const { generateText } = await import("ai");
    const { getGatewayModel } = await import("@/lib/ai-gateway.server");
    const { parseStudyPlan, STUDY_PLAN_JSON_INSTRUCTIONS } = await import("@/lib/ai-output.server");
    try {
      const { text } = await generateText({
        model: getGatewayModel(),
        system:
          "You are StudyFlow AI, an expert academic coach. You design realistic, motivating study schedules for students. Follow the requested JSON contract exactly.",
        prompt: `${planPrompt(data)}\n\n${STUDY_PLAN_JSON_INSTRUCTIONS}`,
      });
      const output = parseStudyPlan(text);
      const { data: row, error } = await context.supabase
        .from("study_plans")
        .insert({
          user_id: context.userId,
          period: data.period,
          title: output.title,
          plan: output,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    } catch (e) {
      if (e instanceof z.ZodError || e instanceof SyntaxError)
        throw new Error("The AI returned an incomplete study plan. Please try once more.");
      throw e;
    }
  });

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("study_plans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(8000),
            }),
          )
          .min(1)
          .max(40),
        mode: z.enum(["explain", "summarize", "notes", "solve"]).default("explain"),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { generateText } = await import("ai");
    const { getGatewayModel } = await import("@/lib/ai-gateway.server");
    const styles: Record<string, string> = {
      explain: "Explain concepts step by step with simple analogies and a short recap.",
      summarize: "Summarize the material into tight, well-structured bullet points.",
      notes: "Produce clean revision notes with headings, key formulas and a quick-recall list.",
      solve: "Solve the problem showing every step, then state the final answer clearly.",
    };
    const { text } = await generateText({
      model: getGatewayModel(),
      system: `You are StudyFlow AI Tutor for college students. ${styles[data.mode]} Always answer in markdown.`,
      messages: data.messages,
    });
    return { text };
  });

export const generateFlashcardsAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        deck_id: z.string().uuid(),
        topic: z.string().min(2).max(2000),
        count: z.number().int().min(3).max(20).default(10),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { generateText } = await import("ai");
    const { getGatewayModel } = await import("@/lib/ai-gateway.server");
    const { parseFlashcards, FLASHCARDS_JSON_INSTRUCTIONS } = await import("@/lib/ai-output.server");
    try {
      const { text } = await generateText({
        model: getGatewayModel(),
        system: "You create concise, high-quality study flashcards and follow the requested JSON contract exactly.",
        prompt: `Create ${data.count} flashcards about: ${data.topic}. Fronts are short questions or terms; backs are precise answers under 40 words.\n\n${FLASHCARDS_JSON_INSTRUCTIONS}`,
      });
      const output = parseFlashcards(text);
      const rows = output.cards.slice(0, data.count).map((c) => ({
        user_id: context.userId,
        deck_id: data.deck_id,
        front: c.front,
        back: c.back,
      }));
      const { error } = await context.supabase.from("flashcards").insert(rows);
      if (error) throw new Error(error.message);
      return { inserted: rows.length };
    } catch (e) {
      if (e instanceof z.ZodError || e instanceof SyntaxError)
        throw new Error("The AI could not build these flashcards. Try again with a clearer topic.");
      throw e;
    }
  });

export const generateQuizAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        topic: z.string().min(2).max(2000),
        count: z.number().int().min(3).max(20).default(8),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { generateText } = await import("ai");
    const { getGatewayModel } = await import("@/lib/ai-gateway.server");
    const { parseQuiz, QUIZ_JSON_INSTRUCTIONS } = await import("@/lib/ai-output.server");
    try {
      const { text } = await generateText({
        model: getGatewayModel(),
        system: "You are an exam setter creating multiple choice questions for college students. Follow the requested JSON contract exactly.",
        prompt: `Write ${data.count} ${data.difficulty} multiple-choice questions about: ${data.topic}. Each has exactly 4 options, one correct answerIndex (0-3) and a one-sentence explanation.\n\n${QUIZ_JSON_INSTRUCTIONS}`,
      });
      const output = parseQuiz(text);
      const questions = output.questions.filter(
        (q) => q.options.length === 4 && q.answerIndex >= 0 && q.answerIndex < q.options.length,
      );
      if (questions.length === 0) throw new Error("No valid questions were generated. Please try again.");
      const { data: row, error } = await context.supabase
        .from("quizzes")
        .insert({
          user_id: context.userId,
          title: data.topic.slice(0, 120),
          difficulty: data.difficulty,
          questions,
          total: questions.length,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    } catch (e) {
      if (e instanceof z.ZodError || e instanceof SyntaxError)
        throw new Error("The AI could not build this quiz. Try again with a clearer topic.");
      throw e;
    }
  });

export const saveQuizScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), score: z.number().int().min(0) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("quizzes")
      .update({ score: data.score })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });