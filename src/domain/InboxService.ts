import { NotificationLinks } from "./NotificationLinks";
import { ReminderPolicy } from "./ReminderPolicy";
import type { AppNotification, ExtractedTodo, Meeting } from "./types";

export class InboxService {
  static assignments(
    meeting: Meeting,
    todos: readonly ExtractedTodo[],
    createdOn: string,
  ): AppNotification[] {
    const notes: AppNotification[] = [];
    for (const todo of todos) {
      if (todo.status !== "assigned" || !todo.ownerId) continue;
      const link = NotificationLinks.forOwner(meeting, todo.ownerId, todo.id);
      notes.push({
        id: `assigned:${todo.id}`,
        kind: "assigned",
        reminder: null,
        todoId: todo.id,
        ownerId: todo.ownerId,
        title: todo.title,
        dueDate: todo.dueDate,
        entry: link.entry,
        href: link.href,
        createdOn,
      });
    }
    return notes;
  }

  static withReminders(
    meeting: Meeting,
    todos: readonly ExtractedTodo[],
    notifications: readonly AppNotification[],
    simulatedDate: string,
    reminderSkips: readonly string[],
  ): { notifications: AppNotification[]; reminderSkips: string[] } {
    const reminded = new Set(
      notifications.filter((item) => item.kind === "reminder").map((item) => item.todoId),
    );
    const skips = new Set(reminderSkips);
    const additions: AppNotification[] = [];
    for (const todo of todos) {
      if (todo.status !== "assigned" || !todo.ownerId) continue;
      if (reminded.has(todo.id) || skips.has(todo.id)) continue;
      const outcome = ReminderPolicy.outcome(todo.dueDate, simulatedDate);
      if (outcome === "wait") continue;
      if (outcome === "scheduled" || outcome === "backfill") {
        const link = NotificationLinks.forOwner(meeting, todo.ownerId, todo.id);
        additions.push({
          id: `reminder:${todo.id}`,
          kind: "reminder",
          reminder: outcome,
          todoId: todo.id,
          ownerId: todo.ownerId,
          title: todo.title,
          dueDate: todo.dueDate,
          entry: link.entry,
          href: link.href,
          createdOn: simulatedDate,
        });
        reminded.add(todo.id);
        continue;
      }
      skips.add(todo.id);
    }
    return {
      notifications: additions.length === 0 ? [...notifications] : [...notifications, ...additions],
      reminderSkips: [...skips],
    };
  }

  static forOwner(notifications: readonly AppNotification[], ownerId: string): AppNotification[] {
    return notifications
      .filter((item) => item.ownerId === ownerId)
      .slice()
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "reminder" ? -1 : 1;
        return a.todoId < b.todoId ? -1 : a.todoId > b.todoId ? 1 : 0;
      });
  }
}
