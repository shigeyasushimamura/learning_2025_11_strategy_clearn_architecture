/**
 * 記事の状態
 */
export enum ArticleState {
  DRAFT = "DRAFT", // 下書き
  SCHEDULED = "SCHEDULED", // 予約投稿
  PUBLISHED = "PUBLISHED", // 公開中
  ARCHIVED = "ARCHIVED", // アーカイブ
}

/**
 * 状態の表示名
 */
export const ArticleStateLabels: Record<ArticleState, string> = {
  [ArticleState.DRAFT]: "下書き",
  [ArticleState.SCHEDULED]: "予約投稿",
  [ArticleState.PUBLISHED]: "公開中",
  [ArticleState.ARCHIVED]: "アーカイブ",
};

/**
 * 状態の説明
 */
export const ArticleStateDescriptions: Record<ArticleState, string> = {
  [ArticleState.DRAFT]: "編集中の記事。外部からは見えません。",
  [ArticleState.SCHEDULED]: "指定日時に自動公開される記事。",
  [ArticleState.PUBLISHED]: "公開中の記事。誰でも閲覧できます。",
  [ArticleState.ARCHIVED]: "アーカイブされた記事。検索対象外です。",
};
