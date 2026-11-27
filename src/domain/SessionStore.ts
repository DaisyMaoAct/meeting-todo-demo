import { DateField } from "./DateField";
import { Directory } from "./Directory";
import { MeetingCatalog } from "./MeetingCatalog";
import { SimulatedClock } from "./SimulatedClock";
import type {
  AppNotification,
  ExtractedTodo,
  NotificationEntry,
  NotificationKind,
  Phase,
  ReminderKind,
  Role,
  SessionState,
  TodoStatus,
} from "./types";

export class SessionStore {
  static readonly key = "meeting-todo-demo:v1";

  static empty(): SessionState {
    return {
      role: "organizer",
      actorId: null,
      simulatedDate: SimulatedClock.initial,
      meetingId: null,
      minutes: "",
      fileName: null,
      todos: [],
      phase: "idle",
      error: null,
      notifications: [],
      reminderSkips: [],
    };
  }

  static load(): SessionState | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.revive(parsed);
    } catch {
      return null;
    }
  }

  static save(state: SessionState): void {
    if (typeof window === "undefined") return;
    const stored: SessionState = {
      ...state,
      phase: state.phase === "extracting" ? "idle" : state.phase,
    };
    window.localStorage.setItem(this.key, JSON.stringify(stored));
  }

  static revive(value: unknown): SessionState | null {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const role = this.role(record.role);
    const phase = this.phase(record.phase);
    const meetingId = typeof record.meetingId === "string" ? record.meetingId : null;
    if (!role || !phase || !Array.isArray(record.todos)) return null;
    if (typeof record.minutes !== "string") return null;
    const todos = record.todos.map((item) => this.todo(item));
    if (todos.some((item) => item === null)) return null;
    const actorId = typeof record.actorId === "string" ? record.actorId : null;
    return {
      role,
      actorId: actorId && Directory.byId(actorId) ? actorId : null,
      simulatedDate:
        typeof record.simulatedDate === "string" && DateField.isIso(record.simulatedDate)
          ? record.simulatedDate
          : SimulatedClock.initial,
      meetingId: meetingId && MeetingCatalog.byId(meetingId) ? meetingId : null,
      minutes: record.minutes,
      fileName: typeof record.fileName === "string" ? record.fileName : null,
      todos: todos as ExtractedTodo[],
      phase: phase === "extracting" ? "idle" : phase,
      error: typeof record.error === "string" ? record.error : null,
      notifications: this.notifications(record.notifications),
      reminderSkips: this.skips(record.reminderSkips),
    };
  }

  private static role(value: unknown): Role | null {
    return value === "organizer" || value === "assignee" ? value : null;
  }

  private static phase(value: unknown): Phase | null {
    if (
      value === "idle" ||
      value === "extracting" ||
      value === "failed" ||
      value === "review" ||
      value === "confirmed"
    ) {
      return value;
    }
    return null;
  }

  private static todo(value: unknown): ExtractedTodo | null {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const status = this.status(record.status);
    if (!status || typeof record.id !== "string" || typeof record.title !== "string") return null;
    if (!(record.ownerId === null || typeof record.ownerId === "string")) return null;
    if (!(record.dueDate === null || typeof record.dueDate === "string")) return null;
    return {
      id: record.id,
      title: record.title,
      ownerId: record.ownerId,
      dueDate: record.dueDate,
      status,
      needsAttention: record.ownerId === null || record.dueDate === null,
    };
  }

  private static status(value: unknown): TodoStatus | null {
    if (value === "pending" || value === "assigned" || value === "unassigned" || value === "completed") {
      return value;
    }
    return null;
  }

  private static notifications(value: unknown): AppNotification[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const note = this.notification(item);
      return note ? [note] : [];
    });
  }

  private static notification(value: unknown): AppNotification | null {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const kind = this.kind(record.kind);
    const entry = this.entry(record.entry);
    const reminder = this.reminder(record.reminder);
    if (!kind || !entry || reminder === undefined) return null;
    if (kind === "assigned" && reminder !== null) return null;
    if (kind === "reminder" && reminder === null) return null;
    if (typeof record.id !== "string" || typeof record.todoId !== "string") return null;
    if (typeof record.ownerId !== "string" || !Directory.byId(record.ownerId)) return null;
    if (typeof record.title !== "string" || typeof record.href !== "string") return null;
    if (!(record.dueDate === null || typeof record.dueDate === "string")) return null;
    if (record.dueDate !== null && !DateField.isIso(record.dueDate)) return null;
    if (typeof record.createdOn !== "string" || !DateField.isIso(record.createdOn)) return null;
    return {
      id: record.id,
      kind,
      reminder,
      todoId: record.todoId,
      ownerId: record.ownerId,
      title: record.title,
      dueDate: record.dueDate,
      entry,
      href: record.href,
      createdOn: record.createdOn,
    };
  }

  private static kind(value: unknown): NotificationKind | null {
    return value === "assigned" || value === "reminder" ? value : null;
  }

  private static entry(value: unknown): NotificationEntry | null {
    return value === "meeting" || value === "todo" ? value : null;
  }

  private static reminder(value: unknown): ReminderKind | null | undefined {
    if (value === null) return null;
    if (value === "scheduled" || value === "backfill") return value;
    return undefined;
  }

  private static skips(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
}
