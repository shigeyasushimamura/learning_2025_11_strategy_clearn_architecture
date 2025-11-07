import { Hono } from "hono";
import { ArticleScheduler } from "../../infrastructure/scheduler/ArticleScheduler";

const cron = new Hono();

/**
 * POST /cron/auto-publish
 * 自動公開を実行（pg_cron から叩かれる）
 */
cron.post("/auto-publish", async (c) => {
  try {
    // 本番環境では API キーで認証すべき
    const apiKey = c.req.header("X-Cron-Key");
    if (
      process.env.NODE_ENV === "production" &&
      apiKey !== process.env.CRON_API_KEY
    ) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const scheduler = new ArticleScheduler();
    await scheduler.runAutoPublish();

    return c.json({ success: true, message: "Auto-publish completed" });
  } catch (error) {
    console.error("Cron job failed:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { cron };
