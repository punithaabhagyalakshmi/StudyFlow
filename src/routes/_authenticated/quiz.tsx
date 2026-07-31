import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { HelpCircle, Sparkles, Check, X, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { generateQuizAI, listQuizzes, saveQuizScore } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — StudyFlow AI" },
      { name: "description", content: "Generate AI multiple-choice quizzes on any topic, take them instantly and track your scores." },
      { property: "og:title", content: "Quiz — StudyFlow AI" },
      { property: "og:description", content: "AI-generated MCQ practice with instant explanations." },
    ],
  }),
  component: QuizPage,
});

type Question = { question: string; options: string[]; answerIndex: number; explanation: string };

function QuizPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateQuizAI);
  const fetchQuizzes = useServerFn(listQuizzes);
  const persist = useServerFn(saveQuizScore);

  const { data: history = [] } = useQuery({ queryKey: ["quizzes"], queryFn: () => fetchQuizzes() });

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0);

  const create = useMutation({
    mutationFn: () => gen({ data: { topic: topic.trim(), count: 8, difficulty } }),
    onSuccess: (row) => {
      setQuizId(row.id);
      setQuestions((row.questions as unknown as Question[]) ?? []);
      setAnswers({});
      setSubmitted(false);
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: () => persist({ data: { id: quizId as string, score } }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success(`You scored ${score}/${questions.length}`);
      qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader icon={HelpCircle} title="Quiz" description="AI-generated practice questions with instant feedback." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold">New quiz</h3>
            <Textarea
              rows={3}
              value={topic}
              maxLength={2000}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic, chapter or pasted notes — e.g. 'Operating systems: deadlocks'"
              className="resize-none"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="bg-brand-gradient text-primary-foreground shadow-glow"
                disabled={topic.trim().length < 2 || create.isPending}
                onClick={() => create.mutate()}
              >
                <Sparkles className="mr-1 h-4 w-4" /> {create.isPending ? "Writing questions…" : "Generate quiz"}
              </Button>
            </div>
          </Card>

          {questions.length > 0 ? (
            <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Your quiz</h3>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(answers).length}/{questions.length} answered
                </span>
              </div>
              <Progress value={(Object.keys(answers).length / questions.length) * 100} className="mb-5 h-1.5" />
              <ol className="space-y-5">
                {questions.map((q, i) => (
                  <li key={i}>
                    <p className="mb-2 font-medium">{i + 1}. {q.question}</p>
                    <div className="grid gap-2">
                      {q.options.map((o, oi) => {
                        const picked = answers[i] === oi;
                        const correct = submitted && oi === q.answerIndex;
                        const wrong = submitted && picked && oi !== q.answerIndex;
                        return (
                          <button
                            key={oi}
                            disabled={submitted}
                            onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                              correct
                                ? "border-chart-2 bg-chart-2/10"
                                : wrong
                                  ? "border-destructive bg-destructive/10"
                                  : picked
                                    ? "border-brand bg-accent/60"
                                    : "border-border/60 hover:bg-sidebar-accent/60"
                            }`}
                          >
                            <span>{o}</span>
                            {correct ? <Check className="h-4 w-4 text-chart-2" /> : wrong ? <X className="h-4 w-4 text-destructive" /> : null}
                          </button>
                        );
                      })}
                    </div>
                    {submitted ? <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p> : null}
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center justify-between">
                {submitted ? (
                  <p className="text-sm font-semibold">Score: {score}/{questions.length}</p>
                ) : <span />}
                {submitted ? (
                  <Button variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Retry
                  </Button>
                ) : (
                  <Button
                    className="bg-brand-gradient text-primary-foreground"
                    disabled={Object.keys(answers).length !== questions.length || submit.isPending}
                    onClick={() => submit.mutate()}
                  >
                    Submit answers
                  </Button>
                )}
              </div>
            </Card>
          ) : null}
        </div>

        <Card className="glass h-fit rounded-2xl border-border/60 p-5 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold">Past quizzes</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((q) => (
                <li key={q.id}>
                  <button
                    onClick={() => {
                      setQuizId(q.id);
                      setQuestions((q.questions as unknown as Question[]) ?? []);
                      setAnswers({});
                      setSubmitted(false);
                    }}
                    className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm hover:bg-sidebar-accent/60"
                  >
                    <span className="block truncate font-medium">{q.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {q.difficulty} · {q.score === null ? "not taken" : `${q.score}/${q.total}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
