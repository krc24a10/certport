import { getCertifications, getCategoriesWithCount } from "@/lib/actions/flashcard";
import { FlashcardForm } from "@/components/flashcard-form";

export default async function NewFlashcardPage() {
  const certifications = await getCertifications();
  const allCategories = await Promise.all(
    certifications.map((c) => getCategoriesWithCount(c.id))
  );
  const categories = allCategories.flat();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">カード作成</h1>
      <FlashcardForm certifications={certifications} categories={categories} />
    </div>
  );
}
