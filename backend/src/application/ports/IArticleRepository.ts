import { Article } from "@prisma/client";
import { ArticleState } from "@prisma/client";

/**
 * 記事リポジトリのインターフェース
 * Infrastructure層で実装する
 */
export interface IArticleRepository {
  /**
   * 記事を保存
   */
  save(article: Article): Promise<Article>;

  /**
   * IDで記事を取得
   */
  findById(id: string): Promise<Article | null>;

  /**
   * スラッグで記事を取得
   */
  findBySlug(slug: string): Promise<Article | null>;

  /**
   * 記事一覧を取得(公開中のみ)
   */
  findPublished(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Article[]>;

  /**
   * 著者の記事一覧を取得
   */
  findByAuthor(
    authorId: string,
    options?: {
      state?: ArticleState;
      limit?: number;
      offset?: number;
    }
  ): Promise<Article[]>;

  /**
   * 自動公開対象の記事を取得
   */
  findScheduledForAutoPublish(currentTime: Date): Promise<Article[]>;

  /**
   * 記事を削除
   */
  delete(id: string): Promise<void>;
}
