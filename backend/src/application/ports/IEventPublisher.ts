import { ArticleEventMetadata } from "../../domain/article/ArticleEvent";

/**
 * イベント発行インターフェース
 * Infrastructureで実装(このIFはアプリケーション層に属する)
 */
export interface IEventPublisher {
  /**
   * 記事の状態変更イベントを発行
   */
  publishArticleStateChange(
    articleId: string,
    metadata: ArticleEventMetadata
  ): Promise<void>;
}
