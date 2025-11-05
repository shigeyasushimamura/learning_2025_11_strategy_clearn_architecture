import { ArticleStateMachine } from "./ArticleStateMachine";
import { ArticleState } from "./ArticleState";
import { ArticleEvent } from "./ArticleEvent";
import { describe, expect, it } from "vitest";

describe("ArticleStateMachine", () => {
  describe("基本的な状態遷移", () => {
    it("DRAFT -> PUBLISH -> PUBLISHED", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      expect(machine.getState()).toBe(ArticleState.DRAFT);

      const result = machine.transition(ArticleEvent.PUBLISH);
      expect(result.isSuccess).toBe(true);
      expect(machine.getState()).toBe(ArticleState.PUBLISHED);
    });

    it("DRAFT -> SCHEDULE -> SCHEDULED(未来の日時", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const futureDate = new Date(Date.now() + 864000000); //1日後の時刻

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: futureDate,
      });
      expect(result.isSuccess).toBe(true);
      expect(machine.getState()).toBe(ArticleState.SCHEDULED);
      expect(machine.getScheduledAt()).toEqual(futureDate);
    });

    it("DRAFT -> SCHEDULE 失敗(過去の日時を設定)", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const pastDate = new Date(Date.now() - 86400000); // 1日前の時刻

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: pastDate,
      });
      expect(result.isFailure).toBe(true);

      // 状態が変化しないことを確認する
      expect(machine.getState()).toBe(ArticleState.DRAFT);
    });
  });
});
