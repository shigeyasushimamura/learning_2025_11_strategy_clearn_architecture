import { ArticleStateMachine } from "./ArticleStateMachine";
import { ArticleState } from "./ArticleState";
import { ArticleEvent } from "./ArticleEvent";
import { describe, expect, it } from "vitest";

const ONE_DAY_MILLISECONDS = 86400000;
const ONE_SECOND = 1000;
const ONE_MILLISECOND = 1;

describe("ArticleStateMachine", () => {
  describe("正常系の状態遷移(スケジュール機能以外)", () => {
    const testCases = [
      {
        name: "DRAFT -> PUBLISH -> PUBLISHED",
        initialState: ArticleState.DRAFT,
        event: ArticleEvent.PUBLISH,
        expectedState: ArticleState.PUBLISHED,
      },
      {
        name: "PUBLISHED -> UNPUBLISH -> DRAFT",
        initialState: ArticleState.PUBLISHED,
        event: ArticleEvent.UNPUBLISH,
        expectedState: ArticleState.DRAFT,
      },
    ];

    testCases.forEach(({ name, initialState, event, expectedState }) => {
      it(name, () => {
        const machine = new ArticleStateMachine(initialState);
        const result = machine.transition(event);

        expect(result.isSuccess).toBe(true);
        expect(machine.getState()).toBe(expectedState);
      });
    });
  });

  describe("正常系のスケジュール機能の状態遷移", () => {
    it("未来の日時でスケジュール設定成功", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const futureDate = new Date(Date.now() + ONE_DAY_MILLISECONDS);

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: futureDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(machine.getState()).toBe(ArticleState.SCHEDULED);
      expect(machine.getScheduledAt()).toEqual(futureDate);
    });

    it("過去の日時でスケジュール設定失敗", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const pastDate = new Date(Date.now() - ONE_DAY_MILLISECONDS);

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: pastDate,
      });

      expect(result.isFailure).toBe(true);
      expect(result.unwrapError().message).toBe(
        "Cannot transition from DRAFT with event SCHEDULE: Guard condition failed"
      );
      expect(machine.getState()).toBe(ArticleState.DRAFT);
    });

    it("境界値: 現在時刻ちょうどでスケジュール設定失敗", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const now = new Date();

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: now,
      });

      expect(result.isFailure).toBe(true);
      expect(machine.getState()).toBe(ArticleState.DRAFT);
    });

    it("境界値: 1ミリ秒後の日時でスケジュール設定成功", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const futureDate = new Date(Date.now() + ONE_MILLISECOND);

      const result = machine.transition(ArticleEvent.SCHEDULE, {
        scheduledAt: futureDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(machine.getState()).toBe(ArticleState.SCHEDULED);
    });
  });

  describe("自動公開機能", () => {
    it("SCHEDULED → AUTO_PUBLISH → PUBLISHED（時刻到達）", () => {
      const scheduledTime = new Date(Date.now() - ONE_SECOND);
      const machine = new ArticleStateMachine(
        ArticleState.SCHEDULED,
        scheduledTime
      );

      const result = machine.transition(ArticleEvent.AUTO_PUBLISH);
      expect(result.isSuccess).toBe(true);
      expect(machine.getState()).toBe(ArticleState.PUBLISHED);
    });

    it("SCHEDULED → AUTO_PUBLISH 失敗（時刻未到達）", () => {
      const futureTime = new Date(Date.now() + ONE_DAY_MILLISECONDS);
      const machine = new ArticleStateMachine(
        ArticleState.SCHEDULED,
        futureTime
      );

      const result = machine.transition(ArticleEvent.AUTO_PUBLISH);
      expect(result.isFailure).toBe(true);
      expect(result.unwrapError().message).toBe(
        "Cannot transition from SCHEDULED with event AUTO_PUBLISH: Guard condition failed"
      );
      expect(machine.getState()).toBe(ArticleState.SCHEDULED);
    });
  });

  describe("異常系の状態遷移", () => {
    const testCases = [
      {
        name: "PUBLISHED → SCHEDULE は不可",
        initialState: ArticleState.PUBLISHED,
        opt: { scheduledAt: new Date(Date.now() + ONE_DAY_MILLISECONDS) },
        event: ArticleEvent.SCHEDULE,
        expectedError:
          "Cannot transition from PUBLISHED with event SCHEDULE: No transition defined",
      },
      {
        name: "ARCHIVED → PUBLISH は不可",
        initialState: ArticleState.ARCHIVED,
        opt: {},
        event: ArticleEvent.PUBLISH,
        expectedError:
          "Cannot transition from ARCHIVED with event PUBLISH: No transition defined",
      },
    ];

    testCases.forEach(({ name, initialState, opt, event, expectedError }) => {
      it(name, () => {
        const machine = new ArticleStateMachine(initialState);
        const result = machine.transition(event, opt);

        expect(result.isFailure).toBe(true);
        expect(result.unwrapError().message).toBe(expectedError);
        expect(machine.getState()).toBe(initialState); // 状態が変わっていないことも確認
      });
    });
  });

  describe("ステートマシンのヘルパーメソッド", () => {
    it("getAvailableEvents() で可能なイベントを取得", () => {
      const machine = new ArticleStateMachine(ArticleState.DRAFT);
      const events = machine.getAvailableEvents();

      expect(events).toContain(ArticleEvent.SAVE_DRAFT);
      expect(events).toContain(ArticleEvent.SCHEDULE);
      expect(events).toContain(ArticleEvent.PUBLISH);
    });

    it("canAutoPublish() で自動公開可能かチェック", () => {
      const pastTime = new Date(Date.now() - ONE_SECOND);
      const machine = new ArticleStateMachine(ArticleState.SCHEDULED, pastTime);

      expect(machine.canAutoPublish()).toBe(true);
    });

    it("canAutoPublish() で自動公開不可をチェック", () => {
      const futureTime = new Date(Date.now() + ONE_SECOND);
      const machine = new ArticleStateMachine(
        ArticleState.SCHEDULED,
        futureTime
      );

      expect(machine.canAutoPublish()).toBe(false);
    });

    it("境界値: canAutoPublish() で現在時刻ちょうどは公開可能", () => {
      const now = new Date();
      const machine = new ArticleStateMachine(ArticleState.SCHEDULED, now);

      expect(machine.canAutoPublish()).toBe(true);
    });
  });
});
