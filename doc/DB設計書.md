# DB設計書

## ER図

```
Certification ──< Category ──< Flashcard
                      │
                      └────< Question
                                 │
                                 └──< StudyAnswer >── StudySession >── Certification
```

---

## テーブル定義

### Certification（資格）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| name | String | NOT NULL, UNIQUE | 例: "LPIC-1", "LPIC-2", "応用情報" |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |

**初期データ**
- LPIC-1
- LPIC-2
- 応用情報技術者

---

### Category（分野）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| name | String | NOT NULL | 例: "ファイル操作", "プロセス管理" |
| certificationId | Int | NOT NULL, FK → Certification.id | |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |

**制約**
- (name, certificationId) の組み合わせで UNIQUE

---

### Flashcard（フラッシュカード）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| front | String | NOT NULL | 表面（用語・コマンド） |
| back | String | NOT NULL | 裏面（説明・解説） |
| categoryId | Int | NOT NULL, FK → Category.id | |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |
| updatedAt | DateTime | NOT NULL | |

---

### Question（問題）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| body | String | NOT NULL | 問題文 |
| choices | Json | NOT NULL | 選択肢の配列（後述） |
| correctAnswers | Json | NOT NULL | 正解のインデックス配列 |
| isMultiple | Boolean | NOT NULL, DEFAULT false | 複数選択問題かどうか |
| explanation | String | NULLABLE | 解説 |
| categoryId | Int | NOT NULL, FK → Category.id | |
| tags | String | NULLABLE | カンマ区切りタグ 例: "コマンド,頻出" |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |
| updatedAt | DateTime | NOT NULL | |

**choices のJSON構造**
```json
[
  { "index": 0, "text": "-l でファイルサイズのみ表示する" },
  { "index": 1, "text": "-l でファイルの詳細情報を一覧表示する" },
  { "index": 2, "text": "-a でファイルを昇順に並べる" },
  { "index": 3, "text": "-r でサブディレクトリを再帰的に削除する" }
]
```

**correctAnswers のJSON構造**
```json
[1]          // 単一正解の場合
[0, 2]       // 複数正解の場合（isMultiple: true）
```

---

### StudySession（学習セッション）

問題集クイズ・模擬試験のセッションを統一して管理する。

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| type | Enum | NOT NULL | `QUIZ` or `EXAM` |
| certificationId | Int | NOT NULL, FK → Certification.id | |
| totalCount | Int | NOT NULL | 出題数 |
| correctCount | Int | NOT NULL | 正解数 |
| durationSec | Int | NOT NULL | 所要時間（秒） |
| timeLimitSec | Int | NULLABLE | 制限時間（秒）。EXAMのみ設定 |
| examConfig | Json | NULLABLE | 試験設定（分野別出題数）。EXAMのみ |
| createdAt | DateTime | NOT NULL, DEFAULT now() | 学習日時 |

**examConfig のJSON構造（EXAMのみ）**
```json
[
  { "categoryId": 1, "count": 5 },
  { "categoryId": 2, "count": 5 },
  { "categoryId": 3, "count": 10 }
]
```

---

### StudyAnswer（解答記録）

セッション内の各問題の解答を記録する。進捗管理・正答率集計に使用。

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | Int | PK, AUTO_INCREMENT | |
| studySessionId | Int | NOT NULL, FK → StudySession.id | |
| questionId | Int | NOT NULL, FK → Question.id | |
| selectedAnswers | Json | NOT NULL | ユーザーが選択した答えのインデックス配列 |
| isCorrect | Boolean | NOT NULL | 正解かどうか |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |

---

## リレーション一覧

| テーブル | カラム | 参照先 | ON DELETE |
|---|---|---|---|
| Category | certificationId | Certification.id | RESTRICT |
| Flashcard | categoryId | Category.id | RESTRICT |
| Question | categoryId | Category.id | RESTRICT |
| StudySession | certificationId | Certification.id | RESTRICT |
| StudyAnswer | studySessionId | StudySession.id | CASCADE |
| StudyAnswer | questionId | Question.id | RESTRICT |

---

## 主要クエリ例

### 分野別の正答率（進捗管理用）
```sql
SELECT
  c.name AS category,
  COUNT(*) AS total,
  SUM(CASE WHEN sa.isCorrect THEN 1 ELSE 0 END) AS correct
FROM StudyAnswer sa
JOIN Question q ON sa.questionId = q.id
JOIN Category c ON q.categoryId = c.id
GROUP BY c.id, c.name;
```

### 問題ごとの正答率（苦手問題リスト用）
```sql
SELECT
  q.id,
  q.body,
  COUNT(*) AS total,
  SUM(CASE WHEN sa.isCorrect THEN 1 ELSE 0 END) AS correct,
  ROUND(100.0 * SUM(CASE WHEN sa.isCorrect THEN 1 ELSE 0 END) / COUNT(*), 1) AS accuracy
FROM StudyAnswer sa
JOIN Question q ON sa.questionId = q.id
GROUP BY q.id
ORDER BY accuracy ASC;
```

### 学習ストリーク（連続学習日数）
```sql
SELECT DISTINCT DATE(createdAt) AS studyDate
FROM StudySession
ORDER BY studyDate DESC;
-- アプリ側で連続日数を計算
```

---

## Prisma スキーマ（実装用）

```prisma
model Certification {
  id         Int        @id @default(autoincrement())
  name       String     @unique
  createdAt  DateTime   @default(now())
  categories Category[]
  sessions   StudySession[]
}

model Category {
  id              Int           @id @default(autoincrement())
  name            String
  certificationId Int
  createdAt       DateTime      @default(now())
  certification   Certification @relation(fields: [certificationId], references: [id])
  flashcards      Flashcard[]
  questions       Question[]

  @@unique([name, certificationId])
}

model Flashcard {
  id         Int      @id @default(autoincrement())
  front      String
  back       String
  categoryId Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  category   Category @relation(fields: [categoryId], references: [id])
}

model Question {
  id             Int           @id @default(autoincrement())
  body           String
  choices        Json
  correctAnswers Json
  isMultiple     Boolean       @default(false)
  explanation    String?
  categoryId     Int
  tags           String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  category       Category      @relation(fields: [categoryId], references: [id])
  answers        StudyAnswer[]
}

model StudySession {
  id              Int           @id @default(autoincrement())
  type            SessionType
  certificationId Int
  totalCount      Int
  correctCount    Int
  durationSec     Int
  timeLimitSec    Int?
  examConfig      Json?
  createdAt       DateTime      @default(now())
  certification   Certification @relation(fields: [certificationId], references: [id])
  answers         StudyAnswer[]
}

model StudyAnswer {
  id              Int          @id @default(autoincrement())
  studySessionId  Int
  questionId      Int
  selectedAnswers Json
  isCorrect       Boolean
  createdAt       DateTime     @default(now())
  session         StudySession @relation(fields: [studySessionId], references: [id], onDelete: Cascade)
  question        Question     @relation(fields: [questionId], references: [id])
}

enum SessionType {
  QUIZ
  EXAM
}
```
