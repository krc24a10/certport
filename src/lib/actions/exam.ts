"use server";

import { prisma } from "@/lib/prisma";

export async function getRandomQuestions(
  certificationId: number,
  examFilter: string | null,
  count: number,
) {
  const allQuestions = await prisma.question.findMany({
    where: {
      category: {
        certificationId,
        ...(examFilter ? { name: { startsWith: examFilter } } : {}),
      },
    },
    include: { category: { select: { name: true } } },
    orderBy: { id: "asc" },
  });

  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function saveExamResult(data: {
  certificationId: number;
  totalCount: number;
  correctCount: number;
  durationSec: number;
  timeLimitSec: number | null;
  examConfig: string;
  answers: { questionId: number; selectedAnswers: number[]; isCorrect: boolean }[];
}) {
  const session = await prisma.studySession.create({
    data: {
      type: "exam",
      certificationId: data.certificationId,
      totalCount: data.totalCount,
      correctCount: data.correctCount,
      durationSec: data.durationSec,
      timeLimitSec: data.timeLimitSec,
      examConfig: data.examConfig,
    },
  });

  await prisma.studyAnswer.createMany({
    data: data.answers.map((a) => ({
      studySessionId: session.id,
      questionId: a.questionId,
      selectedAnswers: JSON.stringify(a.selectedAnswers),
      isCorrect: a.isCorrect,
    })),
  });

  return session.id;
}

export async function getProgressSessions() {
  return prisma.studySession.findMany({
    include: { certification: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProgressStats() {
  const sessions = await prisma.studySession.findMany({
    include: { certification: { select: { name: true } } },
  });

  const total = sessions.length;
  const totalQuestions = sessions.reduce((s, r) => s + r.totalCount, 0);
  const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const byCert: Record<string, { sessions: number; questions: number; correct: number }> = {};
  for (const s of sessions) {
    const name = s.certification.name;
    if (!byCert[name]) byCert[name] = { sessions: 0, questions: 0, correct: 0 };
    byCert[name].sessions++;
    byCert[name].questions += s.totalCount;
    byCert[name].correct += s.correctCount;
  }

  return { total, totalQuestions, totalCorrect, avgAccuracy, byCert };
}
