"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Choice = { index: number; text: string };
type Question = {
  id: number;
  body: string;
  choices: Choice[];
  correctAnswers: number[];
  isMultiple: boolean;
  explanation: string | null;
};

export function QuizSession({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex];
  const isCorrect =
    submitted &&
    selected.length === current.correctAnswers.length &&
    selected.every((s) => current.correctAnswers.includes(s));

  const toggleSelect = useCallback(
    (index: number) => {
      if (submitted) return;
      if (current.isMultiple) {
        setSelected((prev) =>
          prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
      } else {
        setSelected([index]);
      }
    },
    [submitted, current.isMultiple]
  );

  const submit = useCallback(() => {
    if (selected.length === 0) return;
    const correct =
      selected.length === current.correctAnswers.length &&
      selected.every((s) => current.correctAnswers.includes(s));
    setResults((r) => [...r, correct]);
    setSubmitted(true);
  }, [selected, current.correctAnswers]);

  const next = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected([]);
      setSubmitted(false);
    }
  }, [currentIndex, questions.length]);

  if (finished) {
    const correct = results.filter(Boolean).length;
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-5xl font-bold mb-2">{pct}%</p>
          <p className="text-muted-foreground">
            {total}問中 {correct}問 正解
          </p>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full transition-all",
              pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setSelected([]);
              setSubmitted(false);
              setResults([]);
              setFinished(false);
            }}
          >
            もう一度
          </Button>
          <Button onClick={() => router.push("/quiz")}>一覧へ戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => router.push("/quiz")}>
          <X size={16} />
          終了
        </Button>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-muted rounded-full h-1.5 mb-8">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>

      {/* 問題文 */}
      <div className="rounded-xl border bg-card p-6 mb-4">
        {current.isMultiple && (
          <p className="text-xs text-muted-foreground mb-2">複数選択</p>
        )}
        <p className="text-base font-medium leading-relaxed">{current.body}</p>
      </div>

      {/* 選択肢 */}
      <div className="flex flex-col gap-3 mb-6">
        {current.choices.map((choice) => {
          const isSelected = selected.includes(choice.index);
          const isCorrectChoice = current.correctAnswers.includes(choice.index);

          let variant: "default" | "outline" = "outline";
          let extraClass = "";

          if (submitted) {
            if (isCorrectChoice) {
              extraClass = "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100";
            } else if (isSelected && !isCorrectChoice) {
              extraClass = "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100";
            }
          } else if (isSelected) {
            variant = "default";
          }

          return (
            <button
              key={choice.index}
              onClick={() => toggleSelect(choice.index)}
              disabled={submitted}
              className={cn(
                "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                !submitted && "hover:bg-muted/50 cursor-pointer",
                submitted && "cursor-default",
                isSelected && !submitted && "border-primary bg-primary text-primary-foreground",
                extraClass
              )}
            >
              <span className="font-mono mr-3 text-muted-foreground">
                {String.fromCharCode(65 + choice.index)}.
              </span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {/* 結果・解説 */}
      {submitted && (
        <div
          className={cn(
            "rounded-xl border p-4 mb-6",
            isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle size={18} className="text-green-600" />
            ) : (
              <XCircle size={18} className="text-red-600" />
            )}
            <span className={cn("font-semibold text-sm", isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
              {isCorrect ? "正解！" : "不正解"}
            </span>
          </div>
          {!isCorrect && (
            <p className="text-sm text-muted-foreground mb-2">
              正解:{" "}
              {current.correctAnswers
                .map((i) => String.fromCharCode(65 + i))
                .join(", ")}
            </p>
          )}
          {current.explanation && (
            <p className="text-sm leading-relaxed">{current.explanation}</p>
          )}
        </div>
      )}

      {/* ボタン */}
      <div className="flex justify-end">
        {!submitted ? (
          <Button onClick={submit} disabled={selected.length === 0} className="w-32">
            回答する
          </Button>
        ) : (
          <Button onClick={next} className="w-32">
            {currentIndex + 1 >= questions.length ? "結果を見る" : "次の問題"}
          </Button>
        )}
      </div>
    </div>
  );
}
