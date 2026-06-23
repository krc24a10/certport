"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCertifications() {
  return prisma.certification.findMany({ orderBy: { id: "asc" } });
}

export async function getCategoriesWithCount(certificationId: number) {
  const categories = await prisma.category.findMany({
    where: { certificationId },
    orderBy: { id: "asc" },
    include: { _count: { select: { flashcards: true } } },
  });
  return categories;
}

export async function getFlashcardsByCategory(categoryId: number) {
  return prisma.flashcard.findMany({
    where: { categoryId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFlashcardsByCertification(certificationId: number) {
  return prisma.flashcard.findMany({
    where: { category: { certificationId } },
    orderBy: { createdAt: "asc" },
    include: { category: true },
  });
}

export async function getFlashcardById(id: number) {
  return prisma.flashcard.findUnique({
    where: { id },
    include: { category: { include: { certification: true } } },
  });
}

export async function createFlashcard(data: {
  front: string;
  back: string;
  categoryId: number;
}) {
  await prisma.flashcard.create({ data });
  revalidatePath("/flashcards");
}

export async function updateFlashcard(
  id: number,
  data: { front: string; back: string; categoryId: number }
) {
  await prisma.flashcard.update({ where: { id }, data });
  revalidatePath("/flashcards");
}

export async function deleteFlashcard(id: number) {
  await prisma.flashcard.delete({ where: { id } });
  revalidatePath("/flashcards");
}
