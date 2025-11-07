import { AutoPublishArticleUseCase } from "../../application/usecases/AutoPublishArticleUseCase";
import { PrismaArticleRepository } from "../database/PrismaArticleRepository";
import { ConsoleEventPublisher } from "../events/ConsoleEventPublisher";

const SHCEDULE_INTERVAL = 60 * 1000; // 1分間隔

/**
 * 記事の自動公開スケジューラー
 * PostgresSQLの pg_cronで実行
 */
export class ArticleScheduler {
  private useCase: AutoPublishArticleUseCase;

  constructor() {
    const repository = new PrismaArticleRepository();
    const eventPublisher = new ConsoleEventPublisher();
    this.useCase = new AutoPublishArticleUseCase(repository, eventPublisher);
  }

  async runAutoPublish(): Promise<void> {
    try {
      const publishedCount = await this.useCase.execute();

      if (publishedCount > 0) {
        console.log(`✅ Auto-published ${publishedCount} article(s)`);
      }
    } catch (error) {
      console.error("❌ Auto-publish failed:", error);
    }
  }
}

/**
 * PostgresSQLのpg_cronからキック
 */
export async function runAutoPublishTask(): Promise<void> {
  const scheduler = new ArticleScheduler();
  await scheduler.runAutoPublish();
}
