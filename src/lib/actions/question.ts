"use server";

import { prisma } from "@/lib/prisma";

export async function getQuestionCategoriesWithCount(certificationId: number) {
  return prisma.category.findMany({
    where: { certificationId },
    orderBy: { id: "asc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function getQuestionsByCategory(categoryId: number) {
  return prisma.question.findMany({
    where: { categoryId },
    orderBy: { id: "asc" },
  });
}

export async function getQuestionsByCertification(certificationId: number) {
  return prisma.question.findMany({
    where: { category: { certificationId } },
    orderBy: { id: "asc" },
    include: { category: true },
  });
}
