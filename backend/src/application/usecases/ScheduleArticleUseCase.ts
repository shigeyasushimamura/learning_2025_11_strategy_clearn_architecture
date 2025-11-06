import { Article } from "@prisma/client";
import { IArticleRepository } from "../ports/IArticleRepository";
import { IEventPublisher } from "../ports/IEventPublisher";
import { ScheduleArticleInput } from "../dto/CreateArticleInput";
import { ArticleStateMachine } from "../../domain/article/ArticleStateMachine";
import { ArticleState } from "../../domain/article/ArticleState";
import { ArticleEvent } from "../../domain/article/ArticleEvent";
import { Result, ok, fail } from "../../domain/shared/Result";
import { DomainError, ValidationError } from "../../domain/shared/DomainError";

/**
 * 予約投稿ユースケース
 *
 * 責務:
 * - 予約時刻のバリデーション
 * - 状態ステートマシンを使った予約設定
 * - イベント発行
 */
export class ScheduleArticleUseCase {
  constructor(
    private articleRepository: IArticleRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(
    articleId: string,
    input: ScheduleArticleInput,
    userId: string
  ): Promise<Result<Article, DomainError>> {
    const article = await this.articleRepository.findById(articleId);
    if (!article) {
      return fail(new DomainError("Article not found", "Not_FOUND"));
    }

    // 権限チェック
    // authorIdがなりすましかどうか判定するのはあくまでapplication層ではない
    if (article.authorId !== userId) {
      return fail(new DomainError("Unauthorized", "UNAUTHORIZED"));
    }

    // 予約時刻のバリデーション
    const now = new Date();
    if (input.scheduledAt <= now) {
      new ValidationError(
        "Scheduled time must be in the future",
        "scheduledAt"
      );
    }

    // 状態ステートマシンで遷移
    const stateMachine = new ArticleStateMachine(
      article.state as ArticleState,
      article.scheduledAt || undefined
    );

    const transitionResult = stateMachine.transition(ArticleEvent.SCHEDULE, {
      triggeredBy: userId,
      scheduledAt: input.scheduledAt,
      currentTime: now,
    });

    if (transitionResult.isFailure) {
      return fail(transitionResult.unwrapError());
    }

    // 記事を更新
    const updatedArticle: Article = {
      ...article,
      state: stateMachine.getState(),
      scheduledAt: input.scheduledAt,
      updatedAt: new Date(),
    };

    const savedArticle = await this.articleRepository.save(updatedArticle);

    // イベント発行
    await this.eventPublisher.publishArticleStateChanged(
      articleId,
      transitionResult.unwrap()
    );

    return ok(savedArticle);
  }
}
