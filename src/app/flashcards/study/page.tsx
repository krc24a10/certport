import { notFound, redirect } from "next/navigation";
import {
  getFlashcardsByCategory,
  getFlashcardsByCertification,
} from "@/lib/actions/flashcard";
import { StudySession } from "./study-session";

type Props = {
  searchParams: Promise<{ categoryId?: string; certificationId?: string }>;
};

export default async function FlashcardStudyPage({ searchParams }: Props) {
  const params = await searchParams;
  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const certificationId = params.certificationId
    ? Number(params.certificationId)
    : undefined;

  if (!categoryId && !certificationId) redirect("/flashcards");

  const cards = categoryId
    ? await getFlashcardsByCategory(categoryId)
    : await getFlashcardsByCertification(certificationId!);

  if (cards.length === 0) notFound();

  return <StudySession cards={cards} />;
}
