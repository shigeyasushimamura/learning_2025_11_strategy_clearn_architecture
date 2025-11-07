import { ArticleEventMetadata } from "../../domain/article/ArticleEvent";

/**
 * イベント発行インターフェース
 * Infrastructureで実装(ログ、通知など)
 */
export interface IEventPublisher {
  /**
   * 記事の状態変更イベントを発行
   */
  publishArticleStateChanged(
    articleId: string,
    metadata: ArticleEventMetadata
  ): Promise<void>;
}
