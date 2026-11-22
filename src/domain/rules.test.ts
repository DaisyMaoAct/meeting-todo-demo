import { readFileSync } from "node:fs";
import JSZip from "jszip";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Calendar } from "./Calendar";
import { Directory } from "./Directory";
import { DocxTextReader } from "./DocxTextReader";
import { DueDateResolver } from "./DueDateResolver";
import { MeetingCatalog } from "./MeetingCatalog";
import { NextMeetingResolver } from "./NextMeetingResolver";
import { OwnerResolver } from "./OwnerResolver";
import { RoleKeys } from "./RoleKeys";
import { RulesEngine } from "./RulesEngine";
import { TodoEdits } from "./TodoEdits";

const contacts = Directory.contacts;

describe("日期规则", () => {
  it("以周一为一周的开始计算周五", () => {
    expect(Calendar.weekday("2026-11-06")).toBe("周五");
    expect(Calendar.weekday("2026-11-07")).toBe("周六");
    expect(Calendar.fridayOfWeek("2026-11-06")).toBe("2026-11-06");
    expect(Calendar.fridayOfWeek("2026-11-07")).toBe("2026-11-06");
    expect(Calendar.endOfMonth("2026-11-06")).toBe("2026-11-30");
  });

  it("下周、月底、周五、下次会议和模糊日期按会议日换算", () => {
    expect(DueDateResolver.resolve("下周给结论", "2026-11-06", null)).toBe("2026-11-13");
    expect(DueDateResolver.resolve("月底前", "2026-11-06", null)).toBe("2026-11-30");
    expect(DueDateResolver.resolve("周五前发出来", "2026-11-06", null)).toBe("2026-11-06");
    expect(DueDateResolver.resolve("本周五前给初稿", "2026-11-07", "2026-11-14")).toBeNull();
    expect(DueDateResolver.resolve("尽快确认", "2026-11-07", "2026-11-14")).toBeNull();
    expect(DueDateResolver.resolve("下次会议前补齐", "2026-11-07", "2026-11-14")).toBe("2026-11-14");
    expect(DueDateResolver.resolve("下次会议前补齐", "2026-11-07", null)).toBeNull();
    expect(DueDateResolver.resolve("下次会议前补齐", "2026-11-07", "2026-11-01")).toBeNull();
  });

  it("下次会议早于会议日时改用下一年", () => {
    expect(NextMeetingResolver.resolve("下次例会：1 月 8 日。", "2026-12-20")).toBe("2027-01-08");
    expect(NextMeetingResolver.resolve("下次例会：11 月 14 日。", "2026-11-07")).toBe("2026-11-14");
    const next = NextMeetingResolver.resolve("下次例会：1 月 8 日。", "2026-12-20");
    expect(DueDateResolver.resolve("下次会议前交报告", "2026-12-20", next)).toBe("2027-01-08");
  });
});

describe("负责人规则", () => {
  it("昵称、职务简称、部门、同名和多人都留空", () => {
    expect(OwnerResolver.resolve("老王跟一下原因", contacts)).toBeNull();
    expect(OwnerResolver.resolve("张经理再谈一轮", contacts)?.id ?? null).not.toBe("zhang-ming");
    expect(OwnerResolver.resolve("张经理再谈一轮", contacts)).toBeNull();
    expect(OwnerResolver.resolve("HR 那边看看", contacts)).toBeNull();
    expect(OwnerResolver.resolve("李工和小李一起排班", contacts)).toBeNull();
    expect(OwnerResolver.resolve("请张伟确认", contacts)).toBeNull();
    expect(OwnerResolver.resolve("@张伟（采）尽快确认", contacts)).toBeNull();
    expect(OwnerResolver.resolve("@张伟（采购部）尽快确认", contacts)).toBeNull();
  });

  it("括号职务能唯一区分同名，改由接手覆盖原负责人", () => {
    expect(OwnerResolver.resolve("@张伟（采购）尽快确认", contacts)?.id).toBe("zhang-wei-purchase");
    expect(OwnerResolver.resolve("@张伟（质量）下次会议前补齐", contacts)?.id).toBe(
      "zhang-wei-quality",
    );
    const owner = OwnerResolver.resolve(
      "原定刘洋负责，因刘洋休假，改由孙浩接手，本周五前给初稿。",
      contacts,
    );
    expect(owner?.id).toBe("sun-hao");
  });
});

describe("行动行", () => {
  it("非样例句式的行动行仍保留，非行动和日程行继续排除", () => {
    const todos = RulesEngine.extract(
      "请孙浩周五前交周报。\n服务器扩容的事情大家再想想。\n下次例会：1 月 8 日。",
      "2026-11-06",
    );
    expect(todos.map((todo) => todo.title)).toEqual(["请孙浩周五前交周报。"]);
    expect(todos[0]?.ownerId).toBe("sun-hao");
    expect(todos[0]?.dueDate).toBe("2026-11-06");
  });
});

describe("角色切换", () => {
  it("方向键在发起人和负责人之间循环", () => {
    expect(RoleKeys.next("organizer", "ArrowRight")).toBe("assignee");
    expect(RoleKeys.next("assignee", "ArrowLeft")).toBe("organizer");
    expect(RoleKeys.next("organizer", "ArrowUp")).toBe("assignee");
    expect(RoleKeys.next("assignee", "ArrowDown")).toBe("organizer");
    expect(RoleKeys.next("organizer", "Enter")).toBeNull();
  });
});

describe("核对后的修改", () => {
  it("补上负责人和日期后不再标记需要处理", () => {
    const [first] = RulesEngine.extract("新员工培训材料，HR 那边看看。", "2026-11-06");
    expect(first.needsAttention).toBe(true);
    const edited = TodoEdits.apply(first, { ownerId: "lin-xiao", dueDate: "2026-11-20" });
    expect(edited.ownerId).toBe("lin-xiao");
    expect(edited.dueDate).toBe("2026-11-20");
    expect(edited.needsAttention).toBe(false);
    expect(edited.status).toBe("pending");
  });
});

describe("演示数据", () => {
  it("只有两场会议，通讯录是完整的 15 人", () => {
    expect(MeetingCatalog.meetings.map((meeting) => meeting.title)).toEqual([
      "二号工厂生产周会",
      "MES 升级项目周例会",
    ]);
    expect(MeetingCatalog.meetings.map((meeting) => meeting.date)).toEqual([
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(Directory.byId("wang-jianguo")?.name).toBe("王建国");
    expect(Directory.byId("chen-jing")?.name).toBe("陈静");
    expect(Directory.byId("wu-jia")?.name).toBe("吴佳");
    expect(Directory.contacts).toHaveLength(15);
    expect(Directory.contacts.filter((contact) => contact.name === "张伟")).toHaveLength(2);
  });
});

describe("docx 样例", () => {
  it("两份 docx 正文与可粘贴文本一致，并且提取结果相同", async () => {
    for (const name of ["factory-weekly", "mes-weekly"] as const) {
      const text = readFileSync(
        path.join(process.cwd(), "public", "fixtures", `${name}.txt`),
        "utf8",
      ).trim();
      const docx = readFileSync(path.join(process.cwd(), "public", "fixtures", `${name}.docx`));
      const parsed = await DocxTextReader.read(docx);
      expect(parsed).toBe(text);
      const meeting = MeetingCatalog.meetings.find((item) => item.sampleId === name.split("-")[0]);
      expect(meeting).toBeTruthy();
      expect(RulesEngine.extract(parsed, meeting!.date)).toEqual(
        RulesEngine.extract(text, meeting!.date),
      );
    }
  });

  it("超过 4 MB 的文件在解析前拒绝", async () => {
    const huge = new Uint8Array(DocxTextReader.maxFileBytes + 1);
    await expect(DocxTextReader.read(huge)).rejects.toThrow("这份 docx 超过 4 MB，请换一份较小的文件。");
  });

  it("正文超过上限时拒绝解析", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", "a".repeat(DocxTextReader.maxDocumentXmlBytes + 1));
    const docx = await zip.generateAsync({ type: "uint8array" });
    await expect(DocxTextReader.read(docx)).rejects.toThrow("docx 正文过长，无法解析。");
  });
});
