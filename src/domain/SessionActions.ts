import { AssignmentService } from "./AssignmentService";
import { RoleGate } from "./RoleGate";
import { TodoEdits } from "./TodoEdits";
import type { ExtractedTodo, Role, SessionState, TodoPatch } from "./types";

export class SessionActions {
  static setRole(state: SessionState, role: Role): SessionState {
    return { ...state, role };
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
    };
  }

  static beginExtract(state: SessionState): SessionState {
    return {
      ...state,
      phase: "extracting",
      error: null,
      todos: [],
    };
  }

  static finishExtract(state: SessionState, todos: ExtractedTodo[]): SessionState {
    return {
      ...state,
      todos,
      phase: "review",
      error: null,
    };
  }

  static failExtract(state: SessionState, error: string): SessionState {
    return {
      ...state,
      phase: "failed",
      error,
      todos: [],
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
    return {
      ...state,
      phase: "confirmed",
      error: null,
      todos: AssignmentService.confirm(state.todos),
    };
  }
}
