import { getProgressSessions, getProgressStats } from "@/lib/actions/exam";
import { cn } from "@/lib/utils";

function fmt(sec: number) {
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}分${s}秒` : `${m}分`;
}

function typeLabel(type: string) {
  if (type === "exam") return "模擬試験";
  if (type === "quiz") return "クイズ";
  return type;
}

export default async function ProgressPage() {
  const [stats, sessions] = await Promise.all([
    getProgressStats(),
    getProgressSessions(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">進捗</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard label="総セッション数" value={String(stats.total)} />
        <StatCard label="総回答問題数" value={`${stats.totalQuestions}問`} />
        <StatCard label="総正解数" value={`${stats.totalCorrect}問`} />
        <StatCard
          label="平均正解率"
          value={`${stats.avgAccuracy}%`}
          highlight={stats.avgAccuracy >= 70}
        />
      </div>

      {/* 資格別サマリー */}
      {Object.keys(stats.byCert).length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">資格別</h2>
          <div className="space-y-3">
            {Object.entries(stats.byCert).map(([name, data]) => {
              const pct = data.questions > 0 ? Math.round((data.correct / data.questions) * 100) : 0;
              return (
                <div key={name} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-sm text-muted-foreground">
                      {data.sessions}回 / {data.questions}問 / {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* セッション履歴 */}
      <h2 className="text-sm font-medium text-muted-foreground mb-3">セッション履歴</h2>
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">まだ学習記録がありません。</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 pl-2 font-medium">日時</th>
              <th className="text-left py-2 font-medium">資格</th>
              <th className="text-left py-2 font-medium">種別</th>
              <th className="text-right py-2 font-medium">正解率</th>
              <th className="text-right py-2 pr-2 font-medium">所要時間</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
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
                  <td className="py-3">{typeLabel(s.type)}</td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      "font-semibold",
                      pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {pct}%
                    </span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({s.correctCount}/{s.totalCount})
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right text-muted-foreground">
                    {fmt(s.durationSec)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", highlight && "text-green-600")}>{value}</p>
    </div>
  );
}
