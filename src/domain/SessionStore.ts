import { MeetingCatalog } from "./MeetingCatalog";
import type { ExtractedTodo, Phase, Role, SessionState, TodoStatus } from "./types";

export class SessionStore {
  static readonly key = "meeting-todo-demo:v1";

  static empty(): SessionState {
    return {
      role: "organizer",
      meetingId: null,
      minutes: "",
      fileName: null,
      todos: [],
      phase: "idle",
      error: null,
    };
  }

  static load(): SessionState | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      const state = this.normalize(parsed);
      return state;
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

  private static normalize(value: unknown): SessionState | null {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const role = this.role(record.role);
    const phase = this.phase(record.phase);
    const meetingId = typeof record.meetingId === "string" ? record.meetingId : null;
    if (!role || !phase || !Array.isArray(record.todos)) return null;
    if (typeof record.minutes !== "string") return null;
    const todos = record.todos.map((item) => this.todo(item));
    if (todos.some((item) => item === null)) return null;
    return {
      role,
      meetingId: meetingId && MeetingCatalog.byId(meetingId) ? meetingId : null,
      minutes: record.minutes,
      fileName: typeof record.fileName === "string" ? record.fileName : null,
      todos: (todos as ExtractedTodo[]).map((todo) => ({
        ...todo,
        needsAttention: todo.ownerId === null || todo.dueDate === null,
      })),
      phase: phase === "extracting" ? "idle" : phase,
      error: typeof record.error === "string" ? record.error : null,
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
    return value === "pending" || value === "assigned" || value === "unassigned" ? value : null;
  }
}
