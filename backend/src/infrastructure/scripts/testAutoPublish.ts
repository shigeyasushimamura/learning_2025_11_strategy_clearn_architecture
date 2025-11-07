import { ArticleScheduler } from "../scheduler/ArticleScheduler";
import { getPrismaClient } from "../database/PrismaClient";
import { ArticleState } from "../../domain/article/ArticleState";

/**
 * 自動公開のテストスクリプト
 */
async function main() {
  const prisma = getPrismaClient();

  console.log("🧪 Creating test scheduled article...");

  // テストユーザー取得
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No user found. Run seed first.");
    return;
  }

  // 1分前の予約投稿を作成
  const scheduledTime = new Date(Date.now() - 60000);
  const article = await prisma.article.create({
    data: {
      title: "Auto Publish Test Article",
      slug: "auto-publish-test-" + Date.now(),
      content: "This article should be auto-published.",
      state: ArticleState.SCHEDULED,
      scheduledAt: scheduledTime,
      authorId: user.id,
    },
  });

  console.log("✅ Created article:", article.id);
  console.log("📅 Scheduled at:", scheduledTime);

  // スケジューラーを起動
  const scheduler = new ArticleScheduler();
  console.log("\n🚀 Running auto-publish...\n");

  await scheduler.runAutoPublish();

  // 結果確認
  const updated = await prisma.article.findUnique({
    where: { id: article.id },
  });

  console.log("\n📊 Result:");
  console.log("State:", updated?.state);
  console.log("Published at:", updated?.publishedAt);

  await prisma.$disconnect();
}

main();
