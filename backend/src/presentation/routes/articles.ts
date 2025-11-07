import { Hono } from "hono";
import { PrismaArticleRepository } from "../../infrastructure/database/PrismaArticleRepository";
import { ConsoleEventPublisher } from "../../infrastructure/events/ConsoleEventPublisher";
import { CreateArticleUseCase } from "../../application/usecases/CreateArticleUseCase";
import { PublishArticleUseCase } from "../../application/usecases/PublishArticleUseCase";
import { ScheduleArticleUseCase } from "../../application/usecases/ScheduleArticleUseCase";
import { GetArticleUseCase } from "../../application/usecases/GetArticleUseCase";
import { ArchiveArticleUseCase } from "../../application/usecases/ArchiveArticleUseCase";
import {
  CreateArticleInput,
  ScheduleArticleInput,
} from "../../application/dto/CreateArticleInput";

const articles = new Hono();

// 依存関係の初期化
const repository = new PrismaArticleRepository();
const eventPublisher = new ConsoleEventPublisher();

const createArticleUseCase = new CreateArticleUseCase(repository);
const publishArticleUseCase = new PublishArticleUseCase(
  repository,
  eventPublisher
);
const scheduleArticleUseCase = new ScheduleArticleUseCase(
  repository,
  eventPublisher
);
const getArticleUseCase = new GetArticleUseCase(repository);
const archiveArticleUseCase = new ArchiveArticleUseCase(
  repository,
  eventPublisher
);

/**
 * GET /articles
 * 公開中の記事一覧を取得
 */
articles.get("/", async (c) => {
  try {
    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;

    const articlesList = await repository.findPublished({ limit, offset });
    const total = await repository.count({ state: "PUBLISHED" as any });

    return c.json({
      articles: articlesList,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /articles/:id
 * 記事詳細を取得
 */
articles.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await getArticleUseCase.execute(id);

    if (result.isFailure) {
      const error = result.unwrapError();
      return c.json({ error: error.message }, 404);
    }

    return c.json(result.unwrap());
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /articles/slug/:slug
 * スラッグで記事を取得
 */
articles.get("/slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const result = await getArticleUseCase.executeBySlug(slug);

    if (result.isFailure) {
      const error = result.unwrapError();
      return c.json({ error: error.message }, 404);
    }

    return c.json(result.unwrap());
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /articles
 * 新規記事を作成
 */
articles.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateArticleInput>();
    console.log("init");
    // TODO: 認証ミドルウェアから userId を取得
    // 今は仮で body.authorId を使用
    if (!body.authorId) {
      return c.json({ error: "authorId is required" }, 400);
    }
    console.log("押し1");

    const result = await createArticleUseCase.execute(body);
    console.log("押し2");

    if (result.isFailure) {
      const error = result.unwrapError();
      return c.json({ error: error.message }, 400);
    }

    return c.json(result.unwrap(), 201);
  } catch (error) {
    console.error("Failed to create article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /articles/:id/publish
 * 記事を公開
 */
articles.post("/:id/publish", async (c) => {
  try {
    const id = c.req.param("id");
    // TODO: 認証ミドルウェアから userId を取得
    const userId = c.req.header("X-User-Id") || "temp-user-id";

    const result = await publishArticleUseCase.execute(id, userId);

    if (result.isFailure) {
      const error = result.unwrapError();
      const status = error.code === "UNAUTHORIZED" ? 403 : 400;
      return c.json({ error: error.message }, status);
    }

    return c.json(result.unwrap());
  } catch (error) {
    console.error("Failed to publish article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /articles/:id/schedule
 * 記事を予約投稿
 */
articles.post("/:id/schedule", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<ScheduleArticleInput>();
    const userId = c.req.header("X-User-Id") || "temp-user-id";

    // 日時文字列をDateオブジェクトに変換
    const input: ScheduleArticleInput = {
      scheduledAt: new Date(body.scheduledAt),
    };

    const result = await scheduleArticleUseCase.execute(id, input, userId);

    if (result.isFailure) {
      const error = result.unwrapError();
      const status = error.code === "UNAUTHORIZED" ? 403 : 400;
      return c.json({ error: error.message }, status);
    }

    return c.json(result.unwrap());
  } catch (error) {
    console.error("Failed to schedule article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /articles/:id/archive
 * 記事をアーカイブ
 */
articles.post("/:id/archive", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.req.header("X-User-Id") || "temp-user-id";

    const result = await archiveArticleUseCase.execute(id, userId);

    if (result.isFailure) {
      const error = result.unwrapError();
      const status = error.code === "UNAUTHORIZED" ? 403 : 400;
      return c.json({ error: error.message }, status);
    }

    return c.json(result.unwrap());
  } catch (error) {
    console.error("Failed to archive article:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { articles };
