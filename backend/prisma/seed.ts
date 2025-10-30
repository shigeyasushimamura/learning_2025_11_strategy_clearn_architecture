import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ユーザー作成
  const user = await prisma.user.create({
    data: {
      email: "author@example.com",
      name: "Travel Blogger",
      bio: "世界中を旅するブロガー",
      role: "AUTHOR",
    },
  });

  console.log("✅ Created user:", user.email);

  // タグ作成
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "日本", slug: "japan" } }),
    prisma.tag.create({ data: { name: "グルメ", slug: "food" } }),
    prisma.tag.create({ data: { name: "観光", slug: "sightseeing" } }),
  ]);

  console.log("✅ Created tags:", tags.map((t) => t.name).join(", "));

  // 記事作成
  const article = await prisma.article.create({
    data: {
      title: "東京の隠れた名店を巡る旅",
      slug: "tokyo-hidden-restaurants",
      content: "東京には知られざる名店がたくさんあります...",
      excerpt: "東京の隠れた名店を紹介",
      state: "PUBLISHED",
      publishedAt: new Date(),
      authorId: user.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[1].id }],
      },
    },
  });

  console.log("✅ Created article:", article.title);

  // コメント作成
  const comment = await prisma.comment.create({
    data: {
      content: "素晴らしい記事ですね！",
      articleId: article.id,
      authorId: user.id,
    },
  });

  console.log("✅ Created comment:", comment.id);

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
