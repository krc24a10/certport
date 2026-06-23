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
        { name: "ファイル操作", certificationId: lpic1.id },
        { name: "プロセス管理", certificationId: lpic1.id },
        { name: "ネットワーク設定", certificationId: lpic1.id },
        { name: "テキスト処理", certificationId: lpic1.id },
        { name: "シェルスクリプト", certificationId: lpic1.id },
        { name: "パーミッション", certificationId: lpic1.id },
        { name: "パッケージ管理", certificationId: lpic1.id },
      ],
      skipDuplicates: true,
    });
  }

  if (lpic2) {
    await prisma.category.createMany({
      data: [
        { name: "カーネル", certificationId: lpic2.id },
        { name: "システム起動", certificationId: lpic2.id },
        { name: "ファイルシステム", certificationId: lpic2.id },
        { name: "ネットワーク応用", certificationId: lpic2.id },
        { name: "セキュリティ", certificationId: lpic2.id },
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
