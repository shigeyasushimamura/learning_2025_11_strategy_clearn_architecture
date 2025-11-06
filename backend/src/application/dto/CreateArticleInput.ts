/**
 * 記事作成の入力
 */
export interface CreateArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  tagIds?: string[];
}

/**
 * 記事更新の入力
 */
export interface UpdateArticleInput {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  tagIds?: string[];
}

/**
 * 予約投稿の入力
 */
export interface ScheduleArticleInput {
  scheduledAt: Date;
}
