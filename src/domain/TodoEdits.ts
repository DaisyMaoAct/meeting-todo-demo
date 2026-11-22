import type { ExtractedTodo, TodoPatch } from "./types";

export class TodoEdits {
  static apply(todo: ExtractedTodo, patch: TodoPatch): ExtractedTodo {
    if (todo.status !== "pending") return todo;
    const title = patch.title === undefined ? todo.title : patch.title.trim();
    const next: ExtractedTodo = {
      ...todo,
      title: title.length > 0 ? title : todo.title,
      ownerId: patch.ownerId === undefined ? todo.ownerId : patch.ownerId,
      dueDate: patch.dueDate === undefined ? todo.dueDate : patch.dueDate,
    };
    next.needsAttention = next.ownerId === null || next.dueDate === null;
    return next;
  }
}
