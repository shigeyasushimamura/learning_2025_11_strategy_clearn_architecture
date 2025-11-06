import { ArticleState } from "./ArticleState";
import { ArticleEvent } from "./ArticleEvent";

/**
 * 状態遷移の定義
 */
export interface StateTransition {
  from: ArticleState;
  event: ArticleEvent;
  to: ArticleState;
  guard?: (context: TransitionContext) => boolean;
}

/**
 * 遷移時のコンテキスト
 */
export interface TransitionContext {
  triggeredBy?: string;
  scheduledAt?: Date;
  currentTime?: Date;
}

/**
 * 状態遷移表
 *
 * 遷移図:
 *
 *   DRAFT <────→ SCHEDULED ─────→ PUBLISHED
 *     ↓            ↓                  ↓
 *     └──────────→ PUBLISHED ←───────┘
 *                     ↓
 *                  ARCHIVED
 *                     ↓
 *                  DRAFT (復元)
 */
export const transitions: StateTransition[] = [
  // DRAFT からの遷移
  {
    from: ArticleState.DRAFT,
    event: ArticleEvent.SAVE_DRAFT,
    to: ArticleState.DRAFT,
  },
  {
    from: ArticleState.DRAFT,
    event: ArticleEvent.SCHEDULE,
    to: ArticleState.SCHEDULED,
    guard: (ctx) => {
      // 未来の日時のみ予約可能
      if (!ctx.scheduledAt) return false;
      const now = ctx.currentTime || new Date();
      return ctx.scheduledAt > now;
    },
  },
  {
    from: ArticleState.DRAFT,
    event: ArticleEvent.PUBLISH,
    to: ArticleState.PUBLISHED,
  },

  // SCHEDULED からの遷移
  {
    from: ArticleState.SCHEDULED,
    event: ArticleEvent.SAVE_DRAFT,
    to: ArticleState.DRAFT,
  },
  {
    from: ArticleState.SCHEDULED,
    event: ArticleEvent.SCHEDULE,
    to: ArticleState.SCHEDULED,
    guard: (ctx) => {
      if (!ctx.scheduledAt) return false;
      const now = ctx.currentTime || new Date();
      return ctx.scheduledAt > now;
    },
  },
  {
    from: ArticleState.SCHEDULED,
    event: ArticleEvent.PUBLISH,
    to: ArticleState.PUBLISHED,
  },
  {
    from: ArticleState.SCHEDULED,
    event: ArticleEvent.AUTO_PUBLISH,
    to: ArticleState.PUBLISHED,
    guard: (ctx) => {
      // 予約時刻を過ぎている場合のみ自動公開
      if (!ctx.scheduledAt) return false;
      const now = ctx.currentTime || new Date();
      return ctx.scheduledAt <= now;
    },
  },

  // PUBLISHED からの遷移
  {
    from: ArticleState.PUBLISHED,
    event: ArticleEvent.UNPUBLISH,
    to: ArticleState.DRAFT,
  },
  {
    from: ArticleState.PUBLISHED,
    event: ArticleEvent.ARCHIVE,
    to: ArticleState.ARCHIVED,
  },

  // ARCHIVED からの遷移
  {
    from: ArticleState.ARCHIVED,
    event: ArticleEvent.RESTORE,
    to: ArticleState.DRAFT,
  },
];

/**
 * 特定の状態とイベントで遷移可能かチェック
 */
export function findTransition(
  from: ArticleState,
  event: ArticleEvent
): StateTransition | undefined {
  return transitions.find((t) => t.from === from && t.event === event);
}

/**
 * 特定の状態から可能なイベント一覧を取得
 */
export function getAvailableEvents(from: ArticleState): ArticleEvent[] {
  return transitions.filter((t) => t.from === from).map((t) => t.event);
}
