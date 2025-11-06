import { Article } from "@prisma/client";
import { IArticleRepository } from "../ports/IArticleRepository";
import { IEventPublisher } from "../ports/IEventPublisher";
import { ArticleStateMachine } from "../../domain/article/ArticleStateMachine";
import { ArticleState } from "../../domain/article/ArticleState";
import { ArticleEvent } from "../../domain/article/ArticleEvent";
import { Result, ok, fail } from "../../domain/shared/Result";
import {
  InvalidStateTransitionError,
  DomainError,
} from "../../domain/shared/DomainError";

/**
 * 記事公開ユースケース
 *
 * 責務:
 * - 状態ステートマシンを使った公開処理
 * - 公開日時の設定
 * - イベント発行
 */
export class PublishArticleUseCase {
  constructor(
    private articleRepository: IArticleRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(
    articleId: string,
    userId: string
  ): Promise<Result<Article, DomainError>> {
    // 記事を取得
    const article = await this.articleRepository.findById(articleId);
    if (!article) {
      return fail(new DomainError("Article not found", "NOT_FOUND"));
    }

    // 権限チェック（著者のみ公開可能）
    if (article.authorId !== userId) {
      return fail(new DomainError("Unauthorized", "UNAUTHORIZED"));
    }

    // 状態ステートマシンで遷移
    const stateMachine = new ArticleStateMachine(
      article.state as ArticleState,
      article.scheduledAt || undefined
    );

    // これにより状態ステートマシンの状態が->PUBLISHEDになる
    const transitionResult = stateMachine.transition(ArticleEvent.PUBLISH, {
      triggeredBy: userId,
      scheduledAt: new Date(),
    });

    if (transitionResult.isFailure) {
      return fail(transitionResult.error);
    }

    const updatedArticle: Article = {
      ...article,
      state: stateMachine.getState(),
      publishedAt: new Date(),
      scheduledAt: null,
      updatedAt: new Date(),
    };

    const savedArticle = await this.articleRepository.save(updatedArticle);

    // イベント発行
    await this.eventPublisher.publishArticleStateChange(
      articleId,
      transitionResult.unwrap()
    );

    return ok(savedArticle);
  }
}
