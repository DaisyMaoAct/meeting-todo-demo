import type { ExtractedTodo } from "./types";

export class AssignmentService {
  static confirm(todos: readonly ExtractedTodo[]): ExtractedTodo[] {
    return todos.map((todo) => {
      if (todo.status !== "pending") return todo;
      return {
        ...todo,
        status: todo.ownerId ? "assigned" : "unassigned",
      };
    });
  }

  static tally(todos: readonly ExtractedTodo[]): {
    assigned: number;
    unassigned: number;
    pending: number;
  } {
    return {
      assigned: todos.filter((todo) => todo.status === "assigned").length,
      unassigned: todos.filter((todo) => todo.status === "unassigned").length,
      pending: todos.filter((todo) => todo.status === "pending").length,
    };
  }
}
