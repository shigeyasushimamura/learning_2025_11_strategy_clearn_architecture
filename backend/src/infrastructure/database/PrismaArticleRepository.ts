import { Article, PrismaClient } from "@prisma/client";
import { IArticleRepository } from "../../application/ports/IArticleRepository";
import { ArticleState } from "../../domain/article/ArticleState";
import { getPrismaClient } from "./PrismaClient";

/**
 * Prisma を使った記事リポジトリの実装
 */
export class PrismaArticleRepository implements IArticleRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  /**
   * 記事を保存（作成 or 更新）
   */
  async save(article: Article): Promise<Article> {
    return await this.prisma.article.upsert({
      where: { id: article.id },
      create: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        state: article.state,
        publishedAt: article.publishedAt,
        scheduledAt: article.scheduledAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authorId: article.authorId,
      },
      update: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        state: article.state,
        publishedAt: article.publishedAt,
        scheduledAt: article.scheduledAt,
        updatedAt: article.updatedAt,
      },
      include: {
        author: true,
        tags: true,
      },
    });
  }

  /**
   * IDで記事を取得
   */
  async findById(id: string): Promise<Article | null> {
    return await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        tags: true,
      },
    });
  }

  /**
   * スラッグで記事を取得
   */
  async findBySlug(slug: string): Promise<Article | null> {
    return await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true,
      },
    });
  }

  /**
   * 公開中の記事一覧を取得
   */
  async findPublished(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    return await this.prisma.article.findMany({
      where: {
        state: ArticleState.PUBLISHED,
      },
      include: {
        author: true,
        tags: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }

  /**
   * 著者の記事一覧を取得
   */
  async findByAuthor(
    authorId: string,
    options?: {
      state?: ArticleState;
      limit?: number;
      offset?: number;
    }
  ): Promise<Article[]> {
    return await this.prisma.article.findMany({
      where: {
        authorId,
        ...(options?.state && { state: options.state }),
      },
      include: {
        author: true,
        tags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }

  /**
   * 自動公開対象の記事を取得
   * （予約投稿で、予約時刻を過ぎているもの）
   */
  async findScheduledForAutoPublish(currentTime: Date): Promise<Article[]> {
    return await this.prisma.article.findMany({
      where: {
        state: ArticleState.SCHEDULED,
        scheduledAt: {
          lte: currentTime,
        },
      },
      include: {
        author: true,
        tags: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
  }

  /**
   * 記事を削除
   */
  async delete(id: string): Promise<void> {
    await this.prisma.article.delete({
      where: { id },
    });
  }

  /**
   * 記事数を取得（ページネーション用）
   */
  async count(where?: {
    state?: ArticleState;
    authorId?: string;
  }): Promise<number> {
    return await this.prisma.article.count({
      where,
    });
  }

  /**
   * 全文検索（タイトル・本文）
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Article[]> {
    return await this.prisma.article.findMany({
      where: {
        state: ArticleState.PUBLISHED,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        author: true,
        tags: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }
}
