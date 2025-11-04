/**
 * 記事のイベント（状態遷移のトリガー）
 */
export enum ArticleEvent {
  SAVE_DRAFT = "SAVE_DRAFT", // 下書き保存
  SCHEDULE = "SCHEDULE", // 予約投稿設定
  PUBLISH = "PUBLISH", // 公開
  UNPUBLISH = "UNPUBLISH", // 非公開
  ARCHIVE = "ARCHIVE", // アーカイブ
  RESTORE = "RESTORE", // 復元
  AUTO_PUBLISH = "AUTO_PUBLISH", // 自動公開（システム）
}

/**
 * イベントの表示名
 */
export const ArticleEventLabels: Record<ArticleEvent, string> = {
  [ArticleEvent.SAVE_DRAFT]: "下書き保存",
  [ArticleEvent.SCHEDULE]: "予約投稿",
  [ArticleEvent.PUBLISH]: "公開",
  [ArticleEvent.UNPUBLISH]: "非公開",
  [ArticleEvent.ARCHIVE]: "アーカイブ",
  [ArticleEvent.RESTORE]: "復元",
  [ArticleEvent.AUTO_PUBLISH]: "自動公開",
};

/**
 * イベントのメタデータ
 */
export interface ArticleEventMetadata {
  event: ArticleEvent;
  triggeredAt: Date;
  triggeredBy?: string; // ユーザーID（自動の場合はundefined）
  reason?: string;
  scheduledAt?: Date; // SCHEDULE の場合
}
