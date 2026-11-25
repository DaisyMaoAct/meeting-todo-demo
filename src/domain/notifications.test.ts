import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MeetingCatalog } from "./MeetingCatalog";
import { NotificationLinks } from "./NotificationLinks";
import { RulesEngine } from "./RulesEngine";
import { SessionActions } from "./SessionActions";
import { SessionStore } from "./SessionStore";
import { SimulatedClock } from "./SimulatedClock";
import type { AppNotification, ExtractedTodo, SessionState } from "./types";

function minutes(name: string): string {
  return readFileSync(path.join(process.cwd(), "public", "fixtures", name), "utf8").trim();
}

function todo(patch: Partial<ExtractedTodo> = {}): ExtractedTodo {
  return {
    id: "t1",
    title: "事项",
    ownerId: "li-qiang",
    dueDate: "2026-11-27",
    status: "pending",
    needsAttention: false,
    ...patch,
  };
}

function review(
  todos: ExtractedTodo[],
  simulatedDate = SimulatedClock.initial,
  meetingId = "factory-weekly",
): SessionState {
  return {
    ...SessionStore.empty(),
    role: "organizer",
    meetingId,
    phase: "review",
    simulatedDate,
    minutes: "纪要",
    todos,
  };
}

function reminders(state: SessionState): AppNotification[] {
  return state.notifications.filter((item) => item.kind === "reminder");
}

describe("派发通知", () => {
  it("只通知已派发且有负责人的条目", () => {
    const state = SessionActions.confirm(
      review([
        todo({ id: "a", ownerId: "li-qiang", title: "有人负责", dueDate: "2026-11-27" }),
        todo({ id: "b", ownerId: null, title: "没有负责人", dueDate: "2026-11-27", needsAttention: true }),
      ]),
    );
    expect(state.todos.map((item) => item.status)).toEqual(["assigned", "unassigned"]);
    expect(state.notifications.map((item) => item.todoId)).toEqual(["a"]);
    expect(state.notifications[0]).toMatchObject({
      kind: "assigned",
      title: "有人负责",
      dueDate: "2026-11-27",
      ownerId: "li-qiang",
    });
  });

  it("样例工厂纪要确认后没有通知", () => {
    const meeting = MeetingCatalog.byId("factory-weekly")!;
    const todos = RulesEngine.extract(minutes("factory-weekly.txt"), meeting.date);
    const state = SessionActions.confirm(
      review(todos, SimulatedClock.initial, meeting.id),
    );
    expect(state.todos.every((item) => item.status === "unassigned")).toBe(true);
    expect(state.notifications).toEqual([]);
  });

  it("会议外负责人进入待办详情，参会人进入会议页", () => {
    const state = SessionActions.confirm(
      review([
        todo({ id: "in", ownerId: "li-qiang", title: "会内事项", dueDate: "2026-11-27" }),
        todo({ id: "out", ownerId: "he-tao", title: "会外事项", dueDate: "2026-11-25" }),
      ]),
    );
    const inside = state.notifications.find((item) => item.todoId === "in" && item.kind === "assigned");
    const outside = state.notifications.filter((item) => item.todoId === "out");
    expect(inside).toMatchObject({
      entry: "meeting",
      href: "/?meeting=factory-weekly",
      title: "会内事项",
      dueDate: "2026-11-27",
    });
    expect(outside.map((item) => item.kind).sort()).toEqual(["assigned", "reminder"]);
    expect(outside.every((item) => item.entry === "todo" && item.href === "/todos/out")).toBe(true);
    expect(outside.every((item) => item.href.includes("factory-weekly"))).toBe(false);
    expect(outside.every((item) => item.title === "会外事项" && item.dueDate === "2026-11-25")).toBe(true);
  });

  it("发起人不在参会名单里时，入口仍然是会议页", () => {
    const meeting = {
      ...MeetingCatalog.byId("factory-weekly")!,
      attendeeIds: ["li-qiang"],
    };
    expect(NotificationLinks.forOwner(meeting, meeting.organizerId, "t1")).toEqual({
      entry: "meeting",
      href: "/?meeting=factory-weekly",
    });
    expect(NotificationLinks.forOwner(meeting, "he-tao", "t1")).toEqual({
      entry: "todo",
      href: "/todos/t1",
    });
  });

  it("样例 MES 纪要里的参会负责人进入会议页，且过期或无截止日期不提醒", () => {
    const meeting = MeetingCatalog.byId("mes-weekly")!;
    const todos = RulesEngine.extract(minutes("mes-weekly.txt"), meeting.date);
    const state = SessionActions.confirm(review(todos, SimulatedClock.initial, meeting.id));
    expect(state.notifications.map((item) => item.ownerId).sort()).toEqual([
      "sun-hao",
      "zhang-wei-purchase",
      "zhang-wei-quality",
    ]);
    expect(
      state.notifications.every(
        (item) => item.kind === "assigned" && item.entry === "meeting" && item.href === "/?meeting=mes-weekly",
      ),
    ).toBe(true);
    expect(reminders(state)).toEqual([]);
  });
});

describe("标记完成", () => {
  it("当前负责人标记完成后，发起人看到同一条已完成", () => {
    let state = SessionActions.confirm(review([todo({ id: "a", ownerId: "li-qiang", title: "良率" })]));
    state = SessionActions.setRole(state, "assignee");
    expect(SessionActions.complete(state, "a")).toBe(state);
    state = SessionActions.setActor(state, "he-tao");
    expect(SessionActions.complete(state, "a")).toBe(state);
    state = SessionActions.setActor(state, "li-qiang");
    state = SessionActions.complete(state, "a");
    expect(state.todos[0]?.status).toBe("completed");
    state = SessionActions.setRole(state, "organizer");
    expect(state.todos.find((item) => item.id === "a")?.status).toBe("completed");
    const revived = SessionStore.revive(JSON.parse(JSON.stringify(state)));
    expect(revived?.phase).toBe("confirmed");
    expect(revived?.todos.find((item) => item.id === "a")?.status).toBe("completed");
    expect(revived?.minutes).toBe("纪要");
  });

  it("发起人不能代替负责人标记完成", () => {
    let state = SessionActions.confirm(review([todo({ id: "a" })]));
    state = SessionActions.setActor(state, "li-qiang");
    expect(SessionActions.complete(state, "a")).toBe(state);
  });

  it("完成后不再补到期提醒", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-27" })]));
    state = SessionActions.setRole(state, "assignee");
    state = SessionActions.setActor(state, "li-qiang");
    state = SessionActions.complete(state, "t1");
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    expect(reminders(state)).toEqual([]);
  });
});

describe("到期提醒", () => {
  it("到期前一个自然日提醒一次", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-27", title: "下周结论" })]));
    expect(reminders(state)).toEqual([]);
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    expect(reminders(state)).toEqual([
      expect.objectContaining({
        reminder: "scheduled",
        title: "下周结论",
        dueDate: "2026-11-27",
        ownerId: "li-qiang",
      }),
    ]);
  });

  it("提醒日按自然日减一天，可以跨月", () => {
    const state = SessionActions.confirm(
      review([todo({ dueDate: "2026-11-01", title: "跨月" })], "2026-10-31"),
    );
    expect(reminders(state)).toEqual([
      expect.objectContaining({ reminder: "scheduled", dueDate: "2026-11-01", createdOn: "2026-10-31" }),
    ]);
  });

  it("确认时截止日还没结束但已不足一个自然日，立即补发", () => {
    const state = SessionActions.confirm(
      review([todo({ dueDate: "2026-11-25", title: "今天到期" })]),
    );
    expect(reminders(state)).toEqual([
      expect.objectContaining({
        reminder: "backfill",
        title: "今天到期",
        dueDate: "2026-11-25",
      }),
    ]);
  });

  it("从提醒日之前直接拨到截止日期当天，补发且仍然只有一条", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-27" })]));
    state = SessionActions.setSimulatedDate(state, "2026-11-27");
    expect(reminders(state)).toEqual([expect.objectContaining({ reminder: "backfill" })]);
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    expect(reminders(state)).toHaveLength(1);
    expect(state.notifications.filter((item) => item.kind === "assigned")).toHaveLength(1);
  });

  it("确认时已经过期则不提醒，调回提醒日也不补", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-20", title: "已过期" })]));
    expect(reminders(state)).toEqual([]);
    expect(state.notifications).toHaveLength(1);
    state = SessionActions.setSimulatedDate(state, "2026-11-19");
    expect(reminders(state)).toEqual([]);
  });

  it("跳过提醒窗口直到过期后不再补发", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-27" })]));
    state = SessionActions.setSimulatedDate(state, "2026-11-28");
    expect(reminders(state)).toEqual([]);
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    expect(reminders(state)).toEqual([]);
  });

  it("没有截止日期不提醒", () => {
    let state = SessionActions.confirm(
      review([todo({ dueDate: null, needsAttention: true, title: "没有日期" })]),
    );
    expect(state.notifications).toEqual([
      expect.objectContaining({ kind: "assigned", dueDate: null, title: "没有日期" }),
    ]);
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    state = SessionActions.setSimulatedDate(state, "2026-12-01");
    expect(reminders(state)).toEqual([]);
  });

  it("同一条待办最多一条提醒", () => {
    let state = SessionActions.confirm(review([todo({ dueDate: "2026-11-27" })]));
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    state = SessionActions.setSimulatedDate(state, "2026-11-27");
    state = SessionActions.setSimulatedDate(state, "2026-11-26");
    expect(reminders(state)).toHaveLength(1);
  });
});

describe("会话迁移", () => {
  it("刷新旧的核对会话时保留会议、纪要、待办和阶段", () => {
    const revived = SessionStore.revive({
      role: "organizer",
      meetingId: "mes-weekly",
      minutes: "正文还在",
      fileName: "mes-weekly.docx",
      phase: "review",
      error: null,
      todos: [
        {
          id: "t1",
          title: "补齐质量模块测试用例",
          ownerId: "zhang-wei-quality",
          dueDate: "2026-11-14",
          status: "pending",
          needsAttention: false,
        },
      ],
    });
    expect(revived).toMatchObject({
      role: "organizer",
      meetingId: "mes-weekly",
      minutes: "正文还在",
      fileName: "mes-weekly.docx",
      phase: "review",
      simulatedDate: SimulatedClock.initial,
      actorId: null,
      notifications: [],
      reminderSkips: [],
    });
    expect(revived?.todos).toEqual([
      {
        id: "t1",
        title: "补齐质量模块测试用例",
        ownerId: "zhang-wei-quality",
        dueDate: "2026-11-14",
        status: "pending",
        needsAttention: false,
      },
    ]);
  });

  it("坏掉的通知条目不会清掉已确认的待办", () => {
    const revived = SessionStore.revive({
      role: "organizer",
      meetingId: "factory-weekly",
      minutes: "保留",
      fileName: null,
      phase: "confirmed",
      error: null,
      todos: [
        {
          id: "a",
          title: "发出夜班排班表",
          ownerId: "chen-jing",
          dueDate: "2026-11-06",
          status: "assigned",
          needsAttention: false,
        },
      ],
      notifications: [
        { bad: true },
        {
          id: "assigned:a",
          kind: "assigned",
          reminder: null,
          todoId: "a",
          ownerId: "chen-jing",
          title: "发出夜班排班表",
          dueDate: "2026-11-06",
          entry: "meeting",
          href: "/?meeting=factory-weekly",
          createdOn: "2026-11-25",
        },
      ],
    });
    expect(revived?.phase).toBe("confirmed");
    expect(revived?.todos).toHaveLength(1);
    expect(revived?.notifications).toHaveLength(1);
    expect(revived?.notifications[0]?.title).toBe("发出夜班排班表");
  });
});
