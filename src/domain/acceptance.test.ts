import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AssignmentService } from "./AssignmentService";
import { Directory } from "./Directory";
import { MeetingCatalog } from "./MeetingCatalog";
import { RulesEngine } from "./RulesEngine";
import { SessionActions } from "./SessionActions";
import { SessionStore } from "./SessionStore";
import type { ExtractedTodo } from "./types";

function minutes(name: string): string {
  return readFileSync(path.join(process.cwd(), "public", "fixtures", name), "utf8").trim();
}

function snapshot(todo: ExtractedTodo) {
  const owner = todo.ownerId ? Directory.byId(todo.ownerId) : null;
  return {
    title: todo.title,
    ownerName: owner?.name ?? null,
    ownerTitle: owner?.title ?? null,
    dueDate: todo.dueDate,
    status: todo.status,
    needsAttention: todo.needsAttention,
  };
}

describe("样例纪要提取", () => {
  it("二号工厂生产周会与预期行完全一致", () => {
    const meeting = MeetingCatalog.byId("factory-weekly");
    expect(meeting).not.toBeNull();
    const todos = RulesEngine.extract(minutes("factory-weekly.txt"), meeting!.date);
    expect(todos.map(snapshot)).toEqual([
      {
        title: "查明二号线良率下降原因并给结论",
        ownerName: null,
        ownerTitle: null,
        dueDate: "2026-11-13",
        status: "pending",
        needsAttention: true,
      },
      {
        title: "与供应商 B 再谈一轮报价",
        ownerName: null,
        ownerTitle: null,
        dueDate: "2026-11-30",
        status: "pending",
        needsAttention: true,
      },
      {
        title: "看新员工培训材料",
        ownerName: null,
        ownerTitle: null,
        dueDate: null,
        status: "pending",
        needsAttention: true,
      },
      {
        title: "发出夜班排班表",
        ownerName: null,
        ownerTitle: null,
        dueDate: "2026-11-06",
        status: "pending",
        needsAttention: true,
      },
    ]);
    expect(todos.some((todo) => todo.title.includes("点检"))).toBe(false);
  });

  it("MES 升级项目周例会与预期行完全一致", () => {
    const meeting = MeetingCatalog.byId("mes-weekly");
    expect(meeting).not.toBeNull();
    const todos = RulesEngine.extract(minutes("mes-weekly.txt"), meeting!.date);
    expect(todos.map(snapshot)).toEqual([
      {
        title: "和供应商确认新的到货时间",
        ownerName: "张伟",
        ownerTitle: "采购",
        dueDate: null,
        status: "pending",
        needsAttention: true,
      },
      {
        title: "补齐质量模块测试用例",
        ownerName: "张伟",
        ownerTitle: "质量",
        dueDate: "2026-11-14",
        status: "pending",
        needsAttention: false,
      },
      {
        title: "数据迁移方案初稿",
        ownerName: "孙浩",
        ownerTitle: "MES 项目",
        dueDate: null,
        status: "pending",
        needsAttention: true,
      },
    ]);
    expect(todos.some((todo) => todo.ownerId === "liu-yang")).toBe(false);
    expect(todos.some((todo) => todo.title.includes("服务器扩容"))).toBe(false);
  });

  it("确认前不派发，空负责人在确认后仍未派发", () => {
    const meeting = MeetingCatalog.byId("factory-weekly")!;
    const todos = RulesEngine.extract(minutes("factory-weekly.txt"), meeting.date);
    expect(todos.every((todo) => todo.status === "pending")).toBe(true);
    const confirmed = AssignmentService.confirm(todos);
    expect(confirmed.map((todo) => todo.status)).toEqual([
      "unassigned",
      "unassigned",
      "unassigned",
      "unassigned",
    ]);
    const state = SessionActions.confirm({
      ...SessionStore.empty(),
      role: "organizer",
      meetingId: meeting.id,
      minutes: minutes("factory-weekly.txt"),
      phase: "review",
      todos,
    });
    expect(state.phase).toBe("confirmed");
    expect(state.todos.every((todo) => todo.status === "unassigned")).toBe(true);
  });

  it("负责人角色不能确认派发", () => {
    const meeting = MeetingCatalog.byId("mes-weekly")!;
    const todos = RulesEngine.extract(minutes("mes-weekly.txt"), meeting.date);
    const state = {
      ...SessionStore.empty(),
      role: "assignee" as const,
      meetingId: meeting.id,
      phase: "review" as const,
      todos,
    };
    expect(SessionActions.confirm(state)).toBe(state);
    const dispatched = SessionActions.confirm({ ...state, role: "organizer" });
    expect(dispatched.todos.map((todo) => todo.status)).toEqual([
      "assigned",
      "assigned",
      "assigned",
    ]);
  });
});
