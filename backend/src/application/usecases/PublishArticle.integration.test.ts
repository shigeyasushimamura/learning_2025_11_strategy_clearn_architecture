import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, User, Article } from "@prisma/client";
import { PublishArticleUseCase } from "./PublishArticleUseCase";
import { PrismaArticleRepository } from "../../infrastructure/database/PrismaArticleRepository";
import { ConsoleEventPublisher } from "../../infrastructure/events/ConsoleEventPublisher";
import { ArticleState } from "../../domain/article/ArticleState";

const prisma = new PrismaClient();

describe("PublishArticleUseCase - Integration", () => {
  let useCase: PublishArticleUseCase;
  let repository: PrismaArticleRepository;
  let eventPublisher: ConsoleEventPublisher;
  let testUser: User;

  beforeEach(async () => {
    repository = new PrismaArticleRepository(prisma);
    eventPublisher = new ConsoleEventPublisher(prisma);
    useCase = new PublishArticleUseCase(repository, eventPublisher);

    // テストユーザー作成
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
  });

  afterAll(async () => {
    await prisma.article.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("下書き記事を公開できる", async () => {
    // 下書き記事のサンプル
    // useCase層からPrismaの詳細を知りたくないので、直接prismaにデータを作りにいかない
    const article: Article = {
      id: crypto.randomUUID(),
      title: "Test Article",
      slug: "test-article-" + Date.now(),
      content: "Content",
      excerpt: null,
      coverImage: null,
      state: ArticleState.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: testUser.id,
    };

    const saved = await repository.save(article);

    // 公開
    // 状態:DRAFT -> PUBLISHED
    // イベント:PUBLISH
    const result = await useCase.execute(saved.id, testUser.id);
    expect(result.isSuccess).toBe(true);

    const publishedArticle = result.unwrap();
    expect(publishedArticle.state).toBe(ArticleState.PUBLISHED);
    expect(publishedArticle.publishedAt).not.toBeNull();

    // DBから記事を取得して確認する
    const fromDb = await repository.findById(saved.id);
    expect(fromDb?.state).toBe(ArticleState.PUBLISHED);
    expect(fromDb?.authorId).toBe(saved.authorId);

    // DBから状態履歴も確認する
    const history = await prisma.articleStateHistory.findMany({
      where: { articleId: saved.id },
    });
    expect(history.length).toBe(1);
  });
});
