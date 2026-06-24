import { getCertifications } from "@/lib/actions/flashcard";
import { ExamConfig } from "./exam-config";

export default async function ExamPage() {
  const certifications = await getCertifications();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">模擬試験</h1>
      <p className="text-sm text-muted-foreground mb-8">
        全問回答してから採点します。回答中は正誤が表示されません。
      </p>
      <ExamConfig certifications={certifications} />
    </div>
  );
}
