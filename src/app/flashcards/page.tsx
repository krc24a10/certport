import Link from "next/link";
import { getCertifications, getCategoriesWithCount } from "@/lib/actions/flashcard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function FlashcardsPage() {
  const certifications = await getCertifications();
  const defaultCertId = certifications[0]?.id;

  if (certifications.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">フラッシュカード</h1>
        <p className="text-muted-foreground">資格データがありません。DBのセットアップを確認してください。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">フラッシュカード</h1>
        <Link href="/flashcards/new" className={buttonVariants()}>
          <Plus size={16} />
          新規作成
        </Link>
      </div>

      <Tabs defaultValue={String(defaultCertId)}>
        <TabsList>
          {certifications.map((cert) => (
            <TabsTrigger key={cert.id} value={String(cert.id)}>
              {cert.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {certifications.map((cert) => (
          <TabsContent key={cert.id} value={String(cert.id)}>
            <CertificationTab certificationId={cert.id} certificationName={cert.name} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

async function CertificationTab({
  certificationId,
  certificationName,
}: {
  certificationId: number;
  certificationName: string;
}) {
  const categories = await getCategoriesWithCount(certificationId);
  const totalCards = categories.reduce((sum, c) => sum + c._count.flashcards, 0);

  return (
    <div className="mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pl-2 font-medium">分野</th>
            <th className="text-right py-2 font-medium">枚数</th>
            <th className="text-right py-2 pr-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="py-3 pl-2">{cat.name}</td>
              <td className="py-3 text-right text-muted-foreground">
                {cat._count.flashcards}枚
              </td>
              <td className="py-3 pr-2 text-right">
                {cat._count.flashcards > 0 ? (
                  <Link
                    href={`/flashcards/study?categoryId=${cat.id}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    学習
                  </Link>
                ) : (
                  <Button size="sm" disabled>学習</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        {totalCards > 0 ? (
          <Link
            href={`/flashcards/study?certificationId=${certificationId}`}
            className={buttonVariants({ variant: "outline" })}
          >
            {certificationName} 全分野まとめて学習（{totalCards}枚）
          </Link>
        ) : (
          <Button variant="outline" disabled>
            {certificationName} 全分野まとめて学習（0枚）
          </Button>
        )}
      </div>
    </div>
  );
}
