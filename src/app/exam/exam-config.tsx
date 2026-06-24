"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type Cert = { id: number; name: string };

const EXAM_FILTERS: Record<string, { label: string; value: string }[]> = {
  "LPIC-1": [
    { label: "すべて", value: "" },
    { label: "101 のみ", value: "[101]" },
    { label: "102 のみ", value: "[102]" },
  ],
  "LPIC-2": [
    { label: "すべて", value: "" },
    { label: "201 のみ", value: "[201]" },
    { label: "202 のみ", value: "[202]" },
  ],
};

const COUNT_OPTIONS = [10, 20, 30, 50];
const TIME_OPTIONS = [
  { label: "なし", value: 0 },
  { label: "30 分", value: 30 },
  { label: "60 分", value: 60 },
  { label: "90 分", value: 90 },
];

export function ExamConfig({ certifications }: { certifications: Cert[] }) {
  const router = useRouter();
  const [certId, setCertId] = useState(certifications[0]?.id ?? 0);
  const [examFilter, setExamFilter] = useState("");
  const [count, setCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(0);

  const certName = certifications.find((c) => c.id === certId)?.name ?? "";
  const filterOptions = EXAM_FILTERS[certName] ?? [{ label: "すべて", value: "" }];

  const handleCertChange = (id: number) => {
    setCertId(id);
    setExamFilter("");
  };

  const start = () => {
    const params = new URLSearchParams({
      certificationId: String(certId),
      count: String(count),
      ...(examFilter ? { examFilter } : {}),
      ...(timeLimit > 0 ? { timeLimit: String(timeLimit) } : {}),
    });
    router.push(`/exam/session?${params}`);
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* 資格 */}
      <div>
        <label className="block text-sm font-medium mb-2">資格</label>
        <div className="flex flex-wrap gap-2">
          {certifications.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCertChange(c.id)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                certId === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 試験範囲 */}
      {filterOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">試験範囲</label>
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setExamFilter(opt.value)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  examFilter === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 問題数 */}
      <div>
        <label className="block text-sm font-medium mb-2">問題数</label>
        <div className="flex gap-2">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                count === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {n}問
            </button>
          ))}
        </div>
      </div>

      {/* 制限時間 */}
      <div>
        <label className="block text-sm font-medium mb-2">制限時間</label>
        <div className="flex gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeLimit(opt.value)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                timeLimit === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={start} size="lg" className="w-full">
        <Play size={16} />
        試験開始
      </Button>
    </div>
  );
}
