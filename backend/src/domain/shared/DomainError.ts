// Record<string,unknown>はキーが文字列で、値の型はなんでもokなオブジェクト
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * 状態遷移エラー
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, event: string, reason?: string) {
    super(
      `Cannot transition from ${from} with event ${event}${
        reason ? `: ${reason}` : ""
      }`,
      "INVALID_STATE_TRANSITION",
      { from, event, reason }
    );
    this.name = "InvalidStateTransitionError";
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", { field });
    this.name = "ValidationError";
  }
}
