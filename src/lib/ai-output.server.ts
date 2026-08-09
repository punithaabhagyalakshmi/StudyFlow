import { FlashcardsSchema, PlanSchema, QuizSchema } from "@/lib/ai-schemas";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const objectStart = cleaned.indexOf("{");
    const arrayStart = cleaned.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0);
    if (starts.length === 0) throw new Error("The AI returned an incomplete response. Please try again.");
    const start = Math.min(...starts);
    const end = cleaned[start] === "{" ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
    if (end <= start) throw new Error("The AI returned an incomplete response. Please try again.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseStudyPlan(text: string) {
  const raw = readJson(text);
  const direct = PlanSchema.safeParse(raw);
  if (direct.success) return direct.data;
  if (!isRecord(raw)) throw new Error("The AI returned an invalid study plan. Please try again.");

  const overview = isRecord(raw.plan_overview) ? raw.plan_overview : {};
  const schedule = Array.isArray(raw.daily_schedule)
    ? raw.daily_schedule
    : Array.isArray(raw.schedule)
      ? raw.schedule
      : [];
  const days = schedule.map((entry, dayIndex) => {
    const day = isRecord(entry) ? entry : {};
    const rawBlocks = Array.isArray(day.blocks) ? day.blocks : [];
    const blocks = rawBlocks.map((entryBlock) => {
      const block = isRecord(entryBlock) ? entryBlock : {};
      return {
        time: textValue(block.time, textValue(block.time_slot, "Flexible")),
        subject: textValue(block.subject, "General study"),
        activity: textValue(block.activity, textValue(block.task, "Focused study")),
        minutes: Math.max(5, Math.round(numberValue(block.minutes, numberValue(block.duration_minutes, 30)))),
      };
    });
    return {
      label: textValue(day.label, textValue(day.day, `Day ${dayIndex + 1}`)),
      focus: textValue(day.focus, blocks[0]?.subject ?? "Focused study"),
      blocks,
    };
  });

  return PlanSchema.parse({
    title: textValue(raw.title, "Your study plan"),
    summary: textValue(raw.summary, textValue(overview.summary, "A focused plan balanced around your priorities.")),
    days,
    tips: Array.isArray(raw.tips)
      ? raw.tips.map((tip) => textValue(tip)).filter(Boolean)
      : Array.isArray(raw.study_tips)
        ? raw.study_tips.map((tip) => textValue(tip)).filter(Boolean)
        : [],
  });
}

export function parseQuiz(text: string) {
  const raw = readJson(text);
  const questions = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.questions) ? raw.questions : [];
  return QuizSchema.parse({ questions });
}

export function parseFlashcards(text: string) {
  const raw = readJson(text);
  const cards = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.cards) ? raw.cards : [];
  return FlashcardsSchema.parse({ cards });
}

export const STUDY_PLAN_JSON_INSTRUCTIONS = `Return only valid JSON with exactly this shape:
{"title":"string","summary":"string","days":[{"label":"string","focus":"string","blocks":[{"time":"string","subject":"string","activity":"string","minutes":30}]}],"tips":["string"]}
Do not rename keys, add markdown fences, or add text outside the JSON.`;

export const QUIZ_JSON_INSTRUCTIONS = `Return only valid JSON with exactly this shape:
{"questions":[{"question":"string","options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}]}
Do not return a top-level array. Do not add markdown fences or text outside the JSON.`;

export const FLASHCARDS_JSON_INSTRUCTIONS = `Return only valid JSON with exactly this shape:
{"cards":[{"front":"string","back":"string"}]}
Do not return a top-level array. Do not add markdown fences or text outside the JSON.`;