import { IEventPublisher } from "../../application/ports/IEventPublisher";
import { ArticleEventMetadata } from "../../domain/article/ArticleEvent";
import { ArticleState, PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../database/PrismaClient";

/**
 * コンソール出力 + DB保存のイベント発行
 */
export class ConsoleEventPublisher implements IEventPublisher {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  async publishArticleStateChanged(
    articleId: string,
    metadata: ArticleEventMetadata
  ): Promise<void> {
    // コンソールにログ出力
    console.log("📢 Article State Changed:", {
      articleId,
      event: metadata.event,
      triggeredAt: metadata.triggeredAt,
      triggeredBy: metadata.triggeredBy || "system",
    });

    // 状態履歴をDBに保存
    try {
      // 記事を取得して現在の状態を確認
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        console.error("❌ Article not found:", articleId);
        return;
      }

      // ArticleStateHistory に保存
      await this.prisma.articleStateHistory.create({
        data: {
          articleId,
          fromState: this.inferFromState(article.state, metadata.event),
          toState: article.state,
          event: metadata.event,
          createdAt: metadata.triggeredAt,
        },
      });

      console.log("✅ State history saved");
    } catch (error) {
      console.error("❌ Failed to save state history:", error);
    }
  }

  /**
   * イベントから遷移元の状態を推測
   * （本来はメタデータに含めるべきだが、簡易実装）
   */
  private inferFromState(currentState: string, event: string): ArticleState {
    // 簡易実装：現在の状態とイベントから推測
    // 実際のプロダクションでは、メタデータに fromState を含めるべき
    if (event === "PUBLISH") {
      return currentState === "PUBLISHED" ? "DRAFT" : "SCHEDULED";
    }
    if (event === "SCHEDULE") {
      return "DRAFT";
    }
    if (event === "ARCHIVE") {
      return "PUBLISHED";
    }
    if (event === "RESTORE") {
      return "ARCHIVED";
    }
    return "DRAFT";
  }
}
