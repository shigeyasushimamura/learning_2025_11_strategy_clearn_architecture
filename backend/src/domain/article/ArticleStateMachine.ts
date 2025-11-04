import { ArticleState } from "./ArticleState";
import { ArticleEvent, ArticleEventMetadata } from "./ArticleEvent";
import {
  findTransition,
  getAvailableEvents,
  TransitionContext,
} from "./ArticleTransition";
import { Result, ok, fail } from "../shared/Result";
import { InvalidStateTransitionError } from "../shared/DomainError";

/**
 * 記事の状態遷移マネージャ
 *
 * 責務:
 * - 状態遷移の検証
 * - 遷移の実行
 * - 遷移履歴の記録
 */
export class ArticleStateMachine {
  constructor(private currentState: ArticleState, private scheduledAt?: Date) {}

  /**
   * 現在の状態を取得
   */
  getState(): ArticleState {
    return this.currentState;
  }

  /**
   * 予約時刻を取得
   */
  getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }

  /**
   * イベントを適用して状態を遷移
   */
  transition(
    event: ArticleEvent,
    context: TransitionContext = {}
  ): Result<ArticleEventMetadata, InvalidStateTransitionError> {
    const transition = findTransition(this.currentState, event);

    if (!transition) {
      return fail(
        new InvalidStateTransitionError(
          this.currentState,
          event,
          "No transition defined"
        )
      );
    }

    //　ガード条件を検証
    if (transition.guard) {
      const guardContext: TransitionContext = {
        ...context,
        scheduledAt: context.scheduledAt || this.scheduledAt,
      };

      if (!transition.guard(guardContext)) {
        return fail(
          new InvalidStateTransitionError(
            this.currentState,
            event,
            "Guard condition failed"
          )
        );
      }
    }

    const previousState = this.currentState;
    this.currentState = transition.to;

    // 予約時刻を更新
    if (event === ArticleEvent.SCHEDULE && context.scheduledAt) {
      this.scheduledAt = context.scheduledAt;
    }

    // 予約解除(そのまま公開 or 下書きに戻す)
    if (
      previousState === ArticleState.SCHEDULED &&
      (event == ArticleEvent.PUBLISH || event === ArticleEvent.SAVE_DRAFT)
    ) {
      this.scheduledAt = undefined;
    }

    // イベントメタデータ作成
    const metadata: ArticleEventMetadata = {
      event,
      triggeredAt: context.currentTime || new Date(),
      triggeredBy: undefined,
      reason: undefined,
      scheduledAt: this.scheduledAt,
    };

    return ok(metadata);
  }

  /**
   * イベントが実行可能かチェック
   */
  canTransition(event: ArticleEvent, context: TransitionContext = {}): boolean {
    const transition = findTransition(this.currentState, event);
    if (!transition) return false;

    if (transition.guard) {
      const guardContext: TransitionContext = {
        ...context,
        scheduledAt: context.scheduledAt || this.scheduledAt,
      };
      return transition.guard(guardContext);
    }
    return true;
  }

  /**
   * 現在の状態から実行可能なイベント一覧
   */
  getAvailableEvents(): ArticleEvent[] {
    return getAvailableEvents(this.currentState);
  }

  /**
   * 公開可能かチェック
   */
  isPublishable(): boolean {
    return (
      this.currentState === ArticleState.DRAFT ||
      this.currentState === ArticleState.SCHEDULED
    );
  }

  /**
   * 編集可能かチェック
   */
  isEditable(): boolean {
    return (
      this.currentState === ArticleState.DRAFT ||
      this.currentState === ArticleState.SCHEDULED
    );
  }

  /**
   * 公開中かチェック
   */
  isPublished(): boolean {
    return this.currentState === ArticleState.PUBLISHED;
  }

  /**
   * 自走公開可能かチェック(予約時刻を過ぎているか)
   */
  canAutoPublish(currentTime: Date = new Date()): boolean {
    return (
      this.currentState === ArticleState.SCHEDULED &&
      this.scheduledAt !== undefined &&
      this.scheduledAt <= currentTime
    );
  }
}
