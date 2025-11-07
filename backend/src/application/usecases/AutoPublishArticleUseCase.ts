import { IArticleRepository } from "../ports/IArticleRepository";
import { IEventPublisher } from "../ports/IEventPublisher";
import { ArticleStateMachine } from "../../domain/article/ArticleStateMachine";
import { ArticleState } from "../../domain/article/ArticleState";
import { ArticleEvent } from "../../domain/article/ArticleEvent";
import { Article } from "@prisma/client";

/**
 * 自動公開ユースケース(Cron実行用)
 *
 * 責務:
 * - 予約時刻を過ぎた記事を自動公開
 * - バッチ処理
 */
export class AutoPublishArticleUseCase {
  constructor(
    private articleRepository: IArticleRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(currentTime: Date = new Date()): Promise<number> {
    // 自動公開対象の記事を取得
    const articles = await this.articleRepository.findScheduledForAutoPublish(
      currentTime
    );

    let publishedCount = 0;

    for (const article of articles) {
      try {
        const stateMachine = new ArticleStateMachine(
          article.state as ArticleState,
          article.scheduledAt || undefined
        );

        const transitionResult = stateMachine.transition(
          ArticleEvent.AUTO_PUBLISH,
          { currentTime }
        );

        if (transitionResult.isSuccess) {
          const updatedArticle: Article = {
            ...article,
            state: stateMachine.getState(),
            publishedAt: currentTime,
            scheduledAt: null,
            updatedAt: currentTime,
          };

          await this.articleRepository.save(updatedArticle);

          await this.eventPublisher.publishArticleStateChanged(
            article.id,
            transitionResult.unwrap()
          );

          publishedCount++;
        }
      } catch (error) {
        // エラーが発生しても、処理は続ける
        console.error(`Failed to auto-publish article ${article.id}:`, error);
      }
    }
    return publishedCount;
  }
}
