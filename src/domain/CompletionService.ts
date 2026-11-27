import type { ExtractedTodo } from "./types";

export class CompletionService {
  static mark(todo: ExtractedTodo, actorId: string | null): ExtractedTodo {
    if (!actorId || todo.ownerId !== actorId) return todo;
    if (todo.status !== "assigned") return todo;
    return { ...todo, status: "completed" };
  }
}
