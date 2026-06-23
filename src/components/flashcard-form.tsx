"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} from "@/lib/actions/flashcard";

type Certification = { id: number; name: string };
type Category = { id: number; name: string; certificationId: number };
type Card = { id: number; front: string; back: string; categoryId: number };

type Props = {
  certifications: Certification[];
  categories: Category[];
  card?: Card;
};

export function FlashcardForm({ certifications, categories, card }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultCert = card
    ? categories.find((c) => c.id === card.categoryId)?.certificationId
    : certifications[0]?.id;

  const [certId, setCertId] = useState<number>(defaultCert ?? certifications[0]?.id);
  const [categoryId, setCategoryId] = useState<number>(card?.categoryId ?? 0);
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");

  const filteredCategories = categories.filter((c) => c.certificationId === certId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !front.trim() || !back.trim()) return;
    startTransition(async () => {
      if (card) {
        await updateFlashcard(card.id, { front, back, categoryId });
      } else {
        await createFlashcard({ front, back, categoryId });
      }
      router.push("/flashcards");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>資格</Label>
          <Select
            value={String(certId)}
            onValueChange={(v) => {
              setCertId(Number(v));
              setCategoryId(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="資格を選択" />
            </SelectTrigger>
            <SelectContent>
              {certifications.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>分野</Label>
          <Select
            value={categoryId ? String(categoryId) : ""}
            onValueChange={(v) => setCategoryId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="分野を選択" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>表面（用語・コマンド）</Label>
        <Input
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="例: ls -la"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>裏面（説明・解説）</Label>
        <Textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="例: ファイルとディレクトリの詳細一覧を表示する"
          rows={4}
          required
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {card && (
          <DeleteDialog cardId={card.id} />
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/flashcards")}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending || !categoryId}>
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DeleteDialog({ cardId }: { cardId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteFlashcard(cardId);
      router.push("/flashcards");
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button type="button" className={buttonVariants({ variant: "destructive" })} />
        }
      >
        削除
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カードを削除しますか？</DialogTitle>
          <DialogDescription>この操作は元に戻せません。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>キャンセル</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "削除中..." : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
