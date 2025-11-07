import { describe, it, expect, beforeEach, vi } from "vitest";
import { PublishArticleUseCase } from "./PublishArticleUseCase";
import { IArticleRepository } from "../ports/IArticleRepository";
import { IEventPublisher } from "../ports/IEventPublisher";
import { Article } from "@prisma/client";
import { ArticleState } from "../../domain/article/ArticleState";

/**
 * DBモック
 * - インメモリ
 */
class MockArticleRepository implements IArticleRepository {
  private articles = new Map<string, Article>();
  async save(article: Article): Promise<Article> {
    this.articles.set(article.id, article);
    return article;
  }

  async findById(id: string): Promise<Article | null> {
    return this.articles.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    return null;
  }

  async findPublished(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    return [];
  }

  async findByAuthor(): Promise<Article[]> {
    return [];
  }

  async findScheduledForAutoPublish(): Promise<Article[]> {
    return [];
  }

  async delete(): Promise<void> {}

  // テストヘルパー
  seed(article: Article) {
    this.articles.set(article.id, article);
  }
}

/**
 * イベントモック
 */
class MockEventPublisher implements IEventPublisher {
  publishedEvents: any[] = [];

  async publishArticleStateChanged(
    articleId: string,
    metadata: any
  ): Promise<void> {
    this.publishedEvents.push({ articleId, metadata });
  }
}

describe("PublishArticleUseCase", () => {
  let useCase: PublishArticleUseCase;
  let repository: MockArticleRepository;
  let eventPublisher: MockEventPublisher;

  beforeEach(() => {
    repository = new MockArticleRepository();
    eventPublisher = new MockEventPublisher();
    useCase = new PublishArticleUseCase(repository, eventPublisher);
  });

  it("下書き記事を公開できる", async () => {
    const article: Article = {
      id: "article-1",
      title: "Test Article",
      slug: "test-article",
      content: "Content",
      excerpt: null,
      coverImage: null,
      state: ArticleState.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.seed(article);

    const result = await useCase.execute("article-1", "user-1");

    expect(result.isSuccess).toBe(true);
    const value = result.unwrap();
    expect(value.state).toBe(ArticleState.PUBLISHED);
    expect(value.publishedAt).not.toBeNull();

    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it("他人の記事は公開できない", async () => {
    const article: Article = {
      id: "article-1",
      title: "Test Article",
      slug: "test-article",
      content: "Content",
      excerpt: null,
      coverImage: null,
      state: ArticleState.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.seed(article);

    // 違うユーザーで検証
    const result = await useCase.execute("article-1", "user-2");

    expect(result.isFailure).toBe(true);
    const error = result.unwrapError();
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("公開中の記事は再公開できない", async () => {
    const article: Article = {
      id: "article-1",
      title: "Test Article",
      slug: "test-article",
      content: "Content",
      excerpt: null,
      coverImage: null,
      state: ArticleState.PUBLISHED,
      publishedAt: new Date(),
      scheduledAt: null,
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.seed(article);

    const result = await useCase.execute("article-1", "user-1");
    expect(result.isFailure).toBe(true);
  });
});
