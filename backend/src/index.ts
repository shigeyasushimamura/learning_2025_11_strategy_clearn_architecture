import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { articles } from "./presentation/routes/articles";
import { cron } from "./presentation/routes/cron";
import { cors } from "./presentation/middleware/cors";
import { logger } from "./presentation/middleware/logger";
import { ArticleScheduler } from "./infrastructure/scheduler/ArticleScheduler";
import { disconnectPrisma } from "./infrastructure/database/PrismaClient";

// Hono アプリケーション
const app = new Hono();

// ミドルウェア
app.use("*", logger);
app.use("*", cors);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ルーティング
app.route("/api/articles", articles);
app.route("/api/cron", cron);

// 404
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// エラーハンドリング
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// サーバー起動
const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Server starting on http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await disconnectPrisma();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await disconnectPrisma();
  process.exit(0);
});
