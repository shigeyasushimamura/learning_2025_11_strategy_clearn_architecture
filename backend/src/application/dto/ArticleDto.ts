import { Article, User, Tag } from "@prisma/client";
import { ArticleState } from "../../domain/article/ArticleState";

/**
 * 記事のDTO（APIレスポンス用）
 */
export interface ArticleDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  state: ArticleState;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

/**
 * Prismaのモデルから DTOに変換
 */
export function toArticleDto(
  article: Article & {
    author: User;
    tags: Tag[];
  }
): ArticleDto {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    state: article.state as ArticleState,
    publishedAt: article.publishedAt,
    scheduledAt: article.scheduledAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: {
      id: article.author.id,
      name: article.author.name,
      avatarUrl: article.author.avatarUrl,
    },
    tags: article.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
  };
}
