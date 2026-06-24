"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveExamResult } from "@/lib/actions/exam";

type Choice = { index: number; text: string };
type Question = {
  id: number;
  body: string;
  choices: Choice[];
  correctAnswers: number[];
  isMultiple: boolean;
  explanation: string | null;
  categoryName: string;
};

type AnswerMap = Record<number, number[]>; // questionIndex → selected indices

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ExamSession({
  questions,
  certificationId,
  timeLimitSec,
  examFilter,
}: {
  questions: Question[];
  certificationId: number;
  timeLimitSec: number | null;
  examFilter: string | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; correctAnswers: number[] }[]>([]);
  const [saving, setSaving] = useState(false);
  const startTime = useRef(Date.now());

  // タイマー
  useEffect(() => {
    if (timeLimitSec === null || submitted) return;
    if (timeLeft === 0) {
      handleSubmit();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  const toggleAnswer = useCallback(
    (qIndex: number, choiceIndex: number) => {
      if (submitted) return;
      const q = questions[qIndex];
      setAnswers((prev) => {
        const current = prev[qIndex] ?? [];
        if (q.isMultiple) {
          const next = current.includes(choiceIndex)
            ? current.filter((i) => i !== choiceIndex)
            : [...current, choiceIndex];
          return { ...prev, [qIndex]: next };
        } else {
          return { ...prev, [qIndex]: [choiceIndex] };
        }
      });
    },
    [submitted, questions],
  );

  const handleSubmit = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    const durationSec = Math.round((Date.now() - startTime.current) / 1000);
    const computed = questions.map((q, i) => {
      const sel = answers[i] ?? [];
      const correct =
        sel.length === q.correctAnswers.length &&
        sel.every((s) => q.correctAnswers.includes(s));
      return { correct, correctAnswers: q.correctAnswers };
    });
    setResults(computed);
    setSubmitted(true);

    const correctCount = computed.filter((r) => r.correct).length;
    await saveExamResult({
      certificationId,
      totalCount: questions.length,
      correctCount,
      durationSec,
      timeLimitSec,
      examConfig: JSON.stringify({ examFilter, count: questions.length }),
      answers: questions.map((q, i) => ({
        questionId: q.id,
        selectedAnswers: answers[i] ?? [],
        isCorrect: computed[i].correct,
      })),
    });

    setSaving(false);
    setCurrent(0);
  }, [saving, questions, answers, certificationId, timeLimitSec, examFilter]);

  const answeredCount = Object.keys(answers).length;
  const q = questions[current];

  // ── 結果画面 ──────────────────────────────────────────────────
  if (submitted) {
    const correct = results.filter((r) => r.correct).length;
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        {/* スコア */}
        <div className="text-center py-8 border-b mb-6">
          <p className={cn("text-6xl font-bold mb-1", pct >= 70 ? "text-green-500" : "text-red-500")}>
            {pct}%
          </p>
          <p className="text-muted-foreground">{total}問中 {correct}問 正解</p>
        </div>

        {/* 問題ごとの結果 */}
        <div className="space-y-4 mb-8">
          {questions.map((question, i) => {
            const res = results[i];
            const selected = answers[i] ?? [];
            return (
              <div
                key={question.id}
                className={cn(
                  "rounded-lg border p-4",
                  res.correct ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                )}
              >
                <div className="flex items-start gap-2 mb-3">
                  {res.correct
                    ? <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                    : <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" />}
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground mr-2">問{i + 1}</span>
                    <span className="text-sm font-medium">{question.body}</span>
                  </div>
                </div>
                <div className="space-y-1 ml-6">
                  {question.choices.map((c) => {
                    const isSelected = selected.includes(c.index);
                    const isCorrect = question.correctAnswers.includes(c.index);
                    return (
                      <p
                        key={c.index}
                        className={cn(
                          "text-sm rounded px-2 py-1",
                          isCorrect && "font-medium text-green-700 dark:text-green-300",
                          isSelected && !isCorrect && "line-through text-red-600 dark:text-red-400",
                        )}
                      >
                        <span className="font-mono mr-2 text-muted-foreground">
                          {String.fromCharCode(65 + c.index)}.
                        </span>
                        {c.text}
                        {isCorrect && <span className="ml-2 text-xs">✓</span>}
                      </p>
                    );
                  })}
                </div>
                {question.explanation && (
                  <p className="mt-3 ml-6 text-xs text-muted-foreground leading-relaxed">
                    {question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center pb-8">
          <Button variant="outline" onClick={() => router.push("/exam")}>もう一度設定する</Button>
          <Button onClick={() => router.push("/progress")}>進捗を見る</Button>
        </div>
      </div>
    );
  }

  // ── 試験画面 ──────────────────────────────────────────────────
  const selected = answers[current] ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {questions.length} 問 回答済み
        </span>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <span className={cn(
              "flex items-center gap-1 text-sm font-mono font-semibold",
              timeLeft < 300 ? "text-red-500" : "text-muted-foreground"
            )}>
              <Clock size={14} />
              {fmt(timeLeft)}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "保存中..." : "提出する"}
          </Button>
        </div>
      </div>

      {/* 問題番号ドット */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "w-7 h-7 rounded text-xs font-medium transition-colors",
              i === current && "ring-2 ring-primary ring-offset-1",
              answers[i] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* 問題 */}
      <div className="rounded-xl border bg-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground">
            問{current + 1}
          </span>
          <span className="text-xs text-muted-foreground">{q.categoryName}</span>
          {q.isMultiple && (
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 dark:bg-yellow-900 dark:text-yellow-300">
              複数選択
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-relaxed">{q.body}</p>
      </div>

      {/* 選択肢 */}
      <div className="flex flex-col gap-2 mb-6">
        {q.choices.map((choice) => {
          const isSel = selected.includes(choice.index);
          return (
            <button
              key={choice.index}
              onClick={() => toggleAnswer(current, choice.index)}
              className={cn(
                "w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors",
                isSel
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted/50"
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

      {/* ナビゲーション */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
          disabled={current === 0}
        >
          <ChevronLeft size={16} />
          前の問題
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
          disabled={current === questions.length - 1}
        >
          次の問題
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
