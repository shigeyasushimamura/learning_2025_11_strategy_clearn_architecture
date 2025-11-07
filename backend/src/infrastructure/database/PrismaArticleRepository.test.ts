import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, Article, User } from "@prisma/client";
import { PrismaArticleRepository } from "./PrismaArticleRepository";
import { ArticleState } from "../../domain/article/ArticleState";

// テスト用のPrismaクライアント
const prisma = new PrismaClient();

describe("PrismaArticleRepository", () => {
  let repository: PrismaArticleRepository;
  let testUser: User;

  beforeEach(async () => {
    repository = new PrismaArticleRepository(prisma);

    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
  });

  afterAll(async () => {
    // テストデータをクリーンアップ
    await prisma.article.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("記事を保存できる", async () => {
    const article = await prisma.article.create({
      data: {
        id: "testID",
        title: "Test Article",
        slug: "test-article-" + Date.now(),
        content: "Content",
        state: ArticleState.DRAFT,
        authorId: testUser.id,
      },
    });

    const saved = await repository.findById("testID");

    expect(saved?.id).toBe(article.id);
    expect(saved?.title).toBe(article.title);
  });

  it("IDで記事を取得できる", async () => {
    const article = await prisma.article.create({
      data: {
        title: "Test Article",
        slug: "test-article-" + Date.now(),
        content: "Content",
        state: ArticleState.DRAFT,
        authorId: testUser.id,
      },
    });

    const found = await repository.findById(article.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(article.id);
  });

  it("自動公開対象の記事を取得できる", async () => {
    const pastTime = new Date(Date.now() - 60000); // 1分前

    const article = await prisma.article.create({
      data: {
        title: "Scheduled Article",
        slug: "scheduled-article-" + Date.now(),
        content: "Content",
        state: ArticleState.SCHEDULED,
        scheduledAt: pastTime,
        authorId: testUser.id,
      },
    });

    const articles = await repository.findScheduledForAutoPublish(new Date());

    expect(articles.length).toBeGreaterThan(0);
    expect(articles.some((a) => a.id === article.id)).toBe(true);
  });

  it("公開中の記事のみ取得できる", async () => {
    // 下書き記事
    const draftArticle = await prisma.article.create({
      data: {
        title: "Draft Article",
        slug: "draft-article-" + Date.now(),
        content: "Content",
        state: ArticleState.DRAFT,
        authorId: testUser.id,
      },
    });

    // 公開記事
    const publishedArticle = await prisma.article.create({
      data: {
        title: "Published Article",
        slug: "published-article-" + Date.now(),
        content: "Content",
        state: ArticleState.PUBLISHED,
        publishedAt: new Date(),
        authorId: testUser.id,
      },
    });

    const published = await repository.findPublished();

    expect(published.some((a) => a.id === publishedArticle.id)).toBe(true);
    expect(published.some((a) => a.id === draftArticle.id)).toBe(false);
  });
});
