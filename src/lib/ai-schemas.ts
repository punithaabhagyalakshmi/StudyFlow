import { z } from "zod";

export const PlanInput = z.object({
  period: z.enum(["daily", "weekly", "monthly", "revision"]),
  subjects: z.array(z.string().max(120)).max(30).default([]),
  hoursPerDay: z.number().min(0.5).max(16).default(3),
  examDate: z.string().max(40).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
export type PlanInputType = z.infer<typeof PlanInput>;

export const PlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  days: z.array(
    z.object({
      label: z.string(),
      focus: z.string(),
      blocks: z.array(
        z.object({
          time: z.string(),
          subject: z.string(),
          activity: z.string(),
          minutes: z.number(),
        }),
      ),
    }),
  ),
  tips: z.array(z.string()),
});
export type StudyPlan = z.infer<typeof PlanSchema>;

export const FlashcardsSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});

export const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number(),
      explanation: z.string(),
    }),
  ),
});
export type GeneratedQuiz = z.infer<typeof QuizSchema>;

export function planPrompt(input: PlanInputType) {
  return [
    `Create a ${input.period} study plan.`,
    `Subjects: ${input.subjects.length ? input.subjects.join(", ") : "general academics"}.`,
    `Available study time: ${input.hoursPerDay} hours per day.`,
    input.examDate ? `Target exam / deadline: ${input.examDate}.` : "",
    input.notes ? `Extra context: ${input.notes}` : "",
    input.period === "daily"
      ? "Produce exactly 1 day."
      : input.period === "weekly"
        ? "Produce exactly 7 days labelled Monday..Sunday."
        : input.period === "monthly"
          ? "Produce 4 entries, one per week (Week 1..Week 4)."
          : "Produce a 7-step revision cycle with spaced repetition.",
    "Each day has 3-6 blocks. Include short breaks. Keep activities concrete and actionable. Add 3-5 tips.",
  ]
    .filter(Boolean)
    .join("\n");
}