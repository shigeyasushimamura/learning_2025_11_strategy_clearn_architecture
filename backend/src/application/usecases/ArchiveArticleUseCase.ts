import { Article } from "@prisma/client";
import { IArticleRepository } from "../ports/IArticleRepository";
import { IEventPublisher } from "../ports/IEventPublisher";
import { ArticleStateMachine } from "../../domain/article/ArticleStateMachine";
import { ArticleState } from "../../domain/article/ArticleState";
import { ArticleEvent } from "../../domain/article/ArticleEvent";
import { Result, ok, fail } from "../../domain/shared/Result";
import { DomainError } from "../../domain/shared/DomainError";

/**
 * 記事アーカイブユースケース
 */
export class ArchiveArticleUseCase {
  constructor(
    private articleRepository: IArticleRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(
    articleId: string,
    userId: string
  ): Promise<Result<Article, DomainError>> {
    const article = await this.articleRepository.findById(articleId);
    if (!article) {
      return fail(new DomainError("Article not found", "NOT_FOUND"));
    }

    if (article.authorId !== userId) {
      return fail(new DomainError("Unauthorized", "UNAUTHORIZED"));
    }

    const stateMachine = new ArticleStateMachine(
      article.state as ArticleState,
      article.scheduledAt || undefined
    );

    const transitionResult = stateMachine.transition(ArticleEvent.ARCHIVE, {
      triggeredBy: userId,
    });

    if (transitionResult.isFailure) {
      return fail(transitionResult.unwrapError());
    }

    const updatedArticle: Article = {
      ...article,
      state: stateMachine.getState(),
      updatedAt: new Date(),
    };

    const savedArticle = await this.articleRepository.save(updatedArticle);

    await this.eventPublisher.publishArticleStateChanged(
      articleId,
      transitionResult.unwrap()
    );

    return ok(savedArticle);
  }
}
