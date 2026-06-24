import { redirect } from "next/navigation";
import { getQuestionsByCategory, getQuestionsByCertification } from "@/lib/actions/question";
import { QuizSession } from "./quiz-session";

type Choice = { index: number; text: string };

type Question = {
  id: number;
  body: string;
  choices: Choice[];
  correctAnswers: number[];
  isMultiple: boolean;
  explanation: string | null;
};

export default async function QuizStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; certificationId?: string }>;
}) {
  const params = await searchParams;
  const categoryId = params.categoryId ? Number(params.categoryId) : null;
  const certificationId = params.certificationId ? Number(params.certificationId) : null;

  if (!categoryId && !certificationId) redirect("/quiz");

  const raw = categoryId
    ? await getQuestionsByCategory(categoryId)
    : await getQuestionsByCertification(certificationId!);

  const questions: Question[] = raw.map((q) => ({
    id: q.id,
    body: q.body,
    choices: JSON.parse(q.choices) as Choice[],
    correctAnswers: JSON.parse(q.correctAnswers) as number[],
    isMultiple: q.isMultiple,
    explanation: q.explanation ?? null,
  }));

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-muted-foreground">この分野の問題がありません。</p>
      </div>
    );
  }

  return <QuizSession questions={questions} />;
}
