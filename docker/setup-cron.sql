-- pg_cronの設定

-- 既存のジョブを削除（再設定時用）
SELECT cron.unschedule('auto-publish-articles');

-- 毎分実行: 予約投稿を自動公開
-- TODO(拡張案):API エンドポイント経由で実行
SELECT cron.schedule(
  'auto-publish-articles',
  '* * * * *', -- 毎分実行
  $$
  -- トリガー関数を呼び出す
  NOTIFY auto_publish_trigger;
  $$
);

-- ジョブの確認
SELECT * FROM cron.job;



-- 実行コマンド
-- docker exec -it travel_blog_db psql -U admin -d travel_blog -f /docker-entrypoint-initdb.d/setup-cron.sql