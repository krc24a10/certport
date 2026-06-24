import { redirect } from "next/navigation";
import { getRandomQuestions } from "@/lib/actions/exam";
import { ExamSession } from "./exam-session";

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

export default async function ExamSessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    certificationId?: string;
    examFilter?: string;
    count?: string;
    timeLimit?: string;
  }>;
}) {
  const params = await searchParams;
  const certificationId = params.certificationId ? Number(params.certificationId) : null;
  if (!certificationId) redirect("/exam");

  const count = params.count ? Number(params.count) : 20;
  const examFilter = params.examFilter ?? null;
  const timeLimitMin = params.timeLimit ? Number(params.timeLimit) : null;

  const raw = await getRandomQuestions(certificationId, examFilter, count);

  if (raw.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">この条件の問題がありません。</p>
        <a href="/exam" className="text-primary underline">設定に戻る</a>
      </div>
    );
  }

  const questions: Question[] = raw.map((q) => ({
    id: q.id,
    body: q.body,
    choices: JSON.parse(q.choices) as Choice[],
    correctAnswers: JSON.parse(q.correctAnswers) as number[],
    isMultiple: q.isMultiple,
    explanation: q.explanation ?? null,
    categoryName: q.category.name,
  }));

  return (
    <ExamSession
      questions={questions}
      certificationId={certificationId}
      timeLimitSec={timeLimitMin ? timeLimitMin * 60 : null}
      examFilter={examFilter}
    />
  );
}
