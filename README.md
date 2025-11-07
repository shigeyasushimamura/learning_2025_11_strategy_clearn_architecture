[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-purple.svg)](https://www.prisma.io/)
[![Hono](https://img.shields.io/badge/Hono-4.0-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [🎯 プロジェクト概要](#-プロジェクト概要)
- [🏗️ アーキテクチャ](#️-アーキテクチャ)
- [✨ 主要機能](#-主要機能)
- [🛠️ 技術スタック](#️-技術スタック)
- [📐 設計原則](#-設計原則)
- [🚀 セットアップ](#-セットアップ)
- [📊 データモデル](#-データモデル)
- [🔄 状態機械](#-状態機械)
- [🧪 テスト戦略](#-テスト戦略)

---

## 🎯 プロジェクト概要

### ビジネス要件

- ✅ **記事管理**: 下書き → 予約投稿 → 公開 → アーカイブの完全なライフサイクル管理
- ✅ **予約投稿**: 指定日時での自動公開（PostgreSQL pg_cron 使用）
- ✅ **状態管理**: 厳格な状態機械による整合性保証

### 技術的な目標

1. **保守性**: Clean Architecture による疎結合設計
2. **信頼性**: 型安全性とドメインロジックの分離
3. **テスタビリティ**: 各層の独立したユニットテスト

---

## 🏗️ アーキテクチャ

### Clean Architecture

```mermaid
graph LR
    Presentation[Presentation] --> Application[Application]
    Application --> Domain[Domain]
    Infrastructure[Infrastructure] --> Application
    Infrastructure -.-> Domain

    style Domain fill:#e1f5ff
    style Application fill:#fff4e6
    style Infrastructure fill:#f3e5f5
    style Presentation fill:#e8f5e9
```

**依存性逆転の原則 (DIP)を利用**:

- Domain 層は**他の層に依存しない**（ビジネスロジックの純粋性）
- Application 層は Domain 層のみに依存
- Infrastructure 層は Application 層のインターフェース（Port）を実装

**規模的/ドメイン拡張先が未定のため、DI コンテナは利用していない**

---

## ✨ 主要機能

### 1. 記事管理システム

#### 状態遷移フロー

```mermaid
stateDiagram-v2
    [*] --> DRAFT: 新規作成

    DRAFT --> DRAFT: 下書き保存
    DRAFT --> SCHEDULED: 予約設定
    DRAFT --> PUBLISHED: 即時公開

    SCHEDULED --> DRAFT: 予約解除
    SCHEDULED --> SCHEDULED: 予約時刻変更
    SCHEDULED --> PUBLISHED: 自動公開
    SCHEDULED --> PUBLISHED: 手動公開

    PUBLISHED --> DRAFT: 非公開化
    PUBLISHED --> ARCHIVED: アーカイブ

    ARCHIVED --> DRAFT: 復元

    note right of SCHEDULED
        予約時刻到達かつスケジューラ起動でPUBLISHEDへ
    end note

    note right of PUBLISHED
        公開状態
    end note
```

#### 状態の詳細

| 状態          | 説明       | 外部公開 | 編集可能 | 次の状態             |
| ------------- | ---------- | -------- | -------- | -------------------- |
| **DRAFT**     | 下書き     | ❌       | ✅       | SCHEDULED, PUBLISHED |
| **SCHEDULED** | 予約投稿   | ❌       | ✅       | PUBLISHED, DRAFT     |
| **PUBLISHED** | 公開中     | ✅       | ❌       | DRAFT, ARCHIVED      |
| **ARCHIVED**  | アーカイブ | ❌       | ❌       | DRAFT                |

### 2. 予約投稿システム

#### 自動公開の仕組み

```mermaid
sequenceDiagram
    participant Cron as PostgreSQL pg_cron
    participant API as Hono API
    participant UseCase as AutoPublishUseCase
    participant StateMachine as ArticleStateMachine
    participant DB as PostgreSQL

    Cron->>API: POST /api/cron/auto-publish (毎分)
    API->>UseCase: execute()
    UseCase->>DB: 予約時刻を過ぎた記事を取得
    DB-->>UseCase: Article[]

    loop 各記事
        UseCase->>StateMachine: transition(AUTO_PUBLISH)
        StateMachine->>StateMachine: ガード条件チェック
        alt 時刻到達
            StateMachine-->>UseCase: Success
            UseCase->>DB: state = PUBLISHED に更新
            UseCase->>DB: 履歴を保存
        else 時刻未到達
            StateMachine-->>UseCase: Failure
        end
    end

    UseCase-->>API: 公開した記事数
    API-->>Cron: 200 OK
```

**開発環境**: Node.js `setInterval`（1 分ごと）  
**本番環境**: PostgreSQL `pg_cron` 拡張案として Cloudflare Cron Triggers

---

## 🛠️ 技術スタック

### Backend

| カテゴリ      | 技術           | 選定理由                                              |
| ------------- | -------------- | ----------------------------------------------------- |
| **Language**  | TypeScript 5.3 | 型安全性、大規模開発での保守性                        |
| **Framework** | Hono 4.10      | 超軽量、エッジランタイム対応、Cloudflare Workers 互換 |
| **ORM**       | Prisma 5.22    | 型安全なクエリ、マイグレーション管理、優れた DX       |
| **Database**  | PostgreSQL 16  | ACID 保証、pg_cron 拡張、JSONB サポート               |
| **Runtime**   | Node.js 24     | LTS、ES2022 サポート                                  |

### Infrastructure

| カテゴリ         | 技術                      | 用途                         |
| ---------------- | ------------------------- | ---------------------------- |
| **コンテナ**     | Docker + Docker Compose   | ローカル開発環境             |
| **スケジューラ** | PostgreSQL pg_cron        | 予約投稿の自動実行           |
| **ホスティング** | Cloudflare Workers (予定) | グローバルエッジ配信、無料枠 |

### Testing

| カテゴリ        | 技術                           | 用途                 |
| --------------- | ------------------------------ | -------------------- |
| **Test Runner** | Vitest                         | 高速、Vite 統合      |
| **単体テスト**  | Domain/Application 層          | ビジネスロジック検証 |
| **統合テスト**  | Infrastructure/presentation 層 | サービス内検証       |
| **E2E テスト**  | Playwright (予定)              | API 統合テスト       |

---

## 📐 設計原則

### 1. Domain-Driven Design (DDD)

#### ユビキタス言語

| 用語           | 定義                                              |
| -------------- | ------------------------------------------------- |
| **Article**    | 記事エンティティ                                  |
| **State**      | 記事の状態（DRAFT/SCHEDULED/PUBLISHED/ARCHIVED）  |
| **Event**      | 状態遷移のトリガー（PUBLISH/SCHEDULE/ARCHIVE 等） |
| **Transition** | 状態遷移（from → event → to）                     |
| **Guard**      | 遷移前の条件チェック                              |

#### 集約ルート

```typescript
// Article = 集約ルート
Article {
  - id, title, content
  - state: ArticleState
  - scheduledAt?: Date
  - author: User (参照)
  - tags: Tag[] (参照)
}
```

**境界**: 記事の状態変更は必ず ArticleStateMachine を経由

### 2. 状態機械パターン

#### 実装の特徴

```typescript
class ArticleStateMachine {
  // ✅ 状態を内部で保持
  private currentState: ArticleState;

  // ✅ イベントで遷移
  transition(event: ArticleEvent, context: Context): Result;

  // ✅ ガード条件で制約
  guard: (context) => boolean;

  // ✅ 副作用なし（純粋関数）
  // DBへの永続化はUseCase層で実施
}
```

**メリット**:

- 🔒 不正な状態遷移の防止（型レベル + ランタイム）
- 📊 状態遷移の可視化が容易
- 🧪 テストが書きやすい
- 📝 ドメイン知識の明示化

### 3. Result 型パターン

Railway Oriented Programming による型安全なエラーハンドリング:

```typescript
type Result = Success | Failure;

// ✅ 使用例
const result = await useCase.execute(input);

if (result.isSuccess) {
  const article = result.unwrap();
  return c.json(article);
} else {
  const error = result.unwrapError();
  return c.json({ error: error.message }, 400);
}
```

**メリット**:

- ❌ 例外を throw しない（予測可能なエラーハンドリング）
- ✅ コンパイル時にエラー処理を強制
- 🔄 map/flatMap でチェーン可能

※ **ロジック想定外は try-catch 句を利用**

---

## 🚀 セットアップ

### 前提条件

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (Docker で自動セットアップ)

### 1. リポジトリのクローン

```bash
git clone <<url>>
cd travel-blog/backend
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

```.env
DATABASE_URL="postgresql://admin:admin123@localhost:5432/travel_blog?schema=public"
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### 3. PostgreSQL の起動

```bash
# ルートディレクトリで
docker compose up -d

# 起動確認
docker ps
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. データベースのマイグレーション

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行
npx prisma migrate dev --name init

# シードデータ投入
npm run db:seed
```

### 6. 開発サーバー起動

```bash
npm run dev
```

**アクセス**: http://localhost:3000

### 7. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# 記事一覧
curl http://localhost:3000/api/articles

# Prisma Studio（DB GUI）
npm run db:studio
```

---

## 📊 データモデル

### ER 図

```mermaid
erDiagram
    User ||--o{ Article : "authors"
    Article ||--o{ Comment : "has"
    Article }o--o{ Tag : "tagged_with"
    Article ||--o{ ArticleStateHistory : "has_history"
    User ||--o{ Comment : "writes"

    User {
        string id PK
        string email UK
        string name
        string bio
        string avatarUrl
        enum role
        datetime createdAt
        datetime updatedAt
    }

    Article {
        string id PK
        string title
        string slug UK
        text content
        string excerpt
        string coverImage
        enum state
        datetime publishedAt
        datetime scheduledAt
        string authorId FK
        datetime createdAt
        datetime updatedAt
    }

    Tag {
        string id PK
        string name UK
        string slug UK
        datetime createdAt
    }

    Comment {
        string id PK
        text content
        string articleId FK
        string authorId FK
        datetime createdAt
        datetime updatedAt
    }

    ArticleStateHistory {
        string id PK
        string articleId FK
        enum fromState
        enum toState
        string event
        datetime createdAt
    }
```

### インデックス戦略

```sql
-- 記事検索の最適化
CREATE INDEX idx_articles_state_published ON articles(state, published_at DESC);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_slug ON articles(slug);

-- 予約投稿の効率化
CREATE INDEX idx_articles_scheduled ON articles(state, scheduled_at)
WHERE state = 'SCHEDULED';

-- 全文検索（PostgreSQL）
CREATE INDEX idx_articles_search ON articles USING GIN(to_tsvector('japanese', title || ' ' || content));
```

---

## 🔄 状態機械

### 遷移ルール定義

```typescript
export const transitions: StateTransition[] = [
  // DRAFT からの遷移
  {
    from: ArticleState.DRAFT,
    event: ArticleEvent.SCHEDULE,
    to: ArticleState.SCHEDULED,
    guard: (ctx) => {
      // 未来の日時のみ予約可能
      return (
        ctx.scheduledAt && ctx.scheduledAt > (ctx.currentTime || new Date())
      );
    },
  },

  // SCHEDULED からの自動公開
  {
    from: ArticleState.SCHEDULED,
    event: ArticleEvent.AUTO_PUBLISH,
    to: ArticleState.PUBLISHED,
    guard: (ctx) => {
      // 予約時刻を過ぎている場合のみ
      return (
        ctx.scheduledAt && ctx.scheduledAt <= (ctx.currentTime || new Date())
      );
    },
  },

  // ... その他の遷移
];
```

### 使用例

```typescript
// UseCase内での使用
const stateMachine = new ArticleStateMachine(
  article.state,
  article.scheduledAt
);

const result = stateMachine.transition(ArticleEvent.PUBLISH, {
  triggeredBy: userId,
  currentTime: new Date(),
});

if (result.isSuccess) {
  const metadata = result.unwrap();
  // DBに永続化
  await repository.save({ ...article, state: stateMachine.getState() });
  // イベント発行
  await eventPublisher.publish(articleId, metadata);
}
```

---

## 🧪 テスト戦略

### テストピラミッド

理想的なテストケース配分(本プロジェクトは一部のみ試験実施)

```
        /\
       /  \      E2E Tests (少)
      /    \     - API統合テスト
     /------\
    /        \   Integration Tests (中)
   /          \  - Repository + DB
  /------------\
 /              \ Unit Tests (多)
/________________\ - Domain層: StateMachine
                   - Application層: UseCases
```

### Domain 層のテスト

```typescript
const ONE_DAY_MILLISECONDS = 86400000;

describe("ArticleStateMachine", () => {
  it("DRAFT → PUBLISH → PUBLISHED", () => {
    const machine = new ArticleStateMachine(ArticleState.DRAFT);
    const result = machine.transition(ArticleEvent.PUBLISH);

    expect(result.isSuccess).toBe(true);
    expect(machine.getState()).toBe(ArticleState.PUBLISHED);
  });

  it("過去の日時では予約できない", () => {
    const machine = new ArticleStateMachine(ArticleState.DRAFT);
    const pastDate = new Date(Date.now() - ONE_DAY_MILLISECONDS);

    const result = machine.transition(ArticleEvent.SCHEDULE, {
      scheduledAt: pastDate,
    });

    expect(result.isFailure).toBe(true);
  });
});
```

### テスト実行

```bash
# 全テスト実行
npm run test

```

---

## 📚 参考資料

### アーキテクチャ

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Agile Software Development (Robert C. Martin)](http://hoge.html)

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)

---
