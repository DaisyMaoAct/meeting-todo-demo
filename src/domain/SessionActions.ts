import { AssignmentService } from "./AssignmentService";
import { CompletionService } from "./CompletionService";
import { DateField } from "./DateField";
import { Directory } from "./Directory";
import { InboxService } from "./InboxService";
import { MeetingCatalog } from "./MeetingCatalog";
import { RoleGate } from "./RoleGate";
import { TodoEdits } from "./TodoEdits";
import type { ExtractedTodo, Role, SessionState, TodoPatch } from "./types";

export class SessionActions {
  static setRole(state: SessionState, role: Role): SessionState {
    return { ...state, role };
  }

  static setActor(state: SessionState, actorId: string | null): SessionState {
    if (actorId === state.actorId) return state;
    if (actorId !== null && !Directory.byId(actorId)) return state;
    return { ...state, actorId };
  }

  static setSimulatedDate(state: SessionState, simulatedDate: string): SessionState {
    if (!DateField.isIso(simulatedDate) || simulatedDate === state.simulatedDate) return state;
    const next: SessionState = { ...state, simulatedDate };
    return this.refreshReminders(next);
  }

  static selectMeeting(state: SessionState, meetingId: string): SessionState {
    if (state.meetingId === meetingId) return state;
    return {
      ...state,
      meetingId,
      minutes: "",
      fileName: null,
      todos: [],
      phase: "idle",
      error: null,
      ...this.clearFollowup(),
    };
  }

  static replaceMinutes(state: SessionState, minutes: string, fileName: string | null): SessionState {
    return {
      ...state,
      minutes,
      fileName,
      todos: [],
      phase: state.phase === "extracting" ? state.phase : "idle",
      error: null,
      ...this.clearFollowup(),
    };
  }

  static beginExtract(state: SessionState): SessionState {
    return {
      ...state,
      phase: "extracting",
      error: null,
      todos: [],
      ...this.clearFollowup(),
    };
  }

  static finishExtract(state: SessionState, todos: ExtractedTodo[]): SessionState {
    return {
      ...state,
      todos,
      phase: "review",
      error: null,
      ...this.clearFollowup(),
    };
  }

  static failExtract(state: SessionState, error: string): SessionState {
    return {
      ...state,
      phase: "failed",
      error,
      todos: [],
      ...this.clearFollowup(),
    };
  }

  static edit(state: SessionState, id: string, patch: TodoPatch): SessionState {
    if (state.phase !== "review") return state;
    return {
      ...state,
      todos: state.todos.map((todo) => (todo.id === id ? TodoEdits.apply(todo, patch) : todo)),
    };
  }

  static confirm(state: SessionState): SessionState {
    if (!RoleGate.canDispatch(state.role) || state.phase !== "review") return state;
    const todos = AssignmentService.confirm(state.todos);
    const meeting = state.meetingId ? MeetingCatalog.byId(state.meetingId) : null;
    if (!meeting) {
      return {
        ...state,
        phase: "confirmed",
        error: null,
        todos,
        ...this.clearFollowup(),
      };
    }
    const followed = InboxService.withReminders(
      meeting,
      todos,
      InboxService.assignments(meeting, todos, state.simulatedDate),
      state.simulatedDate,
      [],
    );
    return {
      ...state,
      phase: "confirmed",
      error: null,
      todos,
      notifications: followed.notifications,
      reminderSkips: followed.reminderSkips,
    };
  }

  static complete(state: SessionState, todoId: string): SessionState {
    if (!RoleGate.canComplete(state.role) || !state.actorId) return state;
    let changed = false;
    const todos = state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const next = CompletionService.mark(todo, state.actorId);
      if (next !== todo) changed = true;
      return next;
    });
    if (!changed) return state;
    return { ...state, todos };
  }

  private static refreshReminders(state: SessionState): SessionState {
    if (state.phase !== "confirmed" || !state.meetingId) return state;
    const meeting = MeetingCatalog.byId(state.meetingId);
    if (!meeting) return state;
    const followed = InboxService.withReminders(
      meeting,
      state.todos,
      state.notifications,
      state.simulatedDate,
      state.reminderSkips,
    );
    return {
      ...state,
      notifications: followed.notifications,
      reminderSkips: followed.reminderSkips,
    };
  }

  private static clearFollowup(): Pick<SessionState, "notifications" | "reminderSkips"> {
    return { notifications: [], reminderSkips: [] };
  }
}
