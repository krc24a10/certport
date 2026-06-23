"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Check } from "lucide-react";

type Card = { id: number; front: string; back: string };

export function StudySession({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [deck, setDeck] = useState<Card[]>([...cards]);
  const [done, setDone] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = deck[0];
  const progress = cards.length - deck.length;

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const markAgain = useCallback(() => {
    if (!current) return;
    setDeck((d) => [...d.slice(1), d[0]]);
    setFlipped(false);
  }, [current]);

  const markDone = useCallback(() => {
    if (!current) return;
    const next = deck.slice(1);
    setDone((d) => [...d, current]);
    setDeck(next);
    setFlipped(false);
    if (next.length === 0) setFinished(true);
  }, [current, deck]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); flip(); }
      if (e.key === "ArrowRight") markDone();
      if (e.key === "ArrowLeft") markAgain();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flip, markDone, markAgain]);

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <p className="text-4xl mb-2">🎉</p>
          <h2 className="text-2xl font-bold mb-2">セッション完了！</h2>
          <p className="text-muted-foreground">{done.length}枚すべて覚えました</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setDeck([...cards]);
            setDone([]);
            setFlipped(false);
            setFinished(false);
          }}>
            もう一度
          </Button>
          <Button onClick={() => router.push("/flashcards")}>一覧へ戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {progress} / {cards.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => router.push("/flashcards")}>
          <X size={16} />
          終了
        </Button>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5 mb-8">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(progress / cards.length) * 100}%` }}
        />
      </div>

      {/* カード */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: "1000px", minHeight: "280px" }}
        onClick={flip}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "280px",
          }}
        >
          {/* 表面 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs text-muted-foreground mb-4">表面</p>
            <p className="text-2xl font-mono font-semibold">{current?.front}</p>
            <p className="text-xs text-muted-foreground mt-6">
              スペースキーまたはクリックで裏返す
            </p>
          </div>
          {/* 裏面 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xs text-muted-foreground mb-4">裏面</p>
            <p className="text-lg whitespace-pre-wrap">{current?.back}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <Button
          variant="outline"
          size="lg"
          className="w-36"
          onClick={markAgain}
        >
          <RotateCcw size={16} />
          もう一度
        </Button>
        <Button
          size="lg"
          className="w-36"
          onClick={markDone}
        >
          <Check size={16} />
          覚えた
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        ← もう一度 　 → 覚えた
      </p>
    </div>
  );
}
