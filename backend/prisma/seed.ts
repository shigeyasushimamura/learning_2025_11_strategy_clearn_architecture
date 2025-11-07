import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ユーザー作成
  const user = await prisma.user.upsert({
    where: { email: "author@example.com" },
    update: {},
    create: {
      email: "author@example.com",
      name: "Travel Blogger",
      bio: "世界中を旅するブロガー",
      role: "AUTHOR",
    },
  });

  console.log("✅ Created/Found user:", user.email);

  // タグ作成
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: "japan" },
      update: {},
      create: { name: "日本", slug: "japan" },
    }),
    prisma.tag.upsert({
      where: { slug: "food" },
      update: {},
      create: { name: "グルメ", slug: "food" },
    }),
    prisma.tag.upsert({
      where: { slug: "sightseeing" },
      update: {},
      create: { name: "観光", slug: "sightseeing" },
    }),
  ]);

  console.log("✅ Created/Found tags:", tags.map((t) => t.name).join(", "));

  // 記事作成
  const article = await prisma.article.upsert({
    where: { slug: "tokyo-hidden-restaurants" },
    update: {},
    create: {
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

  console.log("✅ Created/Found article:", article.title);

  // コメント作成
  const existingComment = await prisma.comment.findFirst({
    where: {
      content: "素晴らしい記事ですね！",
      articleId: article.id,
      authorId: user.id,
    },
  });

  if (!existingComment) {
    const comment = await prisma.comment.create({
      data: {
        content: "素晴らしい記事ですね！",
        articleId: article.id,
        authorId: user.id,
      },
    });
    console.log("✅ Created comment:", comment.id);
  } else {
    console.log("✅ Comment already exists:", existingComment.id);
  }

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
