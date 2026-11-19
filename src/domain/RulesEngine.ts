import { ActionTitleRules } from "./ActionTitleRules";
import { Directory } from "./Directory";
import { DueDateResolver } from "./DueDateResolver";
import { MinutesSplitter } from "./MinutesSplitter";
import { NextMeetingResolver } from "./NextMeetingResolver";
import { OwnerResolver } from "./OwnerResolver";
import type { ExtractedTodo } from "./types";

export class RulesEngine {
  static extract(minutes: string, meetingDate: string): ExtractedTodo[] {
    const nextMeetingDate = NextMeetingResolver.resolve(minutes, meetingDate);
    const todos: ExtractedTodo[] = [];
    for (const item of MinutesSplitter.split(minutes)) {
      const title = ActionTitleRules.resolve(item);
      if (!title) continue;
      const owner = OwnerResolver.resolve(item, Directory.contacts);
      const dueDate = DueDateResolver.resolve(item, meetingDate, nextMeetingDate);
      todos.push({
        id: `todo-${todos.length + 1}`,
        title,
        ownerId: owner?.id ?? null,
        dueDate,
        status: "pending",
        needsAttention: owner === null || dueDate === null,
      });
    }
    return todos;
  }
}
