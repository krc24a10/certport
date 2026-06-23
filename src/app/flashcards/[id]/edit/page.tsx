import { notFound } from "next/navigation";
import {
  getCertifications,
  getCategoriesWithCount,
  getFlashcardById,
} from "@/lib/actions/flashcard";
import { FlashcardForm } from "@/components/flashcard-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditFlashcardPage({ params }: Props) {
  const { id } = await params;
  const [card, certifications] = await Promise.all([
    getFlashcardById(Number(id)),
    getCertifications(),
  ]);
  if (!card) notFound();

  const allCategories = await Promise.all(
    certifications.map((c) => getCategoriesWithCount(c.id))
  );
  const categories = allCategories.flat();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">カード編集</h1>
      <FlashcardForm
        certifications={certifications}
        categories={categories}
        card={card}
      />
    </div>
  );
}
