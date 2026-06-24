import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getProgressStats, getProgressSessions } from "@/lib/actions/exam";
import { cn } from "@/lib/utils";

function typeLabel(type: string) {
  if (type === "exam") return "模擬試験";
  if (type === "quiz") return "クイズ";
  return type;
}

export default async function DashboardPage() {
  const [stats, sessions] = await Promise.all([
    getProgressStats(),
    getProgressSessions(),
  ]);
  const recent = sessions.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* クイックアクション */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/flashcards" className={cn(buttonVariants({ variant: "outline" }), "h-16 flex-col gap-1")}>
          <span className="text-base">フラッシュカード</span>
          <span className="text-xs text-muted-foreground">カードで暗記</span>
        </Link>
        <Link href="/quiz" className={cn(buttonVariants({ variant: "outline" }), "h-16 flex-col gap-1")}>
          <span className="text-base">問題集</span>
          <span className="text-xs text-muted-foreground">1問ずつ学習</span>
        </Link>
        <Link href="/exam" className={cn(buttonVariants(), "h-16 flex-col gap-1")}>
          <span className="text-base">模擬試験</span>
          <span className="text-xs opacity-80">まとめて採点</span>
        </Link>
      </div>

      {/* 統計 */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">総セッション数</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">総回答数</p>
            <p className="text-2xl font-bold">{stats.totalQuestions}問</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">総正解数</p>
            <p className="text-2xl font-bold">{stats.totalCorrect}問</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">平均正解率</p>
            <p className={cn(
              "text-2xl font-bold",
              stats.avgAccuracy >= 70 ? "text-green-600" : "text-red-500"
            )}>
              {stats.avgAccuracy}%
            </p>
          </div>
        </div>
      )}

      {/* 最近の学習 */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">最近の学習</h2>
            <Link href="/progress" className="text-xs text-primary hover:underline">すべて見る</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recent.map((s) => {
                const pct = s.totalCount > 0 ? Math.round((s.correctCount / s.totalCount) * 100) : 0;
                return (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 pl-2 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3">{s.certification.name}</td>
                    <td className="py-3 text-muted-foreground">{typeLabel(s.type)}</td>
                    <td className="py-3 text-right pr-2">
                      <span className={cn(
                        "font-semibold",
                        pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {pct}%
                      </span>
                      <span className="text-muted-foreground ml-1 text-xs">({s.correctCount}/{s.totalCount})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {stats.total === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="mb-2">まだ学習記録がありません。</p>
          <p className="text-sm">フラッシュカードや問題集で学習を始めましょう。</p>
        </div>
      )}
    </div>
  );
}
