import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Layers, Plus, Trash2, Sparkles, RotateCcw, Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listDecks, createDeck, deleteDeck, listCards, createCard, markCard } from "@/lib/study.functions";
import { generateFlashcardsAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — StudyFlow AI" },
      { name: "description", content: "Build decks by hand or generate AI flashcards, then review them with flip-and-rate practice." },
      { property: "og:title", content: "Flashcards — StudyFlow AI" },
      { property: "og:description", content: "AI-generated flashcard decks with active-recall review." },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const qc = useQueryClient();
  const fetchDecks = useServerFn(listDecks);
  const addDeck = useServerFn(createDeck);
  const removeDeck = useServerFn(deleteDeck);
  const fetchCards = useServerFn(listCards);
  const addCard = useServerFn(createCard);
  const rate = useServerFn(markCard);
  const genAI = useServerFn(generateFlashcardsAI);

  const { data: decks = [] } = useQuery({ queryKey: ["decks"], queryFn: () => fetchDecks() });
  const [deckId, setDeckId] = useState<string | null>(null);
  const active = decks.find((d) => d.id === deckId) ?? null;

  const { data: cards = [] } = useQuery({
    queryKey: ["cards", deckId],
    queryFn: () => fetchCards({ data: { deck_id: deckId as string } }),
    enabled: !!deckId,
  });

  const [deckName, setDeckName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [topic, setTopic] = useState("");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["decks"] });
    qc.invalidateQueries({ queryKey: ["cards", deckId] });
  };

  const newDeck = useMutation({
    mutationFn: () => addDeck({ data: { name: deckName.trim(), description: null } }),
    onSuccess: (d) => { setDeckName(""); setDeckId(d.id); invalidate(); toast.success("Deck created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const newCard = useMutation({
    mutationFn: () => addCard({ data: { deck_id: deckId as string, front: front.trim(), back: back.trim() } }),
    onSuccess: () => { setFront(""); setBack(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const ai = useMutation({
    mutationFn: () => genAI({ data: { deck_id: deckId as string, topic: topic.trim(), count: 10 } }),
    onSuccess: (r) => { setTopic(""); invalidate(); toast.success(`${r.inserted} AI cards added`); },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (v: { id: string; known: boolean }) => rate({ data: v }),
    onSuccess: () => { setFlipped(false); setIdx((i) => i + 1); invalidate(); },
  });

  const del = useMutation({
    mutationFn: (id: string) => removeDeck({ data: { id } }),
    onSuccess: () => { setDeckId(null); invalidate(); },
  });

  const card = cards[idx] ?? null;

  return (
    <div>
      <PageHeader icon={Layers} title="Flashcards" description="Active recall decks — write your own or let AI build them." />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="glass h-fit rounded-2xl border-border/60 p-4 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold">Decks</h3>
          <div className="mb-3 flex gap-2">
            <Input value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="New deck name" maxLength={120} />
            <Button size="icon" disabled={!deckName.trim() || newDeck.isPending} onClick={() => newDeck.mutate()} className="bg-brand-gradient text-primary-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {decks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No decks yet.</p>
          ) : (
            <ul className="space-y-1">
              {decks.map((d) => (
                <li key={d.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setDeckId(d.id); setIdx(0); setFlipped(false); }}
                    className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${deckId === d.id ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}
                  >
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block text-xs opacity-70">{d.knownCount}/{d.cardCount} known</span>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!active ? (
          <Card className="glass grid place-items-center rounded-2xl border-border/60 p-12 text-center text-sm text-muted-foreground shadow-soft">
            Select or create a deck to start reviewing.
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="glass rounded-2xl border-border/60 p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{active.name}</h3>
                <span className="text-xs text-muted-foreground">{cards.length} cards</span>
              </div>
              {card ? (
                <div>
                  <button
                    onClick={() => setFlipped((f) => !f)}
                    className="grid min-h-44 w-full place-items-center rounded-2xl border border-border/60 bg-card/60 p-8 text-center text-lg transition-colors hover:border-brand/50"
                  >
                    <span>{flipped ? card.back : card.front}</span>
                  </button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Card {idx + 1} of {cards.length} · tap to {flipped ? "hide" : "reveal"}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" onClick={() => review.mutate({ id: card.id, known: false })}>
                      <X className="mr-2 h-4 w-4" /> Still learning
                    </Button>
                    <Button className="bg-brand-gradient text-primary-foreground" onClick={() => review.mutate({ id: card.id, known: true })}>
                      <Check className="mr-2 h-4 w-4" /> I knew it
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center gap-3 py-10 text-center text-sm text-muted-foreground">
                  {cards.length ? "Deck complete — great work!" : "No cards yet. Add some below."}
                  {cards.length ? (
                    <Button variant="outline" onClick={() => { setIdx(0); setFlipped(false); }}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Review again
                    </Button>
                  ) : null}
                </div>
              )}
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
                <h4 className="mb-3 text-sm font-semibold">Add a card</h4>
                <div className="space-y-2">
                  <Input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front — question or term" maxLength={1000} />
                  <Textarea rows={3} value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back — answer" maxLength={2000} className="resize-none" />
                  <Button className="w-full" variant="outline" disabled={!front.trim() || !back.trim() || newCard.isPending} onClick={() => newCard.mutate()}>
                    <Plus className="mr-1 h-4 w-4" /> Add card
                  </Button>
                </div>
              </Card>
              <Card className="glass rounded-2xl border-border/60 p-5 shadow-soft">
                <h4 className="mb-3 text-sm font-semibold">Generate with AI</h4>
                <div className="space-y-2">
                  <Textarea rows={4} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic or pasted notes, e.g. 'Thermodynamics laws'" maxLength={2000} className="resize-none" />
                  <Button className="w-full bg-brand-gradient text-primary-foreground shadow-glow" disabled={topic.trim().length < 2 || ai.isPending} onClick={() => ai.mutate()}>
                    <Sparkles className="mr-1 h-4 w-4" /> {ai.isPending ? "Generating…" : "Generate 10 cards"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
