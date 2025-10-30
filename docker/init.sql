-- pg_cron拡張を有効化（予約投稿用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- UUIDサポート
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文検索（日本語対応）
CREATE EXTENSION IF NOT EXISTS pg_trgm;