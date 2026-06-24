import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const certs = await prisma.certification.createMany({
    data: [
      { name: "LPIC-1" },
      { name: "LPIC-2" },
      { name: "応用情報技術者" },
    ],
    skipDuplicates: true,
  });

  const lpic1 = await prisma.certification.findUnique({ where: { name: "LPIC-1" } });
  const lpic2 = await prisma.certification.findUnique({ where: { name: "LPIC-2" } });
  const ap = await prisma.certification.findUnique({ where: { name: "応用情報技術者" } });

  if (lpic1) {
    await prisma.category.createMany({
      data: [
        // Exam 101
        { name: "[101] システムアーキテクチャ", certificationId: lpic1.id },
        { name: "[101] Linuxのインストールとパッケージ管理", certificationId: lpic1.id },
        { name: "[101] GNUとUnixコマンド", certificationId: lpic1.id },
        { name: "[101] デバイス・Linuxファイルシステム・FHS", certificationId: lpic1.id },
        // Exam 102
        { name: "[102] シェルとシェルスクリプト", certificationId: lpic1.id },
        { name: "[102] ユーザーインターフェースとデスクトップ", certificationId: lpic1.id },
        { name: "[102] 管理タスク", certificationId: lpic1.id },
        { name: "[102] 必須システムサービス", certificationId: lpic1.id },
        { name: "[102] ネットワークの基礎", certificationId: lpic1.id },
        { name: "[102] セキュリティ", certificationId: lpic1.id },
      ],
      skipDuplicates: true,
    });
  }

  if (lpic2) {
    await prisma.category.createMany({
      data: [
        // Exam 201
        { name: "[201] キャパシティプランニング", certificationId: lpic2.id },
        { name: "[201] Linuxカーネル", certificationId: lpic2.id },
        { name: "[201] システムの起動", certificationId: lpic2.id },
        { name: "[201] ファイルシステムとデバイス", certificationId: lpic2.id },
        { name: "[201] 高度なストレージ管理", certificationId: lpic2.id },
        { name: "[201] ネットワーク設定", certificationId: lpic2.id },
        { name: "[201] システムのメンテナンス", certificationId: lpic2.id },
        // Exam 202
        { name: "[202] ドメインネームサーバー", certificationId: lpic2.id },
        { name: "[202] HTTPサービス", certificationId: lpic2.id },
        { name: "[202] ファイル共有", certificationId: lpic2.id },
        { name: "[202] ネットワーククライアント管理", certificationId: lpic2.id },
        { name: "[202] メールサービス", certificationId: lpic2.id },
        { name: "[202] システムセキュリティ", certificationId: lpic2.id },
      ],
      skipDuplicates: true,
    });
  }

  if (ap) {
    await prisma.category.createMany({
      data: [
        { name: "テクノロジ系", certificationId: ap.id },
        { name: "マネジメント系", certificationId: ap.id },
        { name: "ストラテジ系", certificationId: ap.id },
        { name: "アルゴリズム", certificationId: ap.id },
        { name: "データベース", certificationId: ap.id },
        { name: "ネットワーク", certificationId: ap.id },
        { name: "セキュリティ", certificationId: ap.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
