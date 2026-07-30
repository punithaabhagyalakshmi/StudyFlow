import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Bot, Loader2, Send, User2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askTutor } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — StudyFlow AI" },
      { name: "description", content: "Ask anything: explanations, summaries, revision notes and step-by-step solutions." },
      { property: "og:title", content: "AI Tutor — StudyFlow AI" },
      { property: "og:description", content: "Explanations, summaries and step-by-step solutions on demand." },
    ],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const MODES = [
  { id: "explain", label: "Explain" },
  { id: "summarize", label: "Summarize" },
  { id: "notes", label: "Revision notes" },
  { id: "solve", label: "Solve" },
] as const;

function TutorPage() {
  const ask = useServerFn(askTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("explain");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (next: Msg[]) => ask({ data: { messages: next, mode } }),
    onSuccess: (res) => setMessages((cur) => [...cur, { role: "assistant", content: res.text }]),
    onError: (e: Error) => toast.error(e.message || "The tutor is unavailable right now"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || send.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    send.mutate(next);
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader icon={Bot} title="AI Tutor" description="Your always-available study companion." />

      <div className="mb-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${mode === m.id ? "border-transparent bg-brand-gradient text-primary-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card className="glass flex min-h-0 flex-1 flex-col rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="min-h-[40vh] flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center py-16 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient shadow-glow">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask about any topic — "Explain Bayes' theorem" or paste a chapter to summarize.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" ? (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-gradient/20 text-brand-2">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-brand-gradient text-primary-foreground" : "bg-muted/40"}`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-background/60">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.role === "user" ? (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <User2 className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
            ))
          )}
          {send.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t border-border/60 pt-3">
          <Textarea
            rows={1}
            value={input}
            maxLength={8000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) submit(e);
            }}
            placeholder="Ask your tutor anything…"
            className="max-h-40 min-h-[44px] resize-none"
          />
          <Button type="submit" disabled={send.isPending || !input.trim()} className="bg-brand-gradient text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
