import { Article } from "@prisma/client";
import { IArticleRepository } from "../ports/IArticleRepository";
import { CreateArticleInput } from "../dto/CreateArticleInput";
import { ArticleState } from "../../domain/article/ArticleState";
import { Result, ok, fail } from "../../domain/shared/Result";
import { ValidationError } from "../../domain/shared/DomainError";

/**
 * 記事作成ユースケース
 *
 * 責務:
 * - 入力バリデーション
 * - スラッグ生成
 * - 記事の永続化
 */
export class CreateArticleUseCase {
  constructor(private articleRepository: IArticleRepository) {}

  async execute(
    input: CreateArticleInput
  ): Promise<Result<Article, ValidationError>> {
    const validationResult = this.validate(input);
    if (validationResult.isFailure) {
      return validationResult;
    }

    const slug = this.generateSlug(input.title);

    const existingArticle = await this.articleRepository.findBySlug(slug);
    if (existingArticle) {
      return fail(new ValidationError("Slug already exists", "slug"));
    }

    // 記事作成
    const article: Article = {
      id: crypto.randomUUID(),
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt || null,
      coverImage: input.coverImage || null,
      state: ArticleState.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      authorId: input.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 保存
    const savedArticle = await this.articleRepository.save(article);

    return ok(savedArticle);
  }

  private validate(input: CreateArticleInput): Result<void, ValidationError> {
    if (!input.title || input.title.trim().length === 0) {
      return fail(new ValidationError("Title is required", "title"));
    }

    if (input.title.length > 200) {
      return fail(
        new ValidationError("Title must be 200 characters or less", "title")
      );
    }

    if (!input.content || input.content.trim().length === 0) {
      return fail(new ValidationError("Content is required", "content"));
    }

    if (!input.authorId) {
      return fail(new ValidationError("Author ID is required", "authorId"));
    }

    return ok(undefined);
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100) +
      "-" +
      Date.now()
    );
  }
}
