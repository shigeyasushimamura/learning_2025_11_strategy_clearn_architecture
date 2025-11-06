import { IArticleRepository } from "../ports/IArticleRepository";
import { ArticleDto, toArticleDto } from "../dto/ArticleDto";
import { Result, ok, fail } from "../../domain/shared/Result";
import { DomainError } from "../../domain/shared/DomainError";

/**
 * 記事取得ユースケース
 */
export class GetArticleUseCase {
  constructor(private articleRepository: IArticleRepository) {}

  async execute(articleId: string): Promise<Result<ArticleDto, DomainError>> {
    const article = this.articleRepository.findById(articleId);

    if (!article) {
      return fail(new DomainError("Article not found", "NOT_FOUND"));
    }

    // DTOに変換
    const dto = toArticleDto(article as any);
    return ok(dto);
  }

  async executeBySlug(slug: string): Promise<Result<ArticleDto, DomainError>> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return fail(new DomainError("Article not found", "NOT_FOUND"));
    }

    const dto = toArticleDto(article as any);

    return ok(dto);
  }
}
